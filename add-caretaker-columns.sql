-- Add caretaker and health status fields to profiles table
-- Run this SQL in your Supabase SQL Editor to fix the schema error

-- First, check if columns exist and add them if they don't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'caretaker_name') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'caretaker_relation') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_relation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'health_status_summary') THEN
        ALTER TABLE public.profiles ADD COLUMN health_status_summary TEXT;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.caretaker_name IS 'Name of caretaker for patients aged 55+ who may need assistance';
COMMENT ON COLUMN public.profiles.caretaker_relation IS 'Relation of caretaker to the patient (spouse, child, etc.)';
COMMENT ON COLUMN public.profiles.health_status_summary IS 'Brief summary of patient health status for dementia assessment';
