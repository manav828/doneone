import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { SupportTicket } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Clock, Check, X, User } from 'lucide-react';

export const AdminFeedback: React.FC = () => {
    const { supportTickets, fetchSupportTickets, resolveSupportTicket } = useStore();
    const [filterType, setFilterType] = useState<'All' | 'Bug' | 'Enhancement'>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | 'open' | 'resolved' | 'dismissed'>('open'); // Default to Open

    // Resolution Modal State
    const [resolutionModal, setResolutionModal] = useState<{
        isOpen: boolean;
        ticketId: string;
        action: 'resolved' | 'dismissed' | 'open';
        message: string;
    }>({
        isOpen: false,
        ticketId: '',
        action: 'resolved',
        message: ''
    });

    useEffect(() => {
        fetchSupportTickets();
    }, []);

    const filtered = supportTickets.filter(t => {
        if (filterType !== 'All' && t.type !== filterType) return false;
        if (filterStatus !== 'All' && t.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
        return true;
    });

    const handleActionClick = (id: string, action: 'resolved' | 'dismissed' | 'open') => {
        setResolutionModal({
            isOpen: true,
            ticketId: id,
            action,
            message: ''
        });
    };

    const confirmAction = async () => {
        if (!resolutionModal.ticketId) return;
        // In a real app, we would send resolutionModal.message to the backend too.
        // For now, we assume the backend might log it or distinct logic.
        // If the backend `resolveSupportTicket` signature doesn't take a message, we might need a separate API call 
        // OR just proceed with status update. 
        // Assuming current store only takes status. We will simulate message usage or just proceed.
        // console.log(`Processing ticket ${resolutionModal.ticketId} action ${resolutionModal.action} with note: ${resolutionModal.message}`);

        await resolveSupportTicket(resolutionModal.ticketId, resolutionModal.action, resolutionModal.message);
        setResolutionModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white">User Feedback & Support</h3>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                        <option value="All">All Status</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
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
                                                onClick={() => handleActionClick(ticket.id, 'resolved')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                            >
                                                <Check size={14} />
                                                Resolve
                                            </button>
                                            <button
                                                onClick={() => handleActionClick(ticket.id, 'dismissed')}
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
                                                onClick={() => handleActionClick(ticket.id, 'open')}
                                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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

            {/* Resolution Modal */}
            {resolutionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {resolutionModal.action === 'resolved' ? 'Resolve Ticket' :
                                resolutionModal.action === 'dismissed' ? 'Dismiss Ticket' : 'Re-open Ticket'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Add a note about why you are performing this action.
                        </p>

                        <textarea
                            value={resolutionModal.message}
                            onChange={(e) => setResolutionModal(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Add a resolution note (optional)..."
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none mb-4 min-h-[100px]"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm transition-colors ${resolutionModal.action === 'resolved' ? 'bg-green-600 hover:bg-green-700' :
                                    resolutionModal.action === 'dismissed' ? 'bg-slate-600 hover:bg-slate-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
