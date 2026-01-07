-- ============================================================
-- FIX: Missing Columns in Profiles Table
-- Run this in your Supabase SQL Editor to resolve the 400 Bad Request error
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plans(id),
ADD COLUMN IF NOT EXISTS custom_plan_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS billing_interval text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS extra_seats integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_custom_plan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_date timestamptz,
ADD COLUMN IF NOT EXISTS plan_base_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_seat_cost numeric DEFAULT 5;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
