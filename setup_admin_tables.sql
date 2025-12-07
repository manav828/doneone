-- 1. Create app_settings table (if missing)
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  registration_open BOOLEAN DEFAULT TRUE,
  image_upload_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default settings row if not exists
INSERT INTO app_settings (id, registration_open, image_upload_enabled)
VALUES (1, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Robust Policies
-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public read access" ON app_settings;
DROP POLICY IF EXISTS "Admin update access" ON app_settings;
DROP POLICY IF EXISTS "Admin insert access" ON app_settings;
DROP POLICY IF EXISTS "Admin All Access" ON app_settings;

-- A. READ Policy (Everyone)
CREATE POLICY "Public read access" ON app_settings FOR SELECT USING (true);

-- B. WRITE Policies (Admin Only)
CREATE POLICY "Admin All Access" ON app_settings FOR ALL USING (
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
GRANT ALL ON app_settings TO authenticated;
GRANT ALL ON app_settings TO service_role;
