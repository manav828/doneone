import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
// import Confetti from 'react-confetti'; // Removed dependency to avoid build error

interface Props {
    // Logic handled internally or passed from parent? 
    // Let's control visibility from parent (App.tsx) based on local storage + date.
    isOpen: boolean;
    onClose: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    {/* We can't easily install react-confetti without npm. We'll skip it or use a CSS animation. */}
                </div>
            )}
            <Modal isOpen={isOpen} onClose={onClose} title="">
                <div className="text-center p-4">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Crown size={40} className="text-yellow-500 fill-current" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 mb-2">
                        Congratulations!
                    </h2>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-6">
                        You've unlocked a <span className="font-bold text-yellow-600 dark:text-yellow-400">30-Day Premium Free Trial</span>
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8 text-left space-y-3 border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">What's included:</h3>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-slate-700 dark:text-slate-300">Unlimited Projects & Members</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-slate-700 dark:text-slate-300">Time Tracking & Advanced Reports</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-slate-700 dark:text-slate-300">Unlimited Task History</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-slate-700 dark:text-slate-300">Unlimited Image Uploads</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        Start Creating <ArrowRight size={20} />
                    </button>
                </div>
            </Modal>
        </>
    );
};
