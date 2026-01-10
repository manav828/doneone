import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import {
    Archive, Download, X, Search, CheckCircle, Calendar, User as UserIcon,
    Clock, FileText, Filter, ChevronDown, Briefcase, Building2, Users
} from 'lucide-react';
import { TaskHistory, ReportScope } from '../types';

// ============================================================
// ENTERPRISE HISTORY PAGE - Audit Trail & Archive
// ============================================================

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
        currentUser,
        teams,
        departments,
        getUserRoleLevel,
    } = useStore();

    const [selectedHistory, setSelectedHistory] = useState<TaskHistory | null>(null);
    const [scope, setScope] = useState<ReportScope>('personal');

    // Project Dropdown State
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const activeProject = projects.find(p => p.id === activeProjectId);
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const roleLevel = getUserRoleLevel(activeProjectId || undefined);

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

        const projectMembers = users.filter(u =>
            u.id === activeProject.ownerId ||
            activeProject.leadIds?.includes(u.id) ||
            activeProject.resourceIds?.includes(u.id) ||
            Object.keys(activeProject.reportsTo || {}).includes(u.id)
        );

        const isOwner = activeProject.ownerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
        const isLead = activeProject.leadIds?.includes(currentUser.id);
        const viewAllEnabled = activeProject.viewAllReportsEnabled;

        if (isOwner || viewAllEnabled) return projectMembers;

        if (isLead) {
            const teamMemberIds = Object.entries(activeProject.reportsTo || {})
                .filter(([_, leadId]) => leadId === currentUser.id)
                .map(([resourceId]) => resourceId);
            teamMemberIds.push(currentUser.id);
            return projectMembers.filter(u => teamMemberIds.includes(u.id));
        }

        return projectMembers.filter(u => u.id === currentUser.id);
    }, [activeProject, currentUser, users]);

    // Filter history based on scope and hierarchy
    const visibleHistory = useMemo(() => {
        if (!currentUser) return [];

        let filtered = [...taskHistory];

        // Scope filtering
        if (scope === 'personal') {
            filtered = filtered.filter(h =>
                h.taskData.assigneeId === currentUser.id ||
                h.taskData.creatorId === currentUser.id
            );
        } else if (scope === 'project' && activeProject) {
            const isOwner = activeProject.ownerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
            if (!isOwner && !activeProject.viewAllReportsEnabled) {
                const allowedUserIds = availableUsers.map(u => u.id);
                filtered = filtered.filter(h =>
                    (h.taskData.assigneeId && allowedUserIds.includes(h.taskData.assigneeId)) ||
                    h.taskData.creatorId === currentUser.id
                );
            }
        }

        // Apply user filters
        if (historyFilters.searchQuery) {
            const query = historyFilters.searchQuery.toLowerCase();
            filtered = filtered.filter(h =>
                h.taskData.title.toLowerCase().includes(query) ||
                h.taskData.description?.toLowerCase().includes(query)
            );
        }

        if (historyFilters.assigneeIds?.length) {
            filtered = filtered.filter(h =>
                h.taskData.assigneeId && historyFilters.assigneeIds?.includes(h.taskData.assigneeId)
            );
        }

        if (historyFilters.dateStart) {
            const start = new Date(historyFilters.dateStart).getTime();
            filtered = filtered.filter(h => h.archivedAt >= start);
        }

        if (historyFilters.dateEnd) {
            const end = new Date(historyFilters.dateEnd).getTime() + 86400000;
            filtered = filtered.filter(h => h.archivedAt <= end);
        }

        return filtered.sort((a, b) => b.archivedAt - a.archivedAt);
    }, [taskHistory, availableUsers, activeProject, currentUser, scope, historyFilters]);

    const handleExport = (mode: 'all' | 'filtered' | 'selected') => {
        exportHistoryToCSV(mode);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
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

    const formatRelativeDate = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return formatDate(timestamp);
    };

    // Group history by date
    const groupedHistory = useMemo(() => {
        const groups: Record<string, TaskHistory[]> = {};
        visibleHistory.forEach(h => {
            const date = new Date(h.archivedAt).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(h);
        });
        return groups;
    }, [visibleHistory]);

    // Determine available scopes
    const availableScopes = useMemo(() => {
        const scopes: { value: ReportScope; label: string; icon: any }[] = [
            { value: 'personal', label: 'My History', icon: UserIcon },
        ];
        if (roleLevel === 'lead' || roleLevel === 'manager' || roleLevel === 'depthead' || roleLevel === 'admin') {
            scopes.push({ value: 'project', label: 'Project', icon: Briefcase });
        }
        return scopes;
    }, [roleLevel]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = visibleHistory.length;
        const totalTime = visibleHistory.reduce((sum, h) => sum + h.timeTaken, 0);
        const doneCount = visibleHistory.filter(h => h.statusAtArchive === 'Done').length;
        const avgTime = total > 0 ? totalTime / total : 0;
        return { total, totalTime, doneCount, avgTime };
    }, [visibleHistory]);

    if (projects.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    <Archive size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Projects</h2>
                    <p className="text-slate-500 dark:text-slate-400">Create a project to view history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Archive className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Task History</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Archived tasks and completion records
                            </p>
                        </div>
                    </div>

                    {/* Scope Selector */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                        {availableScopes.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setScope(s.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${scope === s.value
                                        ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <s.icon size={16} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total Archived</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.doneCount}</p>
                        <p className="text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatTime(stats.totalTime)}</p>
                        <p className="text-xs text-slate-500">Total Time</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatTime(stats.avgTime)}</p>
                        <p className="text-xs text-slate-500">Avg per Task</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Project Selector (for project scope) */}
                    {scope === 'project' && (
                        <div className="relative">
                            <button
                                onClick={() => setIsProjectOpen(!isProjectOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Briefcase size={16} className="text-purple-600" />
                                {activeProject?.name || 'Select Project'}
                                <ChevronDown size={16} className={`transition-transform ${isProjectOpen ? 'rotate-180' : ''}`} />
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
                                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
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
                                                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 font-medium'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <span className="w-2 h-2 rounded-full shrink-0 bg-purple-500"></span>
                                                    <span className="truncate">{p.name}</span>
                                                    {activeProjectId === p.id && <CheckCircle size={14} className="ml-auto opacity-50" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search archived tasks..."
                            value={historyFilters.searchQuery || ''}
                            onChange={e => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none dark:text-white"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-1">
                        <Calendar size={14} className="text-slate-400 ml-2" />
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
                            className="appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-3 pr-8 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer dark:text-white"
                            value={historyFilters.assigneeIds?.[0] || 'all'}
                            onChange={e => {
                                const val = e.target.value;
                                setHistoryFilters({
                                    ...historyFilters,
                                    assigneeIds: val === 'all' ? undefined : [val]
                                });
                            }}
                        >
                            <option value="all">All Members</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Clear Filters */}
                    {(historyFilters.dateStart || historyFilters.dateEnd || historyFilters.searchQuery || historyFilters.assigneeIds) && (
                        <button
                            onClick={() => activeProjectId && setHistoryFilters({ projectId: activeProjectId })}
                            className="text-xs text-red-500 hover:text-red-600 font-medium px-2"
                        >
                            Clear Filters
                        </button>
                    )}

                    {/* Export Button */}
                    <div className="relative group ml-auto">
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all text-sm">
                            <Download size={16} />
                            Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => handleExport('all')}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 first:rounded-t-xl"
                            >
                                Export All
                            </button>
                            <button
                                onClick={() => handleExport('filtered')}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                            >
                                Export Filtered ({visibleHistory.length})
                            </button>
                            <button
                                onClick={() => handleExport('selected')}
                                disabled={selectedHistoryIds.length === 0}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed last:rounded-b-xl"
                            >
                                Export Selected ({selectedHistoryIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {visibleHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Archive size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No History Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                            Archived tasks will appear here. Tasks are archived when moved to a column with archiving enabled.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedHistory).map(([date, items]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Calendar className="text-purple-600" size={14} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {formatRelativeDate(items[0].archivedAt)}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">
                                        {items.length} tasks
                                    </span>
                                </div>

                                {/* History Cards */}
                                <div className="space-y-2">
                                    {items.map(history => {
                                        const task = history.taskData;
                                        const assignee = users.find(u => u.id === task.assigneeId);
                                        const project = projects.find(p => p.id === history.projectId);

                                        return (
                                            <div
                                                key={history.id}
                                                onClick={() => setSelectedHistory(history)}
                                                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedHistoryIds.includes(history.id)
                                                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                                    }`}
                                            >
                                                <div className="p-4 flex items-center gap-4">
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedHistoryIds.includes(history.id)}
                                                        onChange={e => {
                                                            e.stopPropagation();
                                                            toggleHistorySelection(history.id);
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                                                    />

                                                    {/* Task Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-slate-900 dark:text-white truncate capitalize">
                                                                {task.title}
                                                            </h4>
                                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${history.statusAtArchive === 'Done'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : history.statusAtArchive === 'In Progress'
                                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                                }`}>
                                                                {history.statusAtArchive}
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Project Badge (if viewing cross-project) */}
                                                    {scope !== 'project' && project && (
                                                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                            <Briefcase size={12} className="text-slate-500" />
                                                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                                                                {project.name}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Assignee */}
                                                    {assignee && (
                                                        <div className="shrink-0 flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                                                {assignee.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                                                                {assignee.name}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Time */}
                                                    <div className="shrink-0 flex items-center gap-1.5 text-slate-500">
                                                        <Clock size={14} />
                                                        <span className="text-sm font-medium">{formatTime(history.timeTaken)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedHistory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FileText className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Task Details</h2>
                                    <p className="text-xs text-slate-500">Archived {formatDate(selectedHistory.archivedAt)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                            {/* Title & Status */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</label>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1 capitalize">
                                    {selectedHistory.taskData.title}
                                </p>
                            </div>

                            {selectedHistory.taskData.description && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                                        {selectedHistory.taskData.description}
                                    </p>
                                </div>
                            )}

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status at Archive</label>
                                    <p className="text-slate-900 dark:text-white mt-1 font-medium">{selectedHistory.statusAtArchive}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Spent</label>
                                    <p className="text-slate-900 dark:text-white mt-1 font-medium">{formatTime(selectedHistory.timeTaken)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</label>
                                    <p className="text-slate-900 dark:text-white mt-1 font-medium">
                                        {selectedHistory.taskData.createdAt ? formatDate(selectedHistory.taskData.createdAt) : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archived</label>
                                    <p className="text-slate-900 dark:text-white mt-1 font-medium">{formatDate(selectedHistory.archivedAt)}</p>
                                </div>
                            </div>

                            {/* Assignee */}
                            {selectedHistory.taskData.assigneeId && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {users.find(u => u.id === selectedHistory.taskData.assigneeId)?.name?.charAt(0) || '?'}
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {users.find(u => u.id === selectedHistory.taskData.assigneeId)?.name || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
