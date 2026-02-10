const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Basic Auth Check (You can enhance this by verifying the sender's JWT)
    // For now, we'll assume Netlify env vars are secure
    const { email, password } = JSON.parse(event.body);

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Hidden key with admin powers
    );

    try {
        // 1. Create User in Supabase Auth
        const { data: user, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Force confirm since it's invite-only
        });

        if (authError) throw authError;

        // 2. Profile is automatically created via DB Trigger (which we should add)
        // Or we manually insert it here to be safe
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                { id: user.user.id, email: email, role: 'member' }
            ]);

        if (profileError) throw profileError;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Member ${email} created successfully.` })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
