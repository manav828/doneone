-- =================================================================
-- FLOWBOARD HISTORY MANAGEMENT MIGRATION
-- Version: 1.0
-- Description: Adds task history, archiving, and retention features
-- =================================================================

-- 1. TASK HISTORY TABLE
-- Stores archived tasks with full snapshot and metadata
CREATE TABLE IF NOT EXISTS public.task_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL, -- Original task ID (task may no longer exist)
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  task_data jsonb NOT NULL, -- Full task snapshot as JSON
  status_at_archive text NOT NULL, -- Pending/In Progress/Done
  time_taken int DEFAULT 0, -- Total seconds from creation to archive
  archived_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  archived_by uuid REFERENCES public.profiles(id), -- User who manually archived (null if auto)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE TABLE IF NOT EXISTS public.admin_retention_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforce single row
  retention_days int, -- NULL = no auto-delete, >0 = delete after X days
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize with default (no retention)
INSERT INTO public.admin_retention_settings (id, retention_days)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. DISABLE ROW LEVEL SECURITY (matching existing pattern)
ALTER TABLE public.task_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_archive_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_retention_settings DISABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTIONS

-- Function: Archive a task
-- Moves task to history with calculated time tracking
CREATE OR REPLACE FUNCTION archive_task_fn(p_task_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task record;
  v_column_title text;
  v_time_taken int;
  v_status text;
BEGIN
  -- 1. Fetch the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- 2. Get column title for status
  SELECT title INTO v_column_title FROM columns WHERE id = v_task.column_id;
  v_status := COALESCE(v_column_title, 'Unknown');

  -- 3. Calculate time taken (seconds from creation to now)
  v_time_taken := EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - v_task.created_at))::int;

  -- 4. Insert into history
  INSERT INTO task_history (
    task_id,
    project_id,
    task_data,
    status_at_archive,
    time_taken,
    archived_by
  ) VALUES (
    p_task_id,
    v_task.project_id,
    to_jsonb(v_task),
    v_status,
    v_time_taken,
    p_user_id
  );

  -- 5. Delete from active tasks
  DELETE FROM tasks WHERE id = p_task_id;

  RETURN json_build_object('success', true, 'task_id', p_task_id);
END;
$$;

-- Function: Get filtered task history
-- Returns history with filters applied (for use in frontend)
CREATE OR REPLACE FUNCTION get_task_history_filtered(
  p_project_id uuid,
  p_date_start timestamp with time zone DEFAULT NULL,
  p_date_end timestamp with time zone DEFAULT NULL,
  p_assignee_ids uuid[] DEFAULT NULL,
  p_tag_ids text[] DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_time_min int DEFAULT NULL,
  p_time_max int DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  task_id uuid,
  project_id uuid,
  task_data jsonb,
  status_at_archive text,
  time_taken int,
  archived_at timestamp with time zone,
  archived_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.id,
    th.task_id,
    th.project_id,
    th.task_data,
    th.status_at_archive,
    th.time_taken,
    th.archived_at,
    th.archived_by
  FROM task_history th
  WHERE 
    th.project_id = p_project_id
    AND (p_date_start IS NULL OR th.archived_at >= p_date_start)
    AND (p_date_end IS NULL OR th.archived_at <= p_date_end)
    AND (p_assignee_ids IS NULL OR (th.task_data->>'assigneeId')::uuid = ANY(p_assignee_ids))
    AND (p_tag_ids IS NULL OR th.task_data->'tagIds' ?| p_tag_ids)
    AND (p_status IS NULL OR th.status_at_archive = p_status)
    AND (p_time_min IS NULL OR th.time_taken >= p_time_min)
    AND (p_time_max IS NULL OR th.time_taken <= p_time_max)
    AND (p_search_query IS NULL OR 
         (th.task_data->>'title' ILIKE '%' || p_search_query || '%') OR
         (th.task_data->>'description' ILIKE '%' || p_search_query || '%'))
  ORDER BY th.archived_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: Cleanup old history (admin retention)
-- Deletes history older than retention_days setting
CREATE OR REPLACE FUNCTION cleanup_old_history()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days int;
  v_cutoff_date timestamp with time zone;
  v_deleted_count int;
BEGIN
  -- 1. Get retention setting
  SELECT retention_days INTO v_retention_days FROM admin_retention_settings WHERE id = 1;

  -- 2. If no retention set, return early
  IF v_retention_days IS NULL THEN
    RETURN json_build_object('success', true, 'deleted_count', 0, 'message', 'No retention policy set');
  END IF;

  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_retention_days || ' days')::interval;

  -- 4. Delete old history
  DELETE FROM task_history WHERE archived_at < v_cutoff_date;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'deleted_count', v_deleted_count, 'cutoff_date', v_cutoff_date);
END;
$$;

-- Function: Auto-archive old tasks for a user
-- Archives tasks older than user's auto_archive_days setting
CREATE OR REPLACE FUNCTION auto_archive_user_tasks(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auto_archive_days int;
  v_cutoff_date timestamp with time zone;
  v_task record;
  v_archived_count int := 0;
BEGIN
  -- 1. Get user's auto-archive setting
  SELECT auto_archive_days INTO v_auto_archive_days 
  FROM user_archive_settings 
  WHERE user_id = p_user_id;

  -- 2. If not set or disabled, return early
  IF v_auto_archive_days IS NULL OR v_auto_archive_days = 0 THEN
    RETURN json_build_object('success', true, 'archived_count', 0, 'message', 'Auto-archive disabled');
  END IF;

  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_auto_archive_days || ' days')::interval;

  -- 4. Archive old tasks for this user
  FOR v_task IN 
    SELECT id FROM tasks 
    WHERE updated_at < v_cutoff_date 
    AND (creator_id = p_user_id OR assignee_id = p_user_id)
  LOOP
    PERFORM archive_task_fn(v_task.id, NULL); -- NULL = auto-archived
    v_archived_count := v_archived_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'archived_count', v_archived_count, 'cutoff_date', v_cutoff_date);
END;
$$;

-- 6. GRANT PERMISSIONS (if using RLS in future)
-- For now, RLS is disabled, so these are placeholders
-- GRANT SELECT, INSERT, UPDATE, DELETE ON task_history TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_archive_settings TO authenticated;
-- GRANT SELECT ON admin_retention_settings TO authenticated;
-- GRANT UPDATE ON admin_retention_settings TO admin; -- Future: restrict to admin only

-- 7. ENABLE REALTIME (optional, for live updates)
-- ALTER PUBLICATION supabase_realtime ADD TABLE task_history;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_archive_settings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE admin_retention_settings;

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables created: SELECT * FROM task_history LIMIT 1;
-- 3. Test archive function: SELECT archive_task_fn('task-uuid-here');
-- 4. Proceed with TypeScript type definitions and store updates
-- =================================================================
