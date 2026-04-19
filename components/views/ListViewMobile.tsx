import React, { useState } from 'react';
import { Task, Column } from '../../types';
import { useStore } from '../../store';
import { Clock, CheckCircle, MoreVertical, Trash, Edit, Play, Pause, Layout, List, Calendar, Filter, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterBottomSheet } from '../FilterBottomSheet';

interface ListViewMobileProps {
    tasks: Task[];
    columns: Column[];
}

export const ListViewMobile: React.FC<ListViewMobileProps> = ({ tasks, columns }) => {
    const { users, can, updateTask, deleteTask, toggleTaskTimer, currentView, setView, moveTask } = useStore();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [showMoveSheet, setShowMoveSheet] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

    const getColumnColor = (columnId: string) => {
        const column = columns.find(c => c.id === columnId);
        if (!column) return 'bg-slate-500';

        const title = column.title.toLowerCase();
        if (title.includes('done') || title.includes('complete')) return 'bg-green-500';
        if (title.includes('progress') || title.includes('doing')) return 'bg-blue-500';
        if (title.includes('todo') || title.includes('backlog') || title.includes('pending')) return 'bg-slate-400';
        if (title.includes('review')) return 'bg-purple-500';
        return 'bg-orange-500';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
            case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
        }
    };

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskId(taskId);
        setShowActions(true);
    };

    const handleComplete = async (task: Task) => {
        const doneColumn = columns.find(c => c.title.toLowerCase() === 'done');
        if (doneColumn) {
            await updateTask(task.id, { columnId: doneColumn.id, completedAt: Date.now() });
        }
        setShowActions(false);
    };

    const handleDelete = async (taskId: string) => {
        if (confirm('Delete this task?')) {
            await deleteTask(taskId);
        }
        setShowActions(false);
    };

    const handleMoveTask = (taskId: string, columnId: string) => {
        moveTask(taskId, columnId);
        setShowMoveSheet(false);
        setShowActions(false);
    };

    const toggleColumnCollapse = (columnId: string) => {
        const newCollapsed = new Set(collapsedColumns);
        if (newCollapsed.has(columnId)) {
            newCollapsed.delete(columnId);
        } else {
            newCollapsed.add(columnId);
        }
        setCollapsedColumns(newCollapsed);
    };

    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    // Group tasks by column
    const groupedTasks = columns.map(column => ({
        column,
        tasks: tasks.filter(task => task.columnId === column.id)
    })).filter(group => group.tasks.length > 0);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* View Switcher */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-1">
                        <button
                            onClick={() => setView('board')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${currentView === 'board'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <Layout size={14} />
                            Board
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${currentView === 'list'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <List size={14} />
                            List
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${currentView === 'calendar'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <Calendar size={14} />
                            Calendar
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilters(true)}
                        className="shrink-0 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Open filters"
                    >
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Grouped Task List */}
            <div className="flex-1 overflow-y-auto">
                {groupedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                        <CheckCircle size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">No tasks found</p>
                    </div>
                ) : (
                    groupedTasks.map(({ column, tasks: columnTasks }) => {
                        const isCollapsed = collapsedColumns.has(column.id);
                        return (
                            <div key={column.id} className="mb-3">
                                {/* Column Header */}
                                <div
                                    onClick={() => toggleColumnCollapse(column.id)}
                                    className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getColumnColor(column.id)}`} />
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                            {column.title}
                                        </h3>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            ({columnTasks.length})
                                        </span>
                                    </div>
                                    {isCollapsed ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
                                </div>

                                {/* Column Tasks */}
                                {!isCollapsed && (
                                    <div className="px-4 py-2 space-y-3">
                                        {columnTasks.map((task) => {
                                            const assignedUser = users?.find(u => u.id === task.assigneeId);
                                            const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                                            const totalSubtasks = task.subtasks?.length || 0;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm active:shadow-md transition-shadow"
                                                    onClick={() => handleTaskClick(task.id)}
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <h4 className="flex-1 text-sm font-semibold text-slate-800 dark:text-white leading-snug capitalize">
                                                            {task.title}
                                                        </h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTaskClick(task.id);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded touch-target"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Description */}
                                                    {task.description && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    {/* Subtasks Progress */}
                                                    {totalSubtasks > 0 && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <CheckCircle size={14} className="text-slate-400" />
                                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                                {completedSubtasks}/{totalSubtasks} subtasks
                                                            </span>
                                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full transition-all"
                                                                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer Info */}
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {/* Priority */}
                                                            {task.priority && ['high', 'medium', 'low'].includes(task.priority as string) && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Assignee & Time */}
                                                        <div className="flex items-center gap-2">
                                                            {assignedUser && (
                                                                <div className="flex items-center gap-1.5">
                                                                    {assignedUser.avatar ? (
                                                                        <img
                                                                            src={assignedUser.avatar}
                                                                            alt={assignedUser.name}
                                                                            className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                                                                            {assignedUser.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                                                        {assignedUser.name.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {task.updatedAt && (
                                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {new Date(task.updatedAt).toLocaleDateString(undefined, {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Actions Bottom Sheet */}
            {showActions && selectedTask && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-end"
                    onClick={() => setShowActions(false)}
                >
                    <div
                        className="w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[50vh] overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                            <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                                {selectedTask.title}
                            </h3>
                        </div>
                        <div className="overflow-y-auto">
                            <button
                                onClick={() => {
                                    // Open edit modal
                                    setShowActions(false);
                                }}
                                className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                            >
                                <Edit size={18} />
                                <span className="font-medium">Edit Task</span>
                            </button>

                            {/* MOVE TASK BUTTON */}
                            <button
                                onClick={() => {
                                    setShowActions(false);
                                    setShowMoveSheet(true);
                                }}
                                className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                            >
                                <MoreHorizontal size={18} />
                                <span className="font-medium">Move Task</span>
                            </button>

                            {can('manageTimer') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskTimer(selectedTask.id);
                                        setShowActions(false);
                                    }}
                                    className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                                >
                                    {selectedTask.timerStartedAt ? <Pause size={18} /> : <Play size={18} />}
                                    <span className="font-medium">
                                        {selectedTask.timerStartedAt ? 'Pause Timer' : 'Start Timer'}
                                    </span>
                                </button>
                            )}

                            <button
                                onClick={() => handleComplete(selectedTask)}
                                className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 dark:active:bg-green-900/30 transition-colors"
                            >
                                <CheckCircle size={18} />
                                <span className="font-medium">Mark Complete</span>
                            </button>

                            {can('deleteTasks') && (
                                <button
                                    onClick={() => handleDelete(selectedTask.id)}
                                    className="w-full text-left px-6 py-4 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
                                >
                                    <Trash size={18} />
                                    <span className="font-medium">Delete Task</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Move Task Bottom Sheet */}
            {showMoveSheet && selectedTask && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-end"
                    onClick={() => setShowMoveSheet(false)}
                >
                    <div
                        className="w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                Move Task To
                            </h3>
                        </div>
                        <div className="overflow-y-auto max-h-[40vh]">
                            {columns.map((col) => (
                                <button
                                    key={col.id}
                                    onClick={() => handleMoveTask(selectedTask.id, col.id)}
                                    disabled={col.id === selectedTask.columnId}
                                    className={`w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${col.id === selectedTask.columnId
                                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
                                        }`}
                                >
                                    <div className="font-medium">{col.title}</div>
                                    {col.id === selectedTask.columnId && (
                                        <div className="text-xs text-slate-400 mt-0.5">Current column</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bottom Sheet */}
            <FilterBottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} />
        </div>
    );
};
