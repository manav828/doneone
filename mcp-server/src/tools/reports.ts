import { supabase } from '../supabaseClient.js';
import { requirePermission } from '../rbac.js';
import type { AuthenticatedUser } from '../auth.js';
import { McpPermissionError } from '../auth.js';

// ============================================================
// REPORTS & ANALYTICS TOOLS
// ============================================================

/**
 * get_project_report - Task stats for a project
 * Requires: Manager+
 */
export async function getProjectReport(user: AuthenticatedUser, params: {
  projectId: string;
  dateStart?: string;
  dateEnd?: string;
}) {
  requirePermission(user.role, 'view_project_reports');
  await assertProjectAccess(user.userId, params.projectId);

  const [columnsRes, tasksRes] = await Promise.all([
    supabase.from('columns').select('id, title').eq('project_id', params.projectId),
    supabase.from('tasks').select('id, column_id, assignee_id, time_tracked, created_at, completed_at, priority, estimated_time').eq('project_id', params.projectId)
  ]);

  const columns = columnsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  // Build column breakdown
  const columnBreakdown = columns.map(col => ({
    columnId: col.id,
    columnTitle: col.title,
    taskCount: tasks.filter(t => t.column_id === col.id).length
  }));

  // Identify done column (case-insensitive check)
  const doneColumns = columns.filter(c =>
    ['done', 'complete', 'completed', 'finished'].includes(c.title.toLowerCase())
  );
  const completedTasks = tasks.filter(t => doneColumns.some(c => c.id === t.column_id));

  const totalTimeTracked = tasks.reduce((sum, t) => sum + (t.time_tracked ?? 0), 0);
  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);

  return {
    projectId: params.projectId,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    completionRate: tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0,
    totalTimeTrackedSeconds: totalTimeTracked,
    totalEstimatedSeconds: totalEstimated,
    efficiencyRate: totalEstimated > 0
      ? Math.round((totalEstimated / Math.max(totalTimeTracked, 1)) * 100)
      : null,
    columnBreakdown,
    priorityBreakdown: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
      none: tasks.filter(t => !t.priority).length
    }
  };
}

/**
 * get_member_report - Productivity stats for a specific member
 * Requires: Manager+ OR requesting your own data
 */
export async function getMemberReport(user: AuthenticatedUser, params: {
  userId: string;
  projectId?: string;
  dateStart?: string;
  dateEnd?: string;
}) {
  // Users can always request their own report
  if (params.userId !== user.userId) {
    requirePermission(user.role, 'view_project_reports');
  }

  let query = supabase
    .from('tasks')
    .select('id, column_id, project_id, time_tracked, created_at, completed_at, priority, columns(title)')
    .eq('assignee_id', params.userId);

  if (params.projectId) query = query.eq('project_id', params.projectId);
  if (params.dateStart) query = query.gte('created_at', params.dateStart);
  if (params.dateEnd) query = query.lte('created_at', params.dateEnd);

  const { data: tasks, error } = await query;
  if (error) throw new Error(`Failed to fetch member report: ${error.message}`);

  const allTasks = tasks ?? [];
  const totalTime = allTasks.reduce((sum, t) => sum + (t.time_tracked ?? 0), 0);

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role')
    .eq('id', params.userId)
    .maybeSingle();

  return {
    user: profile,
    totalTasksAssigned: allTasks.length,
    totalTimeTrackedSeconds: totalTime,
    totalTimeTrackedFormatted: formatSeconds(totalTime),
    tasksByPriority: {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    }
  };
}

/**
 * get_time_report - Time tracking summary for a date range
 * Requires: Manager+ OR own data
 */
export async function getTimeReport(user: AuthenticatedUser, params: {
  projectId?: string;
  userId?: string;
  dateStart: string;
  dateEnd: string;
}) {
  const targetUserId = params.userId ?? user.userId;

  if (targetUserId !== user.userId) {
    requirePermission(user.role, 'view_project_reports');
  }

  let query = supabase
    .from('tasks')
    .select('id, title, project_id, time_tracked, timer_started_at, projects(name)')
    .eq('assignee_id', targetUserId)
    .gt('time_tracked', 0);

  if (params.projectId) query = query.eq('project_id', params.projectId);

  const { data: tasks, error } = await query;
  if (error) throw new Error(`Failed to fetch time report: ${error.message}`);

  const allTasks = tasks ?? [];
  const totalSeconds = allTasks.reduce((sum, t) => sum + (t.time_tracked ?? 0), 0);

  return {
    dateRange: { start: params.dateStart, end: params.dateEnd },
    totalTimeSeconds: totalSeconds,
    totalTimeFormatted: formatSeconds(totalSeconds),
    taskBreakdown: allTasks.map(t => ({
      taskId: t.id,
      taskTitle: t.title,
      projectName: (t.projects as any)?.name ?? 'Unknown',
      timeSeconds: t.time_tracked,
      timeFormatted: formatSeconds(t.time_tracked ?? 0)
    }))
  };
}

/**
 * list_task_history - View archived/completed task history
 * Accessible by: All members
 */
export async function listTaskHistory(user: AuthenticatedUser, params: {
  projectId?: string;
  limit?: number;
}) {
  let query = supabase
    .from('task_history')
    .select('id, task_id, project_id, status_at_archive, time_taken, archived_at, archived_by, task_data')
    .order('archived_at', { ascending: false })
    .limit(params.limit ?? 20);

  if (params.projectId) {
    await assertProjectAccess(user.userId, params.projectId);
    query = query.eq('project_id', params.projectId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch task history: ${error.message}`);
  return data ?? [];
}

// ============================================================
// HELPERS
// ============================================================
async function assertProjectAccess(userId: string, projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from('projects').select('owner_id').eq('id', projectId).maybeSingle();

  if (!project) throw new Error('Project not found');
  if (project.owner_id === userId) return;

  const { data: membership } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) throw new McpPermissionError('You do not have access to this project');
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
