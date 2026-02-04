-- Create discoveries table for storing analyzed images
CREATE TABLE public.discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  location_hint TEXT,
  anomaly_score INTEGER DEFAULT 0 CHECK (anomaly_score >= 0 AND anomaly_score <= 10),
  anomaly_types TEXT[] DEFAULT '{}',
  ai_analysis TEXT,
  narration TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'complete', 'failed'))
);

-- Enable RLS
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read discoveries (public gallery)
CREATE POLICY "Anyone can view discoveries"
ON public.discoveries
FOR SELECT
USING (true);

-- Allow anyone to insert discoveries (no auth required for demo)
CREATE POLICY "Anyone can create discoveries"
ON public.discoveries
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update discoveries (for AI analysis updates)
CREATE POLICY "Anyone can update discoveries"
ON public.discoveries
FOR UPDATE
USING (true);