-- FIX: Infinite Recursion in Profiles Policy
-- Run this script in your Supabase SQL Editor to resolve the "infinite recursion" error.

-- 1. Create a secure function to check admin status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This query runs with "SECURITY DEFINER" privileges, bypassing RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
-- Note: We update other admin policies too just to be consistent and safe/efficient

-- 3. Re-create policies using the safe function

-- Profiles: Use is_admin()
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING ( public.is_admin() );

-- Events: Use is_admin()
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING ( public.is_admin() );

-- Storage: Use is_admin()
-- Note: Storage policies are a bit tricky, we need to ensure we target the right table if re-applying
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
CREATE POLICY "Admin Full Access" 
    ON storage.objects FOR ALL 
    USING (
        bucket_id = 'experience-media' 
        AND public.is_admin()
    );
