-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update existing profiles with email from auth.users
-- This syncs the email from Supabase Auth to your profiles table
UPDATE profiles
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.id
)
WHERE email IS NULL;
