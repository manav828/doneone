import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useStore } from '../store';

interface TopBarMobileProps {
    onMenuClick: () => void;
    onNotificationsClick: () => void;
    onProfileClick: () => void;
}

export const TopBarMobile: React.FC<TopBarMobileProps> = ({
    onMenuClick,
    onNotificationsClick,
    onProfileClick,
}) => {
    const { activeProjectId, projects, notifications, currentUser } = useStore();
    const activeProject = projects.find(p => p.id === activeProjectId);

    const myNotifications = notifications.filter(n => n.recipientId === currentUser?.id);
    const unreadCount = myNotifications.filter(n => !n.read).length;

    return (
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
            {/* Left: Menu Button */}
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 rounded-lg transition-colors touch-target"
                aria-label="Open menu"
            >
                <Menu size={22} />
            </button>

            {/* Center: Project Name */}
            <div className="flex-1 px-3 text-center">
                <h1 className="text-base font-bold text-slate-800 dark:text-white truncate">
                    {activeProject?.name || 'DoneOne'}
                </h1>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-1">
                {/* Notifications */}
                <button
                    onClick={onNotificationsClick}
                    className="p-2 text-slate-600 dark:text-slate-400 relative touch-target active:bg-slate-100 dark:active:bg-slate-800 rounded-lg"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    )}
                </button>

                {/* Profile */}
                <button
                    onClick={onProfileClick}
                    className="p-1 touch-target"
                    aria-label="Profile"
                >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span>{currentUser?.name.charAt(0) || 'U'}</span>
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
};
