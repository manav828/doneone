-- ============================================================
-- TEAM-BASED MEMBER MANAGEMENT MIGRATION
-- ============================================================
-- This script creates the team architecture for proper member counting
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TEAMS TABLE (Organization/Workspace)
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_join_code ON teams(join_code);

-- ============================================================
-- 2. TEAM ROLES TABLE (Custom roles defined by owner)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_roles_team ON team_roles(team_id);

-- ============================================================
-- 3. TEAM MEMBERS TABLE (Shared member pool)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================================
-- 4. DEPARTMENTS TABLE (Grouping within teams)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_team ON departments(team_id);

-- ============================================================
-- 5. DEPARTMENT MEMBERS TABLE (Assignment to departments)
-- ============================================================
CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_department_members_dept ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_department_members_user ON department_members(user_id);

-- ============================================================
-- 6. MODIFY PROJECTS TABLE (Add team_id)
-- ============================================================
-- Add team_id column (nullable for backward compatibility with free user projects)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);

-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES FOR TEAMS
-- ============================================================
-- View: Owner or active member of the team
CREATE POLICY "Users can view teams they own or belong to" ON teams
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Insert: Any authenticated user can create a team
CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Update: Only owner can update
CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

-- Delete: Only owner can delete
CREATE POLICY "Team owners can delete their teams" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- 9. RLS POLICIES FOR TEAM MEMBERS
-- ============================================================
-- View: Team owner or the member themselves
CREATE POLICY "Team members visible to team" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Insert: Anyone can request to join (creates pending entry)
CREATE POLICY "Users can request to join teams" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update: Team owner can approve/reject, or member can leave
CREATE POLICY "Owners can manage team members" ON team_members
  FOR UPDATE USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Delete: Team owner or the member themselves
CREATE POLICY "Owners or self can remove membership" ON team_members
  FOR DELETE USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- ============================================================
-- 10. RLS POLICIES FOR TEAM ROLES
-- ============================================================
CREATE POLICY "Team roles visible to team members" ON team_roles
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team owners can manage roles" ON team_roles
  FOR ALL USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- ============================================================
-- 11. RLS POLICIES FOR DEPARTMENTS
-- ============================================================
CREATE POLICY "Departments visible to team members" ON departments
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team owners can manage departments" ON departments
  FOR ALL USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- ============================================================
-- 12. RLS POLICIES FOR DEPARTMENT MEMBERS
-- ============================================================
CREATE POLICY "Department members visible to team" ON department_members
  FOR SELECT USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN teams t ON d.team_id = t.id
      WHERE t.owner_id = auth.uid() OR
      d.team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY "Team owners can manage department members" ON department_members
  FOR ALL USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN teams t ON d.team_id = t.id
      WHERE t.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 13. HELPER FUNCTION: Get team member count
-- ============================================================
CREATE OR REPLACE FUNCTION get_team_member_count(p_team_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM team_members
    WHERE team_id = p_team_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. HELPER FUNCTION: Check if can add member to team
-- ============================================================
CREATE OR REPLACE FUNCTION can_add_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_id UUID;
  v_base_limit INTEGER;
  v_extra_seats INTEGER;
  v_current_count INTEGER;
  v_effective_limit INTEGER;
BEGIN
  -- Get team owner
  SELECT owner_id INTO v_owner_id FROM teams WHERE id = p_team_id;
  
  -- Get owner's limits from profile
  SELECT 
    COALESCE(max_resources, 5),
    COALESCE(extra_seats, 0)
  INTO v_base_limit, v_extra_seats
  FROM profiles WHERE id = v_owner_id;
  
  -- Calculate effective limit
  v_effective_limit := v_base_limit + v_extra_seats;
  
  -- Get current count
  v_current_count := get_team_member_count(p_team_id);
  
  RETURN v_current_count < v_effective_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 15. SECURE JOIN TEAM FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION join_team_secure(p_join_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_user_id UUID := auth.uid();
  v_existing_status TEXT;
BEGIN
  -- Find team by code
  SELECT id INTO v_team_id FROM teams WHERE join_code = UPPER(p_join_code);
  
  IF v_team_id IS NULL THEN
    RETURN json_build_object('status', 'not_found');
  END IF;
  
  -- Check if already a member
  SELECT status INTO v_existing_status 
  FROM team_members 
  WHERE team_id = v_team_id AND user_id = v_user_id;
  
  IF v_existing_status = 'active' THEN
    RETURN json_build_object('status', 'already_member');
  END IF;
  
  IF v_existing_status = 'pending' THEN
    RETURN json_build_object('status', 'already_pending');
  END IF;
  
  -- Create pending membership request
  INSERT INTO team_members (team_id, user_id, status)
  VALUES (v_team_id, v_user_id, 'pending')
  ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'pending';
  
  RETURN json_build_object('status', 'requested', 'team_id', v_team_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 16. DATA MIGRATION (Run after tables are created)
-- ============================================================
-- This migrates existing projects to the new team structure

-- Step 1: Create teams for existing project owners (premium users)
INSERT INTO teams (owner_id, name, join_code)
SELECT DISTINCT
  p.manager_id,
  COALESCE(pr.name, 'User') || '''s Workspace',
  UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
FROM projects p
JOIN profiles pr ON p.manager_id = pr.id
WHERE p.manager_id IS NOT NULL
  AND pr.is_premium = true
  AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.owner_id = p.manager_id)
ON CONFLICT DO NOTHING;

-- Step 2: Link existing projects to their owner's team
UPDATE projects p
SET team_id = t.id
FROM teams t
WHERE t.owner_id = p.manager_id
  AND p.team_id IS NULL;

-- Step 3: Add team owners as active members of their own teams
INSERT INTO team_members (team_id, user_id, status)
SELECT id, owner_id, 'active'
FROM teams
ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'active';

-- Step 4: Migrate existing project_members to team_members
INSERT INTO team_members (team_id, user_id, status)
SELECT DISTINCT
  p.team_id,
  pm.user_id,
  CASE WHEN pm.status = 'active' THEN 'active' ELSE 'pending' END
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
WHERE p.team_id IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Step 5: Create a default "General" department for each team
INSERT INTO departments (team_id, name, color)
SELECT id, 'General', '#6b7280'
FROM teams
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- After running this script:
-- 1. Existing premium users will have a team created
-- 2. Their projects will be linked to their team
-- 3. Existing project members will be migrated to team members
-- 4. Each team will have a "General" department
-- 5. Free users' projects remain without a team (personal projects)
