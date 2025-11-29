import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Moon, Sun, Bell, Users, LogOut, Filter, User as UserIcon, ChevronDown, Check, Layout, List, Calendar, Search, BarChart, Database } from 'lucide-react';
import { ProjectMembersModal } from './ProjectMembersModal';
import { ReportsModal } from './ReportsModal';
import { DataManagementModal } from './DataManagementModal';

export const TopBar: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    currentUser,
    projects,
    activeProjectId,
    activities,
    notifications,
    markNotificationRead,
    clearNotifications,
    signOut,
    activeMemberFilter,
    setMemberFilter,
    getVisibleUsers,
    currentView,
    setView,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const recentActivity = activities.find(a => a.projectId === activeProjectId);
  const visibleUsers = getVisibleUsers();
  const usersToFilter = visibleUsers.filter(u => u.id !== currentUser?.id);

  const myNotifications = notifications
    .filter(n => n.recipientId === currentUser?.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = myNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    const color = activeProject?.themeColor || '#3b82f6';
    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-primary-hover', color);
  }, [activeProject]);

  const handleViewChange = (view: 'board' | 'list' | 'calendar') => {
    if (view !== 'board' && !currentUser?.isPremium) {
      alert("Upgrade to Premium to access List and Calendar views!");
      return;
    }
    setView(view);
  };

  if (!currentUser) return null;

  return (
    <>
      <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300 relative">
        <div className="flex items-center gap-6">
          {activeProject ? (
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                {activeProject.name}
              </h2>
              {recentActivity ? (
                <p className="text-[11px] text-slate-400 truncate max-w-md font-medium">
                  {recentActivity.description} <span className="text-slate-300 dark:text-slate-600">•</span> {new Date(recentActivity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Project Workspace</p>
              )}
            </div>
          ) : (
            <h2 className="text-lg font-medium text-slate-400">Dashboard</h2>
          )}

          {activeProject && (
            <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-slate-700 h-8">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Filters */}
              {usersToFilter.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filter:</span>
                  <div className="relative group">
                    <select
                      value={activeMemberFilter || ''}
                      onChange={(e) => setMemberFilter(e.target.value || null)}
                      className="appearance-none bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 pr-6 cursor-pointer focus:outline-none"
                    >
                      <option value="">All Members</option>
                      {usersToFilter.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeProject && (
            <>
              {/* View Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
                <button
                  onClick={() => handleViewChange('board')}
                  className={`p-1.5 rounded-md transition-all ${currentView === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Kanban Board"
                >
                  <Layout size={16} />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`p-1.5 rounded-md transition-all ${currentView === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View (Premium)"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => handleViewChange('calendar')}
                  className={`p-1.5 rounded-md transition-all ${currentView === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Calendar View (Premium)"
                >
                  <Calendar size={16} />
                </button>
              </div>

              {/* Advanced Tools */}
              <div className="flex items-center gap-1 mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                {activeProject.managerId === currentUser.id && (
                  <button
                    onClick={() => setIsReportsModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                    title="Reports (Manager Only)"
                  >
                    <BarChart size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsDataModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                  title="Data & Archive"
                >
                  <Database size={18} />
                </button>
                <button
                  onClick={() => setIsMembersModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                  title="Team Members"
                >
                  <Users size={18} />
                </button>
              </div>
            </>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={clearNotifications} className="text-xs text-primary hover:text-primary-hover font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {myNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      <Bell size={24} className="mx-auto mb-2 opacity-20" />
                      No notifications
                    </div>
                  ) : (
                    myNotifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-200">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative pl-2" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 group outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-800 transition-all group-hover:ring-primary/30">
                {currentUser.name.charAt(0)}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-modal border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white text-base">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] rounded-md uppercase font-bold tracking-wider shadow-sm">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} />
      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />
    </>
  );
};