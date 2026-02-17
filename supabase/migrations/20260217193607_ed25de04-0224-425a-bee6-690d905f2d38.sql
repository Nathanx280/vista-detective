
-- Add AI art URL column to discoveries
ALTER TABLE public.discoveries ADD COLUMN IF NOT EXISTS ai_art_url text;
