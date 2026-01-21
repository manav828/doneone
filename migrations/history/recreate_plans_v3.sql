-- Add per-seat pricing columns to plans table
-- Force schema reload
NOTIFY pgrst, 'reload schema';

DROP TABLE IF EXISTS "plans";

CREATE TABLE "plans" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "description" text, 
  "currency" text NOT NULL DEFAULT 'USD', 
  "region" text DEFAULT 'global',
  
  -- Base Plan Pricing
  "price_monthly" numeric NOT NULL DEFAULT 0,
  "price_yearly" numeric NOT NULL DEFAULT 0,

  -- Per-Seat Pricing (New)
  "price_per_seat_monthly" numeric NOT NULL DEFAULT 0,
  "price_per_seat_yearly" numeric NOT NULL DEFAULT 0,
  
  -- Limits
  "max_projects" numeric DEFAULT 3,
  "max_members_per_project" numeric DEFAULT 5,
  "max_leads_per_project" numeric DEFAULT 5,
  "max_upload_size_mb" numeric DEFAULT 5,
  "max_images_per_task" numeric DEFAULT 0,
  "history_retention_days" numeric DEFAULT 30,
  
  -- Features
  "can_invite_members" boolean DEFAULT false,
  "can_upload_images" boolean DEFAULT false,
  "can_set_reminders" boolean DEFAULT false,
  "can_use_notifications" boolean DEFAULT false,
  "can_export_data" boolean DEFAULT false,
  "can_view_history" boolean DEFAULT false,

  "created_at" timestamptz DEFAULT NOW(),
  "updated_at" timestamptz DEFAULT NOW()
);

-- RLS
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON "plans";
CREATE POLICY "Enable read access for all users" ON "plans" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for admins" ON "plans";
CREATE POLICY "Enable write access for admins" ON "plans" FOR ALL USING (
  auth.role() = 'authenticated'
);

-- Insert Default Data
INSERT INTO "plans" (
    "name", "description", "currency", "region", 
    "price_monthly", "price_yearly", 
    "price_per_seat_monthly", "price_per_seat_yearly",
    "max_projects", "max_members_per_project", "max_leads_per_project", "max_upload_size_mb", "max_images_per_task", "history_retention_days",
    "can_invite_members", "can_upload_images", "can_set_reminders", "can_use_notifications", "can_export_data", "can_view_history"
) VALUES
(
    'Free Plan', 'Basic Free Tier', 'USD', 'global',
    0, 0,
    0, 0,
    3, 2, 2, 5, 0, 7,
    false, false, true, true, false, false
),
(
    'Premium Plan (Global)', 'Standard Premium Plan for Global Users', 'USD', 'global',
    12, 120,
    5, 50, -- $5/user/mo
    50, 10, 5, 100, 3, 365,
    true, true, true, true, true, true
),
(
    'Premium Plan (India)', 'Standard Premium Plan for Indian Users', 'INR', 'india',
    899, 8990,
    399, 3990, -- ₹399/user/mo
    50, 10, 5, 100, 0, 365,
    true, true, true, true, true, true
);
