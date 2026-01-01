import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { Archive, Download, X, Search, CheckCircle } from 'lucide-react';
import { TaskHistory } from '../types';

export const HistoryPage: React.FC = () => {
    const {
        activeProjectId,
        setActiveProject,
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
        currentUser
    } = useStore();

    const [selectedHistory, setSelectedHistory] = useState<TaskHistory | null>(null);

    // Project Dropdown State
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const activeProject = projects.find(p => p.id === activeProjectId);
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

    useEffect(() => {
        if (activeProjectId) {
            loadTaskHistory(activeProjectId);
        } else if (projects.length > 0) {
            setActiveProject(projects[0].id);
        }
    }, [activeProjectId, loadTaskHistory, projects, setActiveProject]);

    // Role-based User Filter Logic
    const availableUsers = useMemo(() => {
        if (!activeProject || !currentUser) return [];

        // Filter to Project Members only
        const projectMembers = users.filter(u =>
            u.id === activeProject.managerId ||
            activeProject.leadIds?.includes(u.id) ||
            activeProject.resourceIds?.includes(u.id) ||
            Object.keys(activeProject.reportsTo || {}).includes(u.id)
        );

        const isManager = activeProject.managerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled;

        if (isManager || viewAllEnabled) {
            return projectMembers;
        }

        if (isLead) {
            const teamMemberIds = Object.entries(activeProject.reportsTo || {})
                .filter(([_, leadId]) => leadId === currentUser.id)
                .map(([resourceId]) => resourceId);
            teamMemberIds.push(currentUser.id);
            return projectMembers.filter(u => teamMemberIds.includes(u.id));
        }

        return projectMembers.filter(u => u.id === currentUser.id);
    }, [activeProject, currentUser, users]);

    // Apply role-based filter automatically
    useEffect(() => {
        if (!activeProject || !currentUser) return;
        const isManager = activeProject.managerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled;

        if (!isManager && !viewAllEnabled && !isLead) {
            if (!historyFilters.assigneeIds?.includes(currentUser.id)) {
                setHistoryFilters({ ...historyFilters, assigneeIds: [currentUser.id] });
            }
        }
    }, [activeProject, currentUser, historyFilters, setHistoryFilters]);

    // Filter history based on Hierarchy
    const visibleHistory = useMemo(() => {
        if (!activeProject || !currentUser) return [];

        const isManager = activeProject.managerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
        if (isManager || activeProject.viewAllReportsEnabled) return taskHistory;

        const allowedUserIds = availableUsers.map(u => u.id);
        return taskHistory.filter(h => {
            // Visible if assigned to visible user OR created by current user
            return (h.taskData.assigneeId && allowedUserIds.includes(h.taskData.assigneeId)) ||
                h.taskData.creatorId === currentUser.id;
        });
    }, [taskHistory, availableUsers, activeProject, currentUser]);

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

    if (projects.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Projects</h2>
                    <p className="text-slate-500 dark:text-slate-400">Create a project to view history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between gap-4">

                {/* Project Selector */}
                <div className="relative mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                    <button
                        onClick={() => setIsProjectOpen(!isProjectOpen)}
                        className="flex items-center gap-2 font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <span>{activeProject?.name || 'Select Project'}</span>
                        <svg className={`w-4 h-4 transition-transform ${isProjectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {isProjectOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsProjectOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                                            value={projectSearch}
                                            onChange={(e) => setProjectSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                                    {filteredProjects.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setActiveProject(p.id); setIsProjectOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeProjectId === p.id
                                                ? 'bg-primary/5 text-primary font-medium'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            <span className="w-2 h-2 rounded-full shrink-0 bg-primary"></span>
                                            <span className="truncate">{p.name}</span>
                                            {activeProjectId === p.id && <CheckCircle size={14} className="ml-auto opacity-50" />}
                                        </button>
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                                            No projects found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4 flex-1">
                    {/* Search */}
                    <div className="relative max-w-md w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={historyFilters.searchQuery || ''}
                            onChange={e => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
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
                                    {visibleHistory.map(history => {
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
