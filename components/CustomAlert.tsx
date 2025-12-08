
import React, { useEffect } from 'react';
import { useStore } from '../store';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const CustomAlert: React.FC = () => {
    const { customAlert, closeCustomAlert } = useStore();

    useEffect(() => {
        if (customAlert.isOpen) {
            // Auto-close success/info alerts after 3 seconds
            if (customAlert.type === 'success' || customAlert.type === 'info') {
                const timer = setTimeout(() => {
                    closeCustomAlert();
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [customAlert, closeCustomAlert]);

    if (!customAlert.isOpen) return null;

    const getIcon = () => {
        switch (customAlert.type) {
            case 'error': return <AlertCircle size={32} className="text-red-500" />;
            case 'success': return <CheckCircle2 size={32} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={32} className="text-yellow-500" />;
            default: return <Info size={32} className="text-blue-500" />;
        }
    };

    const getColors = () => {
        switch (customAlert.type) {
            case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
            case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
            case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
            default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
        }
    }

    const getTitle = () => {
        switch (customAlert.type) {
            case 'error': return 'Error';
            case 'success': return 'Success';
            case 'warning': return 'Warning';
            default: return 'Information';
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${getColors()} transform animate-in zoom-in-95 slide-in-from-bottom-2 duration-200`}>
                <button
                    onClick={closeCustomAlert}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                        {getIcon()}
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">{getTitle()}</h3>
                    <p className="text-sm opacity-90 font-medium leading-relaxed">
                        {customAlert.message}
                    </p>

                    {(customAlert.type === 'error' || customAlert.type === 'warning') && (
                        <button
                            onClick={closeCustomAlert}
                            className="mt-4 px-6 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 border border-black/5"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
