import React, { useMemo } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useStore } from '../../store';
import { Task, User } from '../../types';
import { Clock, CheckCircle2, User as UserIcon, X } from 'lucide-react';

interface TimelineViewProps {
    tasks: Task[];
    users: User[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, users }) => {
    const { columns, themeMode, activeMemberFilter, setMemberFilter, currentUser, activeProjectId, projects } = useStore();

    const project = projects.find(p => p.id === activeProjectId);
    const usersToFilter = users.filter(u => u.id !== currentUser?.id);

    const ganttTasks: GanttTask[] = useMemo(() => {
        if (tasks.length === 0) return [];

        return tasks.map(task => {
            const startDate = task.startedAt
                ? new Date(task.startedAt)
                : task.timerStartedAt
                    ? new Date(task.timerStartedAt)
                    : new Date(task.createdAt || Date.now());

            let endDate = task.completedAt ? new Date(task.completedAt) : (task.reminderAt ? new Date(task.reminderAt) : null);

            // Default duration logic
            if (!endDate) {
                endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));
            }
            if (endDate <= startDate) {
                endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
            }

            const assignee = users.find(u => u.id === task.assigneeId);
            const column = columns.find(c => c.id === task.columnId);

            // Colors
            let color = column?.color || '#94a3b8';
            if (!column?.color) {
                const title = column?.title.toLowerCase() || '';
                if (title.includes('done')) color = '#22c55e';
                else if (title.includes('progress')) color = '#3b82f6';
                else if (title.includes('review')) color = '#eab308';
                else color = '#64748b';
            }

            let progress = 0;
            if (column?.title.toLowerCase().includes('done')) progress = 100;
            else if (column?.title.toLowerCase().includes('progress')) progress = 50;

            const timeTracked = task.timeTracked ? (task.timeTracked / 3600).toFixed(1) : '0';
            const assigneeName = assignee ? assignee.name.split(' ')[0] : 'Unassigned';

            // Bar Label: Assignee • Status
            const label = `${assigneeName} • ${column?.title || ''}`;

            return {
                start: startDate,
                end: endDate,
                name: label,
                id: task.id,
                type: 'task',
                progress: progress,
                isDisabled: true,
                styles: { progressColor: color, progressSelectedColor: color, backgroundColor: color, backgroundSelectedColor: color },

                // Custom props
                project: task.projectId,
                assigneeName: assignee?.name || 'Unassigned',
                assigneeAvatar: assignee?.avatar,
                status: column?.title || 'Unknown',
                timeTracked: timeTracked,
                estimated: timeTracked,
                description: task.description,
                originalTitle: task.title,
                hoursTakenDisplay: timeTracked
            };
        });
    }, [tasks, columns, users]); // Tasks passed in are already filtered by Board.tsx if filter is active?
    // YES. Board.tsx passes `visibleTasks` which essentially calls `getFilteredTasks`.
    // So if I update `activeMemberFilter` in store, `tasks` prop here updates automatically.
    // So I just need the UI to toggle the store state.

    // ...

    return (
        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 p-4 relative flex flex-col">
            {/* Timeline Tools */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative group">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                        <UserIcon size={12} />
                    </div>
                    <select
                        value={activeMemberFilter || 'ALL'}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'ALL') setMemberFilter(null);
                            else setMemberFilter(val);
                        }}
                        className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full pl-8 pr-8 py-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all min-w-[120px]"
                    >
                        <option value="ME">My Workspace</option>
                        {(currentUser?.email === 'manavss828@gmail.com' || project?.managerId === currentUser?.id || project?.leadIds.includes(currentUser?.id || '')) && (
                            <option value="ALL">All Team</option>
                        )}
                        <optgroup label="Team Members">
                            {usersToFilter.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </optgroup>
                    </select>
                    {(activeMemberFilter && activeMemberFilter !== 'ME') && (
                        <button
                            onClick={() => setMemberFilter('ME')}
                            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                            title="Reset to My Workspace"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            <style>{`
          .gantt-time-period { display: none !important; }
          .gantt-time-period-header { display: none !important; }
          .gantt-container { background-color: transparent !important; }
          ${themeMode === 'dark' ? `
            .gantt-task-list-header { background-color: #1e293b !important; color: #cbd5e1 !important; border-bottom: 1px solid #334155; }
            .gantt-task-list-item { background-color: #0f172a !important; color: #e2e8f0 !important; border-bottom: 1px solid #1e293b !important; }
            .gantt-vertical-separator { border-color: #334155 !important; }
            .gantt-horizontal-separator { border-color: #334155 !important; }
            text { fill: #94a3b8 !important; } 
          ` : `
            .gantt-task-list-header { background-color: #f8fafc !important; color: #475569 !important; border-bottom: 1px solid #e2e8f0; }
            .gantt-task-list-item { border-bottom: 1px solid #f1f5f9 !important; }
          `}
        `}</style>
            <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm relative">

                <Gantt
                    tasks={ganttTasks}
                    viewMode={ViewMode.Day}
                    listCellWidth="400px"
                    columnWidth={70}
                    barBackgroundColor="#3b82f6"
                    barProgressColor="#2563eb"
                    locale="en"
                    TooltipContent={({ task, fontFamily, fontSize }) => {
                        const t = task as any;
                        return (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 text-sm z-50 transform -translate-y-4 -translate-x-4">
                                <div className="font-bold text-slate-800 dark:text-white mb-1">{t.originalTitle}</div>
                                <div className="text-slate-500 text-xs mb-3">{t.status}</div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <UserIcon size={14} className="text-slate-400" />
                                        <span>{t.assigneeName}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={12} /> Tracked:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{t.timeTracked}h</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                    TaskListHeader={({ headerHeight }) => (
                        <div
                            style={{
                                height: headerHeight,
                                width: "400px",
                                minWidth: "400px",
                                maxWidth: "400px",
                                boxSizing: "border-box",
                                fontFamily: "inherit",
                                fontWeight: "bold",
                                paddingLeft: "10px",
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                                color: themeMode === 'dark' ? '#cbd5e1' : '#64748b',
                                fontSize: '11px',
                                textTransform: 'uppercase'
                            }}
                        >
                            <div className="flex-1 pl-2">Task</div>
                            <div className="w-16 text-right pr-4">Time</div>
                        </div>
                    )}
                    TaskListTable={({ rowHeight, tasks, fontFamily, fontSize }) => (
                        <div className="w-full" style={{
                            fontFamily,
                            fontSize,
                            width: "400px",
                            minWidth: "400px",
                            maxWidth: "400px",
                            boxSizing: "border-box"
                        }}>
                            {tasks.map((t, i) => {
                                const customT = t as any;
                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center pl-4 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                                        style={{ height: rowHeight, fontFamily: 'inherit' }}
                                    >
                                        <div className="flex-1 pr-2 min-w-0">
                                            <div
                                                className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors cursor-pointer"
                                                title={customT.originalTitle}
                                            >
                                                {customT.originalTitle}
                                            </div>
                                            {customT.status && (
                                                <div className="text-[10px] text-slate-400 truncate">
                                                    {customT.status}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-16 text-right pr-4">
                                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                                                {customT.hoursTakenDisplay}h
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                />
            </div>
        </div>
    );
};
