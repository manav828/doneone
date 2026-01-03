-- Refactor Architecture to Company-Level Join
-- Run this in Supabase SQL Editor

-- 1. Rename the Primary Team to "DoneOne" (The Company Container)
-- We identify it by the specific ID from your screenshot or broadly by owner
UPDATE teams
SET name = 'DoneOne'
WHERE name = 'Manav''s team';

-- 2. Clear join_code from SUB-DEPARTMENTS (e.g. "HR")
-- This ensures only the Company (DoneOne) has a valid join code
UPDATE teams
SET join_code = NULL
WHERE name != 'DoneOne'
AND name != 'Test Company' -- Preserving other potential workspaces if they are separate
AND owner_id = (SELECT owner_id FROM teams WHERE name = 'DoneOne' LIMIT 1);
