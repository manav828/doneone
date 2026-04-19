import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileSidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

/**
 * Mobile drawer component that slides in from the left
 * Uses a backdrop overlay and handles touch gestures for closing
 */
export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
    isOpen,
    onClose,
    children,
}) => {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10 touch-target"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                {/* Drawer Content */}
                <div className="h-full overflow-y-auto safe-area-inset">
                    {children}
                </div>
            </div>
        </div>
    );
};
