import React, { useState } from 'react';
import { useStore } from '../store';
import { Filter, Tag as TagIcon, X, User, Columns, ArrowLeftRight } from 'lucide-react';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import { CalendarView } from './views/CalendarView';
import { TimelineView } from './views/TimelineView';
import { ColumnReorderModal } from './ColumnReorderModal';

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
    projects,
    currentView,
    can
  } = useStore();

  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const project = projects.find(p => p.id === activeProjectId);

  const visibleTasks = activeProjectId ? getFilteredTasks(activeProjectId) : [];
  const visibleUsers = getVisibleUsers();
  const usersToFilter = visibleUsers.filter(u => u.id !== currentUser?.id);

  const projectColumns = columns
    .filter(c => c.projectId === activeProjectId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (!activeProjectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 px-4">
        {/* Custom Illustration */}
        <div className="w-48 h-48 mb-6">
          <img
            src="/welcome_rocket.png"
            alt="Welcome"
            className="w-full h-full object-contain float-animation"
          />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome to DoneOne</h2>

        {/* Subtitle */}
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6 text-sm leading-relaxed">
          Your productivity command center. Select a project from the sidebar or create a new one to get started.
        </p>

        {/* Quick Tips */}
        <div className="flex gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono shadow-sm border border-slate-200 dark:border-slate-600">Ctrl+Shift+F</kbd>
            <span>Quick Add</span>
          </div>
        </div>
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

        {/* Arrange Columns Button */}
        {can('manageColumns') && currentView === 'board' && (
          <button
            onClick={() => setIsReorderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full hover:border-primary hover:text-primary transition-all shadow-sm"
            title="Arrange Columns"
          >
            <ArrowLeftRight size={12} />
            <span>Arrange</span>
          </button>
        )}
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
      {currentView === 'timeline' && (
        <TimelineView tasks={visibleTasks} users={visibleUsers} />
      )}

      {/* Modals */}
      <ColumnReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        projectId={activeProjectId}
      />
    </div>
  );
};
