-- Sample seed data for professional demo
-- =================================================================
-- RE-RUNNABLE SCRIPT (Idempotent)
-- =================================================================

-- 1. Fix RLS Policy for Profiles Insert (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Allow users to insert own profile'
    ) THEN
        CREATE POLICY "Allow users to insert own profile" 
        ON profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 2. Upsert Users (Update if exists)
INSERT INTO profiles (id, email, name, avatar_url, created_at, premium_until) VALUES
  ('f2455b5a-e567-4610-b791-4c39b6c340a2', 'alice@example.com', 'Alice', 'https://i.pravatar.cc/150?img=1', now(), null),
  ('226dcd94-7cd3-4145-8720-3c6a5c43a8c0', 'bob@example.com', 'Bob', 'https://i.pravatar.cc/150?img=2', now(), null),
  ('fd0e8005-fc4a-43de-98b5-5dbdcc70d9a7', 'carol@example.com', 'Carol', 'https://i.pravatar.cc/150?img=3', now(), null)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url;

-- 3. Upsert Project
INSERT INTO projects (id, name, description, logo, theme_color, created_at) VALUES
  ('1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Acme Corp', 'Demo project for landing page', 'https://picsum.photos/200/200', '#1E40AF', now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  theme_color = EXCLUDED.theme_color;

-- =================================================================
-- CLEANUP CHILD DATA FOR DEMO PROJECT (To prevent duplicates on rerun)
-- =================================================================
DELETE FROM tasks WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35';
DELETE FROM tags WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35';
DELETE FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35';
DELETE FROM project_members WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35';

-- =================================================================
-- RE-INSERT CHILD DATA
-- =================================================================

-- 4. Project members
-- Alice is already defined as manager_id in projects table, so strictly speaking she doesn't need to be here,
-- or she might be 'Manager' if the schema supports it. Safest is to rely on projects.manager_id.
-- Bob and Carol are Resources (Members).
INSERT INTO project_members (project_id, user_id, role, status) VALUES
  ('1e0fa184-2390-4e7d-bc09-57315ec5ad35', '226dcd94-7cd3-4145-8720-3c6a5c43a8c0', 'Resource', 'active'),
  ('1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'fd0e8005-fc4a-43de-98b5-5dbdcc70d9a7', 'Resource', 'active');

-- 5. Columns (Kanban)
INSERT INTO columns (id, project_id, title, order_index) VALUES
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Pending', 0),
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'In Progress', 1),
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Done', 2);

-- 6. Tags (Hardcoded UUIDs for reference)
INSERT INTO tags (id, project_id, name, color, type) VALUES
  ('a11ce001-tag0-0000-0000-000000000001', '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'High Priority', '#EF4444', 'Priority'),
  ('a11ce001-tag0-0000-0000-000000000002', '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Bug', '#F59E0B', 'Custom'),
  ('a11ce001-tag0-0000-0000-000000000003', '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Feature', '#10B981', 'Custom'),
  ('a11ce001-tag0-0000-0000-000000000004', '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 'Design', '#8B5CF6', 'Custom');

-- 7. Tasks
INSERT INTO tasks (id, project_id, column_id, title, description, assignee_id, creator_id, due_date, estimated_time, time_tracked, tag_ids, created_at) VALUES
  -- Pending Tasks
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'Pending' LIMIT 1), 
   'Design Landing Page', 'Create a polished landing page mockup with brand colors.', 
   '226dcd94-7cd3-4145-8720-3c6a5c43a8c0', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() + interval '3 days', 14400, 3600, 
   ARRAY['a11ce001-tag0-0000-0000-000000000001', 'a11ce001-tag0-0000-0000-000000000004'], now()),

  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'Pending' LIMIT 1), 
   'Run Performance Tests', 'Benchmark the app load time and optimization.', 
   NULL, 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() + interval '7 days', 7200, 0, 
   ARRAY['a11ce001-tag0-0000-0000-000000000002'], now()),

  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'Pending' LIMIT 1), 
   'Create Wireframes', 'Design UI wireframes for the landing page.', 
   '226dcd94-7cd3-4145-8720-3c6a5c43a8c0', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() + interval '1 day', 3600, 1800, 
   ARRAY['a11ce001-tag0-0000-0000-000000000004'], now()),

  -- In Progress Tasks
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'In Progress' LIMIT 1), 
   'Implement Auth Flow', 'Set up Supabase authentication and user profile logic.', 
   'f2455b5a-e567-4610-b791-4c39b6c340a2', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() + interval '5 days', 28800, 14400, 
   ARRAY['a11ce001-tag0-0000-0000-000000000001', 'a11ce001-tag0-0000-0000-000000000003'], now()),

  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'In Progress' LIMIT 1), 
   'Integrate Stripe', 'Add test Stripe checkout flow for premium plans.', 
   'f2455b5a-e567-4610-b791-4c39b6c340a2', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() + interval '4 days', 18000, 9000, 
   ARRAY['a11ce001-tag0-0000-0000-000000000003'], now()),

  -- Done Tasks
  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'Done' LIMIT 1), 
   'Write Documentation', 'Complete help guide and API docs.', 
   'fd0e8005-fc4a-43de-98b5-5dbdcc70d9a7', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() - interval '1 day', 10800, 10800, 
   ARRAY['a11ce001-tag0-0000-0000-000000000003'], now()),

  (uuid_generate_v4(), '1e0fa184-2390-4e7d-bc09-57315ec5ad35', 
   (SELECT id FROM columns WHERE project_id = '1e0fa184-2390-4e7d-bc09-57315ec5ad35' AND title = 'Done' LIMIT 1), 
   'Finalize Branding', 'Polish colors, fonts, and logo.', 
   'fd0e8005-fc4a-43de-98b5-5dbdcc70d9a7', 'f2455b5a-e567-4610-b791-4c39b6c340a2', 
   now() - interval '2 days', 5400, 5400, 
   ARRAY['a11ce001-tag0-0000-0000-000000000004'], now());
