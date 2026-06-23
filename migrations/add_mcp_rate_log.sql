-- ============================================================
-- Migration: Add MCP Rate Limiting log table
-- Run this in your Supabase SQL Editor AFTER add_api_keys_table.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mcp_rate_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Optionally track the IP for abuse detection
  ip_address TEXT
);

-- Fast index for sliding window queries (key + time)
CREATE INDEX IF NOT EXISTS idx_mcp_rate_log_key_time
  ON public.mcp_rate_log (api_key_id, called_at DESC);

-- Fast index for daily user limit queries
CREATE INDEX IF NOT EXISTS idx_mcp_rate_log_user_day
  ON public.mcp_rate_log (user_id, called_at DESC);

-- No RLS needed - this table is only accessed by the MCP server via service_role key
-- But we disable RLS to be explicit (service_role bypasses RLS anyway)
ALTER TABLE public.mcp_rate_log DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Auto-cleanup: Delete logs older than 7 days to save storage
-- Run as a pg_cron job or manually
-- ============================================================
-- SELECT cron.schedule('cleanup-mcp-rate-log', '0 2 * * *', $$
--   DELETE FROM public.mcp_rate_log WHERE called_at < now() - interval '7 days';
-- $$);
