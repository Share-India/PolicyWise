-- Fix for infinite recursion in profiles RLS policies
-- Run this script in your Supabase SQL Editor

-- 1. Drop the recursive policies that were causing the "Error fetching questionnaire"
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 2. Create non-recursive policies using the JWT claim
-- Since we populate app_metadata.role in handle_new_user(), we can just check the JWT directly
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
