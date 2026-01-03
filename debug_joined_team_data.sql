-- DEBUG: Check Joined Team Data Integrity
-- Run this in Supabase SQL Editor to see WHY the company name is missing.

SELECT 
    t.id as team_id,
    t.name as team_name,
    t.company_id, -- <--- CHECK IF THIS IS NULL
    c.name as company_name, -- <--- CHECK IF THIS IS NULL
    c.id as company_table_id,
    tm.user_id as my_user_id
FROM teams t
LEFT JOIN companies c ON t.company_id = c.id
JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = auth.uid(); -- Shows teams YOU are a member of
