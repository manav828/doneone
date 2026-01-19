import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiyxdeziscewxuwdoldi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeXhkZXppc2Nld3h1d2RvbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc3MDIsImV4cCI6MjA3OTM4MzcwMn0.xAwCQdRGEsRzH_bN64s9NhqImCrEyJdhzCHP9P9JUEQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTaskMetadata() {
    console.log('--- Testing Task Metadata & Limits ---');

    const timestamp = Date.now();
    const email = `meta_${timestamp}@test.com`;
    const password = 'password123';

    // 1. Setup User & Project
    console.log('Step 1: Setup...');
    const { data: { user } } = await supabase.auth.signUp({ email, password });
    if (!user) { console.error('Sign up failed'); return; }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${(await supabase.auth.signInWithPassword({ email, password })).data.session?.access_token}` } }
    });

    const { data: project } = await client.from('projects').insert({
        name: 'Meta Project',
        owner_id: user.id,
        code: `MP-${timestamp}`
    }).select().single();

    if (!project) { console.error('Project failed'); return; }

    // 2. Create Base Task
    console.log('Step 2: Creating Base Task...');
    const { data: task } = await client.from('tasks').insert({
        project_id: project.id,
        title: 'Metadata Task',
        column_id: 'bac7bebc-28fa-4ee0-ae3b-ccaf149dc205', // Pending
        creator_id: user.id,
        order_index: 0
    }).select().single();

    if (!task) { console.error('Task creation failed'); return; }

    // 3. Test Priority
    console.log('Step 3: Setting Priority (High)...');
    const { error: priError } = await client.from('tasks')
        .update({ priority: 'high' })
        .eq('id', task.id);

    if (priError) console.error('❌ Failed to set priority:', priError.message);
    else console.log('✅ Priority Set');

    // 4. Test Tags
    console.log('Step 4: Creating & Assigning Tag...');
    const { data: tag, error: tagCreateError } = await client.from('tags').insert({
        name: 'Urgent',
        color: '#ff0000',
        project_id: project.id
    }).select().single();

    if (tagCreateError) console.error('❌ Failed to create tag:', tagCreateError.message);
    else {
        const { error: tagAssignError } = await client.from('tasks')
            .update({ tag_ids: [tag.id] })
            .eq('id', task.id);

        if (tagAssignError) console.error('❌ Failed to assign tag:', tagAssignError.message);
        else console.log('✅ Tag Assigned');
    }

    // 5. Test Reminders
    console.log('Step 5: Setting Reminder...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { error: remError } = await client.from('tasks')
        .update({ reminder_at: tomorrow.toISOString() })
        .eq('id', task.id);

    if (remError) console.error('❌ Failed to set reminder:', remError.message);
    else console.log('✅ Reminder Set');

    // 6. Test Subtasks
    console.log('Step 6: Adding Subtasks...');
    const subtasks = [
        { id: 'st-1', title: 'Check logs', completed: false },
        { id: 'st-2', title: 'Fix bug', completed: true }
    ];
    const { error: subError } = await client.from('tasks')
        .update({ subtasks: subtasks })
        .eq('id', task.id);

    if (subError) console.error('❌ Failed to add subtasks:', subError.message);
    else console.log('✅ Subtasks Added');

    // 7. Test Attachments & Upload Limits
    console.log('Step 7: Attachments & Limits...');

    // A. Metadata Update
    const mockAttachment = {
        id: 'file-123',
        name: 'report.pdf',
        size: 1024 * 1024 * 6, // 6MB
        url: 'https://fake.url/report.pdf'
    };
    const { error: attError } = await client.from('tasks')
        .update({ attachments: [mockAttachment] })
        .eq('id', task.id);

    if (attError) console.error('❌ Failed to add attachment metadata:', attError.message);
    else console.log('✅ Attachment Metadata Added');

    // B. Storage Limit Check (Mock)
    // We can't easily upload a real file here, but we can check if the RLS *would* block a large insert if we could.
    // Actually, without a backend function/trigger, purely client-side Supabase upload rely on RLS.
    // I will check if I can insert into `storage.objects` directly (mocking an upload) with a fake size.
    // Note: 'storage.objects' often requires metadata matching the file.

    /* 
       Checking for "FileSize Limit" enforcement:
       If I insert a row into storage.objects with metadata "size": 10MB, does it block?
       Usually Supabase RLS for storage uses `(storage.foldername(name))[1]` etc.
       Explicit size checks usually need a custom Postgres Function or Policy like `check (octet_length(content) < ...)`
    */

    console.log('⚠️ Upload Limit: Not programmatically verifiable without binary upload.');
    console.log('ℹ️ Security Note: Based on inspection, RLS for "storage.objects" lacks size check.');
    console.log('ℹ️ Recommendation: Storage limits must be enforced via RLS "check" constraint or Edge Function.');

    console.log('Task Metadata Verification Complete.');
}

testTaskMetadata().catch(console.error);
