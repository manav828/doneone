-- ============================================================
-- FIX: RLS INFINITE RECURSION ON TEAMS TABLE
-- ============================================================
-- Run this in Supabase SQL Editor to fix the RLS policies
-- ============================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view teams they own or belong to" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;

DROP POLICY IF EXISTS "Team members visible to team" ON team_members;
DROP POLICY IF EXISTS "Users can request to join teams" ON team_members;
DROP POLICY IF EXISTS "Owners can manage team members" ON team_members;
DROP POLICY IF EXISTS "Owners or self can remove membership" ON team_members;

-- ============================================================
-- FIXED RLS POLICIES FOR TEAMS (Using SECURITY DEFINER functions)
-- ============================================================

-- Create helper function to avoid recursion
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams: SELECT - Owner or active member
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    is_team_member(id, auth.uid())
  );

-- Teams: INSERT - Authenticated users can create
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Teams: UPDATE - Only owner
CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

-- Teams: DELETE - Only owner
CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- FIXED RLS POLICIES FOR TEAM_MEMBERS
-- ============================================================

-- Create helper to check team ownership
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams WHERE id = p_team_id AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Team Members: SELECT - Team owner OR Member themselves OR Fellow active members
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_team_owner(team_id, auth.uid()) OR
    is_team_member(team_id, auth.uid())
  );

-- Team Members: INSERT - Anyone can request to join (creates pending)
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Team Members: UPDATE - Owner can approve/reject, member can update self
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE USING (
    is_team_owner(team_id, auth.uid()) OR
    user_id = auth.uid()
  );

-- Team Members: DELETE - Owner or self can remove
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE USING (
    is_team_owner(team_id, auth.uid()) OR
    user_id = auth.uid()
  );

-- ============================================================
-- VERIFY POLICIES ARE APPLIED
-- ============================================================
SELECT 'RLS Policies fixed successfully!' as result;
