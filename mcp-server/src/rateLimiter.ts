import { supabase } from './supabaseClient.js';
import { McpRateLimitError } from './auth.js';

// ============================================================
// Rate Limit Configuration
// ============================================================
const LIMITS = {
  PER_MINUTE: 60,   // 60 requests per minute per API key
  PER_HOUR: 500,    // 500 requests per hour per API key
  PER_DAY: 2000     // 2000 requests per day per user account
};

/**
 * Check and log a rate limit for an API key + user.
 * Uses the mcp_rate_log table as a sliding window counter.
 * Throws McpRateLimitError if any limit is exceeded.
 */
export async function checkAndLogRateLimit(
  apiKeyId: string,
  userId: string,
  toolName: string,
  ipAddress?: string
): Promise<void> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Run all three window counts in parallel for performance
  const [minuteResult, hourResult, dayResult] = await Promise.all([
    supabase
      .from('mcp_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('called_at', oneMinuteAgo),

    supabase
      .from('mcp_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('called_at', oneHourAgo),

    supabase
      .from('mcp_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('called_at', oneDayAgo)
  ]);

  const minuteCount = minuteResult.count ?? 0;
  const hourCount = hourResult.count ?? 0;
  const dayCount = dayResult.count ?? 0;

  // Check limits and throw with appropriate retry time
  if (minuteCount >= LIMITS.PER_MINUTE) {
    throw new McpRateLimitError(
      `Rate limit exceeded: ${LIMITS.PER_MINUTE} requests per minute. ` +
      'Please wait before retrying.',
      60 - Math.floor((now.getTime() - new Date(oneMinuteAgo).getTime()) / 1000)
    );
  }

  if (hourCount >= LIMITS.PER_HOUR) {
    throw new McpRateLimitError(
      `Rate limit exceeded: ${LIMITS.PER_HOUR} requests per hour.`,
      3600
    );
  }

  if (dayCount >= LIMITS.PER_DAY) {
    throw new McpRateLimitError(
      `Daily limit reached: ${LIMITS.PER_DAY} requests per day. Resets at midnight UTC.`,
      86400
    );
  }

  // Log this request (non-blocking insert)
  await supabase.from('mcp_rate_log').insert({
    api_key_id: apiKeyId,
    user_id: userId,
    tool_name: toolName,
    called_at: now.toISOString(),
    ip_address: ipAddress ?? null
  });
}

/**
 * Get the current rate limit status for a user (for informational tools).
 */
export async function getRateLimitStatus(apiKeyId: string, userId: string): Promise<{
  minute: { used: number; limit: number };
  hour: { used: number; limit: number };
  day: { used: number; limit: number };
}> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [minuteResult, hourResult, dayResult] = await Promise.all([
    supabase.from('mcp_rate_log').select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId).gte('called_at', oneMinuteAgo),
    supabase.from('mcp_rate_log').select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId).gte('called_at', oneHourAgo),
    supabase.from('mcp_rate_log').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).gte('called_at', oneDayAgo)
  ]);

  return {
    minute: { used: minuteResult.count ?? 0, limit: LIMITS.PER_MINUTE },
    hour: { used: hourResult.count ?? 0, limit: LIMITS.PER_HOUR },
    day: { used: dayResult.count ?? 0, limit: LIMITS.PER_DAY }
  };
}
