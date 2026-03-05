-- registrations.sql (Updated with DROP IF EXISTS)

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Members can secure event participation" ON public.registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;

-- 2. Create registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    UNIQUE(user_id, event_id)
);

-- 3. Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- MEMBERS: Can view their own registrations
CREATE POLICY "Users can view own registrations" 
ON public.registrations FOR SELECT 
USING ( auth.uid() = user_id );

-- ADMINS: Can view ALL registrations
CREATE POLICY "Admins can view all registrations" 
ON public.registrations FOR SELECT 
USING ( public.is_admin() );

-- MEMBERS: Can register (Insert) themselves
-- STRICTLY for 'member' role only (Admins cannot participate in events)
CREATE POLICY "Members can secure event participation" 
ON public.registrations FOR INSERT 
WITH CHECK ( 
    auth.uid() = user_id 
    AND NOT public.is_admin() 
);

-- MEMBERS: Can update status (e.g. cancel)
CREATE POLICY "Users can update own registrations" 
ON public.registrations FOR UPDATE 
USING ( auth.uid() = user_id );

-- 5. Real-time updates (Optional, for live dashboards)
-- Uncomment if you want real-time subscriptions
-- alter publication supabase_realtime add table public.registrations;
