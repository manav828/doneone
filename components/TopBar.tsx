import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Moon, Sun, Bell, Users, LogOut, Filter, User as UserIcon, ChevronDown, Check, Layout, List, Calendar, Search, BarChart, Database, Settings, HelpCircle, Crown, Camera, MessageSquare } from 'lucide-react';
import { HelpSupportModal } from './HelpSupportModal';
import { ProjectMembersModal } from './ProjectMembersModal';
import { ReportsModal } from './ReportsModal';
import { DataManagementModal } from './DataManagementModal';
import { PremiumModal } from './PremiumModal';
import { PricingModal } from './PricingModal';
import { UserTicketsModal } from './UserTicketsModal';

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
    setSearchQuery,
    canAccessPremium,
    isPricingModalOpen,
    setPricingModalOpen,
    uploadFile,
    updateUserProfile
  } = useStore();

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isUserTicketsModalOpen, setIsUserTicketsModalOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (currentUser) setNameInput(currentUser.name);
  }, [currentUser]);

  const handleNameSave = async () => {
    if (!currentUser || !nameInput.trim() || nameInput === currentUser.name) return;
    await updateUserProfile(currentUser.id, { name: nameInput });
  };

  const toggleMultipleInProgress = async () => {
    if (!currentUser) return;
    await updateUserProfile(currentUser.id, { allowMultipleInProgress: !currentUser.allowMultipleInProgress });
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

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

  const handleViewChange = (view: 'board' | 'list' | 'calendar' | 'timeline') => {
    if (view !== 'board' && !canAccessPremium()) {
      setPremiumFeature(view === 'list' ? 'List View' : 'Calendar View');
      setIsPremiumModalOpen(true);
      return;
    }
    setView(view);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        await updateUserProfile(currentUser.id, { avatar: url });
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
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

          {activeProject && location.pathname === '/' && (
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
              {/* Removed Member Filter as per request */}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Help & Support */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-full transition-colors"
            title="Help & Support"
          >
            <HelpCircle size={20} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {activeProject && location.pathname === '/' && (
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
                <button
                  onClick={() => handleViewChange('timeline')}
                  className={`p-1.5 rounded-md transition-all ${currentView === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Timeline View (Premium)"
                >
                  <List size={16} className="rotate-90" />
                </button>
              </div>
            </>
          )}

          {activeProject && (
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
              <div className={`relative h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 transition-all group-hover:ring-primary/30 ${canAccessPremium() ? 'ring-yellow-400 dark:ring-yellow-500' : 'ring-white dark:ring-slate-800'} overflow-hidden`}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
                {canAccessPremium() && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-white p-0.5 rounded-full border border-white dark:border-slate-900 z-10 w-3 h-3 flex items-center justify-center">
                    <Crown size={8} fill="currentColor" />
                  </div>
                )}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-modal border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 relative">

                  {/* Large Avatar in Dropdown */}
                  <div className="flex justify-center mb-3">
                    <div
                      className="relative w-16 h-16 rounded-full group cursor-pointer ring-4 ring-white dark:ring-slate-700 shadow-md"
                      onClick={handleAvatarClick}
                    >
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera size={20} className="text-white" />
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center px-4">
                    <input
                      className="font-bold text-slate-900 dark:text-white text-base text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none transition-colors w-full mb-0.5"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      title="Click to edit name"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap justify-center">
                    <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] rounded-md uppercase font-bold tracking-wider shadow-sm">
                      {currentUser.role}
                    </span>
                    {canAccessPremium() ? (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 text-[10px] rounded-md uppercase font-bold tracking-wider shadow-sm gap-1">
                        <Crown size={10} /> Premium
                        {currentUser.createdAt && (Date.now() - currentUser.createdAt < 30 * 24 * 60 * 60 * 1000) && !currentUser.premiumUntil && (
                          <span className="opacity-75 normal-case ml-1">
                            (Trial: {Math.ceil((30 - (Date.now() - currentUser.createdAt) / (1000 * 60 * 60 * 24)))}d left)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] rounded-md uppercase font-bold tracking-wider shadow-sm">
                        Basic Plan
                      </span>
                    )}
                  </div>

                  {/* Allow Multiple In Progress Toggle */}
                  <div className="mt-3 px-1 py-1 flex items-center justify-between group" title="Allow more than one task in 'In Progress' column">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Multiple In Progress</span>
                    <button
                      onClick={toggleMultipleInProgress}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${currentUser.allowMultipleInProgress ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span
                        className={`${currentUser.allowMultipleInProgress ? 'translate-x-5' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm`}
                      />
                    </button>
                  </div>

                </div>

                {!canAccessPremium() && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setPricingModalOpen(true);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 flex items-center gap-2 transition-colors font-bold border-b border-slate-100 dark:border-slate-700"
                  >
                    <Crown size={16} />
                    Upgrade to Premium
                  </button>
                )}
                {canAccessPremium() && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setPricingModalOpen(true);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors font-medium border-b border-slate-100 dark:border-slate-700"
                  >
                    <Crown size={16} className="text-yellow-500" />
                    View Plan & Billing
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsUserTicketsModalOpen(true);
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors font-medium border-b border-slate-100 dark:border-slate-700"
                >
                  <MessageSquare size={16} />
                  My Support Tickets
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    const event = new CustomEvent('openArchiveSettings');
                    window.dispatchEvent(event);
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors font-medium border-b border-slate-100 dark:border-slate-700"
                >
                  <Settings size={16} />
                  Archive Settings
                </button>
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
      </header >

      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} />
      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setPricingModalOpen(false)} />
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        featureName={premiumFeature}
      />
      <HelpSupportModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <UserTicketsModal isOpen={isUserTicketsModalOpen} onClose={() => setIsUserTicketsModalOpen(false)} />
    </>
  );
};