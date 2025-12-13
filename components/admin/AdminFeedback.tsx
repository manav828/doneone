import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { SupportTicket } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Clock, Check, X, User } from 'lucide-react';

export const AdminFeedback: React.FC = () => {
    const { supportTickets, fetchSupportTickets, resolveSupportTicket } = useStore();
    const [filterType, setFilterType] = useState<'All' | 'Bug' | 'Enhancement'>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | 'open' | 'resolved' | 'dismissed'>('open'); // Default to Open

    useEffect(() => {
        fetchSupportTickets();
    }, []);

    const filtered = supportTickets.filter(t => {
        if (filterType !== 'All' && t.type !== filterType) return false;
        if (filterStatus !== 'All' && t.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
        return true;
    });

    const handleResolve = async (id: string, status: 'open' | 'resolved' | 'dismissed') => {
        await resolveSupportTicket(id, status);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white">User Feedback & Support</h3>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="All">All Status</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="All">All Types</option>
                        <option value="Bug">Bugs</option>
                        <option value="Enhancement">Enhancements</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500">No tickets found matching filters.</p>
                    </div>
                ) : (
                    filtered.map(ticket => (
                        <div key={ticket.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${ticket.type === 'Bug' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                                        {ticket.type === 'Bug' ? <AlertCircle size={20} /> : <Lightbulb size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-white">{ticket.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{ticket.description}</p>

                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                                <User size={12} />
                                                <span>{ticket.userName} ({ticket.userEmail})</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock size={12} />
                                                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {ticket.status.toLowerCase() === 'open' ? (
                                        <>
                                            <button
                                                onClick={() => handleResolve(ticket.id, 'resolved')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                            >
                                                <Check size={14} />
                                                Resolve
                                            </button>
                                            <button
                                                onClick={() => handleResolve(ticket.id, 'dismissed')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                                Dismiss
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket.status.toLowerCase() === 'resolved'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                {ticket.status.toUpperCase()}
                                            </div>
                                            <button
                                                onClick={() => handleResolve(ticket.id, 'open')}
                                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                            >
                                                Re-open
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
