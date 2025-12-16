import React from 'react';
import { Modal } from './Modal';
import { Crown } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, featureName }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Premium Feature Locked">
            <div className="text-center space-y-6 p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-yellow-200">
                    <Crown size={40} className="drop-shadow-sm" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Unlock {featureName}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                        This feature is available exclusively on the Premium plan. Upgrade your workspace to access advanced tools.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => window.open('https://doneone.app/pricing', '_blank')}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <Crown size={18} />
                        Upgrade to Premium
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};
