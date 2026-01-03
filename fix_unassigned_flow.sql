-- Fix Join Flow: Use 'Unassigned' Team
-- 1. Ensure 'Unassigned' team exists for the company
-- 2. Update join_company_secure to route to 'Unassigned'

-- FUNCTION: Ensure Unassigned Team Exists
CREATE OR REPLACE FUNCTION ensure_unassigned_team(comp_id UUID, comp_owner_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- Check for existing 'Unassigned' team
    SELECT id INTO v_team_id FROM teams 
    WHERE company_id = comp_id AND name = 'Unassigned' LIMIT 1;

    -- If not found, create it
    IF v_team_id IS NULL THEN
        INSERT INTO teams (name, owner_id, company_id)
        VALUES ('Unassigned', comp_owner_id, comp_id)
        RETURNING id INTO v_team_id;
        
        -- Add 'Resource' role to it automatically (via triggers usually, but let's be safe)
    END IF;

    RETURN v_team_id;
END;
$$;

-- UPDATE: join_company_secure
CREATE OR REPLACE FUNCTION join_company_secure(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_owner_id UUID;
    v_team_id UUID;
    v_role_id UUID;
    v_existing_status TEXT;
    v_company_name TEXT;
BEGIN
    -- A. Validate Code
    SELECT id, name, owner_id INTO v_company_id, v_company_name, v_owner_id 
    FROM companies WHERE join_code = p_join_code;
    
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

    -- C. ROUTE TO 'Unassigned' TEAM
    v_team_id := ensure_unassigned_team(v_company_id, v_owner_id);

    -- D. Find Role ID (Resource)
    SELECT id INTO v_role_id FROM team_roles WHERE team_id = v_team_id AND name = 'Resource' LIMIT 1;
    IF v_role_id IS NULL THEN
         SELECT id INTO v_role_id FROM team_roles WHERE team_id = v_team_id LIMIT 1;
    END IF;

    -- E. Insert Pending Request
    INSERT INTO team_members (user_id, team_id, role_id, status)
    VALUES (auth.uid(), v_team_id, v_role_id, 'pending');

    RETURN jsonb_build_object('status', 'success_pending', 'company_name', v_company_name);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
