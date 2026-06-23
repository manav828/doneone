import { createHash } from 'crypto';
import { supabase } from './supabaseClient.js';

export type UserRole = 'Admin' | 'DeptHead' | 'Manager' | 'Lead' | 'Resource';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isPremium: boolean;
  apiKeyId: string;
  companyId?: string;
}

/**
 * Hash the raw API key for DB lookup.
 * We use SHA-256 — never store plaintext.
 */
function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate the API key and return the authenticated user.
 * Throws descriptive errors on failure.
 */
export async function authenticate(rawApiKey: string): Promise<AuthenticatedUser> {
  if (!rawApiKey || !rawApiKey.startsWith('do_live_')) {
    throw new McpAuthError('Invalid API key format. Keys must start with "do_live_"');
  }

  const keyHash = hashKey(rawApiKey);

  // Look up the API key in the database
  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, last_used_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle();

  if (keyError || !apiKey) {
    throw new McpAuthError('API key not found or has been revoked');
  }

  // Fetch the user's profile (includes role, premium status, plan)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role, is_premium, premium_until, plan_id, company_id')
    .eq('id', apiKey.user_id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ [MCP Auth Error] Database error when fetching user profile:', profileError);
    throw new McpAuthError(`Database error: ${profileError.message}`);
  }

  if (!profile) {
    console.error(`❌ [MCP Auth Error] Profile not found in database for user_id: ${apiKey.user_id} (linked to API key ID: ${apiKey.id})`);
    throw new McpAuthError('User profile not found in database');
  }

  // Determine premium status
  const hasPremiumUntil = profile.premium_until
    ? new Date(profile.premium_until).getTime() > Date.now()
    : false;

  // Check if user's plan is a paid plan
  let hasPaidPlan = false;
  if (profile.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('price_monthly')
      .eq('id', profile.plan_id)
      .maybeSingle();
    hasPaidPlan = !!plan && (Number(plan.price_monthly) > 0);
  }

  const isPremium = profile.is_premium === true || hasPremiumUntil || hasPaidPlan;

  // Update last_used_at in the background (non-blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)
    .then(() => {});

  return {
    userId: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserRole,
    isPremium,
    apiKeyId: apiKey.id,
    companyId: profile.company_id
  };
}

/**
 * Ensure the user is premium. Throws if not.
 * Call this at the start of every MCP tool.
 */
export function requirePremium(user: AuthenticatedUser): void {
  if (!user.isPremium) {
    throw new McpPermissionError(
      'This feature requires a DoneOne Premium subscription. ' +
      'Upgrade at https://doneone.app/billing'
    );
  }
}

// ============================================================
// Custom Error Classes
// ============================================================
export class McpAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpAuthError';
  }
}

export class McpPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpPermissionError';
  }
}

export class McpRateLimitError extends Error {
  public retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = 'McpRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
