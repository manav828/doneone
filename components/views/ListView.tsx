import React, { useState } from 'react';
import { useStore } from '../../store';
import { Task, Column, User } from '../../types';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Calendar, User as UserIcon, Tag } from 'lucide-react';
import { TaskEditModal } from '../TaskEditModal';

interface ListViewProps {
    tasks: Task[];
    columns: Column[];
    users: User[];
}

const ListGroup: React.FC<{ column: Column; tasks: Task[]; users: User[] }> = ({ column, tasks, users }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { addTask, activeProjectId, tags } = useStore();

    const handleAddTask = async () => {
        if (!activeProjectId) return;
        const title = prompt("Enter task title:");
        if (title) {
            await addTask(activeProjectId, column.id, title);
        }
    };

    return (
        <div className="mb-6">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-2 group">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500">
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: column.color || '#cbd5e1' }}></div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.title}</h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">
                            {tasks.length}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleAddTask}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-primary"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Tasks Table */}
            {!isCollapsed && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase font-medium border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="py-3 pl-4 pr-2 w-8">
                                    <input type="checkbox" className="rounded border-slate-300" />
                                </th>
                                <th className="py-3 px-2 w-1/4">Task Name</th>
                                <th className="py-3 px-2 w-1/4">Description</th>
                                <th className="py-3 px-2">Estimation</th>
                                <th className="py-3 px-2">Type</th>
                                <th className="py-3 px-2">People</th>
                                <th className="py-3 px-2">Priority</th>
                                <th className="py-3 pr-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {tasks.map(task => (
                                <ListRow key={task.id} task={task} users={users} tags={tags} />
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400 text-sm italic">
                                        No tasks in this stage
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ListRow: React.FC<{ task: Task; users: User[]; tags: any[] }> = ({ task, users, tags }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const assignee = users.find(u => u.id === task.assigneeId);

    // Filter tags by type
    const priorityTag = tags.find(t => task.tagIds.includes(t.id) && t.type === 'Priority');
    const typeTags = tags.filter(t => task.tagIds.includes(t.id) && t.type !== 'Priority');

    const formatDate = (ts?: number) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <tr
                className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-sm"
                onClick={() => setIsModalOpen(true)}
            >
                <td className="py-3 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300" />
                </td>
                <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-400">
                            <Tag size={12} />
                        </div>
                        <span className="capitalize">{task.title}</span>
                    </div>
                </td>
                <td className="py-3 px-2 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {task.description || '-'}
                </td>
                <td className="py-3 px-2 text-slate-500 dark:text-slate-400">
                    {task.reminderAt ? (
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{formatDate(task.reminderAt)}</span>
                        </div>
                    ) : '-'}
                </td>
                <td className="py-3 px-2">
                    <div className="flex gap-1 flex-wrap">
                        {typeTags.length > 0 ? typeTags.map(t => (
                            <span
                                key={t.id}
                                className="px-2 py-0.5 rounded text-[10px] font-medium border"
                                style={{
                                    borderColor: t.color,
                                    color: t.color,
                                    backgroundColor: `${t.color}10`
                                }}
                            >
                                {t.name}
                            </span>
                        )) : '-'}
                    </div>
                </td>
                <td className="py-3 px-2">
                    {assignee ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {assignee.name.charAt(0)}
                            </div>
                            <span className="text-slate-600 dark:text-slate-300">{assignee.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400">-</span>
                    )}
                </td>
                <td className="py-3 px-2">
                    {priorityTag ? (
                        <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: priorityTag.color }}
                        >
                            {priorityTag.name}
                        </span>
                    ) : '-'}
                </td>
                <td className="py-3 pr-4 text-right">
                    <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400">
                        <MoreHorizontal size={16} />
                    </button>
                </td>
            </tr>
            <TaskEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={task} />
        </>
    );
};

export const ListView: React.FC<ListViewProps> = ({ tasks, columns, users }) => {
    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 p-8">
            {columns.map(column => (
                <ListGroup
                    key={column.id}
                    column={column}
                    tasks={tasks.filter(t => t.columnId === column.id)}
                    users={users}
                />
            ))}
        </div>
    );
};
