-- Add max_attachments_per_task column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS max_attachments_per_task INTEGER DEFAULT 3;

-- Update RLS policies if needed (already covered by previous generic update policy, but good to verify)
-- The previous policy "Allow admin to update any profile" should cover this new column.
