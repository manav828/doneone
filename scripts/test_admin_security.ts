import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminSecurity() {
    console.log('--- Testing Admin Security (Workspace Settings) ---');

    const timestamp = Date.now();
    const adminEmail = `admin_set_${timestamp}@test.com`;
    const managerEmail = `manager_set_${timestamp}@test.com`;
    const password = 'password123';

    // 1. Setup Admin & Company
    console.log('Step 1: Admin Setup...');
    const { data: { user: adminUser } } = await supabase.auth.signUp({ email: adminEmail, password });
    if (!adminUser) { console.error('Admin signup failed'); return; }

    const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${(await supabase.auth.signInWithPassword({ email: adminEmail, password })).data.session?.access_token}` } }
    });

    const { data: company, error: coError } = await adminClient.from('companies').insert({
        name: 'Secure Corp',
        owner_id: adminUser.id,
        join_code: `SEC-${timestamp}`
    }).select().single();

    if (!company) { console.error('Company creation failed:', coError?.message); return; }
    console.log('✅ Company Created by Admin');

    // 2. Setup Manager (Non-Admin)
    console.log('Step 2: Manager Setup...');
    const { data: { user: managerUser } } = await supabase.auth.signUp({ email: managerEmail, password });
    if (!managerUser) { console.error('Manager signup failed'); return; }

    // Assign Manager to Company (implicitly or explicitly)
    // We need them to be IN the company to potentially have "read" access, but "update" should be blocked.
    // Adding to a team in the company is the standard way.
    const { data: team } = await adminClient.from('teams').insert({
        name: 'General',
        company_id: company.id,
        owner_id: adminUser.id,
        join_code: `GEN-${timestamp}`
    }).select().single();

    const managerClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${(await supabase.auth.signInWithPassword({ email: managerEmail, password })).data.session?.access_token}` } }
    });

    // 3. ATTACK: Manager tries to rename Company
    console.log('Step 3: Manager Attempting to Rename Company...');

    const { error: updateError } = await managerClient.from('companies')
        .update({ name: 'HACKED CORP' })
        .eq('id', company.id);

    if (updateError) {
        console.log('✅ Manager BLOCKED from updating Company Settings:', updateError.message);
    } else {
        // Create separate verification client or re-use admin to check persistence
        const { data: checkCo } = await adminClient.from('companies').select('name').eq('id', company.id).single();
        if (checkCo?.name === 'HACKED CORP') {
            console.error('❌ Manager SUCCESSFULLY RENAMED Company! (Security Failure)');
        } else {
            console.log('⚠️ Update returned no error, but value is unchanged? (Silent Fail/RLS)');
        }
    }

    // 4. ATTACK: Manager tries to Delete Company
    console.log('Step 4: Manager Attempting to Delete Company...');
    const { error: delError } = await managerClient.from('companies')
        .delete()
        .eq('id', company.id);

    if (delError) {
        console.log('✅ Manager BLOCKED from deleting Company:', delError.message);
    } else {
        // Verify existence
        const { data: checkDel } = await adminClient.from('companies').select('id').eq('id', company.id).single();
        if (!checkDel) {
            console.error('❌ Manager SUCCESSFULLY DELETED Company! (Critical Security Failure)');
        } else {
            console.log('⚠️ Delete returned no error, but company exists? (Silent Fail/RLS)');
        }
    }

    console.log('Admin Security Verification Complete.');
}

testAdminSecurity().catch(console.error);
