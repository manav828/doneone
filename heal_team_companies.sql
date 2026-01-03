-- Heal Teams: Link Orphaned Teams to their Owner's Company
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update teams that have NO company_id
    -- Set it to the company_id of the team's OWNER
    UPDATE teams t
    SET company_id = p.company_id
    FROM profiles p
    WHERE t.owner_id = p.id
    AND t.company_id IS NULL
    AND p.company_id IS NOT NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % orphaned teams.', updated_count;
END $$;

-- Verify the result
SELECT id, name, company_id FROM teams;
