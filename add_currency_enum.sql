-- ============================================================
-- Currency ENUM Migration for DoneOne
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- Step 1: Create the ENUM type (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE currency_type AS ENUM ('USD', 'INR');
    END IF;
END $$;

-- Step 2: Add the currency column to profiles (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'currency'
    ) THEN
        ALTER TABLE profiles ADD COLUMN currency currency_type NOT NULL DEFAULT 'INR';
    END IF;
END $$;

-- Step 3: Migrate all existing users to INR (as requested)
UPDATE profiles SET currency = 'INR' WHERE currency IS NULL OR currency::text = '';

-- Step 4: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verification Query (run separately to check)
-- SELECT id, name, email, currency FROM profiles LIMIT 20;
