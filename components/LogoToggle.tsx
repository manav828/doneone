import React, { useState, useEffect, useRef } from 'react';
import { Image, ChevronDown, Check } from 'lucide-react';

export type LogoOption = 'default' | 'logo1' | 'logo2' | 'logo3';

interface LogoConfig {
    id: LogoOption;
    name: string;
    path: string;
}

const logos: LogoConfig[] = [
    { id: 'default', name: 'Default', path: '/logo.png' },
    { id: 'logo1', name: 'Logo 1', path: '/logo1.jpg' },
    { id: 'logo2', name: 'Logo 2', path: '/logo2.jpg' },
    { id: 'logo3', name: 'Logo 3', path: '/logo3.png' },
];

export const LogoToggle: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<LogoOption>('default');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedLogo = localStorage.getItem('doneone_logo') as LogoOption;
        if (savedLogo && ['default', 'logo1', 'logo2', 'logo3'].includes(savedLogo)) {
            setCurrentLogo(savedLogo);
            document.documentElement.setAttribute('data-logo', savedLogo);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoChange = (logo: LogoOption) => {
        setCurrentLogo(logo);
        localStorage.setItem('doneone_logo', logo);
        document.documentElement.setAttribute('data-logo', logo);
        // Dispatch event so other components can react
        window.dispatchEvent(new CustomEvent('logoChange', { detail: logo }));
        setIsOpen(false);
    };

    const currentLogoConfig = logos.find(l => l.id === currentLogo)!;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-xs font-medium"
                title="Change Logo"
            >
                <Image size={14} />
                <span className="hidden sm:inline">{currentLogoConfig.name}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Logo
                        </h4>
                    </div>
                    <div className="py-1">
                        {logos.map((logo) => (
                            <button
                                key={logo.id}
                                onClick={() => handleLogoChange(logo.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${currentLogo === logo.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <img
                                    src={logo.path}
                                    alt={logo.name}
                                    className="w-6 h-6 object-contain rounded"
                                />
                                <span className="font-medium flex-1 text-left">{logo.name}</span>
                                {currentLogo === logo.id && <Check size={16} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper to get current logo path
export const getLogoPath = (): string => {
    if (typeof window !== 'undefined') {
        const savedLogo = localStorage.getItem('doneone_logo') as LogoOption;
        const logo = logos.find(l => l.id === savedLogo);
        return logo?.path || '/logo.png';
    }
    return '/logo.png';
};
