-- Fix Infinite Recursion on RLS using Security Definer Functions
-- Run this in Supabase SQL Editor

-- 1. Create a helper function to check Team Admin status (Owner or Head)
-- SECURITY DEFINER means it runs with superuser privileges, bypassing RLS on 'teams' table
CREATE OR REPLACE FUNCTION is_team_admin(lookup_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams
    WHERE id = lookup_team_id
    AND (
      owner_id = auth.uid()
      OR auth.uid()::text = ANY(manager_ids::text[])
    )
  );
END;
$$;

-- 2. Update 'team_members' policy to use this function
-- This breaks the recursion because querying 'teams' inside the function DOES NOT trigger RLS
DROP POLICY IF EXISTS "team_members_select" ON team_members;

CREATE POLICY "team_members_select" ON team_members FOR SELECT
USING (
  -- User is the member
  user_id = auth.uid()
  -- OR User is Team Admin (Owner/Head) - uses function to bypass recursion
  OR is_team_admin(team_id)
  -- Super Admin
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);

-- 3. Also fix INSERT/UPDATE/DELETE which were also using direct joins
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members FOR INSERT
WITH CHECK (
  is_team_admin(team_id)
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);

DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members FOR UPDATE
USING (
  is_team_admin(team_id)
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members FOR DELETE
USING (
  is_team_admin(team_id)
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);
