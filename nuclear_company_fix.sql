-- "Nuclear" Fix for Company Visibility
-- This removes all complex rules and just lets any logged-in user see Company Names.
-- We can refine this later, but this GUARANTEES the data is sent to the frontend.

BEGIN;

-- 1. Ensure Foreign Keys exist (Just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'teams_company_id_fkey') THEN
        ALTER TABLE teams ADD CONSTRAINT teams_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;

-- 2. Drop all restrictive policies
DROP POLICY IF EXISTS "companies_read_access" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;

-- 3. Create the "Open Read" Policy
CREATE POLICY "companies_read_access" ON companies FOR SELECT
USING ( auth.role() = 'authenticated' );

-- 4. Reload Schema to ensure API knows about the relation
NOTIFY pgrst, 'reload schema';

COMMIT;
