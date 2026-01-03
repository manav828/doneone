-- Fix Join Request Flow: Enable Pending Requests and Admin Approval
-- Run this in Supabase SQL Editor

-- 1. Create Function to Auto-Sync Profile Company ID on Member Approval
CREATE OR REPLACE FUNCTION handle_new_team_member_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- When a team member becomes 'active' (Approved), user's profile is linked to the company
    SELECT company_id INTO v_company_id FROM teams WHERE id = NEW.team_id;
    
    IF v_company_id IS NOT NULL THEN
        UPDATE profiles SET company_id = v_company_id WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Create Trigger on team_members status change (Pending -> Active)
DROP TRIGGER IF EXISTS tr_on_member_activation ON team_members;
CREATE TRIGGER tr_on_member_activation
AFTER UPDATE OF status ON team_members
FOR EACH ROW
WHEN (OLD.status != 'active' AND NEW.status = 'active')
EXECUTE FUNCTION handle_new_team_member_activation();

-- 3. Create Trigger on team_members insertion (if inserted as Active)
DROP TRIGGER IF EXISTS tr_on_member_insert_active ON team_members;
CREATE TRIGGER tr_on_member_insert_active
AFTER INSERT ON team_members
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION handle_new_team_member_activation();


-- 4. Update Secure Join RPC to create PENDING Request instead of direct join
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
    
    -- Fallback if 'Resource' role not found, pick any role or create one? 
    -- Usually every team has default roles. If not, we might inserted with null?
    -- Let's try to find 'Member' or just the first role.
    IF v_role_id IS NULL THEN
         SELECT id INTO v_role_id FROM team_roles WHERE team_id = v_team_id LIMIT 1;
    END IF;

    -- E. Insert Pending Request
    -- We deliberately do NOT update profiles.company_id yet. 
    INSERT INTO team_members (user_id, team_id, role_id, status)
    VALUES (auth.uid(), v_team_id, v_role_id, 'pending');

    -- F. Return Success Pending status
    RETURN jsonb_build_object('status', 'success_pending', 'company_name', v_company_name);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
