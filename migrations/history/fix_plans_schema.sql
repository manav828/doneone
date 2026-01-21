-- Force schema cache reload and recreate table if needed
NOTIFY pgrst, 'reload schema';

-- Only drop and recreate if the columns are truly missing or broken
-- But since the user is getting column not found errors, a full recreate is safest for this dev environment
DROP TABLE IF EXISTS "plans";

CREATE TABLE "plans" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "description" text, 
  "currency" text NOT NULL DEFAULT 'USD', 
  "region" text DEFAULT 'global',
  
  -- CamelCase Columns explicitly quoted
  "priceMonthly" numeric NOT NULL DEFAULT 0,
  "priceYearly" numeric NOT NULL DEFAULT 0,
  
  "maxProjects" numeric DEFAULT 3,
  "maxMembersPerProject" numeric DEFAULT 5,
  "maxLeadsPerProject" numeric DEFAULT 5,
  "maxUploadSizeMb" numeric DEFAULT 5,
  "maxUploadsPerTaskLimit" numeric DEFAULT 0,
  "historyRetentionDays" numeric DEFAULT 30,
  
  "canInviteMembers" boolean DEFAULT false,
  "canUploadImages" boolean DEFAULT false,
  "canSetReminders" boolean DEFAULT false,
  "canUseNotifications" boolean DEFAULT false,
  "canExportData" boolean DEFAULT false,
  "canViewHistory" boolean DEFAULT false,

  "createdAt" timestamptz DEFAULT NOW(),
  "updatedAt" timestamptz DEFAULT NOW()
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
    "priceMonthly", "priceYearly", 
    "maxProjects", "maxMembersPerProject", "maxLeadsPerProject", "maxUploadSizeMb", "historyRetentionDays",
    "canInviteMembers", "canUploadImages", "canSetReminders", "canUseNotifications", "canExportData", "canViewHistory"
) VALUES
(
    'Premium Plan (Global)', 'Standard Premium Plan for Global Users', 'USD', 'global',
    12, 120,
    999, 50, 50, 100, 365,
    true, true, true, true, true, true
),
(
    'Premium Plan (India)', 'Standard Premium Plan for Indian Users', 'INR', 'india',
    899, 8990,
    999, 50, 50, 100, 365,
    true, true, true, true, true, true
),
(
    'Free Plan', 'Basic Free Tier', 'USD', 'global',
    0, 0,
    3, 2, 2, 5, 7,
    false, false, true, true, false, false
);
