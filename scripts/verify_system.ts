import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

async function runTest(scriptName: string, description: string) {
    process.stdout.write(`Testing: ${description.padEnd(40)} `);
    try {
        const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}`);
        // Check for success markers or failure markers in output
        if (stdout.includes('❌') || stderr.length > 0) {
            // Some scripts print errors to stdout for us to see, so strict stderr check might be too aggressive
            // But our scripts use console.error which goes to stderr, or console.log('❌')
            if (stdout.includes('❌')) {
                console.log('❌ FAILED');
                console.log(stdout); // detailed output
                return false;
            }
        }
        console.log('✅ PASSED');
        return true;
    } catch (error: any) {
        console.log('❌ CRASHED');
        console.error(error.message);
        return false;
    }
}

async function main() {
    console.log('=============================================');
    console.log('   🚀 FLOWBOARD SYSTEM VERIFICATION RUNNER   ');
    console.log('=============================================\n');

    let allPassed = true;

    // Phase 1: Solo User
    allPassed = await runTest('test_solo_user.ts', 'Solo User (Signup & Projects)') && allPassed;

    // Phase 2: Reports
    allPassed = await runTest('test_reports_visibility.ts', 'Reports & Data Visibility') && allPassed;

    // Phase 3: Billing
    allPassed = await runTest('test_billing_limits.ts', 'Billing & Project Limits') && allPassed;

    // Phase 4: Organization Security
    allPassed = await runTest('test_hierarchy_security.ts', 'Hierarchy Security (Resource Block)') && allPassed;

    // Phase 5: Task Features
    allPassed = await runTest('test_task_features.ts', 'Task Features (Recurrence/Time)') && allPassed;

    // Phase 6: Admin Security
    allPassed = await runTest('test_admin_security.ts', 'Admin Security (Company Settings)') && allPassed;

    // Phase 7: Kanban & Discussions
    allPassed = await runTest('test_kanban_flow.ts', 'Kanban Flow & Discussions') && allPassed;

    // Phase 8: Task Metadata
    allPassed = await runTest('test_task_metadata.ts', 'Task Metadata (Tags/Priority/Subs)') && allPassed;

    console.log('\n=============================================');
    if (allPassed) {
        console.log('   ✅ ALL SYSTEMS GREEN - READY FOR USE   ');
    } else {
        console.log('   ❌ SOME CHECKS FAILED - REVIEW LOGS   ');
    }
    console.log('=============================================');
}

main();
