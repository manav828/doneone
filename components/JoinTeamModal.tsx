import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { Users, ArrowRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface JoinTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ isOpen, onClose }) => {
    const { joinTeam, fetchTeams } = useStore();
    const [joinCode, setJoinCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'requested' | 'already_member' | 'already_pending' | 'not_found' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setStatus('loading');
        const result = await joinTeam(joinCode.trim());
        setStatus(result);

        if (result === 'requested') {
            await fetchTeams();
            setTimeout(() => {
                onClose();
                setJoinCode('');
                setStatus('idle');
            }, 2000);
        }
    };

    const getStatusContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span>Joining...</span>
                    </div>
                );
            case 'requested':
                return (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle size={16} />
                        <span>Request sent! Waiting for owner approval.</span>
                    </div>
                );
            case 'already_member':
                return (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <AlertCircle size={16} />
                        <span>You're already a member of this team.</span>
                    </div>
                );
            case 'already_pending':
                return (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Clock size={16} />
                        <span>You already have a pending request for this team.</span>
                    </div>
                );
            case 'not_found':
                return (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle size={16} />
                        <span>Team not found. Check the code and try again.</span>
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join a Team</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Enter the team code shared by the team owner
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
                            disabled={status === 'loading' || status === 'requested'}
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
                        disabled={!joinCode.trim() || joinCode.length < 6 || status === 'loading' || status === 'requested'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {status === 'loading' ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Sending Request...</span>
                            </>
                        ) : status === 'requested' ? (
                            <>
                                <CheckCircle size={18} />
                                <span>Request Sent!</span>
                            </>
                        ) : (
                            <>
                                <span>Request to Join</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Info */}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
                    After requesting, the team owner will review and approve your request.
                </p>
            </div>
        </Modal>
    );
};
