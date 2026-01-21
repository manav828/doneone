-- Add reminder_user_ids array column to tasks table to support multi-user reminders
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_user_ids uuid[] DEFAULT '{}';
