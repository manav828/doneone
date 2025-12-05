import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { Archive, Download, X, Search, Calendar, User, Tag, Clock } from 'lucide-react';
import { TaskHistory } from '../types';

export const HistoryPage: React.FC = () => {
    const {
        activeProjectId,
        projects,
        taskHistory,
        loadTaskHistory,
        historyFilters,
        setHistoryFilters,
        exportHistoryToCSV,
        selectedHistoryIds,
        toggleHistorySelection,
        clearHistorySelection,
        users,
        tags,
        currentUser
    } = useStore();

    const [selectedHistory, setSelectedHistory] = useState<TaskHistory | null>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);

    useEffect(() => {
        if (activeProjectId) {
            loadTaskHistory(activeProjectId);
        }
    }, [activeProjectId, loadTaskHistory]);

    // Role-based User Filter Logic
    const availableUsers = useMemo(() => {
        if (!activeProject || !currentUser) return [];

        const isManager = activeProject.managerId === currentUser.id;
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled; // Reusing this setting for consistency

        if (isManager || viewAllEnabled) {
            return users;
        }

        if (isLead) {
            // Lead sees self + team members
            const teamMemberIds = Object.entries(activeProject.reportsTo || {})
                .filter(([_, leadId]) => leadId === currentUser.id)
                .map(([resourceId]) => resourceId);
            teamMemberIds.push(currentUser.id);
            return users.filter(u => teamMemberIds.includes(u.id));
        }

        // Resource sees only self
        return users.filter(u => u.id === currentUser.id);
    }, [activeProject, currentUser, users]);

    // Apply role-based filter automatically if not manager/lead
    useEffect(() => {
        if (!activeProject || !currentUser) return;

        const isManager = activeProject.managerId === currentUser.id;
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled;

        if (!isManager && !viewAllEnabled && !isLead) {
            // Force filter to self for resources
            if (!historyFilters.assigneeIds?.includes(currentUser.id)) {
                setHistoryFilters({ ...historyFilters, assigneeIds: [currentUser.id] });
            }
        }
    }, [activeProject, currentUser, historyFilters, setHistoryFilters]);


    const handleExport = (mode: 'all' | 'filtered' | 'selected') => {
        exportHistoryToCSV(mode);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (timestamp: number | string) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!activeProjectId || !activeProject) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    <Archive size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Select a Project</h2>
                    <p className="text-slate-500 dark:text-slate-400">Choose a project from the sidebar to view its history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    {/* Search */}
                    <div className="relative max-w-md w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={historyFilters.searchQuery || ''}
                            onChange={e => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs px-2 py-1 outline-none dark:text-white"
                            onChange={e => setHistoryFilters({ ...historyFilters, dateStart: e.target.value })}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs px-2 py-1 outline-none dark:text-white"
                            onChange={e => setHistoryFilters({ ...historyFilters, dateEnd: e.target.value })}
                        />
                    </div>

                    {/* Assignee Filter */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-100 dark:bg-slate-700 border-none rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer dark:text-white"
                            value={historyFilters.assigneeIds?.[0] || 'all'}
                            onChange={e => {
                                const val = e.target.value;
                                setHistoryFilters({
                                    ...historyFilters,
                                    assigneeIds: val === 'all' ? undefined : [val]
                                });
                            }}
                        >
                            <option value="all">All Assignees</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
                        </div>
                    </div>

                    {(historyFilters.dateStart || historyFilters.dateEnd || historyFilters.searchQuery || historyFilters.assigneeIds) && (
                        <button
                            onClick={() => activeProjectId && setHistoryFilters({ projectId: activeProjectId })}
                            className="text-xs text-red-500 hover:text-red-600 font-medium px-2"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => handleExport('all')}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 first:rounded-t-lg"
                            >
                                Export All History
                            </button>
                            <button
                                onClick={() => handleExport('filtered')}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                            >
                                Export Filtered View
                            </button>
                            <button
                                onClick={() => handleExport('selected')}
                                disabled={selectedHistoryIds.length === 0}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed last:rounded-b-lg"
                            >
                                Export Selected ({selectedHistoryIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* History Table */}
                <div className="flex-1 overflow-auto p-6">
                    {taskHistory.length === 0 ? (
                        <div className="text-center py-16">
                            <Archive size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No History Yet</h3>
                            <p className="text-slate-500 dark:text-slate-400">Archived tasks will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-10">
                                            <input
                                                type="checkbox"
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        taskHistory.forEach(h => {
                                                            if (!selectedHistoryIds.includes(h.id)) toggleHistorySelection(h.id);
                                                        });
                                                    } else {
                                                        clearHistorySelection();
                                                    }
                                                }}
                                                className="rounded border-slate-300 dark:border-slate-600"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Task</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Assignee</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Started</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Completed</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Time Taken</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {taskHistory.map(history => {
                                        const task = history.taskData;
                                        const assignee = users.find(u => u.id === task.assigneeId);

                                        return (
                                            <tr
                                                key={history.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedHistory(history)}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedHistoryIds.includes(history.id)}
                                                        onChange={e => {
                                                            e.stopPropagation();
                                                            toggleHistorySelection(history.id);
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                        className="rounded border-slate-300 dark:border-slate-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800 dark:text-white capitalize">{task.title}</div>
                                                    {task.description && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                            {task.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {assignee && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                                {assignee.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm text-slate-700 dark:text-slate-300">{assignee.name}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${history.statusAtArchive === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        history.statusAtArchive === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                        }`}>
                                                        {history.statusAtArchive}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                    {task.startedAt ? formatDate(task.startedAt) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                    {task.completedAt ? formatDate(task.completedAt) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                    {formatTime(history.timeTaken)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Task Details</h2>
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Title</label>
                                <p className="text-slate-800 dark:text-white font-medium mt-1 capitalize">{selectedHistory.taskData.title}</p>
                            </div>
                            {selectedHistory.taskData.description && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Description</label>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedHistory.taskData.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status at Archive</label>
                                    <p className="text-slate-800 dark:text-white mt-1">{selectedHistory.statusAtArchive}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Time Taken</label>
                                    <p className="text-slate-800 dark:text-white mt-1">{formatTime(selectedHistory.timeTaken)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Created</label>
                                    <p className="text-slate-800 dark:text-white mt-1">
                                        {selectedHistory.taskData.createdAt ? formatDate(selectedHistory.taskData.createdAt) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Archived</label>
                                    <p className="text-slate-800 dark:text-white mt-1">{formatDate(selectedHistory.archivedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
