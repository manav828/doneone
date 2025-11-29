import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Task, Column, User } from '../../types';
import { Calendar, User as UserIcon, Tag as TagIcon, Clock, Plus, MoreHorizontal, Trash, X, Timer, Play, Pause } from 'lucide-react';
import { Modal } from '../Modal';

interface ListViewProps {
    tasks: Task[];
    columns: Column[];
    users: User[];
}

import { TaskEditModal } from '../TaskEditModal';

const TaskRow: React.FC<{ task: Task; users: User[]; columns: Column[] }> = ({ task, users, columns }) => {
    const { tags } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assignee = users.find(u => u.id === task.assigneeId);
    const taskTags = tags.filter(t => task.tagIds.includes(t.id));

    return (
        <>
            <tr
                onClick={() => setIsModalOpen(true)}
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
                <td className="py-2 pl-3 pr-2">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{task.title}</div>
                </td>
                <td className="py-2 px-2">
                    {assignee ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-[10px] font-bold" title={assignee.name}>
                            {assignee.name.charAt(0)}
                        </div>
                    ) : (
                        <UserIcon size={14} className="text-slate-300" />
                    )}
                </td>
                <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                        {taskTags.map(tag => (
                            <span key={tag.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </td>
                <td className="py-2 pr-6 text-right">
                    {task.reminderAt && (
                        <div className={`text-[10px] ${task.reminderAt < Date.now() ? 'text-red-500' : 'text-slate-400'}`}>
                            {new Date(task.reminderAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </td>
            </tr>

            <TaskEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={task} />
        </>
    );
};

export const ListView: React.FC<ListViewProps> = ({ tasks, columns, users }) => {
    const { addTask, activeProjectId } = useStore();

    const handleAddTask = async (columnId: string) => {
        if (!activeProjectId) return;
        const title = prompt("Enter task title:");
        if (title) {
            await addTask(activeProjectId, columnId, title);
        }
    };

    const [layout, setLayout] = useState<'1x1' | '2x1'>('2x1');

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 p-6">
            {/* View Controls */}
            <div className="flex justify-end mb-4">
                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-1">
                    <button
                        onClick={() => setLayout('1x1')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === '1x1' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Single Column
                    </button>
                    <button
                        onClick={() => setLayout('2x1')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === '2x1' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Grid View
                    </button>
                </div>
            </div>

            <div className={`grid gap-6 pb-20 ${layout === '2x1' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {columns.map(column => {
                    const columnTasks = tasks.filter(t => t.columnId === column.id);
                    return (
                        <div key={column.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col h-[400px]">
                            {/* Header */}
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{column.title}</h3>
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                                        <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            <th className="py-2 pl-3 w-1/3">Task</th> {/* Reduced width */}
                                            <th className="py-2 px-2 w-16">User</th>
                                            <th className="py-2 px-2 w-auto">Tags</th> {/* Increased width (auto) */}
                                            <th className="py-2 pr-6 text-right w-24">Due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                        {columnTasks.map(task => (
                                            <TaskRow key={task.id} task={task} users={users} columns={columns} />
                                        ))}
                                    </tbody>
                                </table>
                                {columnTasks.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-xs italic">
                                        No tasks
                                    </div>
                                )}
                            </div>

                            {/* Footer Action */}
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => handleAddTask(column.id)}
                                    className="w-full py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/30"
                                >
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
