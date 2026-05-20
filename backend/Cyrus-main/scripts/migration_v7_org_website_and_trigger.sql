-- migration_v7_org_website_and_trigger.sql
-- Description: Adds organization_website to profiles and sets up a trigger for automatic profile creation on signup.

-- 1. Add organization_website to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_website TEXT;

-- 2. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'organization_website',
    '1.0.0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Register migration
INSERT INTO public.system_migrations (name, version)
VALUES ('migration_v7_org_website_and_trigger', '1.0.0')
ON CONFLICT (name) DO NOTHING;
