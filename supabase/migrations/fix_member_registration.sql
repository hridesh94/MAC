-- fix_member_registration.sql
-- This script ensures members can properly register for events

-- 1. Ensure events table allows SELECT for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "Authenticated users can view events" 
ON public.events FOR SELECT 
TO authenticated
USING ( true );

-- 2. Drop and recreate registrations policies with proper permissions
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Members can secure event participation" ON public.registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;

-- 3. Create comprehensive registrations policies

-- SELECT: Users can view their own registrations
CREATE POLICY "Users can view own registrations" 
ON public.registrations FOR SELECT 
TO authenticated
USING ( auth.uid() = user_id );

-- SELECT: Admins can view ALL registrations
CREATE POLICY "Admins can view all registrations" 
ON public.registrations FOR SELECT 
TO authenticated
USING ( public.is_admin() );

-- INSERT: Members (non-admins) can register for events
CREATE POLICY "Members can secure event participation" 
ON public.registrations FOR INSERT 
TO authenticated
WITH CHECK ( 
    auth.uid() = user_id 
    AND NOT public.is_admin() 
);

-- UPDATE: Users can update their own registrations (e.g., cancel)
CREATE POLICY "Users can update own registrations" 
ON public.registrations FOR UPDATE 
TO authenticated
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 4. Verify the unique constraint exists (prevents duplicate registrations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'registrations_user_id_event_id_key'
    ) THEN
        ALTER TABLE public.registrations 
        ADD CONSTRAINT registrations_user_id_event_id_key 
        UNIQUE (user_id, event_id);
    END IF;
END $$;

-- 5. Grant necessary permissions to authenticated role
GRANT SELECT ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.registrations TO authenticated;
-- Note: No sequence grant needed - registrations uses UUID primary key (gen_random_uuid())
