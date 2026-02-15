const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userId } = JSON.parse(event.body);

        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY // Hidden key with admin powers
        );

        // Delete User from Supabase Auth
        // This should cascade to public.profiles if configured, but even if not,
        // removing from Auth prevents login and "User already exists" errors.
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User deleted successfully' })
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
