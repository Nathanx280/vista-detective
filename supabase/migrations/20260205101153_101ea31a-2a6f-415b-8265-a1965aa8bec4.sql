-- Fix RLS policies for discoveries table
-- Current policies are too permissive (anyone can update any record)

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create discoveries" ON public.discoveries;
DROP POLICY IF EXISTS "Anyone can update discoveries" ON public.discoveries;
DROP POLICY IF EXISTS "Anyone can view discoveries" ON public.discoveries;

-- Create new, more secure policies

-- Anyone can view completed discoveries (public gallery)
CREATE POLICY "Anyone can view completed discoveries"
ON public.discoveries
FOR SELECT
USING (status = 'complete');

-- Anonymous users can create new discoveries (for the public demo)
-- But they can only insert with status = 'pending'
CREATE POLICY "Anyone can create pending discoveries"
ON public.discoveries
FOR INSERT
WITH CHECK (status = 'pending' OR status IS NULL);

-- Only service role can update discoveries (edge function uses service role)
-- Regular anonymous/authenticated users cannot update records directly
-- This prevents tampering with anomaly scores, AI analysis, etc.
-- The edge function will use the service role key to update records