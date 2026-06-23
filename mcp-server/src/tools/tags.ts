import { supabase } from '../supabaseClient.js';
import { requirePermission } from '../rbac.js';
import type { AuthenticatedUser } from '../auth.js';
import { McpPermissionError } from '../auth.js';

// ============================================================
// TAG TOOLS
// ============================================================

/**
 * list_tags - List all tags for a project
 * Accessible by: All project members
 */
export async function listTags(user: AuthenticatedUser, params: { projectId: string }) {
  await assertProjectAccess(user.userId, params.projectId);

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, color, type')
    .eq('project_id', params.projectId);

  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
  return data ?? [];
}

/**
 * create_tag - Create a new tag
 * Requires: Lead+
 */
export async function createTag(user: AuthenticatedUser, params: {
  projectId: string;
  name: string;
  color: string;
  type: 'Priority' | 'Type' | 'Custom';
}) {
  requirePermission(user.role, 'create_tag');
  await assertProjectAccess(user.userId, params.projectId);

  if (!params.color.startsWith('#')) {
    throw new Error('Color must be a hex color code starting with # (e.g. #FF5733)');
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({
      project_id: params.projectId,
      name: params.name,
      color: params.color,
      type: params.type
    })
    .select().single();

  if (error) throw new Error(`Failed to create tag: ${error.message}`);
  return data;
}

/**
 * delete_tag - Delete a tag
 * Requires: Manager+
 */
export async function deleteTag(user: AuthenticatedUser, params: { tagId: string }) {
  requirePermission(user.role, 'delete_tag');

  const { data: tag } = await supabase
    .from('tags').select('project_id').eq('id', params.tagId).maybeSingle();

  if (!tag) throw new Error('Tag not found');
  await assertProjectAccess(user.userId, tag.project_id);

  const { error } = await supabase.from('tags').delete().eq('id', params.tagId);
  if (error) throw new Error(`Failed to delete tag: ${error.message}`);
  return { success: true, message: 'Tag deleted successfully' };
}

/**
 * add_tag_to_task - Apply a tag to a task
 * Requires: Lead+
 */
export async function addTagToTask(user: AuthenticatedUser, params: {
  taskId: string;
  tagId: string;
}) {
  requirePermission(user.role, 'manage_tags');

  const { data: task } = await supabase
    .from('tasks').select('project_id, tag_ids').eq('id', params.taskId).maybeSingle();

  if (!task) throw new Error('Task not found');
  await assertProjectAccess(user.userId, task.project_id);

  const currentTags: string[] = task.tag_ids ?? [];
  if (currentTags.includes(params.tagId)) {
    return { success: false, message: 'Tag is already applied to this task' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ tag_ids: [...currentTags, params.tagId], updated_at: new Date().toISOString() })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to add tag: ${error.message}`);
  return { success: true, message: 'Tag added to task', task: data };
}

/**
 * remove_tag_from_task - Remove a tag from a task
 * Requires: Lead+
 */
export async function removeTagFromTask(user: AuthenticatedUser, params: {
  taskId: string;
  tagId: string;
}) {
  requirePermission(user.role, 'manage_tags');

  const { data: task } = await supabase
    .from('tasks').select('project_id, tag_ids').eq('id', params.taskId).maybeSingle();

  if (!task) throw new Error('Task not found');
  await assertProjectAccess(user.userId, task.project_id);

  const currentTags: string[] = task.tag_ids ?? [];
  const { data, error } = await supabase
    .from('tasks')
    .update({
      tag_ids: currentTags.filter(id => id !== params.tagId),
      updated_at: new Date().toISOString()
    })
    .eq('id', params.taskId).select().single();

  if (error) throw new Error(`Failed to remove tag: ${error.message}`);
  return { success: true, message: 'Tag removed from task', task: data };
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
