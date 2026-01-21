-- Fix Company RLS Policies to allow Auto-Creation
-- Run this in Supabase SQL Editor

-- 1. Allow INSERT for Authenticated Users
-- They can create a company if they set themselves as the owner
DROP POLICY IF EXISTS "companies_insert_access" ON companies;
CREATE POLICY "companies_insert_access" ON companies FOR INSERT
WITH CHECK (
    auth.uid() = owner_id
);

-- 2. Verify/Fix SELECT Policy
-- Ensure users can see companies they own (even if not yet linked in profile)
DROP POLICY IF EXISTS "companies_read_access" ON companies;
CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING (
    owner_id = auth.uid() 
    OR id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- 3. Allow UPDATE (Already exists, but good to ensure)
DROP POLICY IF EXISTS "companies_update_access" ON companies;
CREATE POLICY "companies_update_access" ON companies FOR UPDATE
USING (owner_id = auth.uid());

-- 4. Enable RLS (Should be already on, but ensure safe)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
