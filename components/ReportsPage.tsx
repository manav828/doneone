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
    Zap, Award, Activity, BarChart3, Filter, X, HelpCircle, Info, PieChart as PieChartIcon
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
        teamMembers,
        calculateUserMetrics,
        calculateProjectMetrics,
        calculateWorkspaceMetrics,
        getUserRoleLevel,
        currentCompany,
    } = useStore();

    // Filter teams by Current Company
    const companyTeams = useMemo(() => {
        if (!currentCompany) return teams;
        return teams.filter(t => t.companyId === currentCompany.id);
    }, [teams, currentCompany]);

    // Scope State
    const [scope, setScope] = useState<ReportScope>('personal');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');

    // Project Dropdown State
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    // Team Dropdown State
    const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
    const [teamSearch, setTeamSearch] = useState('');

    // Member Selector State
    const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [memberSearch, setMemberSearch] = useState('');

    const activeProject = projects.find(p => p.id === activeProjectId);
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const filteredTeams = companyTeams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()));

    // Filter members for the selected team
    const currentTeamMembers = useMemo(() => {
        if (!selectedTeamId) return [];
        return teamMembers
            .filter(m => m.teamId === selectedTeamId)
            .map(m => users.find(u => u.id === m.userId))
            .filter(Boolean);
    }, [selectedTeamId, teamMembers, users]);

    const filteredMembers = currentTeamMembers.filter(u => u?.name.toLowerCase().includes(memberSearch.toLowerCase()));

    const roleLevel = getUserRoleLevel(activeProjectId || undefined);

    // Dynamic Column Selection State
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

    // Initialize default visible columns when project changes
    useEffect(() => {
        if (activeProjectId && columns.length > 0) {
            const projCols = columns.filter(c => c.projectId === activeProjectId);
            // Default to common status columns if they exist
            const defaultNames = ['Done', 'In Progress', 'Pending', 'To Do', 'Backlog'];
            const defaultIds = projCols
                .filter(c => defaultNames.includes(c.title))
                .map(c => c.id);

            if (defaultIds.length > 0) {
                setVisibleColumnIds(defaultIds);
            } else {
                // Fallback to first 3 columns
                setVisibleColumnIds(projCols.slice(0, 3).map(c => c.id));
            }
        }
    }, [activeProjectId, columns]);

    // Set default team and validate selection
    useEffect(() => {
        if (companyTeams.length > 0) {
            const isValid = companyTeams.some(t => t.id === selectedTeamId);
            if (!isValid) {
                const ownedTeam = companyTeams.find(t => t.ownerId === currentUser?.id);
                setSelectedTeamId(ownedTeam?.id || companyTeams[0].id);
            }
        }
    }, [companyTeams, currentUser, selectedTeamId]);

    // Reset member selection when team changes
    useEffect(() => {
        setSelectedMemberId('');
    }, [selectedTeamId]);

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
        if (scope === 'member' && selectedMemberId) {
            return calculateUserMetrics(selectedMemberId, undefined);
        }
        if (scope === 'project' && activeProjectId) {
            return calculateProjectMetrics(activeProjectId);
        }
        if (scope === 'workspace' && selectedTeamId) {
            return calculateWorkspaceMetrics(selectedTeamId);
        }
        return null;
    }, [scope, currentUser, activeProjectId, selectedTeamId, selectedMemberId, tasks, columns]);

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
        if (roleLevel === 'manager' || roleLevel === 'admin') {
            scopes.push({ value: 'member', label: 'Member', icon: UserIcon });
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
                                {scope === 'member' && `Member Report: ${users.find(u => u.id === selectedMemberId)?.name || 'Select a member'}`}
                                {scope === 'project' && `Project: ${activeProject?.name || 'Select a project'}`}
                                {scope === 'workspace' && `Workspace: ${teams.find(t => t.id === selectedTeamId)?.name || 'Organization overview'}`}
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

                {/* Team Selector (for workspace scope) */}
                {scope === 'workspace' && (
                    <div className="mt-4 relative">
                        <button
                            onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <Users size={16} className="text-primary" />
                            {companyTeams.find(t => t.id === selectedTeamId)?.name || 'Select Workspace'}
                            <ChevronDown size={16} className={`transition-transform ${isTeamSelectorOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTeamSelectorOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsTeamSelectorOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search workspaces..."
                                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                value={teamSearch}
                                                onChange={(e) => setTeamSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                                        {filteredTeams.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { setSelectedTeamId(t.id); setIsTeamSelectorOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${selectedTeamId === t.id
                                                    ? 'bg-primary/5 text-primary font-medium'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {t.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate">{t.name}</span>
                                                {selectedTeamId === t.id && <CheckCircle size={14} className="ml-auto opacity-50" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Member Selector (for member scope) */}
                {scope === 'member' && (
                    <div className="mt-4 flex gap-4">
                        {/* Reuse Team Selector concept for context if needed, but primary is Member */}
                        <div className="relative">
                            <button
                                onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Users size={16} className="text-primary" />
                                {companyTeams.find(t => t.id === selectedTeamId)?.name || 'Select Workspace'}
                                <ChevronDown size={16} className={`transition-transform ${isTeamSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isTeamSelectorOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsTeamSelectorOpen(false)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                            <input
                                                type="text"
                                                placeholder="Search workspaces..."
                                                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                value={teamSearch}
                                                onChange={(e) => setTeamSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-1">
                                            {filteredTeams.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => { setSelectedTeamId(t.id); setIsTeamSelectorOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${selectedTeamId === t.id ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    <span className="truncate">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsMemberSelectorOpen(!isMemberSelectorOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <UserIcon size={16} className="text-primary" />
                                {users.find(u => u.id === selectedMemberId)?.name || 'Select Member'}
                                <ChevronDown size={16} className={`transition-transform ${isMemberSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMemberSelectorOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMemberSelectorOpen(false)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                            <input
                                                type="text"
                                                placeholder="Search members..."
                                                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-1 text-slate-900 dark:text-slate-100">
                                            {filteredMembers.map((u: any) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { setSelectedMemberId(u.id); setIsMemberSelectorOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${selectedMemberId === u.id ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    <span className="truncate">{u.name}</span>
                                                </button>
                                            ))}
                                            {filteredMembers.length === 0 && <div className="p-3 text-xs text-slate-500 text-center">No members found in this team</div>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Section (For Project & Workspace) */}
            {(scope === 'project' || scope === 'workspace') && metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Pie Chart: Task Status */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <PieChartIcon size={18} className="text-primary" /> Task Breakdown
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Done', value: metrics.completedTasks || metrics.tasksCompleted, color: '#22c55e' },
                                            { name: 'In Progress', value: metrics.inProgressTasks || metrics.tasksInProgress, color: '#3b82f6' },
                                            { name: 'Pending', value: metrics.pendingTasks || metrics.tasksPending, color: '#f59e0b' },
                                            { name: 'Overdue', value: metrics.overdueTasks || metrics.tasksOverdue || 0, color: '#ef4444' }
                                        ].filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Done', value: metrics.completedTasks || metrics.tasksCompleted, color: '#22c55e' },
                                            { name: 'In Progress', value: metrics.inProgressTasks || metrics.tasksInProgress, color: '#3b82f6' },
                                            { name: 'Pending', value: metrics.pendingTasks || metrics.tasksPending, color: '#f59e0b' },
                                            { name: 'Overdue', value: metrics.overdueTasks || metrics.tasksOverdue || 0, color: '#ef4444' }
                                        ].filter(i => i.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: Workload */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary" />
                            Workload Distribution
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={
                                    scope === 'project'
                                        ? metrics.memberMetrics?.map((m: any) => ({ name: m.userName?.split(' ')[0], tasks: m.tasksCompleted + m.tasksInProgress }))
                                        : (metrics.projectMetrics?.reduce((acc: any[], p: any) => {
                                            // Aggregate members across projects for workspace view
                                            p.memberMetrics?.forEach((m: any) => {
                                                const existing = acc.find(x => x.name === m.userName?.split(' ')[0]);
                                                if (existing) existing.tasks += (m.tasksCompleted + m.tasksInProgress);
                                                else acc.push({ name: m.userName?.split(' ')[0], tasks: m.tasksCompleted + m.tasksInProgress });
                                            });
                                            return acc;
                                        }, []) || []).slice(0, 10) // Limit to top 10
                                }>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 p-6 space-y-6">
                {/* Personal & Member Scope Dashboard */}
                {(scope === 'personal' || scope === 'member') && metrics && (
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
                                                data={Object.entries(metrics.columnBreakdown || {}).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {Object.entries(metrics.columnBreakdown || {}).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                        <TrendingUp className="text-pink-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Efficiency</h3>
                                        <p className="text-xs text-slate-500">Actual vs Estimated Time</p>
                                    </div>
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Estimated', value: (metrics.totalEstimatedTime || 0) / 3600, fill: '#94a3b8' },
                                            { name: 'Actual', value: (metrics.totalTimeTracked || 0) / 3600, fill: (metrics.totalTimeTracked > (metrics.totalEstimatedTime || 0)) && metrics.totalEstimatedTime > 0 ? '#ef4444' : '#22c55e' }
                                        ]} layout="vertical" barSize={20}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" stroke="#94a3b8" fontSize={12} unit="h" />
                                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={70} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                            />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white">Detailed Task Report</h3>
                                <p className="text-xs text-slate-500">Breakdown of all assigned tasks</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium border-b dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-3">Task Name</th>
                                            <th className="px-6 py-3">Project</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Estimated</th>
                                            <th className="px-6 py-3 text-right">Actual</th>
                                            <th className="px-6 py-3 text-right">Variance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(metrics.tasks || []).map((t: any) => {
                                            const project = projects.find(p => p.id === t.projectId);
                                            const column = columns.find(c => c.id === t.columnId);
                                            const est = t.estimatedTime || 0;
                                            const act = t.timeTracked || 0;
                                            const diff = est - act;
                                            const isOver = diff < 0;

                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                                                        <div className="max-w-[200px] truncate" title={t.title}>{t.title}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500">{project?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                                            {column?.title || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-500">{formatTime(est)}</td>
                                                    <td className="px-6 py-3 text-right text-slate-500">{formatTime(act)}</td>
                                                    <td className={`px-6 py-3 text-right font-medium ${isOver && est > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {est > 0 ? (isOver ? '+' : '-') + formatTime(Math.abs(diff)) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!metrics.tasks || metrics.tasks.length === 0) && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                    No tasks found for this member
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Project Scope Dashboard */}
                {scope === 'project' && metrics && (
                    <>
                        {/* Health Score Banner */}
                        {/* Health Score Banner - Removed overflow-hidden to allow tooltip to show */}
                        <div className="bg-gradient-to-r from-primary to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-primary/20 relative">
                            {/* Explanation Tooltip */}
                            <div className="absolute top-4 right-4 group">
                                <button className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors relative z-20">
                                    <HelpCircle size={16} className="text-white" />
                                </button>
                                {/* Tooltip Content */}
                                <div className="absolute right-0 top-8 mt-2 w-64 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl text-slate-600 dark:text-slate-300 text-xs leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0 border border-slate-100 dark:border-slate-700">
                                    <div className="absolute -top-2 right-3 w-4 h-4 bg-white dark:bg-slate-800 transform rotate-45 border-t border-l border-slate-100 dark:border-slate-700"></div>
                                    <div className="relative z-10">
                                        <p className="font-bold mb-2 text-slate-900 dark:text-white text-sm">How is this calculated?</p>
                                        <ul className="space-y-1.5">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                <span><b>+40%</b> On-Time Rate</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                <span><b>+40%</b> Completion Rate</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                <span><b>-50%</b> Overdue Penalty</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                                <span>Base Score: <b>30 pts</b></span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white/80 text-sm font-medium">Project Health Score</p>
                                    </div>
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
                                <div className="text-right pr-12">
                                    <p className="text-white/80 text-sm">On-Time Rate</p>
                                    <p className="text-3xl font-bold">{metrics.onTimeRate}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Project Metrics Cards */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Column Metrics</h3>

                            {/* Column Visibility Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Filter size={14} />
                                    Customize Columns
                                    <ChevronDown size={14} />
                                </button>

                                {isColumnSelectorOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsColumnSelectorOpen(false)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                                <span className="font-medium text-xs text-slate-500 uppercase">Show Columns</span>
                                                <button onClick={() => setIsColumnSelectorOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                            </div>
                                            <div className="p-2 max-h-60 overflow-y-auto">
                                                {columns.filter(c => c.projectId === activeProjectId).map(col => (
                                                    <label key={col.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumnIds.includes(col.id)
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                                            }`}>
                                                            {visibleColumnIds.includes(col.id) && <CheckCircle size={10} fill="currentColor" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={visibleColumnIds.includes(col.id)}
                                                            onChange={() => {
                                                                if (visibleColumnIds.includes(col.id)) {
                                                                    setVisibleColumnIds(prev => prev.filter(id => id !== col.id));
                                                                } else {
                                                                    setVisibleColumnIds(prev => [...prev, col.id]);
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{col.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Dynamic Column Cards */}
                            {columns
                                .filter(c => c.projectId === activeProjectId && visibleColumnIds.includes(c.id))
                                .map(col => {
                                    // Calculate count specifically for this column
                                    const count = tasks.filter(t => t.projectId === activeProjectId && t.columnId === col.id).length;

                                    // Determine color based on title (heuristic)
                                    let color: 'green' | 'blue' | 'slate' | 'purple' | 'orange' | 'red' = 'slate';
                                    const title = col.title.toLowerCase();
                                    if (title.includes('done') || title.includes('complete')) color = 'green';
                                    else if (title.includes('progress') || title.includes('doing')) color = 'blue';
                                    else if (title.includes('review') || title.includes('test')) color = 'orange';
                                    else if (title.includes('backlog')) color = 'purple';

                                    // Choose icon
                                    const Icon = title.includes('done') ? CheckCircle :
                                        title.includes('progress') ? Activity :
                                            title.includes('review') ? Target : Clock;

                                    return (
                                        <MetricCard
                                            key={col.id}
                                            icon={Icon}
                                            label={col.title}
                                            value={count}
                                            color={color}
                                        />
                                    );
                                })}

                            {/* Standard Metrics (Always Visible) */}
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
                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Member</th>

                                                {/* Dynamic Column Headers */}
                                                {columns
                                                    .filter(c => c.projectId === activeProjectId && visibleColumnIds.includes(c.id))
                                                    .map(col => (
                                                        <th key={col.id} className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                                                            {col.title}
                                                        </th>
                                                    ))
                                                }

                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Time Tracked</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase group relative cursor-help">
                                                    <div className="flex items-center justify-center gap-1">
                                                        Velocity
                                                        <Info size={12} />
                                                    </div>
                                                    {/* Velocity Tooltip */}
                                                    <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg invisible group-hover:visible z-10 font-normal normal-case">
                                                        Score (0-100) based on:
                                                        <br />• Completion Rate (70%)
                                                        <br />• Last 7 days activity (30%)
                                                    </div>
                                                </th>
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

                                                    {/* Dynamic Cells */}
                                                    {columns
                                                        .filter(c => c.projectId === activeProjectId && visibleColumnIds.includes(c.id))
                                                        .map(col => {
                                                            const count = tasks.filter(t =>
                                                                t.projectId === activeProjectId &&
                                                                t.columnId === col.id &&
                                                                t.assigneeId === member.userId
                                                            ).length;

                                                            // Determine styling based on column title
                                                            let badgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
                                                            const title = col.title.toLowerCase();
                                                            if (title.includes('done') || title.includes('complete')) badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                                            else if (title.includes('progress')) badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                                                            else if (title.includes('review')) badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';

                                                            return (
                                                                <td key={col.id} className="px-6 py-4 text-center">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                                                        {count}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })
                                                    }

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

                {/* Workspace Scope - Summary View */}
                {scope === 'workspace' && metrics && (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard icon={Briefcase} label="Projects" value={metrics.totalProjects || 0} color="blue" />
                            <MetricCard icon={Users} label="Active Members" value={metrics.activeMembers || metrics.totalMembers || 0} color="purple" />
                            <MetricCard icon={CheckCircle} label="Tasks Done" value={metrics.completedTasks} color="green" />
                            <MetricCard icon={Target} label="Avg Health" value={metrics.avgHealthScore} color="orange" suffix="/100" />
                        </div>

                        {/* Projects List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    Project Overview
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {metrics.projectMetrics?.map((item: any) => (
                                    <div
                                        key={item.projectId}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Briefcase className="text-primary" size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{item.projectName}</p>
                                                <p className="text-xs text-slate-500">
                                                    {`${item.completedTasks}/${item.totalTasks} tasks completed`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.healthScore}%</p>
                                                <p className="text-xs text-slate-500">Health</p>
                                            </div>
                                            <HealthBar score={item.healthScore} />
                                        </div>
                                    </div>
                                ))}
                                {!metrics.projectMetrics?.length && (
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-0.5">
                <div className={`p-1 rounded-md ${colorClasses[color]}`}>
                    <Icon size={14} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
                <span className={`font-bold text-slate-900 dark:text-white ${isText ? 'text-lg' : 'text-xl'}`}>{value}</span>
                {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
            </div>
            {trend && trend.length > 0 && (
                <div className="mt-2 flex items-end gap-0.5 h-6 opacity-80">
                    {trend.map((val, idx) => (
                        <div
                            key={idx}
                            className="flex-1 bg-primary/20 rounded-t-sm"
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
