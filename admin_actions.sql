-- Admin Actions RPC
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_user_secure(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleter_email TEXT;
    project_ids UUID[];
BEGIN
    -- 1. Authorization Check (Super Admin Only)
    SELECT email INTO deleter_email FROM profiles WHERE id = auth.uid();
    
    -- Using explicit email check as requested for Admin
    IF deleter_email IS NULL OR deleter_email != 'manavss828@gmail.com' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Unauthorized: Only Super Admin can delete users');
    END IF;

    -- 2. Identify Projects owned by the user (to delete them and their children)
    SELECT ARRAY_AGG(id) INTO project_ids FROM projects WHERE manager_id = target_user_id;

    -- 3. Delete Project-Dependent Data (if any projects exist)
    IF project_ids IS NOT NULL THEN
        DELETE FROM tasks WHERE project_id = ANY(project_ids);
        DELETE FROM columns WHERE project_id = ANY(project_ids);
        DELETE FROM project_members WHERE project_id = ANY(project_ids);
        DELETE FROM activities WHERE project_id = ANY(project_ids);
        DELETE FROM tags WHERE project_id = ANY(project_ids);
        DELETE FROM task_history WHERE project_id = ANY(project_ids);
        -- Finally delete the projects
        DELETE FROM projects WHERE id = ANY(project_ids);
    END IF;

    -- 4. Delete User-Specific Data
    -- Tasks created by or assigned to user (in other projects)
    DELETE FROM tasks WHERE creator_id = target_user_id OR assignee_id = target_user_id;

    -- Project Memberships
    DELETE FROM project_members WHERE user_id = target_user_id;
    
    -- Notifications
    DELETE FROM notifications WHERE recipient_id = target_user_id;
    
    -- Activities
    DELETE FROM activities WHERE user_id = target_user_id;
    
    -- Support Tickets
    DELETE FROM support_tickets WHERE user_id = target_user_id;
    
    -- Archive Settings
    DELETE FROM user_archive_settings WHERE user_id = target_user_id;
    
    -- Task History (archived by)
    DELETE FROM task_history WHERE archived_by = target_user_id;
    
    -- Team Members (Cascade cleanup if not set on FK)
    DELETE FROM team_members WHERE user_id = target_user_id;
    
    -- Daily Work Logs (Assuming they exist)
    -- DELETE FROM daily_work_logs WHERE user_id = target_user_id; -- Uncomment if table exists

    -- 5. Delete Profile (The User)
    DELETE FROM profiles WHERE id = target_user_id;

    RETURN jsonb_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
