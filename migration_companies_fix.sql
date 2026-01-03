-- Migration to Company Table Architecture - FIX
-- Run this in Supabase SQL Editor

-- 1. Create table 'companies'
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    join_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 2. Add company_id and Allow NULL join_code on teams
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- CRITICAL FIX: Make join_code nullable on teams
ALTER TABLE teams ALTER COLUMN join_code DROP NOT NULL;

-- 3. Migrate Data: Create Company for existing Owners
DO $$
DECLARE
    main_owner_id UUID;
    company_uuid UUID;
BEGIN
    -- Identify Main Owner (Manav)
    SELECT id INTO main_owner_id FROM profiles WHERE email = 'manavss828@gmail.com';

    IF main_owner_id IS NOT NULL THEN
        -- Create Company "DoneOne"
        SELECT id INTO company_uuid FROM companies WHERE owner_id = main_owner_id LIMIT 1;
        
        IF company_uuid IS NULL THEN
             INSERT INTO companies (name, owner_id, join_code)
             VALUES ('DoneOne', main_owner_id, 'DONE1') 
             RETURNING id INTO company_uuid;
        END IF;

        -- Assign Company to Manav
        UPDATE profiles SET company_id = company_uuid WHERE id = main_owner_id;

        -- Assign Company to Manav's Teams
        UPDATE teams SET company_id = company_uuid WHERE owner_id = main_owner_id;
        
        -- Assign Company to Employees
        UPDATE profiles SET company_id = company_uuid 
        WHERE id IN (
            SELECT user_id FROM team_members 
            WHERE team_id IN (SELECT id FROM teams WHERE owner_id = main_owner_id)
        );

        -- RENAME confusing Team names
        UPDATE teams 
        SET name = 'General' 
        WHERE (name = 'DoneOne' OR name = 'Manav''s team') 
        AND owner_id = main_owner_id;
        
    END IF;
END $$;

-- 4. Clear Team Join Codes
UPDATE teams SET join_code = NULL;

-- 5. Policies
DROP POLICY IF EXISTS "companies_read_access" ON companies;
CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING (
    owner_id = auth.uid() 
    OR id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "companies_update_access" ON companies;
CREATE POLICY "companies_update_access" ON companies FOR UPDATE
USING (owner_id = auth.uid());

-- 6. RPC
CREATE OR REPLACE FUNCTION join_company_secure(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    SELECT id INTO v_company_id FROM companies WHERE join_code = p_join_code;

    IF v_company_id IS NULL THEN
        RETURN jsonb_build_object('status', 'invalid_code');
    END IF;

    UPDATE profiles 
    SET company_id = v_company_id 
    WHERE id = v_user_id;

    RETURN jsonb_build_object('status', 'success', 'company_id', v_company_id);
END;
$$;
