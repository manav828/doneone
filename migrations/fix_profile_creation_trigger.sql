-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_plan_id uuid;
begin
  -- Find the Growth (Premium) plan for INR
  select id into v_plan_id 
  from public.plans 
  where currency = 'INR' and (price_monthly > 0 or price_per_seat_monthly > 0) 
  limit 1;

  insert into public.profiles (
    id, 
    name, 
    email, 
    role, 
    avatar_url, 
    premium_until, 
    plan_id,
    currency
  )
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email, 
    'Resource', 
    coalesce(new.raw_user_meta_data->>'avatar_url', ''), 
    now() + interval '30 days', 
    v_plan_id,
    'INR'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS and add INSERT policy for profiles
alter table public.profiles enable row level security;
drop policy if exists "Allow users to insert own profile" on public.profiles;
create policy "Allow users to insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
