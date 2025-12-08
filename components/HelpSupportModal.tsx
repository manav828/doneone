
import React, { useState } from 'react';
import { useStore } from '../store';
import { X, MessageSquare, Bug, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface HelpSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
    const { submitSupportTicket } = useStore();
    const [type, setType] = useState<'Bug' | 'Enhancement'>('Bug');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            await submitSupportTicket({ type, title, description });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setTitle('');
                setDescription('');
                onClose();
            }, 2000);
        } catch (err) {
            setError('Failed to submit ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <MessageSquare size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Help & Support</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thank You!</h3>
                            <p className="text-slate-500 text-sm">Your feedback has been submitted successfully.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('Bug')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'Bug'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <Bug size={24} />
                                    <span className="text-sm">Report a Bug</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('Enhancement')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'Enhancement'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 font-bold'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <Lightbulb size={24} />
                                    <span className="text-sm">Suggest Feature</span>
                                </button>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={type === 'Bug' ? "e.g., Task drag not working..." : "e.g., Add dark mode..."}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please provide details..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs px-1">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Ticket'
                                )}
                            </button>

                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
