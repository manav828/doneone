-- Restore Manav's company_id to his own company (Firesprint)
-- This is needed because the broken trigger overwrote his company_id 
-- when he was approved into Studio Sahaj.
-- 
-- Step 1: Find Manav's user ID and his owned company
-- SELECT p.id as user_id, p.email, p.company_id, c.name as current_company
-- FROM profiles p 
-- LEFT JOIN companies c ON c.id = p.company_id
-- WHERE p.email = 'manavss828@gmail.com';
--
-- Step 2: Find the company he OWNS
-- SELECT c.id, c.name FROM companies c WHERE c.owner_id = (SELECT id FROM profiles WHERE email = 'manavss828@gmail.com');
--
-- Step 3: Restore it (run this):
UPDATE profiles 
SET company_id = (
    SELECT id FROM companies WHERE owner_id = profiles.id LIMIT 1
)
WHERE email = 'manavss828@gmail.com'
  AND EXISTS (
    SELECT 1 FROM companies WHERE owner_id = profiles.id
  );
