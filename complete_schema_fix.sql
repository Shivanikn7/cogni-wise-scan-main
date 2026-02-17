-- Comprehensively fix the profiles table schema
-- Run this ENTIRE script in your Supabase SQL Editor.

DO $$
BEGIN
    -- 1. gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
        RAISE NOTICE 'Added gender column';
    END IF;

    -- 2. address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column';
    END IF;

    -- 3. phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column';
    END IF;

    -- 4. guardian_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'guardian_name') THEN
        ALTER TABLE public.profiles ADD COLUMN guardian_name TEXT;
        RAISE NOTICE 'Added guardian_name column';
    END IF;

    -- 5. guardian_relation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'guardian_relation') THEN
        ALTER TABLE public.profiles ADD COLUMN guardian_relation TEXT;
        RAISE NOTICE 'Added guardian_relation column';
    END IF;

    -- 6. caretaker_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'caretaker_name') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_name TEXT;
        RAISE NOTICE 'Added caretaker_name column';
    END IF;

    -- 7. caretaker_relation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'caretaker_relation') THEN
        ALTER TABLE public.profiles ADD COLUMN caretaker_relation TEXT;
        RAISE NOTICE 'Added caretaker_relation column';
    END IF;

    -- 8. health_status_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'health_status_summary') THEN
        ALTER TABLE public.profiles ADD COLUMN health_status_summary TEXT;
        RAISE NOTICE 'Added health_status_summary column';
    END IF;

END $$;
