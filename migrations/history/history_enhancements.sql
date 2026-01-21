-- ==================================================================================
-- HISTORY SYSTEM ENHANCEMENTS
-- Add per-user history retention and cleanup scripts
-- ==================================================================================

-- 1. ADD history_retention_days TO user_archive_settings
-- This allows each user to have their own history retention limit
ALTER TABLE user_archive_settings 
ADD COLUMN IF NOT EXISTS history_retention_days INTEGER DEFAULT NULL;

COMMENT ON COLUMN user_archive_settings.history_retention_days IS 
'Per-user history retention in days. NULL = keep forever. Admin can customize per user.';

-- 2. FUNCTION: Cleanup history for a specific user
-- Deletes history older than the user''s retention setting
CREATE OR REPLACE FUNCTION cleanup_user_history(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days int;
  v_cutoff_date timestamp with time zone;
  v_deleted_count int;
BEGIN
  -- 1. Get user's history retention setting
  SELECT history_retention_days INTO v_retention_days 
  FROM user_archive_settings 
  WHERE user_id = p_user_id;
  
  -- 2. If no retention set, return early
  IF v_retention_days IS NULL THEN
    RETURN json_build_object(
      'success', true, 
      'deleted_count', 0, 
      'message', 'No history retention set for this user'
    );
  END IF;
  
  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_retention_days || ' days')::interval;
  
  -- 4. Delete old history for this user
  DELETE FROM task_history 
  WHERE archived_by = p_user_id 
    AND archived_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true, 
    'deleted_count', v_deleted_count, 
    'cutoff_date', v_cutoff_date,
    'retention_days', v_retention_days
  );
END;
$$;

-- 3. FUNCTION: Cleanup all users' history
-- Runs cleanup for ALL users with retention settings
CREATE OR REPLACE FUNCTION cleanup_all_users_history()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
  v_total_deleted int := 0;
  v_user_count int := 0;
  v_result json;
BEGIN
  -- Loop through users with retention settings
  FOR v_user IN 
    SELECT user_id, history_retention_days 
    FROM user_archive_settings 
    WHERE history_retention_days IS NOT NULL AND history_retention_days > 0
  LOOP
    -- Run cleanup for each user
    SELECT cleanup_user_history(v_user.user_id) INTO v_result;
    v_total_deleted := v_total_deleted + (v_result->>'deleted_count')::int;
    v_user_count := v_user_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_deleted', v_total_deleted,
    'users_processed', v_user_count
  );
END;
$$;

-- 4. USAGE EXAMPLES:

-- Set history retention for a specific user (30 days)
-- UPDATE user_archive_settings 
-- SET history_retention_days = 30 
-- WHERE user_id = 'user-uuid-here';

-- Cleanup history for a specific user
-- SELECT cleanup_user_history('user-uuid-here');

-- Cleanup history for ALL users (respecting their individual settings)
-- SELECT cleanup_all_users_history();

-- View users with retention settings
-- SELECT p.name, p.email, uas.auto_archive_days, uas.history_retention_days
-- FROM user_archive_settings uas
-- JOIN profiles p ON p.id = uas.user_id
-- WHERE uas.history_retention_days IS NOT NULL;

-- ==================================================================================
-- MIGRATION COMPLETE - Run this SQL in Supabase SQL Editor
-- ==================================================================================
