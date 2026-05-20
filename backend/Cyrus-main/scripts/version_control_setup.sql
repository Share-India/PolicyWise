-- VERSION CONTROL SETUP MIGRATION
-- Established: 2026-02-26
-- Description: Creates the system_migrations table and adds versioning columns to key tables.

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.system_migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Register this setup migration
INSERT INTO public.system_migrations (name, version)
VALUES ('version_control_setup', '1.0.0')
ON CONFLICT (name) DO NOTHING;

-- Add versioning to assessments
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT '1.0.0';

-- Add versioning to profiles (to track logic version at time of profile update)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0';

-- Add comment for documentation
COMMENT ON TABLE public.system_migrations IS 'Tracks all applied database migrations for version control.';
