
-- 1. Add columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Migrate existing users: Set created_at to NOW() so they get a fresh 30-day trial
-- Only update if created_at is default/null (safeguard against double run if default was different, though here default is NOW)
-- Actually, better to just check if it was arguably "empty" or just force update based on requirement "set data for existing user as today's data"
UPDATE profiles 
SET created_at = NOW() 
WHERE created_at IS NULL OR created_at = '2025-01-01 00:00:00+00'; -- Just in case

-- 3. Verify admin has access
-- (No specific action needed as policies usually rely on ID/Email, but good to know)
