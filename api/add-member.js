import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
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

                return res.status(200).json({ message: `Member ${email} verified and updated successfully.` });
            }
            throw authError;
        }

        return res.status(200).json({ message: `Member ${email} created successfully.` });

    } catch (error) {
        console.error('Error handling member:', error);
        return res.status(500).json({ error: error.message });
    }
}
