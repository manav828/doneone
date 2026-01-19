import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
// Use SERVICE ROLE KEY to bypass RLS for setup, but we'll try to simulate user views?
// Actually, strict visibility testing requires acting AS the user.
// We can use the Anon Key + Login to get a token, then create a client with that token.

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReportsVisibility() {
    console.log('--- Testing Reports Visibility ---');

    // 1. Create Solo User
    const soloEmail = `solo_rpt_${Date.now()}@test.com`;
    const password = 'password123';

    // Sign Up
    const { data: { user: soloUser }, error: suError } = await supabase.auth.signUp({
        email: soloEmail,
        password,
        options: { data: { name: 'Solo Report User' } }
    });

    if (suError || !soloUser) {
        console.error('Solo Signup Failed:', suError?.message);
        return;
    }
    console.log('Step 1: Created Solo User', soloUser.email);

    // Sign In to get Token
    const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: soloEmail,
        password
    });

    const soloClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${sessionData.session?.access_token}` } }
    });

    // Create Project
    const { data: project, error: createProjError } = await soloClient.from('projects').insert({
        name: 'Solo Reports Proj',
        owner_id: soloUser.id,
        code: `SOLO-${Date.now()}`
    }).select().single();

    if (createProjError || !project) {
        console.error('Failed to create solo project:', createProjError?.message);
        return;
    }
    console.log('Step 2: Created Solo Project', project.id);

    // 2. CHECK VISIBILITY (Simulated)
    // Since "Reports" is a Frontend calculation based on fetched data, we test:
    // Can the user fetch ALL metrics required for reports?
    // - Fetch Tasks?

    const { data: tasks, error: taskError } = await soloClient.from('tasks').select('*').eq('project_id', project.id);

    if (taskError) {
        console.error('❌ Solo User CANNOT fetch tasks for reports:', taskError.message);
    } else {
        console.log('✅ Solo User CAN fetch tasks (Count:', tasks.length, ')');
    }

    // --- ORG TEST ---
    console.log('\n--- Testing Org Visibility ---');
    // Create Admin User
    const adminEmail = `admin_rpt_${Date.now()}@test.com`;
    const { data: { user: adminUser } } = await supabase.auth.signUp({
        email: adminEmail,
        password,
        options: { data: { name: 'Admin User' } }
    });

    if (!adminUser) { console.error('Admin setup failed'); return; }

    // Create Manager User
    const mgrEmail = `mgr_rpt_${Date.now()}@test.com`;
    const { data: { user: mgrUser } } = await supabase.auth.signUp({
        email: mgrEmail,
        password,
        options: { data: { name: 'Manager User' } }
    });

    // Create Resource User
    const resEmail = `res_rpt_${Date.now()}@test.com`;
    const { data: { user: resUser } } = await supabase.auth.signUp({
        email: resEmail,
        password,
        options: { data: { name: 'Resource User' } }
    });

    // Admin logs in
    const { data: adminSession } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
    const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${adminSession.session?.access_token}` } }
    });

    // Admin creates Company
    const { data: company, error: coError } = await adminClient.from('companies').insert({
        name: 'ReportCorp',
        owner_id: adminUser.id,
        join_code: `CORE-${Date.now()}`
    }).select().single();

    if (coError || !company) { console.error('Company creation failed:', coError?.message); return; }
    console.log('Admin created company:', company.name);

    // Admin creates Team (Department)
    const { data: team, error: teamError } = await adminClient.from('teams').insert({
        name: 'Marketing',
        owner_id: adminUser.id,
        join_code: `MKTG-${Date.now()}`
    }).select().single();

    if (teamError) console.error('Team creation error:', teamError.message);

    // Admin creates Project A (Assigned to Team)
    const { data: projectA } = await adminClient.from('projects').insert({
        name: 'Project A',
        owner_id: adminUser.id,
        code: `PROJ-A-${Date.now()}`,
        team_id: team?.id
    }).select().single();

    // Admin creates Project B (Private / Other Team)
    const { data: projectB } = await adminClient.from('projects').insert({
        name: 'Project B (Secret)',
        owner_id: adminUser.id,
        code: `PROJ-B-${Date.now()}`
    }).select().single();

    // Add Tasks
    await adminClient.from('tasks').insert([
        { project_id: projectA?.id, title: 'Task A1', column_id: '123' }, // simplified
        { project_id: projectB?.id, title: 'Task B1', column_id: '456' }
    ]);

    // NOTE: Simple insert might fail strictly due to column_id FK checks but RLS is the focus.
    // Actually, we need real columns for strict inserts usually, but let's see if RLS blocks us reading valid tasks if we assume they exist.
    // Better: Create tasks properly or rely on project existence for "View Projects" test.
    // Let's test "View Projects" as proxy for Reports visibility.

    // Link Manager to Team
    // In real app: Admin invites, Manager accepts.
    // DB: Insert into team_members
    await adminClient.from('team_members').insert({
        team_id: team?.id,
        user_id: mgrUser?.id,
        status: 'active',
        role_id: null // simplified
    });

    // Link Resource to Project A directly
    await adminClient.from('project_members').insert({
        project_id: projectA?.id,
        user_id: resUser?.id,
        role: 'Resource',
        status: 'active'
    });

    console.log('Setup Complete. Verifying Access...');

    // 1. MANAGER ACCESS
    const { data: mgrSession } = await supabase.auth.signInWithPassword({ email: mgrEmail, password });
    const mgrClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${mgrSession.session?.access_token}` } }
    });

    const { data: mgrProjects } = await mgrClient.from('projects').select('id, name');
    const mgrSeesA = mgrProjects?.find(p => p.id === projectA?.id);
    const mgrSeesB = mgrProjects?.find(p => p.id === projectB?.id);

    if (mgrSeesA) console.log('✅ Manager SEES Team Project A');
    else console.error('❌ Manager CANNOT see Team Project A');

    if (!mgrSeesB) console.log('✅ Manager BLOCKED from Secret Project B');
    else console.error('❌ Manager SEES Secret Project B (Leak!)');

    // 2. RESOURCE ACCESS
    const { data: resSession } = await supabase.auth.signInWithPassword({ email: resEmail, password });
    const resClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${resSession.session?.access_token}` } }
    });

    const { data: resProjects } = await resClient.from('projects').select('id, name');
    const resSeesA = resProjects?.find(p => p.id === projectA?.id);
    const resSeesB = resProjects?.find(p => p.id === projectB?.id);

    if (resSeesA) console.log('✅ Resource SEES Assigned Project A');
    else console.error('❌ Resource CANNOT see Assigned Project A');

    if (!resSeesB) console.log('✅ Resource BLOCKED from Secret Project B');
    else console.error('❌ Resource SEES Secret Project B (Leak!)');

    console.log('Test Complete.');
}

testReportsVisibility().catch(console.error);
