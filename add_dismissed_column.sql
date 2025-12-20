-- Migration to add 'is_reminder_dismissed' column to tasks table
-- Run this in your Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_reminder_dismissed boolean DEFAULT false;

-- Optional: Update existing records to false (default handles new ones)
UPDATE tasks SET is_reminder_dismissed = false WHERE is_reminder_dismissed IS NULL;
