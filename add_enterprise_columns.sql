ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_base_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_seats integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_custom_plan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_date timestamptz;
