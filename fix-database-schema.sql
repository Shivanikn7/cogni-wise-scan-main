-- Fix Database Schema Error
-- Copy and paste this entire SQL into your Supabase SQL Editor
-- Go to: Project Settings > SQL Editor > New Query

-- Add caretaker columns if they don't exist
DO $$
BEGIN
    -- Add caretaker_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'caretaker_name') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_name TEXT;
        RAISE NOTICE 'Added caretaker_name column';
    ELSE
        RAISE NOTICE 'caretaker_name column already exists';
    END IF;

    -- Add caretaker_relation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'caretaker_relation') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_relation TEXT;
        RAISE NOTICE 'Added caretaker_relation column';
    ELSE
        RAISE NOTICE 'caretaker_relation column already exists';
    END IF;

    -- Add health_status_summary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'health_status_summary') THEN
        ALTER TABLE public.profiles ADD COLUMN health_status_summary TEXT;
        RAISE NOTICE 'Added health_status_summary column';
    ELSE
        RAISE NOTICE 'health_status_summary column already exists';
    END IF;

    -- Add gender column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
        RAISE NOTICE 'Added gender column';
    ELSE
        RAISE NOTICE 'gender column already exists';
    END IF;

    -- Add address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column';
    ELSE
        RAISE NOTICE 'address column already exists';
    END IF;

END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.caretaker_name IS 'Name of caretaker for patients aged 55+ who may need assistance';
COMMENT ON COLUMN public.profiles.caretaker_relation IS 'Relation of caretaker to the patient (spouse, child, etc.)';
COMMENT ON COLUMN public.profiles.health_status_summary IS 'Brief summary of patient health status for dementia assessment';

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name IN ('caretaker_name', 'caretaker_relation', 'health_status_summary')
ORDER BY column_name;


