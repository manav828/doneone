import React from 'react';
import { useStore } from '../store';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';

export const ReportsPageMobile: React.FC = () => {
    const { tasks, currentUser, activities } = useStore();

    const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id);
    const completedTasks = myTasks.filter(t => t.completedAt);
    const inProgressTasks = myTasks.filter(t => !t.completedAt && t.columnId);

    // Calculate time tracked
    const totalTimeTracked = tasks.reduce((sum, task) => {
        return sum + (task.timeTracked || 0);
    }, 0);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    // Get last 7 days productivity
    const getLast7DaysData = () => {
        const days = [];
        const now = Date.now();

        for (let i = 6; i >= 0; i--) {
            const dayStart = now - (i * 24 * 60 * 60 * 1000);
            const dayEnd = dayStart + (24 * 60 * 60 * 1000);

            const completed = tasks.filter(t =>
                t.completedAt && t.completedAt >= dayStart && t.completedAt < dayEnd
            ).length;

            days.push({
                label: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }),
                count: completed
            });
        }

        return days;
    };

    const productivityData = getLast7DaysData();
    const maxCount = Math.max(...productivityData.map(d => d.count), 1);

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    Analytics Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your personal performance metrics
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Tasks Completed */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Target size={18} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {completedTasks.length}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tasks Completed
                    </div>
                </div>

                {/* In Progress */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Zap size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {inProgressTasks.length}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        In Progress
                    </div>
                </div>

                {/* Time Tracked */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Clock size={18} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {formatTime(totalTimeTracked)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Time Tracked
                    </div>
                </div>

                {/* Velocity Score */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                            <TrendingUp size={18} className="text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {Math.round((completedTasks.length / Math.max(myTasks.length, 1)) * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Completion Rate
                    </div>
                </div>
            </div>

            {/* Productivity Trend */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        Productivity Trend
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Tasks completed per day (last 7 days)
                </p>

                {/* Chart */}
                <div className="flex items-end gap-2 h-32">
                    {productivityData.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col justify-end h-full">
                                <div
                                    className="w-full bg-primary/20 dark:bg-primary/30 rounded-t-lg border-t-2 border-primary transition-all"
                                    style={{
                                        height: `${(day.count / maxCount) * 100}%`,
                                        minHeight: day.count > 0 ? '8px' : '2px'
                                    }}
                                >
                                    {day.count > 0 && (
                                        <div className="text-xs font-bold text-primary text-center pt-1">
                                            {day.count}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {day.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                    Recent Activity
                </h2>
                <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {activity.description}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {new Date(activity.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom padding for nav */}
            <div className="h-4" />
        </div>
    );
};
