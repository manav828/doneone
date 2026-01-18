import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role for setup

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const TEST_USERS = {
    admin: { email: 'admin@test.com', password: 'password123', role: 'Admin' },
    pooja: { email: 'pooja@test.com', password: 'password123', role: 'DeptHead' },
    rahul: { email: 'rahul@test.com', password: 'password123', role: 'Manager' },
    resource: { email: 'resource@test.com', password: 'password123', role: 'Resource' }
};

export async function setupTestEnvironment() {
    console.log('--- Setting up Test Environment ---');

    // 1. Ensure Users Exist (Idempotent)
    for (const [key, user] of Object.entries(TEST_USERS)) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { name: key.toUpperCase(), role: user.role }
        });

        if (error && !error.message.includes('already registered')) {
            console.error(`Failed to create ${key}:`, error.message);
        } else {
            console.log(`User ${key} ready.`);
        }
    }

    // 2. Clear previous test data (Risky on prod, ensure this is test logic)
    // For now, we will just create unique suffixes for projects
}

if (require.main === module) {
    setupTestEnvironment();
}
