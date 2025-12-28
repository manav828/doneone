-- Daily Work Logs Table
-- Stores aggregated daily work time for each user per project
-- This allows historical tracking of work hours and performance reports

-- Create the daily_work_logs table
CREATE TABLE IF NOT EXISTS daily_work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    tasks_worked INTEGER NOT NULL DEFAULT 0, -- Number of tasks worked on
    tasks_completed INTEGER NOT NULL DEFAULT 0, -- Number of tasks completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one row per user per project per day
    UNIQUE(user_id, project_id, work_date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_work_logs_user_id ON daily_work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_logs_project_id ON daily_work_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_logs_work_date ON daily_work_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_logs_user_date ON daily_work_logs(user_id, work_date);

-- Enable RLS
ALTER TABLE daily_work_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own logs
CREATE POLICY "Users can view own daily logs" ON daily_work_logs
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert/update their own logs
CREATE POLICY "Users can insert own daily logs" ON daily_work_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily logs" ON daily_work_logs
    FOR UPDATE USING (user_id = auth.uid());

-- Managers can view all logs for their projects
CREATE POLICY "Managers can view project daily logs" ON daily_work_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = daily_work_logs.project_id 
            AND projects.manager_id = auth.uid()
        )
    );

-- Leads can view logs of their team members
CREATE POLICY "Leads can view team daily logs" ON daily_work_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = daily_work_logs.project_id
            AND pm.lead_id = auth.uid()
            AND pm.user_id = daily_work_logs.user_id
        )
    );

-- Function to update or insert daily work log
CREATE OR REPLACE FUNCTION upsert_daily_work_log(
    p_user_id UUID,
    p_project_id UUID,
    p_seconds_to_add INTEGER,
    p_task_worked BOOLEAN DEFAULT FALSE,
    p_task_completed BOOLEAN DEFAULT FALSE
)
RETURNS daily_work_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result daily_work_logs;
BEGIN
    INSERT INTO daily_work_logs (user_id, project_id, work_date, total_seconds, tasks_worked, tasks_completed)
    VALUES (p_user_id, p_project_id, CURRENT_DATE, p_seconds_to_add, 
            CASE WHEN p_task_worked THEN 1 ELSE 0 END,
            CASE WHEN p_task_completed THEN 1 ELSE 0 END)
    ON CONFLICT (user_id, project_id, work_date)
    DO UPDATE SET 
        total_seconds = daily_work_logs.total_seconds + EXCLUDED.total_seconds,
        tasks_worked = daily_work_logs.tasks_worked + EXCLUDED.tasks_worked,
        tasks_completed = daily_work_logs.tasks_completed + EXCLUDED.tasks_completed,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_daily_work_log TO authenticated;

-- Function to get daily work summary for a project
CREATE OR REPLACE FUNCTION get_project_daily_summary(
    p_project_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    total_seconds INTEGER,
    tasks_worked INTEGER,
    tasks_completed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dwl.user_id,
        p.name AS user_name,
        COALESCE(dwl.total_seconds, 0) AS total_seconds,
        COALESCE(dwl.tasks_worked, 0) AS tasks_worked,
        COALESCE(dwl.tasks_completed, 0) AS tasks_completed
    FROM profiles p
    LEFT JOIN daily_work_logs dwl ON dwl.user_id = p.id 
        AND dwl.project_id = p_project_id 
        AND dwl.work_date = p_date
    WHERE p.id IN (
        SELECT pm.user_id FROM project_members pm WHERE pm.project_id = p_project_id AND pm.status = 'active'
        UNION
        SELECT proj.manager_id FROM projects proj WHERE proj.id = p_project_id
    )
    ORDER BY total_seconds DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_project_daily_summary TO authenticated;

-- Function to get weekly work summary for a user
CREATE OR REPLACE FUNCTION get_user_weekly_summary(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    work_date DATE,
    total_seconds INTEGER,
    tasks_worked INTEGER,
    tasks_completed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dwl.work_date,
        dwl.total_seconds,
        dwl.tasks_worked,
        dwl.tasks_completed
    FROM daily_work_logs dwl
    WHERE dwl.user_id = p_user_id
        AND dwl.work_date >= CURRENT_DATE - INTERVAL '7 days'
        AND (p_project_id IS NULL OR dwl.project_id = p_project_id)
    ORDER BY dwl.work_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_weekly_summary TO authenticated;

COMMENT ON TABLE daily_work_logs IS 'Stores daily aggregated work time for each user per project for performance tracking and reports';
