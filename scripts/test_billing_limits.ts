import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBillingLimits() {
    console.log('--- Testing Billing Limits (Backend Enforcement) ---');

    // 1. Create Solo User
    const soloEmail = `limit_test_${Date.now()}@test.com`;
    const password = 'password123';

    // Sign Up
    const { data: { user: soloUser }, error: suError } = await supabase.auth.signUp({
        email: soloEmail,
        password,
        options: { data: { name: 'Limit Tester' } }
    });

    if (suError || !soloUser) {
        console.error('Signup Failed:', suError?.message);
        return;
    }
    console.log('Step 1: Created User', soloUser.email);

    // Sign In
    const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: soloEmail,
        password
    });

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${sessionData.session?.access_token}` } }
    });

    // 2. Create 3 Projects (Allowed Limit)
    console.log('Step 2: Creating 3 Allowed Projects...');
    for (let i = 1; i <= 3; i++) {
        const { data, error } = await client.from('projects').insert({
            name: `Proj ${i}`,
            owner_id: soloUser.id,
            code: `L-P${i}-${Date.now()}`
        }).select().single();

        if (error) {
            console.error(`❌ Failed to create Project ${i}:`, error.message);
            return;
        } else {
            console.log(`✅ Created Project ${i}`);
        }
    }

    // 3. Attempt 4th Project (Should Fail if Backend Enforced)
    console.log('Step 3: Attempting 4th Project (Should FAIL)...');
    const { data: p4, error: e4 } = await client.from('projects').insert({
        name: `Proj 4 (Excess)`,
        owner_id: soloUser.id,
        code: `L-P4-${Date.now()}`
    }).select().single();

    if (e4) {
        console.log('✅ 4th Project BLOCKED by Backend:', e4.message);
    } else {
        console.error('❌ 4th Project CREATED! (Security Hole: Frontend-only limit)');
    }
}

testBillingLimits().catch(console.error);
