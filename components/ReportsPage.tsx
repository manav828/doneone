import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Download, User as UserIcon, CheckCircle, Search, Clock, TrendingUp,
    Target, AlertTriangle, Users, Briefcase, Building2, ChevronDown,
    Zap, Award, Activity, BarChart3
} from 'lucide-react';
import type { ReportScope } from '../types';

// ============================================================
// ENTERPRISE REPORTS PAGE - Asana-level Analytics
// ============================================================

export const ReportsPage: React.FC = () => {
    const {
        activeProjectId,
        setActiveProject,
        projects,
        tasks,
        users,
        columns,
        currentUser,
        teams,
        departments,
        calculateUserMetrics,
        calculateProjectMetrics,
        calculateDepartmentMetrics,
        calculateWorkspaceMetrics,
        getUserRoleLevel,
    } = useStore();

    // Scope State
    const [scope, setScope] = useState<ReportScope>('personal');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');

    // Project Dropdown State
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const activeProject = projects.find(p => p.id === activeProjectId);
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const roleLevel = getUserRoleLevel(activeProjectId || undefined);

    // Set default team
    useEffect(() => {
        if (teams.length > 0 && !selectedTeamId) {
            const ownedTeam = teams.find(t => t.ownerId === currentUser?.id);
            setSelectedTeamId(ownedTeam?.id || teams[0].id);
        }
    }, [teams, currentUser, selectedTeamId]);

    // Default Selection Logic
    useEffect(() => {
        if (!activeProjectId && projects.length > 0) {
            setActiveProject(projects[0].id);
        }
    }, [activeProjectId, projects, setActiveProject]);

    // Metrics calculation based on scope
    const metrics = useMemo(() => {
        if (scope === 'personal' && currentUser) {
            return calculateUserMetrics(currentUser.id, activeProjectId || undefined);
        }
        if (scope === 'project' && activeProjectId) {
            return calculateProjectMetrics(activeProjectId);
        }
        if (scope === 'department' && selectedDeptId) {
            return calculateDepartmentMetrics(selectedDeptId);
        }
        if (scope === 'workspace' && selectedTeamId) {
            return calculateWorkspaceMetrics(selectedTeamId);
        }
        return null;
    }, [scope, currentUser, activeProjectId, selectedDeptId, selectedTeamId, tasks, columns]);

    const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

    const formatTime = (seconds: number) => {
        if (!seconds || seconds === 0) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Determine available scopes based on role
    const availableScopes = useMemo(() => {
        const scopes: { value: ReportScope; label: string; icon: any }[] = [
            { value: 'personal', label: 'My Performance', icon: UserIcon },
        ];

        if (roleLevel === 'lead' || roleLevel === 'manager' || roleLevel === 'depthead' || roleLevel === 'admin') {
            scopes.push({ value: 'project', label: 'Project', icon: Briefcase });
        }
        if (roleLevel === 'depthead' || roleLevel === 'admin') {
            scopes.push({ value: 'department', label: 'Department', icon: Building2 });
        }
        if (roleLevel === 'admin') {
            scopes.push({ value: 'workspace', label: 'Workspace', icon: Users });
        }

        return scopes;
    }, [roleLevel]);

    if (projects.length === 0 && scope === 'project') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    <BarChart3 size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Projects Yet</h2>
                    <p className="text-slate-500 dark:text-slate-400">Create a project to view reports</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-y-auto">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <BarChart3 className="text-primary" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {scope === 'personal' && 'Your personal performance metrics'}
                                {scope === 'project' && `Project: ${activeProject?.name || 'Select a project'}`}
                                {scope === 'department' && 'Department-wide analytics'}
                                {scope === 'workspace' && 'Organization overview'}
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
                                        ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <s.icon size={16} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Project Selector (for project scope) */}
                {scope === 'project' && (
                    <div className="mt-4 relative">
                        <button
                            onClick={() => setIsProjectOpen(!isProjectOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <Briefcase size={16} className="text-primary" />
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
                                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
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
                                                        ? 'bg-primary/5 text-primary font-medium'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <span className="w-2 h-2 rounded-full shrink-0 bg-primary"></span>
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
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6">
                {/* Personal Scope Dashboard */}
                {scope === 'personal' && metrics && (
                    <>
                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard
                                icon={CheckCircle}
                                label="Tasks Completed"
                                value={metrics.tasksCompleted}
                                color="green"
                                trend={metrics.productivityTrend}
                            />
                            <MetricCard
                                icon={Activity}
                                label="In Progress"
                                value={metrics.tasksInProgress}
                                color="blue"
                            />
                            <MetricCard
                                icon={Clock}
                                label="Time Tracked"
                                value={formatTime(metrics.totalTimeTracked)}
                                color="purple"
                                isText
                            />
                            <MetricCard
                                icon={Zap}
                                label="Velocity Score"
                                value={metrics.velocityScore}
                                color="orange"
                                suffix="/100"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Productivity Trend */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <TrendingUp className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Productivity Trend</h3>
                                        <p className="text-xs text-slate-500">Tasks completed per day (last 7 days)</p>
                                    </div>
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={metrics.productivityTrend.map((val: number, idx: number) => ({ day: `Day ${idx + 1}`, tasks: val }))}>
                                            <defs>
                                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTasks)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Task Distribution */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Target className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Task Distribution</h3>
                                        <p className="text-xs text-slate-500">Current status breakdown</p>
                                    </div>
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Completed', value: metrics.tasksCompleted },
                                                    { name: 'In Progress', value: metrics.tasksInProgress },
                                                    { name: 'Pending', value: metrics.tasksPending },
                                                    { name: 'Overdue', value: metrics.tasksOverdue },
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {[0, 1, 2, 3].map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Award className="text-orange-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Performance Summary</h3>
                                    <p className="text-xs text-slate-500">Key insights about your work</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InsightCard
                                    title="Average Completion Time"
                                    value={formatTime(metrics.avgCompletionTime)}
                                    description="Time from start to done"
                                    icon={Clock}
                                />
                                <InsightCard
                                    title="Pending Tasks"
                                    value={metrics.tasksPending}
                                    description={metrics.tasksPending > 5 ? 'Consider prioritizing' : 'Looking good!'}
                                    icon={Target}
                                    warning={metrics.tasksPending > 5}
                                />
                                <InsightCard
                                    title="Overdue Count"
                                    value={metrics.tasksOverdue}
                                    description={metrics.tasksOverdue > 0 ? 'Needs attention' : 'All on track!'}
                                    icon={AlertTriangle}
                                    warning={metrics.tasksOverdue > 0}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Project Scope Dashboard */}
                {scope === 'project' && metrics && (
                    <>
                        {/* Health Score Banner */}
                        <div className="bg-gradient-to-r from-primary to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm font-medium">Project Health Score</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-5xl font-bold">{metrics.healthScore}</span>
                                        <span className="text-2xl text-white/80">/100</span>
                                    </div>
                                    <p className="text-white/70 text-sm mt-2">
                                        {metrics.healthScore >= 80 ? '🎉 Excellent! Project is on track' :
                                            metrics.healthScore >= 60 ? '👍 Good, minor improvements possible' :
                                                metrics.healthScore >= 40 ? '⚠️ Needs attention' : '🚨 Critical - immediate action required'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/80 text-sm">On-Time Rate</p>
                                    <p className="text-3xl font-bold">{metrics.onTimeRate}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Project Metrics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <MetricCard icon={CheckCircle} label="Completed" value={metrics.completedTasks} color="green" />
                            <MetricCard icon={Activity} label="In Progress" value={metrics.inProgressTasks} color="blue" />
                            <MetricCard icon={Clock} label="Pending" value={metrics.pendingTasks} color="slate" />
                            <MetricCard icon={AlertTriangle} label="Overdue" value={metrics.overdueTasks} color="red" />
                            <MetricCard icon={Clock} label="Total Time" value={formatTime(metrics.totalTimeTracked)} color="purple" isText />
                        </div>

                        {/* Bottleneck Alert */}
                        {metrics.bottleneckColumn && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <AlertTriangle className="text-amber-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-800 dark:text-amber-200">Bottleneck Detected</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Column "{metrics.bottleneckColumn}" has a high number of tasks. Consider reviewing workflow.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Team Performance Table */}
                        {metrics.memberMetrics && metrics.memberMetrics.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Users className="text-blue-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Team Performance</h3>
                                            <p className="text-xs text-slate-500">Individual member metrics</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Member</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Completed</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">In Progress</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Pending</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Time Tracked</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Velocity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {metrics.memberMetrics.map((member: any) => (
                                                <tr key={member.userId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white text-sm font-bold">
                                                                {member.userName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-white">{member.userName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            {member.tasksCompleted}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {member.tasksInProgress}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                            {member.tasksPending}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                                                        {formatTime(member.totalTimeTracked)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <VelocityBadge score={member.velocityScore} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Workspace/Department Scope - Summary View */}
                {(scope === 'workspace' || scope === 'department') && metrics && (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard icon={Briefcase} label="Projects" value={metrics.totalProjects || 0} color="blue" />
                            <MetricCard icon={Users} label="Active Members" value={metrics.activeMembers || metrics.totalMembers || 0} color="purple" />
                            <MetricCard icon={CheckCircle} label="Tasks Done" value={metrics.completedTasks} color="green" />
                            <MetricCard icon={Target} label="Avg Health" value={metrics.avgHealthScore} color="orange" suffix="/100" />
                        </div>

                        {/* Projects/Departments List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    {scope === 'workspace' ? 'Department Overview' : 'Project Overview'}
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {(scope === 'workspace' ? metrics.departmentMetrics : metrics.projectMetrics)?.map((item: any) => (
                                    <div
                                        key={item.departmentId || item.projectId}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                {scope === 'workspace' ? <Building2 className="text-primary" size={18} /> : <Briefcase className="text-primary" size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{item.departmentName || item.projectName}</p>
                                                <p className="text-xs text-slate-500">
                                                    {scope === 'workspace'
                                                        ? `${item.totalProjects} projects • ${item.activeMembers} members`
                                                        : `${item.completedTasks}/${item.totalTasks} tasks completed`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.avgHealthScore || item.healthScore}%</p>
                                                <p className="text-xs text-slate-500">Health</p>
                                            </div>
                                            <HealthBar score={item.avgHealthScore || item.healthScore} />
                                        </div>
                                    </div>
                                ))}
                                {(!metrics.departmentMetrics?.length && !metrics.projectMetrics?.length) && (
                                    <div className="text-center py-8 text-slate-500">
                                        No data available for this scope
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* No Metrics Fallback */}
                {!metrics && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No Data Available</h3>
                            <p className="text-slate-500 mt-1">Select a different scope or add some tasks to see analytics</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'slate';
    trend?: number[];
    suffix?: string;
    isText?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color, trend, suffix, isText }) => {
    const colorClasses = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
        slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
                {suffix && <span className="text-lg text-slate-400">{suffix}</span>}
            </div>
            {trend && trend.length > 0 && (
                <div className="mt-3 flex items-end gap-0.5 h-8">
                    {trend.map((val, idx) => (
                        <div
                            key={idx}
                            className="flex-1 bg-primary/20 rounded-t"
                            style={{ height: `${Math.max(10, (val / Math.max(...trend)) * 100)}%` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface InsightCardProps {
    title: string;
    value: number | string;
    description: string;
    icon: React.ElementType;
    warning?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, value, description, icon: Icon, warning }) => (
    <div className={`p-4 rounded-xl border ${warning ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`}>
        <div className="flex items-center gap-2 mb-2">
            <Icon size={16} className={warning ? 'text-amber-600' : 'text-slate-500'} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</span>
        </div>
        <p className={`text-2xl font-bold ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        <p className={`text-xs mt-1 ${warning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{description}</p>
    </div>
);

const VelocityBadge: React.FC<{ score: number }> = ({ score }) => {
    const colorClass = score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {score}
        </span>
    );
};

const HealthBar: React.FC<{ score: number }> = ({ score }) => {
    const colorClass = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
        </div>
    );
};
