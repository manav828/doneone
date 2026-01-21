-- Add view_all_reports_enabled column to projects table
-- This enables/disables the ability for all members to view all reports regardless of role

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS view_all_reports_enabled BOOLEAN DEFAULT false;

-- Update existing projects to have this disabled by default (preserving hierarchy)
UPDATE projects
SET view_all_reports_enabled = false
WHERE view_all_reports_enabled IS NULL;
