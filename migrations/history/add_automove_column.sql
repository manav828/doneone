-- Add auto_move_enabled column to projects table
-- This enables/disables automatic movement of tasks from Pending to In Progress

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS auto_move_enabled BOOLEAN DEFAULT true;

-- Update existing projects to have auto_move enabled by default
UPDATE projects
SET auto_move_enabled = true
WHERE auto_move_enabled IS NULL;
