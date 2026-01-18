-- 1. FIX ACTIVITIES RLS
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable all access for auth users" ON "public"."activities";

-- Ensure remaining policies cover the usage:
-- "View activities" (already exists: project member check)
-- "Activities: Insert" (already exists: project member check)

-- 2. IMPLEMENT PROJECT QUOTAS (Security)
-- Create a function to check limits before INSERT
CREATE OR REPLACE FUNCTION public.check_project_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_projects int;
    v_current_count int;
    v_plan_id text;
    v_is_premium boolean;
BEGIN
    -- Skip check for Admin
    IF (auth.jwt() ->> 'email') = 'manavss828@gmail.com' THEN
        RETURN NEW;
    END IF;

    -- Get User's Plan via Profile
    SELECT plan_id, 
           (premium_until > now() OR created_at > (now() - interval '30 days')) -- Simple trial/premium check
    INTO v_plan_id, v_is_premium
    FROM profiles
    WHERE id = auth.uid();

    -- Determine Limit
    -- Default limit
    v_max_projects := 3; 

    -- If Premium/Trial, increase limit (or fetch from plans table if more complex)
    -- For now, hardcode '10000' for premium as per store.ts logic equivalent
    IF v_is_premium THEN
         v_max_projects := 10000;
    END IF;
    
    -- Check Current Count
    SELECT count(*) INTO v_current_count FROM projects WHERE owner_id = auth.uid();

    IF v_current_count >= v_max_projects THEN
        RAISE EXCEPTION 'Project limit reached (%/%). Upgrade to create more.', v_current_count, v_max_projects;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists to allow update
DROP TRIGGER IF EXISTS tr_check_project_quota ON projects;

-- Create Trigger
CREATE TRIGGER tr_check_project_quota
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION public.check_project_quota();
