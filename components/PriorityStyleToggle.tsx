import React, { useState, useEffect, useRef } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';

export type PriorityStyle = 'border' | 'border-animated' | 'accent-bar' | 'gradient-glow' | 'gradient-animated' | 'corner-ribbon' | 'soft-background';

interface StyleConfig {
    id: PriorityStyle;
    name: string;
    description: string;
}

const styles: StyleConfig[] = [
    { id: 'border', name: 'Border', description: 'Clean colored border' },
    { id: 'border-animated', name: 'Border Pulse', description: 'Animated glow border' },
    { id: 'accent-bar', name: 'Left Accent', description: 'Colored left bar' },
    { id: 'gradient-glow', name: 'Gradient Glow', description: 'Static edge glow' },
    { id: 'gradient-animated', name: 'Gradient Pulse', description: 'Animated glow effect' },
    { id: 'corner-ribbon', name: 'Corner Ribbon', description: 'Diagonal ribbon' },
    { id: 'soft-background', name: 'Soft Background', description: 'Light tint with accent bar' },
];

export const PriorityStyleToggle: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStyle, setCurrentStyle] = useState<PriorityStyle>('soft-background');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedStyle = localStorage.getItem('doneone_priority_style') as PriorityStyle;
        if (savedStyle && ['border', 'border-animated', 'accent-bar', 'gradient-glow', 'gradient-animated', 'corner-ribbon', 'soft-background'].includes(savedStyle)) {
            setCurrentStyle(savedStyle);
            document.documentElement.setAttribute('data-priority-style', savedStyle);
        } else {
            // Default to soft-background if no preference saved
            document.documentElement.setAttribute('data-priority-style', 'soft-background');
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

    const handleStyleChange = (style: PriorityStyle) => {
        setCurrentStyle(style);
        localStorage.setItem('doneone_priority_style', style);
        document.documentElement.setAttribute('data-priority-style', style);
        setIsOpen(false);
    };

    const currentStyleConfig = styles.find(s => s.id === currentStyle)!;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-xs font-medium"
                title="Priority Card Style"
            >
                <Palette size={14} />
                <span className="hidden sm:inline">{currentStyleConfig.name}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Priority Style
                        </h4>
                    </div>
                    <div className="py-1">
                        {styles.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleStyleChange(style.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${currentStyle === style.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <div className="text-left">
                                    <span className="font-medium block">{style.name}</span>
                                    <span className="text-[10px] text-slate-400">{style.description}</span>
                                </div>
                                {currentStyle === style.id && <Check size={16} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper to get current priority style
export const getPriorityStyle = (): PriorityStyle => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('doneone_priority_style') as PriorityStyle) || 'border';
    }
    return 'border';
};
