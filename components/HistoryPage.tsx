import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Archive, Download, X, Search, Calendar, User, Tag, Clock, Filter as FilterIcon } from 'lucide-react';
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
        tags
    } = useStore();

    const [showFilterPanel, setShowFilterPanel] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState<TaskHistory | null>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);

    useEffect(() => {
        if (activeProjectId) {
            loadTaskHistory(activeProjectId);
        }
    }, [activeProjectId, loadTaskHistory]);

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
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Archive size={24} />
                            Task History
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {activeProject.name} • {taskHistory.length} archived task{taskHistory.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Toggle Filters"
                        >
                            <FilterIcon size={20} />
                        </button>

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
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Filter Panel */}
                {showFilterPanel && (
                    <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4">
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Filters</h3>
                        {/* Filter content will be in HistoryFilterPanel component */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={historyFilters.searchQuery || ''}
                                    onChange={e => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div>
                                <button
                                    onClick={() => activeProjectId && setHistoryFilters({ projectId: activeProjectId })}
                                    className="w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <th className="px-4 py-3 text-left">
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
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Archived</th>
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
                                                    <div className="font-medium text-slate-800 dark:text-white">{task.title}</div>
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
                                                    {formatDate(history.archivedAt)}
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
                                <p className="text-slate-800 dark:text-white font-medium mt-1">{selectedHistory.taskData.title}</p>
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
