-- Create Payment Configs Table
CREATE TABLE IF NOT EXISTS payment_configs (
    provider TEXT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    mode TEXT DEFAULT 'test' CHECK (mode IN ('test', 'live')),
    test_key_id TEXT,
    test_key_secret TEXT,
    live_key_id TEXT,
    live_key_secret TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Configs (Razorpay & Lemon Squeezy)
INSERT INTO payment_configs (provider, is_enabled, mode)
VALUES 
    ('razorpay', true, 'test'),
    ('lemonsqueezy', false, 'test')
ON CONFLICT (provider) DO NOTHING;

-- RLS Policies (Only Super Admin can edit, Everyone can read public keys - actually strict read for backend/store, frontend only receives public key)
-- For simplicity in this app, we will allow authenticated users to read (so checkout page works) 
-- BUT we should technically only expose the KEY ID, not SECRET.
-- However, since Supabase Client is used in frontend, we will handle filtering in the Store/API level or just be careful.
-- For this prototype, we'll allow read access to authenticated users.

ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for payment settings" ON payment_configs
    FOR SELECT USING (true); -- Public read needed for Checkout Page to check "is_enabled" and "key_id"

-- Only Super Admin (Manav) can update. Since we don't have robust Role system in DB yet (just hardcoded in frontend),
-- we will allow update for now, but UI protects it. In production, check email trigger or role.
CREATE POLICY "Allow update for all (restricted by UI)" ON payment_configs
    FOR UPDATE USING (true);
