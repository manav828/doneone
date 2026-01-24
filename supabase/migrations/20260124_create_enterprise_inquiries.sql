-- Migration: Create enterprise_inquiries table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  company_name TEXT,
  team_size TEXT,
  required_features TEXT[],
  requirements TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE enterprise_inquiries ENABLE ROW LEVEL SECURITY;

-- Users can insert their own inquiries
CREATE POLICY "Users can insert their own inquiries"
ON enterprise_inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
ON enterprise_inquiries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all inquiries (using email check)
CREATE POLICY "Admin can view all inquiries"
ON enterprise_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email = 'manavss828@gmail.com'
  )
);

-- Admin can update all inquiries
CREATE POLICY "Admin can update all inquiries"
ON enterprise_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email = 'manavss828@gmail.com'
  )
);

-- Admin can delete inquiries
CREATE POLICY "Admin can delete inquiries"
ON enterprise_inquiries FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email = 'manavss828@gmail.com'
  )
);
