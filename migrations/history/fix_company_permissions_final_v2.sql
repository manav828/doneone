-- FINAL FIX: Company Read Permissions
-- 1. Run this script in Supabase SQL Editor to allow members to see Company Name.

-- Enable RLS (Just in case)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policy
DROP POLICY IF EXISTS "companies_read_access" ON companies;

-- Create PERMISSIVE policy for Company Members
CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING (
    -- 1. Owner
    owner_id = auth.uid() 
    
    -- 2. Linked via Profile
    OR id = (SELECT company_id FROM profiles WHERE id = auth.uid())

    -- 3. Member of ANY Team in this Company
    -- (This fixes the "Joined Team" name issue)
    OR id IN (
        SELECT t.company_id 
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = auth.uid() 
        AND tm.status = 'active'
    )
);

-- Force cache refresh for policies
NOTIFY pgrst, 'reload schema';
