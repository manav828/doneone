-- Create transactions table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal(10,2) not null,
  currency text default 'USD',
  status text default 'completed', -- completed, failed, refunded
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table transactions enable row level security;

-- Policies
create policy "Users can view their own transactions"
  on transactions for select
  using ( auth.uid() = user_id );

-- Only service role (or admin functions) should insert for now, but for simulation we might allow insert if authenticated?
-- Ideally, payments are handled server-side. For this simulation, we'll allow authenticated insert.
create policy "Users can insert their own transactions"
  on transactions for insert
  with check ( auth.uid() = user_id );
