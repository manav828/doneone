ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS per_seat_cost numeric DEFAULT 5;
