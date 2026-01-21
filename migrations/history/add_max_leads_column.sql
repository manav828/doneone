-- Add max_leads_per_project to plans table

ALTER TABLE plans
ADD COLUMN IF NOT EXISTS max_leads_per_project int DEFAULT 2;

-- Update existing plans with sensible defaults
UPDATE plans SET max_leads_per_project = 2 WHERE id = 'free';
UPDATE plans SET max_leads_per_project = 5 WHERE id = 'premium';
