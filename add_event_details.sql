-- Add new columns for event technical details
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT 'TBD';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT 'Standard';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'All Levels';
