-- 1. Fix RLS for system_settings
-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ system_settings (so users can check if registration is open)
CREATE POLICY "Allow public read access" ON system_settings
FOR SELECT USING (true);

-- Allow ONLY the Admin to UPDATE system_settings
CREATE POLICY "Allow admin update access" ON system_settings
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'manavss828@gmail.com'
) WITH CHECK (
  auth.jwt() ->> 'email' = 'manavss828@gmail.com'
);

-- Allow ONLY the Admin to INSERT system_settings
CREATE POLICY "Allow admin insert access" ON system_settings
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = 'manavss828@gmail.com'
);

-- 2. Add per-user image upload permission
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS image_upload_enabled BOOLEAN DEFAULT FALSE;

-- 3. Update RLS for profiles to allow Admin to update any profile
-- (Assuming existing policies might be too restrictive or non-existent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (
  auth.uid() = id
);

CREATE POLICY "Allow admin to update any profile" ON profiles
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'manavss828@gmail.com'
);
