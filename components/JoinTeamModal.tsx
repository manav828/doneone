import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Users, ArrowRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface JoinTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ isOpen, onClose }) => {
    const { joinCompany, fetchTeams } = useStore();
    const [joinCode, setJoinCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'invalid_code' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setStatus('loading');
        const result = await joinCompany(joinCode.trim());
        setStatus(result as any);

        if (result === 'success') {
            await fetchTeams();
            setTimeout(() => {
                onClose();
                setJoinCode('');
                setStatus('idle');
            }, 1500);
        }
    };

    const getStatusContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span>Joining Company...</span>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle size={16} />
                        <span>Successfully joined the company!</span>
                    </div>
                );
            case 'success_pending':
                return (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Clock size={16} />
                        <span>Request sent! Waiting for admin approval.</span>
                    </div>
                );
            case 'already_pending':
                return (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <AlertCircle size={16} />
                        <span>Join request is already pending.</span>
                    </div>
                );
            case 'already_joined':
                return (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <CheckCircle size={16} />
                        <span>You are already a member!</span>
                    </div>
                );
            case 'invalid_code':
                return (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle size={16} />
                        <span>Invalid Company Code.</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle size={16} />
                        <span>Something went wrong. Please try again.</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center py-4">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Users className="text-primary" size={28} />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join Company</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Enter the company code shared by the admin
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            autoFocus
                            type="text"
                            maxLength={6}
                            value={joinCode}
                            onChange={(e) => {
                                setJoinCode(e.target.value.toUpperCase());
                                setStatus('idle');
                            }}
                            placeholder="XXXXXX"
                            className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-center uppercase tracking-[0.5em] text-2xl focus:border-primary focus:ring-0 outline-none transition-all"
                            disabled={status === 'loading' || status === 'success'}
                        />
                    </div>

                    {/* Status Message */}
                    {status !== 'idle' && status !== 'loading' && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            {getStatusContent()}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!joinCode.trim() || joinCode.length < 5 || status === 'loading' || status === 'success'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {status === 'loading' ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Joining...</span>
                            </>
                        ) : status === 'success' ? (
                            <>
                                <CheckCircle size={18} />
                                <span>Joined!</span>
                            </>
                        ) : (
                            <>
                                <span>Join Company</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Info */}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
                    You will be added to the company roster immediately.
                </p>
            </div>
        </Modal>
    );
};
