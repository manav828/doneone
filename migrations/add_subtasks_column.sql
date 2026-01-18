-- Add subtasks JSONB column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Add sound_enabled column to profiles (default true for new users)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;
