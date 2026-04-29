-- =================================================================
-- HISTORY BUG FIXES
-- Run this in Supabase SQL Editor for FlowBoard project
-- =================================================================

-- Fix 1: Deduplicate existing records (keep earliest entry per task_id)
DELETE FROM task_history a
USING task_history b
WHERE a.task_id = b.task_id
  AND a.archived_at > b.archived_at;

-- Fix 2: Add unique constraint on task_id to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_task_history_task_id'
  ) THEN
    ALTER TABLE task_history ADD CONSTRAINT uq_task_history_task_id UNIQUE (task_id);
  END IF;
END $$;

-- Fix 3: Update archive_task_fn to use actual time_tracked instead of wall-clock
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

  -- 3. Use actual tracked time (from timer), not wall-clock time
  v_time_taken := COALESCE(v_task.time_tracked, 0);

  -- 4. Insert into history (with dedup via ON CONFLICT)
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
  )
  ON CONFLICT (task_id) DO UPDATE SET
    task_data = EXCLUDED.task_data,
    status_at_archive = EXCLUDED.status_at_archive,
    time_taken = EXCLUDED.time_taken,
    archived_at = timezone('utc'::text, now()),
    archived_by = EXCLUDED.archived_by;

  -- 5. Delete from active tasks
  DELETE FROM tasks WHERE id = p_task_id;

  RETURN json_build_object('success', true, 'task_id', p_task_id);
END;
$$;
