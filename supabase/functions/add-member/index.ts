import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { email, password, fullName } = payload;

        console.log(`Processing request for email: ${email}, name: ${fullName || '(none)'}`);

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: 'Email and password are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase environment variables');
            return new Response(
                JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const userMeta = fullName ? { full_name: fullName } : {};

        // 1. Try to create the user in Supabase Auth
        const { data: createData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { ...userMeta },
        });

        if (authError) {
            // Case A: User already exists — update password + metadata
            if (authError.message?.includes('already been registered') || authError.status === 422) {
                console.log('User already exists, updating password and metadata...');

                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

                if (!existingUser) {
                    throw new Error('User exists but could not be retrieved.');
                }

                // Update existing user
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    {
                        password: password,
                        email_confirm: true,
                        user_metadata: { ...userMeta },
                    }
                );
                if (updateError) throw updateError;

                // Sync profile record including full_name
                const profileUpdate: any = { id: existingUser.id, email: existingUser.email, role: 'member' };
                if (fullName) profileUpdate.full_name = fullName;

                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(profileUpdate, { onConflict: 'id' });

                if (profileError) {
                    console.error('Profile sync error:', profileError.message);
                    throw new Error(`Profile sync failed: ${profileError.message}`);
                }

                return new Response(
                    JSON.stringify({ message: `Member ${email} verified and updated successfully.` }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Case B: Some other auth error
            console.error('Auth creation error:', authError);
            throw authError;
        }

        // 2. Success — New user created
        const newUser = createData.user;
        console.log('Successfully created new user:', newUser.id);

        // 3. Create profile record for new user (with full_name if provided)
        const newProfile: any = { id: newUser.id, email: newUser.email, role: 'member' };
        if (fullName) newProfile.full_name = fullName;

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' });

        if (profileError) {
            console.error('New profile creation error:', profileError.message);
            throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        return new Response(
            JSON.stringify({ message: `Member ${email} created successfully.` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Edge Function Exception:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal Server Error',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
