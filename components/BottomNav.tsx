import React from 'react';
import { Home, BarChart2, Archive, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeProjectId } = useStore();

    const navItems = [
        {
            icon: Home,
            label: 'Board',
            path: '/',
            isActive: location.pathname === '/',
        },
        {
            icon: BarChart2,
            label: 'Reports',
            path: '/reports',
            isActive: location.pathname === '/reports',
        },
        {
            icon: Archive,
            label: 'History',
            path: '/history',
            isActive: location.pathname === '/history',
        },
        {
            icon: Settings,
            label: 'Settings',
            path: '/workspace',
            isActive: location.pathname === '/workspace',
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-inset-bottom">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-all touch-target ${item.isActive
                                    ? 'text-primary bg-primary/5'
                                    : 'text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800'
                                }`}
                            aria-label={item.label}
                        >
                            <Icon
                                size={20}
                                className={item.isActive ? 'text-primary' : ''}
                                strokeWidth={item.isActive ? 2.5 : 2}
                            />
                            <span
                                className={`text-[10px] mt-1 font-medium ${item.isActive ? 'text-primary' : ''
                                    }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
