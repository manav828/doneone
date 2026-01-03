-- Final Fix for Join Request Flow
-- Run this in Supabase SQL Editor

-- 1. CLEANUP: Drop potential conflicting triggers that might imply auto-active
DROP TRIGGER IF EXISTS on_team_member_created ON team_members;
DROP TRIGGER IF EXISTS handle_new_user ON team_members;
DROP TRIGGER IF EXISTS tr_auto_activate_member ON team_members;

-- 2. RESET Function: ensure logic forces 'pending'
CREATE OR REPLACE FUNCTION join_company_secure(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_team_id UUID;
    v_role_id UUID;
    v_existing_status TEXT;
    v_company_name TEXT;
BEGIN
    -- A. Validate Code
    SELECT id, name INTO v_company_id, v_company_name FROM companies WHERE join_code = p_join_code;
    
    IF v_company_id IS NULL THEN
        RETURN jsonb_build_object('status', 'invalid_code');
    END IF;

    -- B. Check if already a member or pending
    SELECT status INTO v_existing_status FROM team_members 
    WHERE user_id = auth.uid() 
    AND team_id IN (SELECT id FROM teams WHERE company_id = v_company_id);
    
    IF v_existing_status = 'active' THEN
        RETURN jsonb_build_object('status', 'already_joined', 'message', 'You are already a member of ' || v_company_name);
    ELSIF v_existing_status = 'pending' THEN
        RETURN jsonb_build_object('status', 'already_pending', 'message', 'Join request already sent to ' || v_company_name);
    END IF;

    -- C. Find target team (Prefer 'General', else first team)
    SELECT id INTO v_team_id FROM teams 
    WHERE company_id = v_company_id AND name = 'General' LIMIT 1;
    
    IF v_team_id IS NULL THEN
        SELECT id INTO v_team_id FROM teams WHERE company_id = v_company_id ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_team_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'No valid department found to join');
    END IF;

    -- D. Find Role ID (Resource)
    SELECT id INTO v_role_id FROM team_roles WHERE team_id = v_team_id AND name = 'Resource' LIMIT 1;
    
    IF v_role_id IS NULL THEN
         SELECT id INTO v_role_id FROM team_roles WHERE team_id = v_team_id LIMIT 1;
    END IF;

    -- E. Insert Pending Request
    INSERT INTO team_members (user_id, team_id, role_id, status)
    VALUES (auth.uid(), v_team_id, v_role_id, 'pending');

    -- F. PARANOID FIX: Explicitly update to 'pending' just in case a default/trigger messed it up
    UPDATE team_members SET status = 'pending' 
    WHERE user_id = auth.uid() AND team_id = v_team_id;

    -- G. Return Success Pending status
    RETURN jsonb_build_object('status', 'success_pending', 'company_name', v_company_name);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
