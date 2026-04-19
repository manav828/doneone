import React, { useState, useRef } from 'react';
import { useStore } from '../../store';
import { Column } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Layout, List, Calendar, MoreHorizontal, Filter } from 'lucide-react';
import { TaskCard } from '../TaskCard';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { FilterBottomSheet } from '../FilterBottomSheet';

interface KanbanViewMobileProps {
    tasks: any[];
    columns: Column[];
}

export const KanbanViewMobile: React.FC<KanbanViewMobileProps> = ({ tasks, columns }) => {
    const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
    const [showMoveSheet, setShowMoveSheet] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { addTask, can, currentView, setView, moveTask } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const currentColumn = columns[currentColumnIndex];
    const columnTasks = tasks.filter((t: any) => t.columnId === currentColumn?.id);

    // Swipe gestures
    useTouchGestures(containerRef, {
        onSwipeLeft: () => {
            if (currentColumnIndex < columns.length - 1) {
                setCurrentColumnIndex(currentColumnIndex + 1);
            }
        },
        onSwipeRight: () => {
            if (currentColumnIndex > 0) {
                setCurrentColumnIndex(currentColumnIndex - 1);
            }
        },
        swipeThreshold: 50,
    });

    const handleAddTask = () => {
        if (currentColumn && can('createTask')) {
            addTask({
                title: 'New Task',
                description: '',
                columnId: currentColumn.id,
                projectId: currentColumn.projectId,
            });
        }
    };

    const handleMoveTask = (taskId: string, targetColumnId: string) => {
        moveTask(taskId, targetColumnId);
        setShowMoveSheet(false);
        setSelectedTaskId(null);
    };

    if (!currentColumn) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 p-4">
                <p>No columns available</p>
            </div>
        );
    }

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

            {/* Column Navigation Header */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                {/* Column Dots Indicator - IMPROVED */}
                <div className="flex justify-center gap-2 mb-3">
                    {columns.map((col: Column, index: number) => (
                        <button
                            key={col.id}
                            onClick={() => setCurrentColumnIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentColumnIndex
                                    ? 'w-8 bg-primary shadow-sm'
                                    : 'w-2 bg-slate-300 dark:bg-slate-600'
                                }`}
                            aria-label={`Go to ${col.title}`}
                        />
                    ))}
                </div>

                {/* Column Title & Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => currentColumnIndex > 0 && setCurrentColumnIndex(currentColumnIndex - 1)}
                        disabled={currentColumnIndex === 0}
                        className="p-2 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-100 dark:active:bg-slate-800 rounded-lg touch-target"
                        aria-label="Previous column"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 text-center">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            {currentColumn.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>

                    <button
                        onClick={() => currentColumnIndex < columns.length - 1 && setCurrentColumnIndex(currentColumnIndex + 1)}
                        disabled={currentColumnIndex === columns.length - 1}
                        className="p-2 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-100 dark:active:bg-slate-800 rounded-lg touch-target"
                        aria-label="Next column"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
                {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p className="text-sm mb-4">No tasks in this column</p>
                        {can('createTask') && (
                            <button
                                onClick={handleAddTask}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm active:bg-primary-hover transition-colors font-medium"
                            >
                                <Plus size={18} />
                                Add Task
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {columnTasks.map((task: any) => (
                            <div key={task.id} className="relative">
                                <TaskCard task={task} />
                                {/* Move Task Button */}
                                <button
                                    onClick={() => {
                                        setSelectedTaskId(task.id);
                                        setShowMoveSheet(true);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors z-10"
                                    aria-label="Move task"
                                >
                                    <MoreHorizontal size={16} className="text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Add Task Button */}
            {can('createTask') && columnTasks.length > 0 && (
                <div className="shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={handleAddTask}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-sm active:bg-primary-hover transition-colors font-medium touch-target"
                    >
                        <Plus size={18} />
                        Add Task
                    </button>
                </div>
            )}

            {/* Move Task Bottom Sheet */}
            {showMoveSheet && selectedTaskId && (
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
                            {columns.map((col: Column) => (
                                <button
                                    key={col.id}
                                    onClick={() => handleMoveTask(selectedTaskId, col.id)}
                                    disabled={col.id === currentColumn.id}
                                    className={`w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${col.id === currentColumn.id
                                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
                                        }`}
                                >
                                    <div className="font-medium">{col.title}</div>
                                    {col.id === currentColumn.id && (
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
