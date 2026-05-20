-- migration_v8_add_phone.sql
-- Description: Adds phone number column to profiles table and updates the signup trigger to handle passwordless signups for both email and phone.

-- 1. Add phone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update the existing handle_new_user trigger to map phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    phone,
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
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),  -- Handle phone from direct phone auth OR metadata
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry',
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'organization_website',
    '1.1.0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
