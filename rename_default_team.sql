-- Rename default team to 'General' to avoid 'Manav's Team' confusion
-- This ensures that when users join the company, they are placed in a generic 'General' workspace
-- rather than one that looks like a personal team.

BEGIN;

-- 1. Rename any team looking like "Manav's Team" or "DoneOne" to "General"
-- Only if they belong to the main owner (Manav) to avoid renaming other users' personal teams if any
UPDATE teams 
SET name = 'General' 
WHERE (name ILIKE '%manav%team%' OR name = 'DoneOne')
AND owner_id = (SELECT id FROM profiles WHERE email = 'manavss828@gmail.com');

-- 2. Ensure join_company_secure looks for 'General' (It already does in fix_join_request_flow.sql)
-- But we can reinforce it or Create 'General' if it somehow doesn't exist?
-- For now, the rename should be sufficient as the logic is:
-- SELECT id FROM teams WHERE name = 'General' -> Found! -> Join that.

COMMIT;
