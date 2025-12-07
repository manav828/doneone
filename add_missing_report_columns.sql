-- =================================================================
-- FIX: ADD MISSING COLUMNS FOR TASK REPORTS
-- The error "Could not find the 'completed_at' column" indicates these
-- columns are missing in the 'tasks' table.
-- =================================================================

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone DEFAULT NULL;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone DEFAULT NULL;

-- Optional: Add comments for clarity
COMMENT ON COLUMN tasks.started_at IS 'Timestamp when task was moved to In Progress';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was moved to Done';

-- Refresh the schema cache is usually handled automatically by Supabase/PostgREST
-- checking the schema after these changes should resolve the PGRST204 error.
