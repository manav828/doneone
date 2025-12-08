import React from 'react';
import { Modal } from './Modal';
import { Check, X, Crown, Zap, Shield, Users, Clock, Database, Image } from 'lucide-react';
import { useStore } from '../store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const PricingModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { canAccessPremium } = useStore();
    const isPremium = canAccessPremium();

    const features = [
        { name: 'Active Projects', basic: '3', premium: 'Unlimited', icon: <Zap size={16} /> },
        { name: 'Active Team Members', basic: 'Max 2', premium: 'Unlimited', icon: <Users size={16} /> },
        { name: 'Task History Retention', basic: '7 Days', premium: 'Unlimited', icon: <Clock size={16} /> },
        { name: 'Image Uploads', basic: 'Limit 3/Task', premium: 'Unlimited', icon: <Image size={16} /> },
        { name: 'Time Tracking', basic: <X size={16} className="text-slate-300" />, premium: <Check size={16} className="text-green-500" />, icon: <Clock size={16} /> },
        { name: 'Advanced Reports', basic: <X size={16} className="text-slate-300" />, premium: <Check size={16} className="text-green-500" />, icon: <Database size={16} /> },
        { name: 'Priority Support', basic: <X size={16} className="text-slate-300" />, premium: <Check size={16} className="text-green-500" />, icon: <Shield size={16} /> },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Plans & Pricing">
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Unlock Your Full Potential</h2>
                    <p className="text-slate-500 dark:text-slate-400">Choose the plan that fits your workflow.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Basic Plan */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 relative bg-white dark:bg-slate-800">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Basic</h3>
                        <div className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Free</div>
                        <ul className="space-y-3 mb-8">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">{f.icon} {f.name}</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{f.basic}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={isPremium}
                            className="w-full py-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPremium ? 'Included' : 'Current Plan'}
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="border-2 border-yellow-400 dark:border-yellow-500 rounded-xl p-6 relative bg-gradient-to-b from-yellow-50/50 to-white dark:from-yellow-900/10 dark:to-slate-800 shadow-xl scale-105 transform z-10">
                        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            MOST POPULAR
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">Premium</h3>
                            <Crown size={20} className="text-yellow-500 fill-current" />
                        </div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">$9<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                        <p className="text-xs text-slate-400 mb-6">or $90/year (save 2 months)</p>

                        <ul className="space-y-3 mb-8">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">{f.icon} {f.name}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{f.premium}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => {
                                // In a real app, this would trigger Stripe checkout
                                window.open('https://buy.stripe.com/test_...', '_blank');
                            }}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            {isPremium ? 'Extend Subscription' : 'Start 30-Day Free Trial'}
                        </button>
                        <p className="text-[10px] text-center text-slate-400 mt-2">No credit card required for trial.</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
