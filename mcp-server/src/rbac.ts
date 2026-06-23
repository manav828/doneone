import type { UserRole } from './auth.js';
import { McpPermissionError } from './auth.js';

// ============================================================
// Permission Matrix - mirrors types.ts PERMISSIONS in the app
// ============================================================
const ROLE_LEVEL: Record<UserRole, number> = {
  Admin: 5,
  DeptHead: 4,
  Manager: 3,
  Lead: 2,
  Resource: 1
};

export type Permission =
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'move_task'
  | 'assign_task'
  | 'manage_subtasks'
  | 'manage_reminders'
  | 'manage_timers'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'archive_project'
  | 'manage_columns'
  | 'invite_member'
  | 'remove_member'
  | 'change_member_role'
  | 'manage_team'
  | 'approve_join'
  | 'manage_departments'
  | 'assign_department_head'
  | 'view_all_users'
  | 'update_user_role'
  | 'disable_user'
  | 'grant_premium'
  | 'view_project_reports'
  | 'view_team_reports'
  | 'manage_tags'
  | 'create_tag'
  | 'delete_tag';

// Minimum role level required for each permission
const PERMISSION_REQUIREMENTS: Record<Permission, number> = {
  // Tasks
  create_task: ROLE_LEVEL.Resource,      // Anyone can create tasks
  update_task: ROLE_LEVEL.Resource,      // Anyone can update tasks
  delete_task: ROLE_LEVEL.Manager,
  move_task: ROLE_LEVEL.Resource,        // Anyone can move tasks
  assign_task: ROLE_LEVEL.Resource,      // Anyone can assign tasks
  manage_subtasks: ROLE_LEVEL.Resource,  // Anyone can manage subtasks
  manage_reminders: ROLE_LEVEL.Resource, // Everyone can set reminders
  manage_timers: ROLE_LEVEL.Resource,    // Everyone can track time

  // Projects
  create_project: ROLE_LEVEL.DeptHead,
  update_project: ROLE_LEVEL.Manager,
  delete_project: ROLE_LEVEL.DeptHead,
  archive_project: ROLE_LEVEL.Manager,
  manage_columns: ROLE_LEVEL.Lead,
  invite_member: ROLE_LEVEL.DeptHead,
  remove_member: ROLE_LEVEL.Manager,
  change_member_role: ROLE_LEVEL.Manager,

  // Teams & Org
  manage_team: ROLE_LEVEL.Admin,
  approve_join: ROLE_LEVEL.DeptHead,
  manage_departments: ROLE_LEVEL.DeptHead,
  assign_department_head: ROLE_LEVEL.Admin,

  // Users (admin only)
  view_all_users: ROLE_LEVEL.Admin,
  update_user_role: ROLE_LEVEL.Admin,
  disable_user: ROLE_LEVEL.Admin,
  grant_premium: ROLE_LEVEL.Admin,

  // Reports
  view_project_reports: ROLE_LEVEL.Manager,
  view_team_reports: ROLE_LEVEL.DeptHead,

  // Tags
  manage_tags: ROLE_LEVEL.Lead,
  create_tag: ROLE_LEVEL.Lead,
  delete_tag: ROLE_LEVEL.Manager
};

/**
 * Check if a user role has a given permission.
 * Throws McpPermissionError if not allowed.
 */
export function requirePermission(role: UserRole, permission: Permission): void {
  const userLevel = ROLE_LEVEL[role] ?? 0;
  const required = PERMISSION_REQUIREMENTS[permission] ?? 999;

  if (userLevel < required) {
    const requiredRole = Object.entries(ROLE_LEVEL).find(([, level]) => level === required)?.[0];
    throw new McpPermissionError(
      `Your role (${role}) does not have permission to "${permission}". ` +
      `Required role: ${requiredRole || 'Admin'}`
    );
  }
}

/**
 * Check permission without throwing - returns boolean.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const userLevel = ROLE_LEVEL[role] ?? 0;
  const required = PERMISSION_REQUIREMENTS[permission] ?? 999;
  return userLevel >= required;
}

/**
 * Check if a user is at least at the given role level.
 */
export function isAtLeast(role: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}
