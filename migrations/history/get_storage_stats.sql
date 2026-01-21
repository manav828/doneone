-- Create a function to get storage usage stats
-- This helps users monitor their usage against the 1GB Free Tier limit

CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT;
  file_count INTEGER;
BEGIN
  -- Check if user is an admin (optional, but good practice)
  -- IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')) THEN
  --   RAISE EXCEPTION 'Access denied';
  -- END IF;

  -- Calculate total size and count from storage.objects
  SELECT 
    COALESCE(SUM(metadata->>'size')::BIGINT, 0),
    COUNT(*)
  INTO 
    total_size,
    file_count
  FROM storage.objects;

  RETURN json_build_object(
    'totalBytes', total_size,
    'fileCount', file_count
  );
END;
$$;
