-- Sample seed data for professional demo
-- Users
INSERT INTO profiles (id, email, name, avatar, created_at, premium_until) VALUES
  (uuid_generate_v4(), 'alice@example.com', 'Alice', 'https://i.pravatar.cc/150?img=1', now(), null),
  (uuid_generate_v4(), 'bob@example.com', 'Bob', 'https://i.pravatar.cc/150?img=2', now(), null),
  (uuid_generate_v4(), 'carol@example.com', 'Carol', 'https://i.pravatar.cc/150?img=3', now(), null);

-- Project (replace PROJECT_UUID with actual UUID after insertion)
INSERT INTO projects (id, name, description, logo, theme_color, created_at) VALUES
  ('PROJECT_UUID', 'Acme Corp', 'Demo project for landing page', 'https://picsum.photos/200/200', '#1E40AF', now());

-- Project members (replace USER1, USER2, USER3 with actual user IDs)
INSERT INTO project_members (project_id, user_id, role) VALUES
  ('PROJECT_UUID', 'USER1', 'owner'),
  ('PROJECT_UUID', 'USER2', 'member'),
  ('PROJECT_UUID', 'USER3', 'member');

-- Tasks (replace USER IDs accordingly)
INSERT INTO tasks (id, project_id, title, description, status, due_date, assignee_id, created_at) VALUES
  (uuid_generate_v4(), 'PROJECT_UUID', 'Design Landing Page', 'Create a polished landing page mockup', 'pending', now() + interval '3 days', 'USER2', now()),
  (uuid_generate_v4(), 'PROJECT_UUID', 'Implement Auth Flow', 'Set up Supabase authentication', 'in_progress', now() + interval '5 days', 'USER1', now()),
  (uuid_generate_v4(), 'PROJECT_UUID', 'Write Documentation', 'Complete help guide and API docs', 'done', now() - interval '1 day', 'USER3', now()),
  (uuid_generate_v4(), 'PROJECT_UUID', 'Run Performance Tests', 'Benchmark the app', 'pending', now() + interval '7 days', null, now());
