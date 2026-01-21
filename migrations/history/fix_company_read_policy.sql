-- Fix Company Read Access for Team Members
-- This allows a user to see the Company Name if they are a member of a Team in that Company.

DROP POLICY IF EXISTS "companies_read_access" ON companies;

CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING (
    -- 1. Owner
    owner_id = auth.uid() 
    -- 2. Directly Linked via Profile
    OR id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    -- 3. Member of a Team in this Company
    OR id IN (
        SELECT company_id 
        FROM teams 
        WHERE id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    -- 4. Manager/Head of a Team in this Company
    OR id IN (
        SELECT company_id
        FROM teams
        WHERE manager_ids @> ARRAY[auth.uid()]
    )
);
