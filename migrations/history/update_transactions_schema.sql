-- Clear ALL transactions (Fresh Start)
TRUNCATE TABLE "transactions";

-- Add provider column if it doesn't exist
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "provider" text DEFAULT 'system';

-- ==========================================
-- PLANS TABLE SETUP (For Dynamic Pricing)
-- ==========================================

-- Drop table first to ensure we get the correct new schema (with currency column)
DROP TABLE IF EXISTS "plans";

CREATE TABLE "plans" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL, -- 'premium_plan', 'extra_seat'
  "description" text, 
  "currency" text NOT NULL DEFAULT 'USD',
  "amount" numeric NOT NULL DEFAULT 0,
  "interval" text DEFAULT 'month', -- 'month', 'year'
  "region" text DEFAULT 'global', -- 'global', 'india'
  "created_at" timestamptz DEFAULT NOW(),
  "updated_at" timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON "plans";
CREATE POLICY "Enable read access for all users" ON "plans" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for admins" ON "plans";
CREATE POLICY "Enable write access for admins" ON "plans" FOR ALL USING (
  auth.role() = 'authenticated' 
);

-- Insert Default Plan Data
INSERT INTO "plans" ("name", "description", "currency", "amount", "region") VALUES
('premium_plan', 'Premium Monthly Subscription', 'USD', 12, 'global'),
('extra_seat', 'Extra Seat Default Cost', 'USD', 5, 'global'),
('premium_plan', 'Premium Monthly Subscription (India)', 'INR', 899, 'india'),
('extra_seat', 'Extra Seat Cost (India)', 'INR', 399, 'india');
