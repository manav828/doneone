-- Add priority column to tasks table
-- Run this in Supabase Dashboard -> SQL Editor

-- Add priority column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT 
CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low'));

-- Create an index for better query performance on priority filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE priority IS NOT NULL;
