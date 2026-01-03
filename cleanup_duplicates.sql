-- Clean up Duplicate Companies (Safe Version)
-- Updated to fix Foreign Key Constraint Violation

DO $$
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT owner_id FROM companies LOOP
        -- 1. Identify the Company to KEEP (The oldest one)
        SELECT id INTO keep_id 
        FROM companies 
        WHERE owner_id = r.owner_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        RAISE NOTICE 'Processing Owner: %, Keeping Company: %', r.owner_id, keep_id;

        -- 2. Update REFERENCES in other tables to point to the `keep_id`
        -- Move profiles attached to duplicate companies -> keep_id
        UPDATE profiles 
        SET company_id = keep_id 
        WHERE company_id IN (
            SELECT id FROM companies 
            WHERE owner_id = r.owner_id AND id != keep_id
        );

        -- Move teams attached to duplicate companies -> keep_id
        UPDATE teams 
        SET company_id = keep_id 
        WHERE company_id IN (
            SELECT id FROM companies 
            WHERE owner_id = r.owner_id AND id != keep_id
        );

        -- 3. NOW it is safe to delete the duplicates
        DELETE FROM companies 
        WHERE owner_id = r.owner_id AND id != keep_id;
        
    END LOOP;
END $$;
