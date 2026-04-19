import React, { useState } from 'react';
import { X, ChevronDown, User, CheckCircle, Circle } from 'lucide-react';
import { useStore } from '../store';
import { Column } from '../types';

interface FilterBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({ isOpen, onClose }) => {
    const {
        users,
        activeProjectId,
        filterMember,
        filterStatus,
        filterPriority,
        setFilterMember,
        setFilterStatus,
        setFilterPriority,
        columns,
    } = useStore();

    const [localMember, setLocalMember] = useState(filterMember);
    const [localStatus, setLocalStatus] = useState<string[]>(filterStatus);
    const [localPriority, setLocalPriority] = useState<string[]>(filterPriority);

    const projectColumns = columns.filter(c => c.projectId === activeProjectId);

    const handleApply = () => {
        setFilterMember(localMember);
        setFilterStatus(localStatus);
        setFilterPriority(localPriority);
        onClose();
    };

    const handleClear = () => {
        setLocalMember('all');
        setLocalStatus([]);
        setLocalPriority([]);
        setFilterMember('all');
        setFilterStatus([]);
        setFilterPriority([]);
    };

    const toggleStatus = (columnId: string) => {
        setLocalStatus(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const togglePriority = (priority: string) => {
        setLocalPriority(prev =>
            prev.includes(priority)
                ? prev.filter(p => p !== priority)
                : [...prev, priority]
        );
    };

    const activeFiltersCount =
        (localMember !== 'all' ? 1 : 0) +
        (localStatus?.length || 0) +
        (localPriority?.length || 0);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={onClose}
        >
            <div
                className="w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 z-10">
                    <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            Filters
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6 space-y-6">
                    {/* Team Member Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Team Member
                        </label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setLocalMember('all')}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${localMember === 'all'
                                    ? 'bg-primary/10 border-primary text-primary font-medium'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                All Team
                            </button>
                            <button
                                onClick={() => setLocalMember('me')}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${localMember === 'me'
                                    ? 'bg-primary/10 border-primary text-primary font-medium'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                My Tasks
                            </button>
                            {users && users.length > 0 && users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setLocalMember(user.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${localMember === user.id
                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <span>{user.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Status
                        </label>
                        <div className="space-y-2">
                            {projectColumns.map(column => (
                                <button
                                    key={column.id}
                                    onClick={() => toggleStatus(column.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${localStatus.includes(column.id)
                                        ? 'bg-primary/10 border-primary'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${localStatus.includes(column.id)
                                        ? 'bg-primary border-primary'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {localStatus.includes(column.id) && (
                                            <CheckCircle size={14} className="text-white" />
                                        )}
                                    </div>
                                    <span className={localStatus.includes(column.id) ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-300'}>
                                        {column.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Priority
                        </label>
                        <div className="space-y-2">
                            {['high', 'medium', 'low'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => togglePriority(priority)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 capitalize ${localPriority.includes(priority)
                                        ? 'bg-primary/10 border-primary'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${localPriority.includes(priority)
                                        ? 'bg-primary border-primary'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {localPriority.includes(priority) && (
                                            <CheckCircle size={14} className="text-white" />
                                        )}
                                    </div>
                                    <span className={localPriority.includes(priority) ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-300'}>
                                        {priority}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        Apply {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};
