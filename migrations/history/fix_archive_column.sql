DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'columns' AND column_name = 'is_archive_enabled') THEN
        ALTER TABLE columns ADD COLUMN is_archive_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable it for 'Done' columns by default
UPDATE columns 
SET is_archive_enabled = true 
WHERE title = 'Done';
