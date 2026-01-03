-- Add manager_ids column to teams table for storing Team Heads
-- Run this in Supabase SQL Editor

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS manager_ids UUID[] DEFAULT '{}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_manager_ids ON teams USING GIN (manager_ids);
