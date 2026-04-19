import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Layout, List, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useStore } from '../../store';
import { Task } from '../../types';
import { FilterBottomSheet } from '../FilterBottomSheet';

interface CalendarViewMobileProps {
    tasks: Task[];
}

export const CalendarViewMobile: React.FC<CalendarViewMobileProps> = ({ tasks }) => {
    const { currentView, setView, columns } = useStore();
    const [showFilters, setShowFilters] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => {
            // Use reminderAt for calendar display
            if (!task.reminderAt) return false;
            const taskDate = new Date(task.reminderAt);
            return taskDate.toDateString() === date.toDateString();
        });
    };


    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    };

    const calendarDays: Date[] = [];
    const currentDateIter = new Date(startDate);
    while (currentDateIter <= endDate) {
        calendarDays.push(new Date(currentDateIter));
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    const dateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

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
                            <CalendarIcon size={14} />
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

            {/* Calendar Header */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">{monthName}</h2>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <button
                    onClick={handleToday}
                    className="w-full px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                    Today
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                {/* Week Day Headers */}
                <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                    {weekDays.map(day => (
                        <div
                            key={day}
                            className="bg-white dark:bg-slate-900 px-2 py-2 text-center text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
                    {calendarDays.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === month;
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        const dayTasks = getTasksForDate(date);
                        const hasEvents = dayTasks.length > 0;

                        return (
                            <div
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`bg-white dark:bg-slate-900 min-h-[60px] p-1.5 relative transition-colors touch-target ${!isCurrentMonth ? 'opacity-40' : ''
                                    } ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                            >
                                <div
                                    className={`text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 mx-auto rounded-full ${isToday
                                        ? 'bg-primary text-white'
                                        : isCurrentMonth
                                            ? 'text-slate-800 dark:text-white'
                                            : 'text-slate-400 dark:text-slate-600'
                                        }`}
                                >
                                    {date.getDate()}
                                </div>
                                {hasEvents && (
                                    <div className="flex justify-center gap-0.5 mt-1">
                                        {dayTasks.slice(0, 3).map((_, i) => (
                                            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Tasks */}
            {selectedDate && dateTasks.length > 0 && (
                <div className="shrink-0 max-h-[40vh] overflow-y-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                        {selectedDate.toLocaleDateString('default', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h3>
                    <div className="space-y-2">
                        {dateTasks.map(task => {
                            const column = columns.find(c => c.id === task.columnId);
                            return (
                                <div
                                    key={task.id}
                                    className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
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
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                {column.title}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter Bottom Sheet */}
            <FilterBottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} />
        </div>
    );
};
