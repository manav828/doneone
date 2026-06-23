-- ============================================================
-- Migration: Add API Keys table for MCP Server Authentication
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Table to store user-generated API keys for MCP access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My MCP Key',
  -- We store ONLY the hash, never the plaintext key
  key_hash TEXT NOT NULL UNIQUE,
  -- First 12 chars shown to user so they can identify the key (e.g. "do_live_a1b2")
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  -- Optional: track which IP last used this key
  last_used_ip TEXT
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys (is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own keys (never see the hash)
CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can INSERT their own keys
CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own keys (e.g., rename, deactivate)
CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can DELETE their own keys
CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Helper: Limit to max 5 API keys per user
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_api_key_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.api_keys WHERE user_id = NEW.user_id AND is_active = true) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 active API keys allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_api_key_limit
  BEFORE INSERT ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.check_api_key_limit();
