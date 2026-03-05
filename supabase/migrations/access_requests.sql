-- access_requests.sql

-- 1. Create table for tracking invite requests
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ignored'
    UNIQUE(email)
);

-- 2. Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- PUBLIC (Anon): Can request access (Insert)
CREATE POLICY "Public can request access" 
ON public.access_requests FOR INSERT 
WITH CHECK ( true );

-- ADMINS: Can view all requests
CREATE POLICY "Admins can view access requests" 
ON public.access_requests FOR SELECT 
USING ( public.is_admin() );

-- ADMINS: Can update status (approve/ignore)
CREATE POLICY "Admins can update access requests" 
ON public.access_requests FOR UPDATE 
USING ( public.is_admin() );
