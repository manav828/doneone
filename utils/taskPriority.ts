// Auto-move helper functions for priority-based task management

import { Task, Tag } from '../types';

/**
 * Get the priority level of a task based on its priority tags
 * @param task - The task to evaluate
 * @param tags - All available tags
 * @returns Number representing priority (1=High, 2=Medium, 3=Low, 999=None)
 */
export function getPriorityLevel(task: Task, tags: Tag[]): number {
    const priorityTags = tags.filter(t => t.type === 'Priority' && task.tagIds.includes(t.id));
    if (priorityTags.length === 0) return 999; // No priority = lowest

    const priorityTag = priorityTags[0];
    const name = priorityTag.name.toLowerCase();

    // Map priority names to numerical values (lower = higher priority)
    if (name.includes('high') || name.includes('critical') || name.includes('urgent') || name.includes('hot')) {
        return 1;
    }
    if (name.includes('medium') || name.includes('warm')) {
        return 2;
    }
    if (name.includes('low') || name.includes('cold')) {
        return 3;
    }
    return 999;
}

/**
 * Sort tasks by priority (higher priority first)
 * @param tasks - Array of tasks to sort
 * @param tags - All available tags
 * @returns Sorted array of tasks
 */
export function sortTasksByPriority(tasks: Task[], tags: Tag[]): Task[] {
    return [...tasks].sort((a, b) => {
        const priorityA = getPriorityLevel(a, tags);
        const priorityB = getPriorityLevel(b, tags);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If same priority, sort by creation time (oldest first)
        return a.createdAt - b.createdAt;
    });
}
