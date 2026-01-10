import React, { useState, useEffect } from 'react';

interface DevModeWrapperProps {
    children: React.ReactNode;
}

/**
 * DevModeWrapper - Only renders children if developer mode is enabled
 * Set localStorage key "doneone" to "yes" to enable developer features
 * 
 * In browser console: localStorage.setItem('doneone', 'yes')
 */
export const DevModeWrapper: React.FC<DevModeWrapperProps> = ({ children }) => {
    const [isDevMode, setIsDevMode] = useState(false);

    useEffect(() => {
        const checkDevMode = () => {
            const devFlag = localStorage.getItem('doneone');
            setIsDevMode(devFlag === 'yes');
        };

        checkDevMode();

        // Listen for storage changes (in case developer enables it in another tab)
        window.addEventListener('storage', checkDevMode);
        return () => window.removeEventListener('storage', checkDevMode);
    }, []);

    if (!isDevMode) return null;

    return <>{children}</>;
};

// Helper function to check dev mode
export const isDevModeEnabled = (): boolean => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('doneone') === 'yes';
    }
    return false;
};
