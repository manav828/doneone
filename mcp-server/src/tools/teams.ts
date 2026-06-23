import { supabase } from '../supabaseClient.js';
import { requirePermission, isAtLeast } from '../rbac.js';
import type { AuthenticatedUser } from '../auth.js';
import { McpPermissionError } from '../auth.js';

// ============================================================
// TEAM & ORGANIZATION TOOLS
// ============================================================

/**
 * get_my_team - Get current user's team info
 * Accessible by: All
 */
export async function getMyTeam(user: AuthenticatedUser) {
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, role_id, status, joined_at, teams(id, name, join_code, created_at, owner_id)')
    .eq('user_id', user.userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    // Check if user owns a team
    const { data: ownedTeam } = await supabase
      .from('teams')
      .select('id, name, join_code, created_at, owner_id')
      .eq('owner_id', user.userId)
      .maybeSingle();

    if (!ownedTeam) return { message: 'You are not part of any team' };
    return { team: ownedTeam, role: 'Owner' };
  }

  return membership;
}

/**
 * list_team_members - List all members of the user's team
 * Requires: Manager+
 */
export async function listTeamMembers(user: AuthenticatedUser, params: {
  teamId: string;
  status?: 'active' | 'pending' | 'rejected';
}) {
  requirePermission(user.role, 'manage_team');
  await assertTeamAccess(user.userId, params.teamId);

  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, status, joined_at, role_id, profiles(id, name, email, role, avatar_url), team_roles(name, color)')
    .eq('team_id', params.teamId)
    .eq('status', params.status ?? 'active');

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data ?? [];
}

/**
 * approve_join_request - Approve a pending member
 * Requires: DeptHead+
 */
export async function approveJoinRequest(user: AuthenticatedUser, params: {
  teamId: string;
  targetUserId: string;
}) {
  requirePermission(user.role, 'approve_join');
  await assertTeamAccess(user.userId, params.teamId);

  const { error } = await supabase
    .from('team_members')
    .update({ status: 'active' })
    .eq('team_id', params.teamId)
    .eq('user_id', params.targetUserId)
    .eq('status', 'pending');

  if (error) throw new Error(`Failed to approve member: ${error.message}`);
  return { success: true, message: 'Member approved and added to team' };
}

/**
 * reject_join_request - Reject a pending member
 * Requires: DeptHead+
 */
export async function rejectJoinRequest(user: AuthenticatedUser, params: {
  teamId: string;
  targetUserId: string;
}) {
  requirePermission(user.role, 'approve_join');
  await assertTeamAccess(user.userId, params.teamId);

  const { error } = await supabase
    .from('team_members')
    .update({ status: 'rejected' })
    .eq('team_id', params.teamId)
    .eq('user_id', params.targetUserId);

  if (error) throw new Error(`Failed to reject member: ${error.message}`);
  return { success: true, message: 'Join request rejected' };
}

/**
 * remove_team_member - Remove a member from the team
 * Requires: Admin
 */
export async function removeTeamMember(user: AuthenticatedUser, params: {
  teamId: string;
  targetUserId: string;
}) {
  requirePermission(user.role, 'manage_team');
  await assertTeamOwner(user.userId, params.teamId);

  if (params.targetUserId === user.userId) {
    throw new McpPermissionError('You cannot remove yourself from the team');
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', params.teamId)
    .eq('user_id', params.targetUserId);

  if (error) throw new Error(`Failed to remove team member: ${error.message}`);
  return { success: true, message: 'Member removed from team' };
}

/**
 * list_departments - List all departments in the user's team
 * Requires: Manager+
 */
export async function listDepartments(user: AuthenticatedUser, params: { teamId: string }) {
  requirePermission(user.role, 'manage_departments');
  await assertTeamAccess(user.userId, params.teamId);

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, color, created_at, manager_ids')
    .eq('team_id', params.teamId);

  if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
  return data ?? [];
}

/**
 * create_department - Create a new department
 * Requires: DeptHead+
 */
export async function createDepartment(user: AuthenticatedUser, params: {
  teamId: string;
  name: string;
  color?: string;
}) {
  requirePermission(user.role, 'manage_departments');
  await assertTeamAccess(user.userId, params.teamId);

  const { data, error } = await supabase
    .from('departments')
    .insert({
      team_id: params.teamId,
      name: params.name,
      color: params.color ?? null,
      manager_ids: [],
      created_at: new Date().toISOString()
    })
    .select().single();

  if (error) throw new Error(`Failed to create department: ${error.message}`);
  return data;
}

/**
 * get_team_activity - Get recent activity for the team
 * Requires: Manager+
 */
export async function getTeamActivity(user: AuthenticatedUser, params: {
  teamId: string;
  limit?: number;
}) {
  requirePermission(user.role, 'view_project_reports');
  await assertTeamAccess(user.userId, params.teamId);

  // Get all project IDs for this team
  const { data: projects } = await supabase
    .from('projects').select('id').eq('team_id', params.teamId);

  const projectIds = (projects ?? []).map(p => p.id);
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from('activities')
    .select('id, project_id, user_id, description, timestamp, profiles(name)')
    .in('project_id', projectIds)
    .order('timestamp', { ascending: false })
    .limit(params.limit ?? 20);

  if (error) throw new Error(`Failed to fetch activity: ${error.message}`);
  return data ?? [];
}

// ============================================================
// HELPERS
// ============================================================
async function assertTeamAccess(userId: string, teamId: string): Promise<void> {
  const { data: owner } = await supabase
    .from('teams').select('owner_id').eq('id', teamId).maybeSingle();

  if (!owner) throw new Error('Team not found');
  if (owner.owner_id === userId) return;

  const { data: membership } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) throw new McpPermissionError('You are not a member of this team');
}

async function assertTeamOwner(userId: string, teamId: string): Promise<void> {
  const { data: team } = await supabase
    .from('teams').select('owner_id').eq('id', teamId).maybeSingle();

  if (!team || team.owner_id !== userId) {
    throw new McpPermissionError('Only the team owner can perform this action');
  }
}
