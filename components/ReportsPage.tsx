import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Calendar, User as UserIcon, CheckCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
    const {
        activeProjectId,
        projects,
        tasks,
        users,
        columns,
        currentUser
    } = useStore();

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

    const activeProject = projects.find(p => p.id === activeProjectId);

    const filteredTasks = useMemo(() => {
        if (!activeProjectId || !activeProject || !currentUser) return [];

        // 1. Base Filter: Project
        let filtered = tasks.filter(t => t.projectId === activeProjectId);

        // 2. Visibility Logic (Role-Based)
        const isManager = activeProject.managerId === currentUser.id;
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled;

        if (!isManager && !viewAllEnabled) {
            if (isLead) {
                // Lead sees self + team members (resources reporting to them)
                // Assuming reportsTo map: { resourceId: leadId }
                const teamMemberIds = Object.entries(activeProject.reportsTo || {})
                    .filter(([_, leadId]) => leadId === currentUser.id)
                    .map(([resourceId]) => resourceId);

                // Also include self
                teamMemberIds.push(currentUser.id);

                filtered = filtered.filter(t =>
                    (t.assigneeId && teamMemberIds.includes(t.assigneeId)) ||
                    t.creatorId === currentUser.id // Can always see tasks created by self? Maybe. Sticking to assignee for reports.
                );
            } else {
                // Resource sees only self
                filtered = filtered.filter(t => t.assigneeId === currentUser.id);
            }
        }

        // 3. User Filters
        if (selectedAssignee !== 'all') {
            filtered = filtered.filter(t => t.assigneeId === selectedAssignee);
        }

        if (dateRange.start) {
            const start = new Date(dateRange.start).getTime();
            filtered = filtered.filter(t => t.createdAt >= start);
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end).getTime() + 86400000; // End of day
            filtered = filtered.filter(t => t.createdAt <= end);
        }

        return filtered;
    }, [tasks, activeProjectId, selectedAssignee, dateRange, currentUser, activeProject]);

    // Chart Data Preparation
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        columns.filter(c => c.projectId === activeProjectId).forEach(c => {
            counts[c.title] = 0;
        });

        filteredTasks.forEach(t => {
            const col = columns.find(c => c.id === t.columnId);
            if (col) {
                counts[col.title] = (counts[col.title] || 0) + 1;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredTasks, columns, activeProjectId]);

    const assigneeData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredTasks.forEach(t => {
            if (t.assigneeId) {
                const user = users.find(u => u.id === t.assigneeId);
                const name = user ? user.name : 'Unknown';
                counts[name] = (counts[name] || 0) + 1;
            } else {
                counts['Unassigned'] = (counts['Unassigned'] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredTasks, users]);

    const totalDoneTasks = useMemo(() => {
        const doneColumn = columns.find(c => c.projectId === activeProjectId && c.title === 'Done');
        if (!doneColumn) return 0;
        return filteredTasks.filter(t => t.columnId === doneColumn.id).length;
    }, [filteredTasks, columns, activeProjectId]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (!activeProjectId) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Select a Project</h2>
                    <p className="text-slate-500 dark:text-slate-400">Choose a project to view reports</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Project Reports</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeProject?.name}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-2 py-1 outline-none dark:text-white"
                                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-2 py-1 outline-none dark:text-white"
                                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>

                        <div className="relative">
                            <select
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
                                value={selectedAssignee}
                                onChange={e => setSelectedAssignee(e.target.value)}
                            >
                                <option value="all">All Assignees</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 space-y-6">
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks Done</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalDoneTasks}</h3>
                        </div>
                    </div>
                    {/* Placeholder for future metrics */}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Task Status Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tasks by Assignee */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tasks by Assignee</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assigneeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                        {assigneeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Detailed Task Report</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Task</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assignee</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Started</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTasks.map(task => {
                                    const column = columns.find(c => c.id === task.columnId);
                                    const assignee = users.find(u => u.id === task.assigneeId);

                                    return (
                                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">{task.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {column?.title}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                {assignee?.name || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(task.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                {task.startedAt ? new Date(task.startedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
