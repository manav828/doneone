import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHierarchySecurity() {
    console.log('--- Testing Hierarchy Security (Org Mode) ---');

    // 1. SETUP ACTORS
    const timestamp = Date.now();
    const adminEmail = `admin_h_${timestamp}@test.com`;
    const managerEmail = `manager_h_${timestamp}@test.com`;
    const resourceEmail = `resource_h_${timestamp}@test.com`;
    const password = 'password123';

    console.log('Step 1: Creating Actors...');

    // Create Users
    const { data: { user: adminUser } } = await supabase.auth.signUp({ email: adminEmail, password, options: { data: { name: 'Admin H' } } });
    const { data: { user: managerUser } } = await supabase.auth.signUp({ email: managerEmail, password, options: { data: { name: 'Manager H' } } });
    const { data: { user: resourceUser } } = await supabase.auth.signUp({ email: resourceEmail, password, options: { data: { name: 'Resource H' } } });

    if (!adminUser || !managerUser || !resourceUser) {
        console.error('Failed to create actors');
        return;
    }

    // 2. ADMIN SETUP
    console.log('Step 2: Admin Sets up Company & Dept...');

    const { data: adminSession } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
    const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${adminSession.session?.access_token}` } }
    });

    // Create Company
    const { data: company, error: coError } = await adminClient.from('companies').insert({
        name: 'Hierarchy Corp',
        owner_id: adminUser.id,
        join_code: `HC-${timestamp}`
    }).select().single();

    if (!company) { console.error('Company creation failed:', coError?.message); return; }

    // Create Department (Team)
    const { data: dept, error: deptError } = await adminClient.from('teams').insert({
        name: 'Engineering',
        owner_id: adminUser.id,
        join_code: `ENG-${timestamp}`
    }).select().single();

    if (!dept) { console.error('Dept creation failed:', deptError?.message); return; }

    // Create Project
    const { data: project } = await adminClient.from('projects').insert({
        name: 'Core Platform',
        owner_id: adminUser.id,
        code: `CP-${timestamp}`,
        team_id: dept.id
    }).select().single();

    if (!project) { console.error('Project creation failed'); return; }

    // 3. ROLE ASSIGNMENT (Simulate Invites)
    console.log('Step 3: Assigning Roles...');

    // Assign Manager to Dept (as Member, effectively Manager role logic handled by app usually, but let's check basic Team Member scope)
    // Actually, to test "Manager Permissions", we need to see IF they can do things.
    // In this system, "Manager" is often a role string in profiles or team_members

    // Update Manager Profile Role? Or Team Member Role?
    // Let's assume strict RLS checks `auth.uid() IN team.manager_ids` or `profile.role`.
    // Based on my previous audit, I updated `functions` to check `profiles.role` too.

    // Set Profile Roles
    await supabase.from('profiles').update({ role: 'Manager' }).eq('id', managerUser.id);
    await supabase.from('profiles').update({ role: 'Resource' }).eq('id', resourceUser.id);

    // Add to Team
    await adminClient.from('team_members').insert([
        { team_id: dept.id, user_id: managerUser.id, status: 'active', role_id: null }, // Simplified
        { team_id: dept.id, user_id: resourceUser.id, status: 'active', role_id: null }
    ]);

    // 4. MANAGER ATTACK (Attempt Delete Project)
    console.log('Step 4: Testing Manager Restrictions...');
    const { data: mgrSession } = await supabase.auth.signInWithPassword({ email: managerEmail, password });
    const mgrClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${mgrSession.session?.access_token}` } }
    });

    // Manager tries to DELETE the project
    const { error: delError } = await mgrClient.from('projects').delete().eq('id', project.id);

    if (delError) {
        console.log('✅ Manager BLOCKED from Deleting Project (Expected)');
    } else {
        // Double check if it was actually deleted
        const { data: check } = await adminClient.from('projects').select('id').eq('id', project.id).single();
        if (!check) console.error('❌ Manager SUCCESSFULLY DELETED Project (Security Failure!)');
        else console.log('⚠️ Delete returned no error but project exists? RLS might silently ignore.');
    }

    // 5. RESOURCE ATTACK (Attempt Create Project)
    console.log('Step 5: Testing Resource Restrictions...');
    const { data: resSession } = await supabase.auth.signInWithPassword({ email: resourceEmail, password });
    const resClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${resSession.session?.access_token}` } }
    });

    // Resource tries to CREATE a project IN THE TEAM (Should be blocked)
    const { data: resProj, error: createError } = await resClient.from('projects').insert({
        name: 'Resource Rogue Project',
        owner_id: resourceUser.id, // Trying to own it
        team_id: dept.id, // TARGETING THE ENGINEERING DEPT
        code: `ROGUE-${timestamp}`
    }).select().single();

    if (createError) {
        console.log('✅ Resource BLOCKED from Creating Project (Expected):', createError.message);
    } else {
        console.error('❌ Resource CREATED Project (Security Failure!):', resProj.id);
        // Wait, did the "Solo Limit" trigger catch this? Or did RLS?
        // Resource SHOULD be blocked by RLS policies if we set them up correctly.
        // Or by `check_project_limit` if limit is 0?
        // Actually, Resource Profile might not have "Create" permission logic in RLS?
    }

    console.log('Hierarchy Test Complete.');
}

testHierarchySecurity().catch(console.error);
