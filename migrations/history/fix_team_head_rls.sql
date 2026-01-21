-- EMERGENCY FIX: Reset RLS to restore login functionality
-- Run these in Supabase SQL Editor ONE BY ONE

-- STEP 1: Temporarily disable RLS on problematic tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on these tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
    
    -- Drop all policies on projects
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
    END LOOP;
    
    -- Drop all policies on project_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'project_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_members', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: Re-enable RLS with simple non-recursive policies

-- Profiles: Simple policy - users can see all profiles (needed for showing user names)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Projects: Simple policy without project_members reference
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON projects FOR SELECT
USING (
  manager_id = auth.uid()
  OR auth.uid()::text = ANY(manager_ids::text[])
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = 'manavss828@gmail.com')
);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (manager_id = auth.uid());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (manager_id = auth.uid());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (manager_id = auth.uid());

-- Project Members: Simple policy
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (true);
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "project_members_update" ON project_members FOR UPDATE USING (true);
CREATE POLICY "project_members_delete" ON project_members FOR DELETE USING (true);



