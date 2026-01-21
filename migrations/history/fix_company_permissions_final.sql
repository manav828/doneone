-- FINAL FIX: Companies and Profiles RLS
-- Run this to fix "Forbidden" errors and "Duplicates"

-- 1. Unrestricted INSERT for Companies (authenticated users)
DROP POLICY IF EXISTS "companies_insert_access" ON companies;
CREATE POLICY "companies_insert_access" ON companies FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 2. Ensure Read Access for Owners (Fixes the "Can't find my company" issue)
DROP POLICY IF EXISTS "companies_read_access" ON companies;
CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING (
    owner_id = auth.uid() 
    OR id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- 3. Allow Update for Owners
DROP POLICY IF EXISTS "companies_update_access" ON companies;
CREATE POLICY "companies_update_access" ON companies FOR UPDATE
USING (owner_id = auth.uid());

-- 4. CRITICAL: Allow Users to Update their own Profile (to link the Company)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
