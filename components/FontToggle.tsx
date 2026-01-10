import React, { useState, useEffect, useRef } from 'react';
import { Type, ChevronDown, Check } from 'lucide-react';

type FontOption = 'inter' | 'roboto' | 'sfpro';

interface FontConfig {
    id: FontOption;
    name: string;
    preview: string;
}

const fonts: FontConfig[] = [
    { id: 'inter', name: 'Sans (Inter)', preview: 'Aa' },
    { id: 'roboto', name: 'Sans (Roboto)', preview: 'Aa' },
    { id: 'sfpro', name: 'Sans (SF Pro)', preview: 'Aa' },
];

export const FontToggle: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentFont, setCurrentFont] = useState<FontOption>('inter');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load saved font preference on mount
    useEffect(() => {
        const savedFont = localStorage.getItem('doneone_font') as FontOption;
        if (savedFont && ['inter', 'roboto', 'sfpro'].includes(savedFont)) {
            setCurrentFont(savedFont);
            document.documentElement.setAttribute('data-font', savedFont);
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFontChange = (font: FontOption) => {
        setCurrentFont(font);
        localStorage.setItem('doneone_font', font);
        document.documentElement.setAttribute('data-font', font);
        setIsOpen(false);
    };

    const currentFontConfig = fonts.find(f => f.id === currentFont)!;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-xs font-medium"
                title="Change Font"
            >
                <Type size={14} />
                <span className="hidden sm:inline">{currentFontConfig.name}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Font Family
                        </h4>
                    </div>
                    <div className="py-1">
                        {fonts.map((font) => (
                            <button
                                key={font.id}
                                onClick={() => handleFontChange(font.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${currentFont === font.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                style={{
                                    fontFamily:
                                        font.id === 'inter'
                                            ? "'Inter', sans-serif"
                                            : font.id === 'roboto'
                                                ? "'Roboto', sans-serif"
                                                : "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                                }}
                            >
                                <span className="font-medium">{font.name}</span>
                                {currentFont === font.id && <Check size={16} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
