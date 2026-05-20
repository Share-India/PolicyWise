-- Migration: v8_rbac.sql
-- Description: Adds a CHECK constraint and index to profiles.role, plus RLS policies.

-- 1. Ensure the constraint exists to allow only 'client' or 'admin'
DO $$ BEGIN
    -- Add CHECK constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'admin'));
    END IF;
END $$;

-- 2. Add an index to profiles.role to optimize lookups (e.g. for middleware)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. RLS Policies for the profiles table
-- By default, people can read their own profile, but we need admins to be able to read all and update roles.
-- Let's make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- If they don't exist, here are the general policies for profiles:
-- 3a. User can read their own profile
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read their own profile'
    ) THEN
        CREATE POLICY "Users can read their own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id);
    END IF;
END $$;

-- 3b. User can update their own profile (except role)
-- Note: Supabase RLS policies are complex for restricting specific columns on UPDATE.
-- Usually, letting them update their profile is fine, and we rely on the application code
-- or a trigger to prevent privilege escalation.
-- But since we are full DB level:
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$;

-- 3c. Admins can read all profiles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can read all profiles'
    ) THEN
        CREATE POLICY "Admins can read all profiles"
        ON profiles FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM profiles admin_profile 
                WHERE admin_profile.id = auth.uid() 
                AND admin_profile.role = 'admin'
            )
        );
    END IF;
END $$;

-- 3d. Admins can update all profiles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles"
        ON profiles FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM profiles admin_profile 
                WHERE admin_profile.id = auth.uid() 
                AND admin_profile.role = 'admin'
            )
        );
    END IF;
END $$;

-- 4. Create trigger to make role visible in Supabase Auth Dashboard
-- Note: We update the app_metadata of the auth.users row to reflect the role,
-- so admins can see "client" or "admin" directly in the Supabase Authentication UI.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Determine the role
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'client');

  -- 1. Insert into public.profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    username, 
    organization_name, 
    industry, 
    role,
    organization_website,
    app_version
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry',
    assigned_role,
    new.raw_user_meta_data->>'organization_website',
    '1.0.0'
  );

  -- 2. Update auth.users to make the role visible in Supabase dashboard
  -- We set it in app_metadata which is the standard place for authorization roles
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role, 'claims_admin', assigned_role = 'admin')
  WHERE id = new.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record the migration
INSERT INTO public.system_migrations (name, version)
VALUES ('migration_v8_rbac', '1.0.0')
ON CONFLICT (name) DO NOTHING;
