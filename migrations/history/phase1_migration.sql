-- Phase 1: Add captured webpage data columns to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS captured_url TEXT,
ADD COLUMN IF NOT EXISTS captured_text TEXT,
ADD COLUMN IF NOT EXISTS captured_screenshot TEXT,
ADD COLUMN IF NOT EXISTS saved_tabs JSONB;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('captured_url', 'captured_text', 'captured_screenshot', 'saved_tabs');
