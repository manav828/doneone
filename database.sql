-- =================================================================
-- FLOWBOARD FULL DATABASE SETUP SCRIPT
-- =================================================================

-- 1. CLEANUP (Only run this if you want to wipe data!)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS columns CASCADE;
-- DROP TABLE IF EXISTS project_members CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;

-- 2. CREATE TABLES

-- Profiles (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text DEFAULT 'Resource',
  avatar_url text,
  
  -- Admin & Limits
  is_premium boolean DEFAULT false,
  max_projects int DEFAULT 3,
  max_leads int DEFAULT 2,
  max_resources int DEFAULT 5,
  auto_delete_days int DEFAULT 0,
  
  -- Feature Flags
  notifications_enabled boolean DEFAULT false,
  reminders_enabled boolean DEFAULT false,
  time_tracking_enabled boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  code text UNIQUE, -- 6-char join code
  manager_id uuid REFERENCES public.profiles(id),
  theme_color text DEFAULT '#3b82f6',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Members (Join Table)
CREATE TABLE public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'Resource',
  status text DEFAULT 'pending', -- pending/active
  lead_id uuid REFERENCES public.profiles(id), -- Hierarchy: Resource reports to this Lead
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

-- Columns (Kanban)
CREATE TABLE public.columns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int DEFAULT 0
);

-- Tasks
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  column_id uuid REFERENCES public.columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES public.profiles(id),
  creator_id uuid REFERENCES public.profiles(id),
  tag_ids text[] DEFAULT '{}', -- Array of Tag IDs
  order_index int DEFAULT 0,
  
  -- Features
  reminder_at timestamp with time zone,
  time_tracked int DEFAULT 0, -- Seconds
  estimated_time int DEFAULT 0, -- Seconds
  timer_started_at timestamp with time zone,
  attachments text[] DEFAULT '{}', -- Array of Image URLs
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activities (Audit Log)
CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  message text,
  is_read boolean DEFAULT false,
  type text DEFAULT 'info',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tags
CREATE TABLE public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text,
  type text -- Priority/Type/Custom
);

-- System Settings (Global Config)
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value boolean DEFAULT true
);

-- Initialize Settings
INSERT INTO system_settings (key, value) VALUES ('registration_open', true) ON CONFLICT DO NOTHING;

-- 3. STORAGE SETUP (Bucket for Images)
-- We insert into the system storage schema.
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SECURITY & RLS (Row Level Security)
-- Currently disabled for stability, but we set up the structure.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Storage Policies (Allow authenticated access)
-- Note: You might need to run these even if RLS is disabled on tables, storage RLS is separate.
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
  
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'task-attachments' );
  CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'task-attachments' AND auth.role() = 'authenticated' );
  CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'task-attachments' AND auth.role() = 'authenticated' );
COMMIT;

-- 5. HELPER FUNCTIONS (RPC)

-- Secure Join Function
-- Checks if a code exists and returns status without exposing the whole table.
CREATE OR REPLACE FUNCTION join_project_secure(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_manager_id uuid;
  v_existing_status text;
BEGIN
  -- 1. Find Project
  SELECT id, manager_id INTO v_project_id, v_manager_id
  FROM projects 
  WHERE code = p_code
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  -- 2. Check if Manager
  IF v_manager_id = auth.uid() THEN
    RETURN json_build_object('status', 'already_member');
  END IF;

  -- 3. Check if Member
  SELECT status INTO v_existing_status
  FROM project_members
  WHERE project_id = v_project_id AND user_id = auth.uid();

  IF v_existing_status IS NOT NULL THEN
    IF v_existing_status = 'active' THEN
      RETURN json_build_object('status', 'already_member');
    ELSE
      RETURN json_build_object('status', 'requested');
    END IF;
  END IF;

  -- 4. Insert Request
  INSERT INTO project_members (project_id, user_id, role, status)
  VALUES (v_project_id, auth.uid(), 'Resource', 'pending');

  RETURN json_build_object('status', 'requested');
END;
$$;

-- 6. REALTIME SETUP
-- Enable realtime updates for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;