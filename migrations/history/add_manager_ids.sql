-- Add manager_ids column to departments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'manager_ids') THEN
        ALTER TABLE departments ADD COLUMN manager_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Add manager_ids column to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'manager_ids') THEN
        ALTER TABLE projects ADD COLUMN manager_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Migrate existing project manager_id to manager_ids array if needed (optional, for backward compatibility)
UPDATE projects 
SET manager_ids = array_append(manager_ids, manager_id::TEXT)
WHERE manager_id IS NOT NULL AND manager_ids IS NOT NULL AND NOT (manager_id::TEXT = ANY(manager_ids));
