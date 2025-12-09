-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY, -- 'free', 'premium', etc.
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0,
    price_yearly INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    
    -- Limits
    max_projects INTEGER NOT NULL DEFAULT 2,
    max_members_per_project INTEGER NOT NULL DEFAULT 2,
    max_upload_size_mb INTEGER NOT NULL DEFAULT 5, -- Just in case
    max_uploads_per_task_limit INTEGER NOT NULL DEFAULT 0, -- 0 = Unlimited, or specific number
    
    -- Feature Toggles
    can_invite_members BOOLEAN NOT NULL DEFAULT false,
    can_upload_images BOOLEAN NOT NULL DEFAULT false,
    can_set_reminders BOOLEAN NOT NULL DEFAULT false,
    can_use_notifications BOOLEAN NOT NULL DEFAULT false,
    can_export_data BOOLEAN NOT NULL DEFAULT false,
    can_view_history BOOLEAN NOT NULL DEFAULT true, -- Basic history
    
    -- Retention
    history_retention_days INTEGER DEFAULT 7, -- NULL for unlimited
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read plans
CREATE POLICY "Allow public read access to plans" ON public.plans
    FOR SELECT USING (true);

-- Only admin (manavss828@gmail.com) can update plans
-- Note: You might need a more robust admin check in production, but adhering to current pattern:
-- For now, we'll allow Authenticated updates if we trust the API to check admin, 
-- or we rely on the implementation in AdminPanel to filter UI.
-- Ideally:
CREATE POLICY "Allow admin update access to plans" ON public.plans
    FOR UPDATE USING (auth.email() = 'manavss828@gmail.com');

-- Insert functionalities for Free Plan
INSERT INTO public.plans (
    id, name, price_monthly, price_yearly, description,
    max_projects, max_members_per_project, max_uploads_per_task_limit,
    can_invite_members, can_upload_images, can_set_reminders,
    can_use_notifications, can_export_data, can_view_history,
    history_retention_days
) VALUES (
    'free', 'Basic', 0, 0, 'Essential tools for individuals.',
    2, 0, 0, -- Max 2 projects, 0 invitees (cannot invite), 0 uploads (cannot upload)
    false, -- can_invite_members
    false, -- can_upload_images (User said: not able to upload image)
    false, -- can_set_reminders
    false, -- can_use_notifications
    false, -- can_export_data
    true,  -- can_view_history
    7      -- 7 days retention
) ON CONFLICT (id) DO UPDATE SET
    max_projects = EXCLUDED.max_projects,
    can_invite_members = EXCLUDED.can_invite_members,
    can_upload_images = EXCLUDED.can_upload_images,
    can_export_data = EXCLUDED.can_export_data;

-- Insert functionalities for Premium Plan
INSERT INTO public.plans (
    id, name, price_monthly, price_yearly, description,
    max_projects, max_members_per_project, max_uploads_per_task_limit,
    can_invite_members, can_upload_images, can_set_reminders,
    can_use_notifications, can_export_data, can_view_history,
    history_retention_days
) VALUES (
    'premium', 'Premium', 9, 90, 'Unlock your full potential.',
    999999, 8, 3, -- Unlimited projects, 8 members, limit 3 images
    true, -- can_invite_members
    true, -- can_upload_images
    true, -- can_set_reminders
    true, -- can_use_notifications
    true, -- can_export_data
    true,  -- can_view_history
    NULL   -- Unlimited retention (NULL)
) ON CONFLICT (id) DO UPDATE SET
    max_projects = EXCLUDED.max_projects,
    max_members_per_project = EXCLUDED.max_members_per_project,
    max_uploads_per_task_limit = EXCLUDED.max_uploads_per_task_limit;
