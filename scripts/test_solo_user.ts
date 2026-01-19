import { createClient } from '@supabase/supabase-js';

// Hardcoded keys for testing verification
const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSoloUser() {
    console.log('--- Testing Solo User Flow ---');
    const email = `solo_${Date.now()}@test.com`;
    const password = 'password123';

    // 1. Create Solo User (Public Sign Up)
    const { data: { user, session }, error: createError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name: 'Solo User' }
        }
    });

    if (createError) {
        console.error('Sign Up failed:', createError.message);
        return;
    }

    if (!user || !session) {
        console.log("User created but no session (email confirmation might be required). Assuming logic allows login or we can proceed if auto-confirm is on.");
        // If auto-confirm is OFF, this test fails. We assume Dev environment has it ON or we can't test easily.
        // We will try to signIn immediately to check.
    }
    console.log('1. Created Solo User:', email);

    // 2. Sign In to get token (if not provided by signup)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError) {
        console.error('Sign in failed (User might need email confirmation):', signInError.message);
        return;
    }
    console.log('2. Signed In');

    // 3. User Client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } }
    });

    // 2. Simulate Onboarding (Individual)
    // We need to match what store.ts does: 
    // - Sets role = 'Admin' (Wait, does it?) 
    // - Creates a team (Workspace)?
    // I'll check store.ts output first.

    // 3. Try to Create Project
    // This requires impersonating the user which RLS handles.
    // Since we are running as Admin (Service Role) here, strict RLS testing is harder 
    // unless we sign in as them.

    // Attempt Create Project
    const { data: project, error: projError } = await userClient.from('projects').insert({
        name: 'Solo Project',
        owner_id: user.id,
        code: 'SOLO01'
    }).select().single();

    if (projError) {
        console.error('❌ Solo User FAILED to create project:', projError.message);
    } else {
        console.log('✅ Solo User SUCCESS creating project:', project.name);
    }

    // Clean up
    // await supabase.auth.admin.deleteUser(user.id); // Cannot delete with anon key
    console.log('Test Complete. (User remains in DB)');
}

testSoloUser().catch(console.error);
