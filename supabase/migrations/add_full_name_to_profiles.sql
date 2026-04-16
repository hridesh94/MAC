-- Migration: Add full_name column to profiles table
-- This allows storing the member's display name set by admin during credential issuance

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update trigger to also capture full_name from auth metadata when available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    'member',
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name
    WHERE public.profiles.full_name IS NULL;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
