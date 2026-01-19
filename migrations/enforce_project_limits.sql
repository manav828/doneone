-- Function to check project limits before insert
create or replace function public.check_project_limit()
returns trigger as $$
declare
  current_count integer;
  max_limit integer;
  user_plan_id uuid;
  user_custom_data jsonb;
  is_custom boolean;
  user_email text;
begin
  -- Get user details
  select plan_id, custom_plan_data, is_custom_plan, email
  into user_plan_id, user_custom_data, is_custom, user_email
  from public.profiles
  where id = new.owner_id;

  -- Admin Bypass (Matches store.ts logic)
  if user_email = 'manavss828@gmail.com' then
    return new;
  end if;

  -- Determine Limit (Default 3)
  max_limit := 3;

  if is_custom and (user_custom_data->>'max_projects') is not null then
     max_limit := (user_custom_data->>'max_projects')::integer;
  elsif user_plan_id is not null then
     -- If plan exists, fetch max_projects, defaulting to 3 if null in DB
     select coalesce(max_projects, 3) into max_limit from public.plans where id = user_plan_id;
  end if;

  -- Count existing projects for this owner
  select count(*) into current_count from public.projects where owner_id = new.owner_id;

  if current_count >= max_limit then
    raise exception 'Project limit reached. You have % projects, limit is %.', current_count, max_limit;
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop trigger if exists to ensure clean slate
drop trigger if exists enforce_project_limit on public.projects;

-- Create Trigger
create trigger enforce_project_limit
before insert on public.projects
for each row execute function public.check_project_limit();
