-- Fix: Critical company_id overwrite bug
-- The trigger handle_new_team_member_activation was unconditionally overwriting
-- profiles.company_id when a user's team membership became active.
-- This caused users who own a company (and join a SECOND company) to lose their
-- original company context.
-- FIX: Only set company_id if the user does NOT already have one.

CREATE OR REPLACE FUNCTION handle_new_team_member_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_existing_company_id UUID;
BEGIN
    -- Get the company_id of the team the user is joining
    SELECT company_id INTO v_company_id FROM teams WHERE id = NEW.team_id;
    
    IF v_company_id IS NOT NULL THEN
        -- CRITICAL FIX: Only update company_id if the user doesn't already have one
        -- This prevents overwriting an existing owner's company link when they join a second company
        SELECT company_id INTO v_existing_company_id FROM profiles WHERE id = NEW.user_id;
        
        IF v_existing_company_id IS NULL THEN
            UPDATE profiles SET company_id = v_company_id WHERE id = NEW.user_id;
        END IF;
        -- If user already has a company_id (e.g., they are an owner), do NOT overwrite it.
        -- They will be a "member" of this second company via team_members, 
        -- but their primary company remains their own.
    END IF;
    
    RETURN NEW;
END;
$$;
