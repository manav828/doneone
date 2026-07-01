import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Clock, Play, Users, Plus, Cpu } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';

interface DailyTimeData {
    userId: string;
    userName: string;
    totalSeconds: number;
    isRunning: boolean;
}

interface DailyWorkLog {
    user_id: string;
    total_seconds: number;
    profiles?: { name: string };
}

export const DailyTimer: React.FC = () => {
    const navigate = useNavigate();
    const {
        tasks,
        currentUser,
        activeProjectId,
        projects,
        users,
        activeMemberFilter,
        fetchDailyWorkLogs,
        addTask,
        columns,
    } = useStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const pendingColumn = useMemo(() => {
        if (!activeProjectId) return null;
        return columns.find((c: any) => c.projectId === activeProjectId && c.title === 'Pending')
            || columns.find((c: any) => c.projectId === activeProjectId);
    }, [activeProjectId, columns]);

    const templateTask = useMemo(() => {
        if (!pendingColumn) return null;
        return {
            id: '',
            projectId: activeProjectId || '',
            columnId: pendingColumn.id,
            title: '',
            creatorId: currentUser?.id || '',
            assigneeId: currentUser?.id,
            orderIndex: tasks.filter((t: any) => t.columnId === pendingColumn.id).length,
            tagIds: [],
            estimatedTime: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            attachments: [],
            subtasks: [],
            timeTracked: 0
        };
    }, [activeProjectId, pendingColumn, currentUser?.id, tasks]);

    const handleSaveNewTask = async (taskData: any) => {
        if (!pendingColumn || !activeProjectId || !taskData.title) return;
        const { title, ...extraFields } = taskData;
        await addTask(activeProjectId, pendingColumn.id, title, extraFields);
    };

    const [tick, setTick] = useState(0);
    const [dailyLogs, setDailyLogs] = useState<DailyWorkLog[]>([]);
    const prevRunningTaskRef = useRef<string | null>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);

    // Find currently running task for this user
    const runningTaskId = tasks.find(t =>
        t.projectId === activeProjectId &&
        t.assigneeId === currentUser?.id &&
        t.timerStartedAt
    )?.id || null;

    // Check if user is manager/lead to see team stats
    const isOwner = activeProject?.ownerId === currentUser?.id || currentUser?.email === 'manavss828@gmail.com';
    const isLead = activeProject?.leadIds?.includes(currentUser?.id || '');
    const canViewTeam = isOwner || isLead;
    const isViewingAllTeam = activeMemberFilter === null || activeMemberFilter === 'ALL';

    // Fetch daily logs from database
    useEffect(() => {
        if (activeProjectId) {
            fetchDailyWorkLogs(activeProjectId).then(logs => {
                setDailyLogs(logs || []);
            });
        }
    }, [activeProjectId, fetchDailyWorkLogs]);

    // Detect when timer stops and refetch daily logs
    useEffect(() => {
        // If there WAS a running task but now there isn't, a timer just stopped - refetch!
        if (prevRunningTaskRef.current && !runningTaskId) {
            // Timer just stopped, refetch daily logs after a brief delay for DB to update
            setTimeout(() => {
                if (activeProjectId) {
                    fetchDailyWorkLogs(activeProjectId).then(logs => {
                        setDailyLogs(logs || []);
                    });
                }
            }, 500);
        }
        prevRunningTaskRef.current = runningTaskId;
    }, [runningTaskId, activeProjectId, fetchDailyWorkLogs]);

    // Update every second to show live timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Get live timer seconds for a user (only currently running timers)
    const getLiveTimerSeconds = (userId: string): { liveSeconds: number; isRunning: boolean } => {
        if (!activeProjectId) return { liveSeconds: 0, isRunning: false };

        let liveSeconds = 0;
        let isRunning = false;

        // Only count currently running timers
        const runningTask = tasks.find(t =>
            t.projectId === activeProjectId &&
            t.assigneeId === userId &&
            t.timerStartedAt
        );

        if (runningTask && runningTask.timerStartedAt) {
            isRunning = true;
            liveSeconds = Math.floor((Date.now() - runningTask.timerStartedAt) / 1000);
        }

        return { liveSeconds, isRunning };
    };

    // Get saved daily time from database for a user
    const getSavedDailySeconds = (userId: string): number => {
        const userLog = dailyLogs.find(log => log.user_id === userId);
        return userLog?.total_seconds || 0;
    };

    // Get total daily time for a user (saved + live)
    const getDailyWorkTime = (userId: string): { totalSeconds: number; isRunning: boolean } => {
        const savedSeconds = getSavedDailySeconds(userId);
        const { liveSeconds, isRunning } = getLiveTimerSeconds(userId);
        return {
            totalSeconds: savedSeconds + liveSeconds,
            isRunning
        };
    };

    // Get current user's daily time
    const myDailyTime = useMemo(() => {
        if (!currentUser) return { totalSeconds: 0, isRunning: false };
        return getDailyWorkTime(currentUser.id);
    }, [currentUser, tasks, activeProjectId, tick, dailyLogs]);

    // Get team daily times (for managers/leads viewing all team)
    const teamDailyTimes = useMemo((): DailyTimeData[] => {
        if (!canViewTeam || !isViewingAllTeam || !activeProject) return [];

        // Get all team member IDs
        const teamMemberIds = new Set<string>();

        // Add manager
        if (activeProject.ownerId) teamMemberIds.add(activeProject.ownerId);

        // Add leads
        activeProject.leadIds?.forEach(id => teamMemberIds.add(id));

        // Add resources
        activeProject.resourceIds?.forEach(id => teamMemberIds.add(id));

        // For leads, only show their team
        if (isLead && !isOwner) {
            const myTeamIds = Object.entries(activeProject.reportsTo || {})
                .filter(([_, leadId]) => leadId === currentUser?.id)
                .map(([resourceId]) => resourceId);

            // Clear and add only lead's team
            teamMemberIds.clear();
            if (currentUser?.id) teamMemberIds.add(currentUser.id);
            myTeamIds.forEach(id => teamMemberIds.add(id));
        }

        return Array.from(teamMemberIds).map(userId => {
            const user = users.find(u => u.id === userId);
            const { totalSeconds, isRunning } = getDailyWorkTime(userId);
            return {
                userId,
                userName: user?.name || 'Unknown',
                totalSeconds,
                isRunning,
            };
        }).sort((a, b) => b.totalSeconds - a.totalSeconds); // Sort by most time
    }, [canViewTeam, isViewingAllTeam, activeProject, users, tasks, tick, isLead, isOwner, currentUser, dailyLogs]);

    // Format seconds to display string
    const formatTime = (seconds: number, showSeconds: boolean = false): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (showSeconds) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Calculate total team time
    const totalTeamSeconds = useMemo(() => {
        return teamDailyTimes.reduce((sum, member) => sum + member.totalSeconds, 0);
    }, [teamDailyTimes]);

    const anyTeamMemberRunning = teamDailyTimes.some(m => m.isRunning);

    if (!activeProjectId) return null;

    return (
        <div className="flex items-center gap-3">
            {/* Connect MCP Button */}
            <button
                onClick={() => navigate('/settings', { state: { tab: 'api-keys' } })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 rounded-full text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                title="Connect MCP Server / API Keys"
            >
                <Cpu size={13} className="text-primary" />
                <span>Connect MCP</span>
            </button>

            {/* Team Stats (for managers/leads viewing all team) */}
            {canViewTeam && isViewingAllTeam && teamDailyTimes.length > 1 && (
                <div className="relative group">
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${anyTeamMemberRunning
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-transparent'
                            }`}
                    >
                        <Users size={14} />
                        <span>Team: {formatTime(totalTeamSeconds)}</span>
                        {anyTeamMemberRunning && (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                    </div>

                    {/* Dropdown with team member times */}
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold px-2">Today's Work Time</div>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1">
                            {teamDailyTimes.map(member => (
                                <div
                                    key={member.userId}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                                            {member.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                                            {member.userName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-mono ${member.isRunning ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {formatTime(member.totalSeconds)}
                                        </span>
                                        {member.isRunning && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Current User's Timer */}
            <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
          ${myDailyTime.isRunning
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-transparent'
                    }`}
            >
                {myDailyTime.isRunning ? (
                    <>
                        <Play size={12} fill="currentColor" className="animate-pulse" />
                        <span className="font-mono">{formatTime(myDailyTime.totalSeconds, true)}</span>
                    </>
                ) : (
                    <>
                        <Clock size={14} />
                        <span>Today: {formatTime(myDailyTime.totalSeconds)}</span>
                    </>
                )}
            </div>

            {/* Add New Task Button */}
            {pendingColumn && (
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-full text-xs font-semibold transition-all border border-transparent shadow-sm hover:shadow-md cursor-pointer"
                    title="Add new task to Pending"
                >
                    <Plus size={14} />
                    <span>Add New Task</span>
                </button>
            )}

            {isCreateModalOpen && templateTask && (
                <TaskEditModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    task={templateTask as any}
                    isCreating={true}
                    onSaveNew={handleSaveNewTask}
                />
            )}
        </div>
    );
};
