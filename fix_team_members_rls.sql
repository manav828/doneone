-- Fix RLS Policy for team_members to allow Team Heads to view all members
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON team_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON team_members;

-- Step 2: Create unified policies

-- SELECT: Allow read if self, owner, or team head
CREATE POLICY "team_members_select" ON team_members FOR SELECT
USING (
  -- User is the member
  user_id = auth.uid()
  -- User is Team Owner
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  -- User is Team Head
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
  -- Super Admin
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);

-- INSERT: Owner or Team Head can add members
CREATE POLICY "team_members_insert" ON team_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
  -- Also allow self-join if public? (Usually flows through invitation/approval which works differently)
  -- For now restricting to managers
);

-- UPDATE: Owner or Team Head can update members (e.g. status)
CREATE POLICY "team_members_update" ON team_members FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);

-- DELETE: Owner or Team Head can remove members
CREATE POLICY "team_members_delete" ON team_members FOR DELETE
USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);
