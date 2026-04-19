import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useStore } from '../store';

interface SearchMobileProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchMobile: React.FC<SearchMobileProps> = ({ isOpen, onClose }) => {
    const { tasks, columns, activeProjectId } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([
        'deadline tomorrow',
        'high priority',
        'design tasks'
    ]);

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

    const filteredTasks = searchQuery.trim()
        ? projectTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() && !recentSearches.includes(query)) {
            setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
        }
    };

    const handleRecentClick = (query: string) => {
        setSearchQuery(query);
    };

    const clearRecent = (query: string) => {
        setRecentSearches(prev => prev.filter(q => q !== query));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col">
            {/* Header */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!searchQuery.trim() ? (
                    <>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    Recent Searches
                                </h3>
                                <div className="space-y-2">
                                    {recentSearches.map((query, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg p-3"
                                        >
                                            <button
                                                onClick={() => handleRecentClick(query)}
                                                className="flex-1 text-left text-sm text-slate-700 dark:text-slate-300"
                                            >
                                                <Search size={14} className="inline mr-2 text-slate-400" />
                                                {query}
                                            </button>
                                            <button
                                                onClick={() => clearRecent(query)}
                                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Filters */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Quick Filters
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleSearch('my tasks')}
                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                                >
                                    My Tasks
                                </button>
                                <button
                                    onClick={() => handleSearch('this week')}
                                    className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={() => handleSearch('high priority')}
                                    className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                                >
                                    High Priority
                                </button>
                                <button
                                    onClick={() => handleSearch('overdue')}
                                    className="px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/20 transition-colors"
                                >
                                    Overdue
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Search Results */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                {filteredTasks.length} {filteredTasks.length === 1 ? 'result' : 'results'}
                            </h3>
                            {filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Search size={48} className="mb-2 opacity-50" />
                                    <p className="text-sm">No tasks found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredTasks.map(task => {
                                        const column = columns.find(c => c.id === task.columnId);
                                        return (
                                            <div
                                                key={task.id}
                                                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
                                                onClick={onClose}
                                            >
                                                <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1 capitalize">
                                                    {task.title}
                                                </h4>
                                                {task.description && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                                {column && (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                        {column.title}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
