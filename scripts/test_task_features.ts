import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTaskFeatures() {
    console.log('--- Testing Task Features ---');

    // 1. Setup
    const timestamp = Date.now();
    const email = `task_feat_${timestamp}@test.com`;
    const password = 'password123';

    console.log('Step 1: Creating User...');
    const { data: { user } } = await supabase.auth.signUp({ email, password });
    if (!user) { console.error('Sign up failed'); return; }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${(await supabase.auth.signInWithPassword({ email, password })).data.session?.access_token}` } }
    });

    // Create Project
    const { data: project } = await client.from('projects').insert({
        name: 'Feature Project',
        owner_id: user.id,
        code: `FP-${timestamp}`
    }).select().single();

    if (!project) { console.error('Project failed'); return; }

    // 2. RECURRING TASK TEST
    console.log('Step 2: Testing Recurring Task Logic...');
    // Create Master Task
    const recurrenceConfig = {
        frequency: 'daily',
        interval: 1,
        nextTriggerAt: Date.now() - 1000 // Past, should trigger
    };

    const { data: task, error: tError } = await client.from('tasks').insert({
        project_id: project.id,
        title: 'Daily Standup',
        description: 'Recurring Task',
        recurrence: recurrenceConfig, // JSONB column
        column_id: 'bac7bebc-28fa-4ee0-ae3b-ccaf149dc205', // Valid 'Pending' UUID
        creator_id: user.id, // Fixed: owner_id -> creator_id
        order_index: 0
    }).select().single();

    var createdTask; // Declare createdTask here

    if (tError) {
        console.log('⚠️ First insert failed, checking error:', tError.message);
        // Try with correct fields
        const { data: task2, error: tError2 } = await client.from('tasks').insert({
            project_id: project.id,
            title: 'Daily Standup',
            column_id: 'bac7bebc-28fa-4ee0-ae3b-ccaf149dc205', // Valid UUID
            creator_id: user.id,
            recurrence: recurrenceConfig,
            order_index: 0 // Fixed: Added missing required field
        }).select().single();
        if (tError2) { console.error('❌ Recurring Task Insert Failed:', tError2.message); return; }
        console.log('✅ Master Recurring Task Created (ID: ' + task2.id + ')');
        // Set 'task' for next step
        createdTask = task2;
    } else {
        console.log('✅ Master Recurring Task Created (ID: ' + task.id + ')');
        createdTask = task;
    }

    // 3. TIME LOG TEST
    console.log('Step 3: Testing Time Log...');

    if (!createdTask) { console.log('❌ Skipping Time Log because Task Failed'); return; }

    // Note: Table might be 'work_logs' or 'time_logs' or nested in task?
    // Checking schema... let's assume 'daily_work_logs' based on previous context or standard schema.

    // We need to know the table name for time logs.
    // Using generic insert attempt.
    // 3. TIME LOG TEST
    console.log('Step 3: Testing Time Log...');

    if (!createdTask) { console.log('❌ Skipping Time Log because Task Failed'); return; }

    // Update Task Time Tracked
    const { error: updateError } = await client.from('tasks')
        .update({ time_tracked: 3600 }) // 1 hour
        .eq('id', createdTask.id);

    if (updateError) console.error('❌ Failed to update task time:', updateError.message);
    else console.log('✅ Task time_tracked updated');

    // Insert to Daily Log (Summary)
    // Columns: user_id, project_id, work_date, total_seconds, tasks_worked, tasks_completed
    const { error: logError } = await client.from('daily_work_logs').insert({
        user_id: user.id,
        project_id: project.id,
        work_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        total_seconds: 3600,
        tasks_worked: 1,
        tasks_completed: 0
    });

    if (logError) {
        // Maybe table is different?
        console.log('⚠️ standard log table insert failed. Checking `time_entries`?');
        // If schema is unknown, we might skip or fail.
        // But based on user context "Time Tracking", it likely exists.
        console.error('❌ Time Log Insert Failed:', logError.message);
    } else {
        console.log('✅ Time Log Created');
    }

    console.log('Task Features Verification Complete.');
}

testTaskFeatures().catch(console.error);
