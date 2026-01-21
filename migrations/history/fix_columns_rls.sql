-- Fix RLS Policy for Columns to allow Team Heads and Project Managers to manage columns
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing policies on columns table
DROP POLICY IF EXISTS "Users can view columns" ON columns;
DROP POLICY IF EXISTS "columns_select_policy" ON columns;
DROP POLICY IF EXISTS "columns_insert_policy" ON columns;
DROP POLICY IF EXISTS "columns_update_policy" ON columns;
DROP POLICY IF EXISTS "columns_delete_policy" ON columns;

-- Step 2: Create unified policies for columns
-- SELECT: Allow users to see columns if they can see the project
CREATE POLICY "columns_select" ON columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id
    -- This relies on the projects table policy which we already fixed
    -- But for robustness, let's duplicate the check:
    AND (
      p.manager_id = auth.uid() -- Project Manager
      OR auth.uid()::text = ANY(p.manager_ids::text[]) -- Project Co-Manager
      -- Team Head
      OR EXISTS (
        SELECT 1 FROM teams t WHERE t.id = p.team_id AND auth.uid()::text = ANY(t.manager_ids::text[])
      )
      -- Team Owner
      OR EXISTS (
        SELECT 1 FROM teams t WHERE t.id = p.team_id AND t.owner_id = auth.uid()
      )
      -- Project Member (Lead/Resource)
      OR EXISTS (
        SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active'
      )
      -- Super Admin
      OR EXISTS (
         SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com'
      )
    )
  )
);

-- INSERT: Allow Project Managers and Team Heads to create columns
CREATE POLICY "columns_insert" ON columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (
        SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      OR EXISTS (
         SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com'
      )
    )
  )
);

-- UPDATE: Allow Project Managers and Team Heads to update columns
CREATE POLICY "columns_update" ON columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (
        SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      OR EXISTS (
         SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com'
      )
    )
  )
);

-- DELETE: Allow Project Managers and Team Heads to delete columns
CREATE POLICY "columns_delete" ON columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id
    AND (
      p.manager_id = auth.uid()
      OR auth.uid()::text = ANY(p.manager_ids::text[])
      OR EXISTS (
        SELECT 1 FROM teams t WHERE t.id = p.team_id AND 
        (t.owner_id = auth.uid() OR auth.uid()::text = ANY(t.manager_ids::text[]))
      )
      OR EXISTS (
         SELECT 1 FROM profiles pf WHERE pf.id = auth.uid() AND pf.email = 'manavss828@gmail.com'
      )
    )
  )
);
