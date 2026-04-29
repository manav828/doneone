import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../store';
import {
  Archive, Download, X, Search, CheckCircle, Calendar, User as UserIcon,
  Clock, Filter, ChevronDown, ChevronUp, Briefcase, BarChart3
} from 'lucide-react';
import { TaskHistory, ReportScope } from '../types';
import { HistoryDetailDrawer } from './HistoryDetailDrawer';

export const HistoryPage: React.FC = () => {
  const {
    activeProjectId, setActiveProject, projects, taskHistory, loadTaskHistory,
    historyFilters, setHistoryFilters, exportHistoryToCSV,
    selectedHistoryIds, toggleHistorySelection, clearHistorySelection,
    users, currentUser, teams, departments, getUserRoleLevel,
  } = useStore();

  const [selectedHistory, setSelectedHistory] = useState<TaskHistory | null>(null);
  const [scope, setScope] = useState<ReportScope>('personal');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [expandStats, setExpandStats] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const roleLevel = getUserRoleLevel(activeProjectId || undefined);

  useEffect(() => {
    if (activeProjectId) loadTaskHistory(activeProjectId);
    else if (projects.length > 0) setActiveProject(projects[0].id);
  }, [activeProjectId, loadTaskHistory, projects, setActiveProject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchFocused]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setIsProjectOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const availableUsers = useMemo(() => {
    if (!activeProject || !currentUser) return [];
    const projectMembers = users.filter(u =>
      u.id === activeProject.ownerId || activeProject.leadIds?.includes(u.id) ||
      activeProject.resourceIds?.includes(u.id) || Object.keys(activeProject.reportsTo || {}).includes(u.id)
    );
    const isOwner = activeProject.ownerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
    if (isOwner || activeProject.viewAllReportsEnabled) return projectMembers;
    if (activeProject.leadIds?.includes(currentUser.id)) {
      const ids = Object.entries(activeProject.reportsTo || {}).filter(([_, l]) => l === currentUser.id).map(([r]) => r);
      ids.push(currentUser.id);
      return projectMembers.filter(u => ids.includes(u.id));
    }
    return projectMembers.filter(u => u.id === currentUser.id);
  }, [activeProject, currentUser, users]);

  const visibleHistory = useMemo(() => {
    if (!currentUser) return [];
    let filtered = [...taskHistory];
    if (scope === 'personal') {
      filtered = filtered.filter(h => h.taskData.assigneeId === currentUser.id || h.taskData.creatorId === currentUser.id);
    } else if (scope === 'project' && activeProject) {
      const isOwner = activeProject.ownerId === currentUser.id || currentUser.email === 'manavss828@gmail.com';
      if (!isOwner && !activeProject.viewAllReportsEnabled) {
        const ids = availableUsers.map(u => u.id);
        filtered = filtered.filter(h => (h.taskData.assigneeId && ids.includes(h.taskData.assigneeId)) || h.taskData.creatorId === currentUser.id);
      }
    }
    if (historyFilters.searchQuery) {
      const q = historyFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(h => h.taskData.title.toLowerCase().includes(q) || h.taskData.description?.toLowerCase().includes(q));
    }
    if (historyFilters.assigneeIds?.length) {
      filtered = filtered.filter(h => h.taskData.assigneeId && historyFilters.assigneeIds?.includes(h.taskData.assigneeId));
    }
    if (historyFilters.statusAtArchive) {
      filtered = filtered.filter(h => h.statusAtArchive === historyFilters.statusAtArchive);
    }
    if (historyFilters.dateStart) {
      const s = new Date(historyFilters.dateStart).getTime();
      filtered = filtered.filter(h => h.archivedAt >= s);
    }
    if (historyFilters.dateEnd) {
      const e = new Date(historyFilters.dateEnd).getTime() + 86400000;
      filtered = filtered.filter(h => h.archivedAt <= e);
    }
    return filtered.sort((a, b) => b.archivedAt - a.archivedAt);
  }, [taskHistory, availableUsers, activeProject, currentUser, scope, historyFilters]);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatRelative = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const getDateGroup = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return 'This Week';
    if (d < 14) return 'Last Week';
    return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const groupedHistory = useMemo(() => {
    const groups: { label: string; items: TaskHistory[] }[] = [];
    const map = new Map<string, TaskHistory[]>();
    visibleHistory.forEach(h => {
      const label = getDateGroup(h.archivedAt);
      if (!map.has(label)) { map.set(label, []); groups.push({ label, items: map.get(label)! }); }
      map.get(label)!.push(h);
    });
    return groups;
  }, [visibleHistory]);

  const stats = useMemo(() => {
    const total = visibleHistory.length;
    const done = visibleHistory.filter(h => h.statusAtArchive === 'Done').length;
    const totalTime = visibleHistory.reduce((s, h) => s + h.timeTaken, 0);
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, totalTime, rate };
  }, [visibleHistory]);

  const availableScopes = useMemo(() => {
    const s: { value: ReportScope; label: string }[] = [{ value: 'personal', label: 'My History' }];
    if (['lead', 'manager', 'depthead', 'admin'].includes(roleLevel)) s.push({ value: 'project', label: 'Project' });
    return s;
  }, [roleLevel]);

  const hasActiveFilters = !!(historyFilters.dateStart || historyFilters.dateEnd || historyFilters.assigneeIds?.length || historyFilters.statusAtArchive);

  const handleSelectAll = useCallback(() => {
    if (selectedHistoryIds.length === visibleHistory.length) clearHistorySelection();
    else visibleHistory.forEach(h => { if (!selectedHistoryIds.includes(h.id)) toggleHistorySelection(h.id); });
  }, [selectedHistoryIds, visibleHistory, clearHistorySelection, toggleHistorySelection]);

  const statusDot: Record<string, string> = { 'Done': 'bg-emerald-500', 'In Progress': 'bg-blue-500' };

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center p-8">
          <Archive size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No Projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create a project to view history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className={`relative flex-1 max-w-xs transition-all ${searchFocused ? 'max-w-md' : ''}`}>
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search… (press /)"
              value={historyFilters.searchQuery || ''}
              onChange={e => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 dark:text-white transition-all"
            />
          </div>

          {/* Scope pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0">
            {availableScopes.map(s => (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${scope === s.value
                  ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Project selector */}
          <div className="relative shrink-0" ref={projectRef}>
            <button
              onClick={() => setIsProjectOpen(!isProjectOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Briefcase size={13} className="text-orange-500" />
              <span className="max-w-[120px] truncate">{activeProject?.name || 'Select Project'}</span>
              <ChevronDown size={12} className={`transition-transform ${isProjectOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProjectOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-30 overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search projects…"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 rounded-md outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                  {projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setActiveProject(p.id); setIsProjectOpen(false); setProjectSearch(''); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                        activeProjectId === p.id
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${activeProjectId === p.id ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className="truncate">{p.name}</span>
                      {activeProjectId === p.id && <CheckCircle size={12} className="ml-auto opacity-50" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
              hasActiveFilters
                ? 'border-orange-300 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter size={13} />
            Filter{hasActiveFilters ? ` · ${[historyFilters.statusAtArchive, historyFilters.assigneeIds?.length ? 'member' : '', historyFilters.dateStart ? 'date' : ''].filter(Boolean).length}` : ''}
          </button>

          {/* Export (click-based) */}
          <div className="relative shrink-0" ref={exportRef}>
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-medium transition-all"
            >
              <Download size={13} />
              Export
            </button>
            {showExport && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1">
                {[
                  { mode: 'all' as const, label: `All (${visibleHistory.length})` },
                  { mode: 'filtered' as const, label: `Filtered (${visibleHistory.length})` },
                  { mode: 'selected' as const, label: `Selected (${selectedHistoryIds.length})`, disabled: !selectedHistoryIds.length },
                ].map(opt => (
                  <button
                    key={opt.mode}
                    disabled={opt.disabled}
                    onClick={() => { exportHistoryToCSV(opt.mode); setShowExport(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-2.5 flex items-center gap-3 flex-wrap bg-slate-50/50 dark:bg-slate-800/50">
          {/* Status */}
          <div className="flex items-center gap-1">
            {['Done', 'In Progress', 'Pending'].map(s => (
              <button
                key={s}
                onClick={() => setHistoryFilters({ ...historyFilters, statusAtArchive: historyFilters.statusAtArchive === s ? undefined : s })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  historyFilters.statusAtArchive === s
                    ? s === 'Done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : s === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Member */}
          <select
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2.5 py-1 text-xs outline-none dark:text-white cursor-pointer"
            value={historyFilters.assigneeIds?.[0] || 'all'}
            onChange={e => setHistoryFilters({ ...historyFilters, assigneeIds: e.target.value === 'all' ? undefined : [e.target.value] })}
          >
            <option value="all">All members</option>
            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs">
            <input type="date" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs outline-none dark:text-white" value={historyFilters.dateStart || ''} onChange={e => setHistoryFilters({ ...historyFilters, dateStart: e.target.value || null })} />
            <span className="text-slate-400">→</span>
            <input type="date" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs outline-none dark:text-white" value={historyFilters.dateEnd || ''} onChange={e => setHistoryFilters({ ...historyFilters, dateEnd: e.target.value || null })} />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => activeProjectId && setHistoryFilters({ projectId: activeProjectId })}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Summary strip ── */}
      {visibleHistory.length > 0 && (
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/30">
          <span className="font-medium text-slate-700 dark:text-slate-300">{stats.total} archived</span>
          <span>·</span>
          <span className="text-emerald-600 dark:text-emerald-400">{stats.done} completed ({stats.rate}%)</span>
          <span>·</span>
          <span>{formatTime(stats.totalTime)} tracked</span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        {visibleHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Archive size={28} className="text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {scope === 'personal' ? "You haven't archived any tasks yet" : 'No archived tasks for this project'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm leading-relaxed">
              Tasks move here when completed in columns with auto-archive enabled, or when manually archived.
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-5 py-2 flex items-center gap-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedHistoryIds.length === visibleHistory.length && visibleHistory.length > 0}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500 shrink-0"
              />
              <span className="w-[55%] min-w-0 shrink-0">Task</span>
              <span className="w-28 text-center shrink-0">Status</span>
              <span className="w-24 text-center shrink-0">Assignee</span>
              <span className="w-24 text-right shrink-0">Time</span>
              <span className="w-28 text-right shrink-0">Archived</span>
            </div>

            {/* Grouped rows */}
            {groupedHistory.map(group => (
              <div key={group.label}>
                <div className="sticky top-[33px] z-[5] px-5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{group.label}</span>
                  <span className="text-[10px] text-slate-400 ml-2">({group.items.length})</span>
                </div>
                {group.items.map(history => {
                  const task = history.taskData;
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const isSelected = selectedHistoryIds.includes(history.id);

                  return (
                    <div
                      key={history.id}
                      onClick={() => setSelectedHistory(history)}
                      className={`px-5 py-2.5 flex items-center gap-3 cursor-pointer border-b border-slate-50 dark:border-slate-800/50 transition-colors group ${
                        isSelected ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => { e.stopPropagation(); toggleHistorySelection(history.id); }}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500 shrink-0"
                      />
                      <div className="w-[55%] min-w-0 shrink-0">
                        <p className="text-sm text-slate-900 dark:text-white truncate capitalize leading-tight">
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mr-1.5">{task.id.slice(0, 8)}</span>
                          {task.title}
                        </p>
                      </div>
                      <div className="w-28 flex justify-center shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[history.statusAtArchive] || 'bg-amber-400'}`} />
                          {history.statusAtArchive}
                        </span>
                      </div>
                      <div className="w-24 flex justify-center shrink-0">
                        {assignee ? (
                          <div title={assignee.name} className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {assignee.name.charAt(0)}
                          </div>
                        ) : <span className="text-[11px] text-slate-400">—</span>}
                      </div>
                      <span className="w-24 text-right text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 tabular-nums">
                        {formatTime(history.timeTaken)}
                      </span>
                      <span className="w-28 text-right text-[11px] text-slate-400 shrink-0" title={formatFullDate(history.archivedAt)}>
                        {formatRelative(history.archivedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {selectedHistory && (
        <HistoryDetailDrawer
          history={selectedHistory}
          users={users}
          onClose={() => setSelectedHistory(null)}
          formatTime={formatTime}
        />
      )}
    </div>
  );
};
