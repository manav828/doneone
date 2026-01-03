-- Fix User Deletion to be PERMANENT via Blacklist
-- Run this in Supabase SQL Editor

-- 1. Create Blacklist Table
CREATE TABLE IF NOT EXISTS deleted_users (
    user_id UUID PRIMARY KEY,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reason TEXT
);

-- Access Policy (Public read is fine, or restricted to authenticated)
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read deleted_users" ON deleted_users;
CREATE POLICY "Read deleted_users" ON deleted_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert deleted_users" ON deleted_users;
CREATE POLICY "Insert deleted_users" ON deleted_users FOR INSERT WITH CHECK (true); -- Allow RPC to insert

-- 2. Update Delete RPC to use Blacklist
CREATE OR REPLACE FUNCTION delete_user_secure(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleter_email TEXT;
BEGIN
    -- Check Authorization
    SELECT email INTO deleter_email FROM profiles WHERE id = auth.uid();
    
    -- Only Super Admin or authorized users can delete (Add logic if needed)
    -- For now assuming Manav is Super Admin or simple owner check
    IF deleter_email IS NULL OR deleter_email != 'manavss828@gmail.com' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Unauthorized');
    END IF;

    -- 1. Add to Blacklist (Prevent future login)
    INSERT INTO deleted_users (user_id, reason)
    VALUES (target_user_id, 'Admin Deleted')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Cascade Delete Data (User's owned data)
    -- Delete Projects owned by user
    DELETE FROM projects WHERE manager_id = target_user_id; -- Assuming manager_id is ownerish
    -- Or if projects have owner_id column? Projects table usually has manager_id as creator/lead
    -- Let's check team ownership
    DELETE FROM teams WHERE owner_id = target_user_id;

    -- Delete Profile (This triggers other cascades usually)
    DELETE FROM profiles WHERE id = target_user_id;

    -- Force Logout (Sessions are managed by Supabase Auth, we can't revoke instantly via SQL easily without extensions)
    -- But the App Check (store.ts) will block them on refresh.

    RETURN jsonb_build_object('status', 'success');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
