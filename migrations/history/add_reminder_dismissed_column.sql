-- Add is_reminder_dismissed column to tasks table
-- This column tracks whether the user has dismissed the reminder animation for a task

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_reminder_dismissed BOOLEAN DEFAULT FALSE;

-- Add a comment explaining the column
COMMENT ON COLUMN tasks.is_reminder_dismissed IS 'Tracks if the reminder alert animation has been dismissed by the user. When true, the task will not show pulsing animation even if overdue.';
