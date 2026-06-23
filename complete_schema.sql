-- =================================================================
-- FLOWBOARD FULL DATABASE SETUP SCRIPT (CONSOLIDATED)
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
-- DROP TABLE IF EXISTS user_archive_settings CASCADE;
-- DROP TABLE IF EXISTS admin_retention_settings CASCADE;
-- DROP TABLE IF EXISTS task_history CASCADE;

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
  
  -- Subscription & Enterprise (Added)
  plan_id uuid, -- REFERENCES public.plans(id) -- Removed FK to avoid order dependency in setup
  custom_plan_data jsonb DEFAULT '{}'::jsonb,
  billing_interval text DEFAULT 'monthly',
  extra_seats integer DEFAULT 0,
  is_custom_plan boolean DEFAULT false,
  renewal_date timestamp with time zone,
  plan_base_cost numeric DEFAULT 0,
  per_seat_cost numeric DEFAULT 5,
  premium_until timestamp with time zone DEFAULT NULL,
  currency text DEFAULT 'INR',
  company_id uuid,
  
  -- Feature Flags
  notifications_enabled boolean DEFAULT false,
  reminders_enabled boolean DEFAULT false,
  time_tracking_enabled boolean DEFAULT false,
  image_upload_enabled boolean DEFAULT false, -- Added from fix_permissions.sql
  max_attachments_per_task int DEFAULT 3, -- Added from add_upload_limit.sql
  
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
  auto_move_enabled boolean DEFAULT true, -- Added from add_automove_column.sql
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
  
  -- New Tracking Fields
  started_at timestamp with time zone, -- Added for Reports
  completed_at timestamp with time zone, -- Added for Reports

  -- Browser Capture (Phase 1)
  captured_url text,
  captured_text text,
  captured_screenshot text,
  saved_tabs jsonb,
  
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

-- User Archive Settings (History Retention)
CREATE TABLE public.user_archive_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_archive_days int DEFAULT 0,
  history_retention_days int DEFAULT NULL, -- Added from history_enhancements.sql
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin Retention Settings
CREATE TABLE public.admin_retention_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retention_days int DEFAULT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO admin_retention_settings (id, retention_days) VALUES (1, NULL) ON CONFLICT DO NOTHING;

-- Task History (Archived Tasks)
CREATE TABLE public.task_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  task_data jsonb NOT NULL, -- Full task object snapshot
  status_at_archive text,
  time_taken int DEFAULT 0,
  archived_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  archived_by uuid REFERENCES public.profiles(id)
);

-- 3. STORAGE SETUP (Bucket for Images)
-- We insert into the system storage schema.
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SECURITY & RLS (Row Level Security)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_archive_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow users to insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin to update any profile" ON profiles FOR UPDATE USING (auth.jwt() ->> 'email' = 'manavss828@gmail.com');

-- System Settings Policies
CREATE POLICY "Allow public read access settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin update access settings" ON system_settings FOR UPDATE USING (auth.jwt() ->> 'email' = 'manavss828@gmail.com');
CREATE POLICY "Allow admin insert access settings" ON system_settings FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'manavss828@gmail.com');

-- Storage Policies
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
  
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'task-attachments' );
  CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'task-attachments' AND auth.role() = 'authenticated' );
  CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'task-attachments' AND auth.role() = 'authenticated' );
COMMIT;

-- Note: For other tables (projects, tasks, etc.), you would typically add policies here.
-- For now, we are leaving them enabled but without specific policies (which means deny all by default), 
-- OR we can disable RLS for them if development speed is priority, as per original database.sql which disabled them.
-- Given the user wants a "ready to use" file, I will DISABLE RLS for the main logic tables to match previous behavior,
-- but keep it enabled for sensitive ones like system_settings where we added specific logic.

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_archive_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_retention_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_history DISABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTIONS (RPC)

-- Secure Join Function
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

-- Archive Task Function
CREATE OR REPLACE FUNCTION archive_task_fn(p_task_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task record;
  v_column_title text;
  v_time_taken int;
  v_status text;
BEGIN
  -- 1. Fetch the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- 2. Get column title for status
  SELECT title INTO v_column_title FROM columns WHERE id = v_task.column_id;
  v_status := COALESCE(v_column_title, 'Unknown');

  -- 3. Calculate time taken (seconds from creation to now)
  v_time_taken := EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - v_task.created_at))::int;

  -- 4. Insert into history
  INSERT INTO task_history (
    task_id,
    project_id,
    task_data,
    status_at_archive,
    time_taken,
    archived_by
  ) VALUES (
    p_task_id,
    v_task.project_id,
    to_jsonb(v_task),
    v_status,
    v_time_taken,
    p_user_id
  );

  -- 5. Delete from active tasks
  DELETE FROM tasks WHERE id = p_task_id;

  RETURN json_build_object('success', true, 'task_id', p_task_id);
END;
$$;

-- Get Filtered History Function
CREATE OR REPLACE FUNCTION get_task_history_filtered(
  p_project_id uuid,
  p_date_start timestamp with time zone DEFAULT NULL,
  p_date_end timestamp with time zone DEFAULT NULL,
  p_assignee_ids uuid[] DEFAULT NULL,
  p_tag_ids text[] DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_time_min int DEFAULT NULL,
  p_time_max int DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  task_id uuid,
  project_id uuid,
  task_data jsonb,
  status_at_archive text,
  time_taken int,
  archived_at timestamp with time zone,
  archived_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.id,
    th.task_id,
    th.project_id,
    th.task_data,
    th.status_at_archive,
    th.time_taken,
    th.archived_at,
    th.archived_by
  FROM task_history th
  WHERE 
    th.project_id = p_project_id
    AND (p_date_start IS NULL OR th.archived_at >= p_date_start)
    AND (p_date_end IS NULL OR th.archived_at <= p_date_end)
    AND (p_assignee_ids IS NULL OR (th.task_data->>'assigneeId')::uuid = ANY(p_assignee_ids))
    AND (p_tag_ids IS NULL OR th.task_data->'tagIds' ?| p_tag_ids)
    AND (p_status IS NULL OR th.status_at_archive = p_status)
    AND (p_time_min IS NULL OR th.time_taken >= p_time_min)
    AND (p_time_max IS NULL OR th.time_taken <= p_time_max)
    AND (p_search_query IS NULL OR 
         (th.task_data->>'title' ILIKE '%' || p_search_query || '%') OR
         (th.task_data->>'description' ILIKE '%' || p_search_query || '%'))
  ORDER BY th.archived_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Auto Archive User Tasks Function
CREATE OR REPLACE FUNCTION auto_archive_user_tasks(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auto_archive_days int;
  v_cutoff_date timestamp with time zone;
  v_task record;
  v_archived_count int := 0;
BEGIN
  -- 1. Get user's auto-archive setting
  SELECT auto_archive_days INTO v_auto_archive_days 
  FROM user_archive_settings 
  WHERE user_id = p_user_id;

  -- 2. If not set or disabled, return early
  IF v_auto_archive_days IS NULL OR v_auto_archive_days = 0 THEN
    RETURN json_build_object('success', true, 'archived_count', 0, 'message', 'Auto-archive disabled');
  END IF;

  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_auto_archive_days || ' days')::interval;

  -- 4. Archive old tasks for this user
  FOR v_task IN 
    SELECT id FROM tasks 
    WHERE updated_at < v_cutoff_date 
    AND (creator_id = p_user_id OR assignee_id = p_user_id)
  LOOP
    PERFORM archive_task_fn(v_task.id, NULL); -- NULL = auto-archived
    v_archived_count := v_archived_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'archived_count', v_archived_count, 'cutoff_date', v_cutoff_date);
END;
$$;

-- History Cleanup Function (Per User)
CREATE OR REPLACE FUNCTION cleanup_user_history(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days int;
  v_cutoff_date timestamp with time zone;
  v_deleted_count int;
BEGIN
  -- 1. Get user's history retention setting
  SELECT history_retention_days INTO v_retention_days 
  FROM user_archive_settings 
  WHERE user_id = p_user_id;
  
  -- 2. If no retention set, return early
  IF v_retention_days IS NULL THEN
    RETURN json_build_object(
      'success', true, 
      'deleted_count', 0, 
      'message', 'No history retention set for this user'
    );
  END IF;
  
  -- 3. Calculate cutoff date
  v_cutoff_date := timezone('utc'::text, now()) - (v_retention_days || ' days')::interval;
  
  -- 4. Delete old history for this user
  DELETE FROM task_history 
  WHERE archived_by = p_user_id 
    AND archived_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true, 
    'deleted_count', v_deleted_count, 
    'cutoff_date', v_cutoff_date,
    'retention_days', v_retention_days
  );
END;
$$;

-- History Cleanup Function (All Users)
CREATE OR REPLACE FUNCTION cleanup_all_users_history()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
  v_total_deleted int := 0;
  v_user_count int := 0;
  v_result json;
BEGIN
  -- Loop through users with retention settings
  FOR v_user IN 
    SELECT user_id, history_retention_days 
    FROM user_archive_settings 
    WHERE history_retention_days IS NOT NULL AND history_retention_days > 0
  LOOP
    -- Run cleanup for each user
    SELECT cleanup_user_history(v_user.user_id) INTO v_result;
    v_total_deleted := v_total_deleted + (v_result->>'deleted_count')::int;
    v_user_count := v_user_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_deleted', v_total_deleted,
    'users_processed', v_user_count
  );
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
