-- 1. Create system_settings table (if missing)
-- NOTE: Renamed from app_settings to match Login.tsx and complete_schema.sql
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value boolean DEFAULT true
);

-- 2. Insert default settings row if not exists
INSERT INTO system_settings (key, value)
VALUES ('registration_open', TRUE), ('image_upload_enabled', FALSE)
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Robust Policies
-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public read access" ON system_settings;
DROP POLICY IF EXISTS "Admin update access" ON system_settings;
DROP POLICY IF EXISTS "Admin insert access" ON system_settings;
DROP POLICY IF EXISTS "Admin All Access" ON system_settings;
-- Also drop old table policies if they exist just in case
DROP POLICY IF EXISTS "Public read access" ON app_settings;
DROP POLICY IF EXISTS "Admin All Access" ON app_settings;

-- A. READ Policy (Everyone - crucial for Login page)
CREATE POLICY "Public read access" ON system_settings FOR SELECT USING (true);

-- B. WRITE Policies (Admin Only)
-- B. WRITE Policies (Admin Only)
CREATE POLICY "Admin All Access" ON system_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (email = 'manavss828@gmail.com' OR role IN ('Manager')) 
  )
);

-- 5. Create/Update Storage Stats Function (Now includes DB Size)
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT;
  file_count INTEGER;
  db_size BIGINT;
BEGIN
  -- 1. Get File Storage Size (storage.objects)
  SELECT 
    COALESCE(SUM((metadata->>'size')::BIGINT), 0),
    COUNT(*)
  INTO 
    total_size,
    file_count
  FROM storage.objects;

  -- 2. Get Database Size
  SELECT pg_database_size(current_database()) INTO db_size;

  RETURN json_build_object(
    'totalBytes', total_size,
    'fileCount', file_count,
    'databaseBytes', db_size
  );
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_storage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_stats TO service_role;
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
