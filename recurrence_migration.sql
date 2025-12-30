-- Add recurrence column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS recurrence JSONB DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN tasks.recurrence IS 'Configuration for recurring tasks: { frequency, interval, daysOfWeek, nextTriggerAt, ... }';
