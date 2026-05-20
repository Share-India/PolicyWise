-- migration_v11_enforce_admin_rbac.sql
-- Description: Updates handle_new_user trigger to enforce that only aditya.ladge@gmail.com 
-- or @shareindia.co.in domain can have the 'admin' role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- 1. Determine the requested role from metadata
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'client');

  -- 2. Enforce RBAC Rule: Only specific domain or master email can be admin
  IF assigned_role = 'admin' THEN
    IF NOT (new.email = 'aditya.ladge@gmail.com' OR new.email LIKE '%@shareindia.co.in') THEN
      assigned_role := 'client'; -- Silently downgrade to client if not authorized
    END IF;
  END IF;

  -- 3. Insert into public.profiles
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
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry',
    assigned_role,
    new.raw_user_meta_data->>'organization_website',
    '1.2.0'
  );

  -- 4. Sync role back to auth.users for dashboard visibility
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role, 'claims_admin', assigned_role = 'admin')
  WHERE id = new.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
