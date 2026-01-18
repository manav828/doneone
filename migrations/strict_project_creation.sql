-- POLICY: Restrict Project Insert
-- 1. If team_id IS NOT NULL (Org Project):
--    User MUST be (Admin OR CompanyOwner OR DeptHead of that team).
--    Managers/Resources CANNOT create projects in a team (strict hierarchy).
-- 2. If team_id IS NULL (Personal Project):
--    User can create (subject to quota).

drop policy if exists "projects_insert" on public.projects;

create policy "projects_insert"
on public.projects
for insert
with check (
  (
    -- Case 1: Personal Project (No Team) - Allowed for everyone (quota trigger handles max count)
    team_id is null
    and owner_id = auth.uid()
  )
  OR
  (
    -- Case 2: Team Project - Restricted to Leaders
    team_id is not null
    and (
      -- Is Admin (via email/role)
      exists (select 1 from public.profiles where id = auth.uid() and (role = 'Admin' or email = 'manavss828@gmail.com'))
      OR
      -- Is Team Owner (Dept Head)
      exists (select 1 from public.teams where id = team_id and owner_id = auth.uid())
      OR
      -- Is Company Owner
      exists (select 1 from public.teams t join public.companies c on c.id = t.company_id where t.id = team_id and c.owner_id = auth.uid())
    )
  )
);
