import { supabase } from '../supabaseClient.js';
import { requirePermission, hasPermission } from '../rbac.js';
import type { AuthenticatedUser } from '../auth.js';
import { McpPermissionError } from '../auth.js';

// ============================================================
// PROJECT & COLUMN TOOLS
// ============================================================

/**
 * list_projects - List all accessible projects for the user
 * Accessible by: All authenticated users
 */
export async function listProjects(user: AuthenticatedUser, params: {
  limit?: number;
}) {
  // Get projects where user is owner or member
  const { data: memberProjects } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.userId)
    .eq('status', 'active');

  const memberProjectIds = (memberProjects ?? []).map(m => m.project_id);

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, owner_id, team_id, logo, created_at')
    .or(`owner_id.eq.${user.userId},id.in.(${memberProjectIds.join(',') || 'null'})`)
    .limit(params.limit ?? 20);

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data ?? [];
}

/**
 * get_project - Get project details with columns and members
 * Accessible by: Project members
 */
export async function getProject(user: AuthenticatedUser, params: { projectId: string }) {
  await assertProjectAccess(user.userId, params.projectId);

  const [projectRes, columnsRes, membersRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.projectId).maybeSingle(),
    supabase.from('columns').select('*').eq('project_id', params.projectId).order('order_index'),
    supabase
      .from('project_members')
      .select('user_id, role, status, profiles(name, email, role)')
      .eq('project_id', params.projectId)
  ]);

  if (!projectRes.data) throw new Error('Project not found');

  return {
    project: projectRes.data,
    columns: columnsRes.data ?? [],
    members: membersRes.data ?? []
  };
}

/**
 * create_project - Create a new project
 * Requires: DeptHead+
 */
export async function createProject(user: AuthenticatedUser, params: {
  name: string;
  description?: string;
  teamId?: string;
}) {
  requirePermission(user.role, 'create_project');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: params.name,
      description: params.description ?? null,
      owner_id: user.userId,
      team_id: params.teamId ?? null,
      lead_ids: [],
      resource_ids: [],
      pending_join_requests: [],
      reports_to: {},
      auto_move_enabled: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data;
}

/**
 * update_project - Update project name or description
 * Requires: Manager+
 */
export async function updateProject(user: AuthenticatedUser, params: {
  projectId: string;
  name?: string;
  description?: string;
}) {
  requirePermission(user.role, 'update_project');
  await assertProjectAccess(user.userId, params.projectId);

  const updates: Record<string, unknown> = {};
  if (params.name) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;

  const { data, error } = await supabase
    .from('projects').update(updates).eq('id', params.projectId).select().single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data;
}

/**
 * archive_project - Soft-delete a project
 * Requires: Manager+
 */
export async function archiveProject(user: AuthenticatedUser, params: { projectId: string }) {
  requirePermission(user.role, 'archive_project');
  await assertProjectOwnerOrManager(user.userId, params.projectId);

  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', params.projectId);

  if (error) throw new Error(`Failed to archive project: ${error.message}`);
  return { success: true, message: 'Project archived successfully' };
}

// ============================================================
// COLUMN TOOLS
// ============================================================

/**
 * list_columns - List columns (statuses) for a project
 */
export async function listColumns(user: AuthenticatedUser, params: { projectId: string }) {
  await assertProjectAccess(user.userId, params.projectId);

  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('project_id', params.projectId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(`Failed to fetch columns: ${error.message}`);
  return data ?? [];
}

/**
 * create_column - Add a new status column
 * Requires: Lead+
 */
export async function createColumn(user: AuthenticatedUser, params: {
  projectId: string;
  title: string;
  color?: string;
}) {
  requirePermission(user.role, 'manage_columns');
  await assertProjectAccess(user.userId, params.projectId);

  const { data: existing } = await supabase
    .from('columns').select('order_index').eq('project_id', params.projectId).order('order_index', { ascending: false }).limit(1);
  const maxOrder = existing?.[0]?.order_index ?? 0;

  const { data, error } = await supabase
    .from('columns')
    .insert({
      project_id: params.projectId,
      title: params.title,
      color: params.color ?? null,
      order_index: maxOrder + 1
    })
    .select().single();

  if (error) throw new Error(`Failed to create column: ${error.message}`);
  return data;
}

/**
 * rename_column - Rename an existing column
 * Requires: Lead+
 */
export async function renameColumn(user: AuthenticatedUser, params: {
  columnId: string;
  title: string;
}) {
  requirePermission(user.role, 'manage_columns');

  const { data: col } = await supabase.from('columns').select('project_id').eq('id', params.columnId).maybeSingle();
  if (!col) throw new Error('Column not found');
  await assertProjectAccess(user.userId, col.project_id);

  const { data, error } = await supabase
    .from('columns').update({ title: params.title }).eq('id', params.columnId).select().single();

  if (error) throw new Error(`Failed to rename column: ${error.message}`);
  return data;
}

// ============================================================
// MEMBER TOOLS
// ============================================================

/**
 * get_project_members - List all members with roles
 */
export async function getProjectMembers(user: AuthenticatedUser, params: { projectId: string }) {
  await assertProjectAccess(user.userId, params.projectId);

  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, status, joined_at, profiles(name, email, role, avatar_url)')
    .eq('project_id', params.projectId);

  if (error) throw new Error(`Failed to fetch members: ${error.message}`);
  return data ?? [];
}

/**
 * change_member_role - Change a member's role in a project
 * Requires: Manager+
 */
export async function changeMemberRole(user: AuthenticatedUser, params: {
  projectId: string;
  targetUserId: string;
  newRole: 'Lead' | 'Resource';
}) {
  requirePermission(user.role, 'change_member_role');
  await assertProjectOwnerOrManager(user.userId, params.projectId);

  const { error } = await supabase
    .from('project_members')
    .update({ role: params.newRole })
    .eq('project_id', params.projectId)
    .eq('user_id', params.targetUserId);

  if (error) throw new Error(`Failed to change role: ${error.message}`);
  return { success: true, message: `Member role changed to ${params.newRole}` };
}

/**
 * remove_member - Remove a member from a project
 * Requires: Manager+
 */
export async function removeMember(user: AuthenticatedUser, params: {
  projectId: string;
  targetUserId: string;
}) {
  requirePermission(user.role, 'remove_member');
  await assertProjectOwnerOrManager(user.userId, params.projectId);

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', params.projectId)
    .eq('user_id', params.targetUserId);

  if (error) throw new Error(`Failed to remove member: ${error.message}`);
  return { success: true, message: 'Member removed from project' };
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

async function assertProjectOwnerOrManager(userId: string, projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from('projects').select('owner_id, manager_ids').eq('id', projectId).maybeSingle();

  if (!project) throw new Error('Project not found');
  if (project.owner_id === userId) return;
  if (project.manager_ids && (project.manager_ids as string[]).includes(userId)) return;

  throw new McpPermissionError('Only the project owner or manager can perform this action');
}
