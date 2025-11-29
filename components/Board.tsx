import React, { useState } from 'react';
import { useStore } from '../store';
import { Filter, Tag as TagIcon, X, User, Columns } from 'lucide-react';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import { CalendarView } from './views/CalendarView';

export const Board: React.FC = () => {
  const {
    activeProjectId,
    columns,
    getFilteredTasks,
    tags,
    activeTagFilter,
    setTagFilter,
    activeMemberFilter,
    setMemberFilter,
    activeStatusFilter,
    setStatusFilter,
    getVisibleUsers,
    currentUser,
    currentView
  } = useStore();

  const visibleTasks = activeProjectId ? getFilteredTasks(activeProjectId) : [];
  const visibleUsers = getVisibleUsers();
  const usersToFilter = visibleUsers.filter(u => u.id !== currentUser?.id);

  const projectColumns = columns
    .filter(c => c.projectId === activeProjectId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (!activeProjectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="text-6xl grayscale opacity-50">👋</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Welcome to FlowBoard</h2>
        <p className="mt-2 text-slate-500 max-w-xs text-center">Select a project from the sidebar or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter Toolbar */}
      <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3 shrink-0">
        {/* Member Filter */}
        {usersToFilter.length > 0 && (
          <div className="relative group">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <User size={12} />
            </div>
            <select
              value={activeMemberFilter || ''}
              onChange={(e) => setMemberFilter(e.target.value || null)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full pl-8 pr-8 py-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all min-w-[120px]"
            >
              <option value="">All Members</option>
              {usersToFilter.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {activeMemberFilter && (
              <button onClick={() => setMemberFilter(null)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X size={10} />
              </button>
            )}
          </div>
        )}

        {/* Status Filter */}
        <div className="relative group">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            <Columns size={12} />
          </div>
          <select
            value={activeStatusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full pl-8 pr-8 py-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all min-w-[120px]"
          >
            <option value="">All Statuses</option>
            {projectColumns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {activeStatusFilter && (
            <button onClick={() => setStatusFilter(null)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
              <X size={10} />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        <div className="relative group">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            <TagIcon size={12} />
          </div>
          <select
            value={activeTagFilter || ''}
            onChange={(e) => setTagFilter(e.target.value || null)}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full pl-8 pr-8 py-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all min-w-[120px]"
          >
            <option value="">All Tags</option>
            {tags.filter(t => !t.projectId || t.projectId === activeProjectId).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {activeTagFilter && (
            <button onClick={() => setTagFilter(null)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* View Content */}
      {currentView === 'board' && (
        <KanbanView tasks={visibleTasks} columns={projectColumns} />
      )}
      {currentView === 'list' && (
        <ListView tasks={visibleTasks} columns={projectColumns} users={visibleUsers} />
      )}
      {currentView === 'calendar' && (
        <CalendarView tasks={visibleTasks} columns={projectColumns} />
      )}
    </div>
  );
};
