-- Fix RLS Policy for Tasks to allow Team Heads to manage tasks
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Enable update for users based on email" ON tasks;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON tasks;

-- Step 2: Create unified policies for tasks

-- SELECT: deeply check team permissions
CREATE POLICY "tasks_select" ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND (
      -- Project Manager
      p.manager_id = auth.uid()
      -- Project Co-Manager
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      -- Team Owner
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id AND t.owner_id = auth.uid())
      -- Team Head
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id AND auth.uid()::text = ANY(t.manager_ids::text[]))
      -- Project Member (Lead/Resource)
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active')
      -- Super Admin
      OR EXISTS (SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com')
    )
  )
);

-- INSERT: Allow Team Heads/Managers/Members to create tasks
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active')
      OR EXISTS (SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com')
    )
  )
);

-- UPDATE: Allow Team Heads/Managers/Members to select and update tasks
-- Note: Logic for "who can edit what" is often in frontend or finer grained, 
-- but broadly if you have generally access, RLS allows the update attempt.
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active')
      OR EXISTS (SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com')
    )
  )
);

-- DELETE: Usually only Managers, but we allow policy to pass if user has broad access
-- Application logic will prevent Resource from deleting.
CREATE POLICY "tasks_delete" ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      -- Allow delete via RLS, app checks role
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active') 
      OR EXISTS (SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com')
    )
  )
);
