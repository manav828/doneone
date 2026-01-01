-- FIX: AUTO-ARCHIVE LOGIC UPDATE
-- Description: Updates auto_archive_user_tasks to respect column settings and use correct date logic.
-- Prevents race conditions and "Task not found" errors by processing on backend.

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
  IF v_auto_archive_days IS NULL OR v_auto_archive_days <= 0 THEN
    RETURN json_build_object('success', true, 'archived_count', 0, 'message', 'Auto-archive disabled');
  END IF;

  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_auto_archive_days || ' days')::interval;

  -- 4. Archive old tasks for this user
  -- Logic matches client: 
  --   a. Task must be in a column where is_archive_enabled = true
  --   b. (completed_at OR updated_at) < cutoff_date
  --   c. User is creator or assignee
  
  FOR v_task IN 
    SELECT t.id 
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    WHERE 
      (t.creator_id = p_user_id OR t.assignee_id = p_user_id)
      AND c.is_archive_enabled = true
      AND COALESCE(t.completed_at, t.updated_at) < v_cutoff_date
  LOOP
    -- Call archive_task_fn for each task found
    -- We ignore the result since if it fails (e.g. concurrent delete), it's fine.
    PERFORM archive_task_fn(v_task.id, NULL); -- NULL = auto-archived
    v_archived_count := v_archived_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'archived_count', v_archived_count, 'cutoff_date', v_cutoff_date);
END;
$$;
