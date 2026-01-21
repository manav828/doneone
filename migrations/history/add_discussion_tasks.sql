-- Discussion Tasks Feature Migration
-- Adds fields to support discussion tasks with multiple participants

-- Add discussion fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_discussion BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discussion_user_ids UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discussion_ended BOOLEAN DEFAULT FALSE;

-- Index for faster lookups of tasks by discussion participants
CREATE INDEX IF NOT EXISTS idx_tasks_discussion_users ON tasks USING GIN(discussion_user_ids);

-- Index for active discussions
CREATE INDEX IF NOT EXISTS idx_tasks_active_discussions ON tasks(is_discussion) WHERE is_discussion = TRUE AND discussion_ended = FALSE;

COMMENT ON COLUMN tasks.is_discussion IS 'Whether this task is marked for group discussion';
COMMENT ON COLUMN tasks.discussion_user_ids IS 'Array of user IDs participating in the discussion';
COMMENT ON COLUMN tasks.discussion_ended IS 'Whether the discussion has been concluded';
