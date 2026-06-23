import { supabase } from '../supabaseClient.js';
import { requirePermission, hasPermission } from '../rbac.js';
import type { AuthenticatedUser } from '../auth.js';
import { McpPermissionError } from '../auth.js';

// ============================================================
// TASK TOOLS
// All functions enforce RBAC before any DB operation
// ============================================================

/**
 * list_tasks - Get tasks in a project with optional filters
 * Accessible by: All project members
 */
export async function listTasks(user: AuthenticatedUser, params: {
  projectId: string;
  status?: string;
  assigneeId?: string;
  priority?: 'high' | 'medium' | 'low';
  limit?: number;
  offset?: number;
}) {
  // Verify user is a member of this project
  await assertProjectMember(user.userId, params.projectId);

  let query = supabase
    .from('tasks')
    .select(`
      id, title, description, column_id, project_id,
      assignee_id, creator_id, priority, tag_ids,
      created_at, updated_at, due_date,
      time_tracked, estimated_time, timer_started_at,
      reminder_at, order_index, subtasks
    `)
    .eq('project_id', params.projectId)
    .order('order_index', { ascending: true })
    .limit(params.limit ?? 50)
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

  if (params.assigneeId) query = query.eq('assignee_id', params.assigneeId);
  if (params.priority) query = query.eq('priority', params.priority);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data;
}

/**
 * get_task - Get a single task with full details
 */
export async function getTask(user: AuthenticatedUser, params: { taskId: string }) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, columns(title), projects(name)')
    .eq('id', params.taskId)
    .maybeSingle();

  if (error || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);
  return task;
}

/**
 * create_task - Create a new task
 * Requires: Lead+
 */
export async function createTask(user: AuthenticatedUser, params: {
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedTime?: number;
  reminderAt?: string;
}) {
  requirePermission(user.role, 'create_task');
  await assertProjectMember(user.userId, params.projectId);

  // Get count of tasks in this column to determine order_index
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('column_id', params.columnId);

  const orderIndex = count ?? 0;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: params.projectId,
      column_id: params.columnId,
      title: params.title,
      description: params.description ?? null,
      assignee_id: params.assigneeId ?? null,
      creator_id: user.userId,
      priority: params.priority ?? null,
      estimated_time: params.estimatedTime ?? null,
      reminder_at: params.reminderAt ?? null,
      tag_ids: [],
      order_index: orderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
}

/**
 * update_task - Update task fields
 * Requires: Lead+ OR task is assigned to the calling user
 */
export async function updateTask(user: AuthenticatedUser, params: {
  taskId: string;
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  assigneeId?: string;
  estimatedTime?: number;
}) {
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('project_id, assignee_id, creator_id')
    .eq('id', params.taskId)
    .maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  // Resources can only update tasks assigned to them
  if (!hasPermission(user.role, 'create_task')) {
    if (task.assignee_id !== user.userId && task.creator_id !== user.userId) {
      throw new McpPermissionError('You can only update tasks assigned to or created by you');
    }
  }

  // Only Lead+ can change assignee
  if (params.assigneeId !== undefined) {
    requirePermission(user.role, 'assign_task');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined) updates.description = params.description;
  if (params.priority !== undefined) updates.priority = params.priority;
  if (params.assigneeId !== undefined) updates.assignee_id = params.assigneeId;
  if (params.estimatedTime !== undefined) updates.estimated_time = params.estimatedTime;

  const { data, error } = await supabase
    .from('tasks').update(updates).eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return data;
}

/**
 * move_task - Move a task to a different column
 * Requires: Lead+ OR task is assigned to the user
 */
export async function moveTask(user: AuthenticatedUser, params: {
  taskId: string;
  columnId: string;
}) {
  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id, assignee_id').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  if (!hasPermission(user.role, 'create_task') && task.assignee_id !== user.userId) {
    throw new McpPermissionError('You can only move tasks assigned to you');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ column_id: params.columnId, updated_at: new Date().toISOString() })
    .eq('id', params.taskId)
    .select().single();

  if (error) throw new Error(`Failed to move task: ${error.message}`);
  return data;
}

/**
 * delete_task - Permanently delete a task
 * Requires: Manager+
 */
export async function deleteTask(user: AuthenticatedUser, params: { taskId: string }) {
  requirePermission(user.role, 'delete_task');

  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  const { error } = await supabase.from('tasks').delete().eq('id', params.taskId);
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
  return { success: true, message: 'Task deleted successfully' };
}

/**
 * start_timer - Start time tracking on a task
 * Accessible by: All members
 */
export async function startTimer(user: AuthenticatedUser, params: { taskId: string }) {
  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id, timer_started_at').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  if (task.timer_started_at) {
    return { success: false, message: 'Timer is already running on this task' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ timer_started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to start timer: ${error.message}`);
  return { success: true, message: 'Timer started', task: data };
}

/**
 * stop_timer - Stop time tracking on a task
 * Accessible by: All members
 */
export async function stopTimer(user: AuthenticatedUser, params: { taskId: string }) {
  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id, timer_started_at, time_tracked').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  if (!task.timer_started_at) {
    return { success: false, message: 'Timer is not running on this task' };
  }

  const elapsed = Math.floor((Date.now() - new Date(task.timer_started_at).getTime()) / 1000);
  const newTotal = (task.time_tracked ?? 0) + elapsed;

  const { data, error } = await supabase
    .from('tasks')
    .update({
      timer_started_at: null,
      time_tracked: newTotal,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to stop timer: ${error.message}`);
  return {
    success: true,
    message: `Timer stopped. Added ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`,
    totalTimeTracked: newTotal,
    task: data
  };
}

/**
 * log_time - Manually log time on a task (in seconds)
 */
export async function logTime(user: AuthenticatedUser, params: {
  taskId: string;
  seconds: number;
}) {
  if (params.seconds <= 0) throw new Error('Time must be greater than 0 seconds');

  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id, time_tracked').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      time_tracked: (task.time_tracked ?? 0) + params.seconds,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to log time: ${error.message}`);
  return { success: true, message: `Logged ${Math.floor(params.seconds / 60)}m ${params.seconds % 60}s`, task: data };
}

/**
 * set_task_reminder - Set a reminder on a task
 */
export async function setTaskReminder(user: AuthenticatedUser, params: {
  taskId: string;
  reminderAt: string; // ISO date string
}) {
  const reminderDate = new Date(params.reminderAt);
  if (isNaN(reminderDate.getTime())) throw new Error('Invalid date format for reminderAt');
  if (reminderDate < new Date()) throw new Error('Reminder must be in the future');

  const { data: task, error: fetchError } = await supabase
    .from('tasks').select('project_id').eq('id', params.taskId).maybeSingle();

  if (fetchError || !task) throw new Error('Task not found');
  await assertProjectMember(user.userId, task.project_id);

  const { data, error } = await supabase
    .from('tasks')
    .update({ reminder_at: reminderDate.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to set reminder: ${error.message}`);
  return { success: true, message: `Reminder set for ${reminderDate.toLocaleString()}`, task: data };
}

// ============================================================
// HELPER: Assert user is a member of a project
// ============================================================
async function assertProjectMember(userId: string, projectId: string): Promise<void> {
  // Check project_members table
  const { data: membership } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (membership) return; // is a member

  // Also allow project owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();

  if (project?.owner_id === userId) return;

  throw new McpPermissionError('You are not a member of this project');
}
