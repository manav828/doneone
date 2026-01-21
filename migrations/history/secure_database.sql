-- ==========================================
-- SECURE DATABASE SCRIPT (Row Level Security)
-- ==========================================
-- Run this entire script in your Supabase SQL Editor to secure your database.
-- 
-- 1. Enables RLS on all tables.
-- 2. Creates policies ensuring users can only access their own data.
-- ==========================================

-- -------------------------------------------------------------------------
-- 1. Enable RLS on all relevant tables
-- -------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_archive_settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 1.1 ENSURE SCHEMA EXISTS (Fix missing columns)
-- -------------------------------------------------------------------------
-- Fix for 'column project_id does not exist' error
ALTER TABLE tags ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo text;

-- Assuming 'support_tickets' exists based on store.ts usage
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  type text,
  title text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -------------------------------------------------------------------------
-- Helper to check if current user is a member of the project
CREATE OR REPLACE FUNCTION is_project_member(project_id uuid) RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM project_members 
  WHERE project_members.project_id = is_project_member.project_id 
  AND project_members.user_id = auth.uid()
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper to check if current user is the manager of the project
CREATE OR REPLACE FUNCTION is_project_manager(id uuid) RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = is_project_manager.id 
  AND projects.manager_id = auth.uid()
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper to check if current user is the Super Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  -- Check email from JWT (secure)
  RETURN (auth.jwt() ->> 'email') = 'manavss828@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -------------------------------------------------------------------------
-- 3. POLICIES
-- -------------------------------------------------------------------------

-- === PROFILES ===
DROP POLICY IF EXISTS "Profiles: Users can insert own" ON profiles;
CREATE POLICY "Profiles: Users can insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: Users can view own" ON profiles;
CREATE POLICY "Profiles: Users can view own" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Profiles: Users can update own" ON profiles;
CREATE POLICY "Profiles: Users can update own" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
-- Admin Delete
CREATE POLICY "Profiles: Admin delete" ON profiles FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Profiles: View team members" ON profiles;
CREATE POLICY "Profiles: View team members" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  )
);


-- === PROJECTS ===
DROP POLICY IF EXISTS "Projects: View if member/manager" ON projects;
CREATE POLICY "Projects: View if member/manager" ON projects FOR SELECT USING (
  manager_id = auth.uid() OR is_project_member(id) OR is_admin()
);

DROP POLICY IF EXISTS "Projects: Insert" ON projects;
CREATE POLICY "Projects: Insert" ON projects FOR INSERT WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Projects: Update if manager" ON projects;
CREATE POLICY "Projects: Update if manager" ON projects FOR UPDATE USING (manager_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Projects: Delete if manager" ON projects;
CREATE POLICY "Projects: Delete if manager" ON projects FOR DELETE USING (manager_id = auth.uid() OR is_admin());


-- === PROJECT MEMBERS ===
DROP POLICY IF EXISTS "Members: View if in project" ON project_members;
CREATE POLICY "Members: View if in project" ON project_members FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND manager_id = auth.uid()) OR
  is_project_member(project_id) OR
  is_admin()
);

DROP POLICY IF EXISTS "Members: Manager manage" ON project_members;
CREATE POLICY "Members: Manager manage" ON project_members FOR ALL USING (
  is_project_manager(project_id) OR is_admin()
);

DROP POLICY IF EXISTS "Members: Leave project" ON project_members;
CREATE POLICY "Members: Leave project" ON project_members FOR DELETE USING (user_id = auth.uid());


-- === COLUMNS ===
DROP POLICY IF EXISTS "Columns: View if project member" ON columns;
CREATE POLICY "Columns: View if project member" ON columns FOR SELECT USING (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);

DROP POLICY IF EXISTS "Columns: Manage if project member" ON columns;
CREATE POLICY "Columns: Manage if project member" ON columns FOR ALL USING (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);


-- === TASKS ===
DROP POLICY IF EXISTS "Tasks: View if project member" ON tasks;
CREATE POLICY "Tasks: View if project member" ON tasks FOR SELECT USING (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);

DROP POLICY IF EXISTS "Tasks: Manage if project member" ON tasks;
CREATE POLICY "Tasks: Manage if project member" ON tasks FOR ALL USING (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);


-- === ACTIVITIES ===
DROP POLICY IF EXISTS "Activities: View if project member" ON activities;
CREATE POLICY "Activities: View if project member" ON activities FOR SELECT USING (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);

DROP POLICY IF EXISTS "Activities: Insert" ON activities;
CREATE POLICY "Activities: Insert" ON activities FOR INSERT WITH CHECK (
  is_project_manager(project_id) OR is_project_member(project_id) OR is_admin()
);


-- === NOTIFICATIONS ===
DROP POLICY IF EXISTS "Notifications: Own only" ON notifications;
CREATE POLICY "Notifications: Own only" ON notifications FOR ALL USING (recipient_id = auth.uid() OR is_admin());


-- === TAGS ===
DROP POLICY IF EXISTS "Tags: Project access" ON tags;
CREATE POLICY "Tags: Project access" ON tags FOR ALL USING (
    project_id IS NULL OR 
    is_project_manager(project_id) OR 
    is_project_member(project_id) OR
    is_admin()
);


-- === PLANS ===
DROP POLICY IF EXISTS "Plans: Public read" ON plans;
CREATE POLICY "Plans: Public read" ON plans FOR SELECT USING (true);
CREATE POLICY "Plans: Admin manage" ON plans FOR ALL USING (is_admin());


-- === ARCHIVE SETTINGS ===
DROP POLICY IF EXISTS "Archive: Own settings" ON user_archive_settings;
CREATE POLICY "Archive: Own settings" ON user_archive_settings FOR ALL USING (user_id = auth.uid() OR is_admin());


-- === SUPPORT TICKETS ===
DROP POLICY IF EXISTS "Tickets: Own tickets" ON support_tickets;
CREATE POLICY "Tickets: Own tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Tickets: Insert own" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Tickets: Admin manage" ON support_tickets FOR UPDATE USING (is_admin());

