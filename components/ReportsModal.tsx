import React from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { BarChart, Clock, CheckCircle, Users } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { projects, activeProjectId, tasks, users } = useStore();
    const activeProject = projects.find(p => p.id === activeProjectId);

    if (!activeProject) return null;

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => {
        // Assuming the last column is "Done" or similar. 
        // Since we don't have a strict "status" field, we'll check if it's in the last column 
        // OR we can just show tasks by column distribution.
        return false; // Placeholder
    }).length;

    // Calculate Stats
    const totalTimeTracked = projectTasks.reduce((acc, t) => acc + (t.timeTracked || 0), 0);
    const totalEstimatedTime = projectTasks.reduce((acc, t) => acc + (t.estimatedTime || 0), 0);

    const projectMembers = users.filter(u =>
        u.id === activeProject.ownerId ||
        activeProject.leadIds.includes(u.id) ||
        activeProject.resourceIds.includes(u.id)
    );

    const tasksByUser = projectMembers.map(u => {
        const userTasks = projectTasks.filter(t => t.assigneeId === u.id);
        const time = userTasks.reduce((acc, t) => acc + (t.timeTracked || 0), 0);
        return {
            user: u,
            count: userTasks.length,
            time
        };
    }).sort((a, b) => b.count - a.count);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Project Reports">
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Total Time</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">
                            {formatTime(totalTimeTracked)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            Est: {formatTime(totalEstimatedTime)}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <CheckCircle size={16} />
                            <span className="text-xs font-bold uppercase">Total Tasks</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">
                            {totalTasks}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Users size={16} />
                            <span className="text-xs font-bold uppercase">Team Members</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">
                            {users.length}
                        </div>
                    </div>
                </div>

                {/* User Performance */}
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">User Performance</h3>
                    <div className="space-y-3">
                        {tasksByUser.map(({ user, count, time }) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</div>
                                        <div className="text-xs text-slate-400">{user.role}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{count}</div>
                                        <div className="text-[10px] text-slate-400 uppercase">Tasks</div>
                                    </div>
                                    <div className="text-right w-20">
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{formatTime(time)}</div>
                                        <div className="text-[10px] text-slate-400 uppercase">Tracked</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
