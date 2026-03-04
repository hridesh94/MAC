import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Try to Create User in Supabase Auth
        const { data: user, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            if (authError.message?.includes('already been registered') || authError.status === 422) {
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                if (listError) throw listError;

                const existingUser = (users || []).find(u => u.email.toLowerCase() === email.toLowerCase());

                if (!existingUser) {
                    throw new Error('User exists but could not be found to update.');
                }

                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    {
                        password: password,
                        email_confirm: true,
                        user_metadata: { email_confirm: true }
                    }
                );

                if (updateError) throw updateError;

                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: existingUser.id,
                        email: existingUser.email,
                        role: 'member'
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                return new Response(JSON.stringify({ message: `Member ${email} verified and updated successfully.` }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw authError;
        }

        return new Response(JSON.stringify({ message: `Member ${email} created successfully.` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error handling member:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
