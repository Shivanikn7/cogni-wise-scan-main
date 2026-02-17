-- Add caretaker and health status fields to profiles table for elderly patients (55+)

ALTER TABLE public.profiles
ADD COLUMN caretaker_name TEXT,
ADD COLUMN caretaker_relation TEXT,
ADD COLUMN health_status_summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.caretaker_name IS 'Name of caretaker for patients aged 55+ who may need assistance';
COMMENT ON COLUMN public.profiles.caretaker_relation IS 'Relation of caretaker to the patient (spouse, child, etc.)';
COMMENT ON COLUMN public.profiles.health_status_summary IS 'Brief summary of patient health status for dementia assessment';



