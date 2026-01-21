-- Fix teams table RLS to allow Team Heads to see their teams
-- Run this in Supabase SQL Editor

-- First, drop any existing SELECT policies on teams
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "Users can view teams" ON teams;
DROP POLICY IF EXISTS "Enable read access for team members" ON teams;
DROP POLICY IF EXISTS "Teams viewable by members" ON teams;

-- Create new policy that allows Team Heads to see their teams
CREATE POLICY "teams_access"
ON teams FOR SELECT
USING (
  -- User is team owner
  owner_id = auth.uid()
  -- User is a Team Head (in manager_ids)
  OR auth.uid()::text = ANY(manager_ids::text[])
  -- User is a team member
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  -- Super Admin
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.email = 'manavss828@gmail.com'
  )
);

-- Also add INSERT, UPDATE, DELETE policies for completeness
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "teams_update_policy" ON teams;
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (
  owner_id = auth.uid()
  OR auth.uid()::text = ANY(manager_ids::text[])
);

DROP POLICY IF EXISTS "teams_delete_policy" ON teams;
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (owner_id = auth.uid());
