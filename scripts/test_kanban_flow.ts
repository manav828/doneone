import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKanbanFlow() {
    console.log('--- Testing Kanban & Discussion Features ---');

    const timestamp = Date.now();
    const email = `kanban_${timestamp}@test.com`;
    const password = 'password123';

    // 1. Setup User & Project
    console.log('Step 1: Setup...');
    const { data: { user } } = await supabase.auth.signUp({ email, password });
    if (!user) { console.error('Sign up failed'); return; }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${(await supabase.auth.signInWithPassword({ email, password })).data.session?.access_token}` } }
    });

    const { data: project } = await client.from('projects').insert({
        name: 'Kanban Project',
        owner_id: user.id,
        code: `KP-${timestamp}`
    }).select().single();

    if (!project) { console.error('Project failed'); return; }

    // 2. Fetch Columns (Auto-created by trigger usually? Or logic?)
    // In store.ts, columns are created manually after project creation.
    // API test must simulate this or check if they exist.
    // Let's create them manually to be safe/realistic if logic is in frontend.
    console.log('Step 2: Setting up Columns...');
    const columns = ['Pending', 'In Progress', 'Done'];
    const colIds: Record<string, string> = {};

    for (const title of columns) {
        const { data: col } = await client.from('columns').insert({
            project_id: project.id,
            title: title,
            order_index: 0
        }).select().single();
        if (col) colIds[title] = col.id;
    }

    // 3. Create Task in Pending
    console.log('Step 3: Creating Task in Pending...');
    const { data: task, error: tError } = await client.from('tasks').insert({
        project_id: project.id,
        title: 'Move Me',
        column_id: colIds['Pending'],
        creator_id: user.id,
        order_index: 0
    }).select().single();

    if (tError || !task) { console.error('Task creation failed:', tError?.message); return; }

    // 4. Move Task to 'In Progress'
    console.log('Step 4: Moving Task -> In Progress...');
    const { error: moveError } = await client.from('tasks')
        .update({ column_id: colIds['In Progress'] })
        .eq('id', task.id);

    if (moveError) console.error('❌ Failed to move task:', moveError.message);
    else console.log('✅ Task Moved successfully');

    // 5. Create Discussion Task
    console.log('Step 5: Creating Discussion Task...');
    const { data: discTask, error: discError } = await client.from('tasks').insert({
        project_id: project.id,
        title: 'Discuss Launch',
        column_id: colIds['Pending'],
        creator_id: user.id,
        order_index: 1,
        is_discussion: true,
        discussion_user_ids: [user.id]
    }).select().single();

    if (discError) console.error('❌ Discussion creation failed:', discError.message);
    else console.log('✅ Discussion Task Created');

    // 6. Column Mgmt (Add/Delete)
    console.log('Step 6: Column Management...');
    const { data: newCol } = await client.from('columns').insert({
        project_id: project.id,
        title: 'Review',
        order_index: 1
    }).select().single();

    if (newCol) {
        console.log('✅ Column Created');
        const { error: delError } = await client.from('columns').delete().eq('id', newCol.id);
        if (!delError) console.log('✅ Column Deleted');
        else console.error('❌ Failed to delete column');
    } else {
        console.error('❌ Failed to create column');
    }

    console.log('Kanban Verification Complete.');
}

testKanbanFlow().catch(console.error);
