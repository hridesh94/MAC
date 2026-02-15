const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    let email, password;
    try {
        const body = JSON.parse(event.body);
        email = body.email;
        password = body.password;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!email || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email and password are required' }) };
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Hidden key with admin powers
    );

    try {
        // 1. Try to Create User in Supabase Auth
        const { data: user, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Force confirm since it's invite-only
        });

        if (authError) {
            // Check if failure is due to user already existing
            if (authError.message?.includes('already been registered') || authError.status === 422) {
                console.log(`User ${email} already exists. Attempting to update credentials.`);

                // RECOVERY LOGIC: Find and Update the existing user

                // 1. List users to find the ID (we can't query by email directly efficiently without this in some versions, 
                // but for admin functions on small-medium userbases this is acceptable)
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

                if (listError) throw listError;

                // Case-insensitive verify
                const existingUser = (users || []).find(u => u.email.toLowerCase() === email.toLowerCase());

                if (!existingUser) {
                    throw new Error('User exists but could not be found to update.');
                }

                // 2. Update the existing user's password and confirm them
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    {
                        password: password,
                        email_confirm: true,
                        user_metadata: { email_confirm: true }
                    }
                );

                if (updateError) throw updateError;

                // 3. Ensure Profile Exists (Upsert)
                // This covers cases where the user was in Auth but Profile was deleted
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: existingUser.id,
                        email: existingUser.email,
                        role: 'member'
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: `Member ${email} verified and updated successfully.` })
                };
            }

            // If it's another error, throw it
            throw authError;
        }

        // 2. Profile is automatically created via DB Trigger (supabase_triggers.sql) for NEW users

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Member ${email} created successfully.` })
        };

    } catch (error) {
        console.error('Error handling member:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
