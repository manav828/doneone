import React from 'react';
import { useStore } from '../store';
import { Modal } from './Modal';
import { AlertCircle, Lightbulb, Check, X, Clock, MessageSquare } from 'lucide-react';

interface UserTicketsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserTicketsModal: React.FC<UserTicketsModalProps> = ({ isOpen, onClose }) => {
    const { supportTickets, currentUser, fetchSupportTickets } = useStore();

    React.useEffect(() => {
        if (isOpen) {
            fetchSupportTickets();
        }
    }, [isOpen]);

    if (!currentUser) return null;

    const myTickets = supportTickets.filter(t => t.userId === currentUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="My Support Tickets" maxWidth="max-w-2xl">
            <div className="space-y-4">
                {myTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                        <p>You haven't submitted any tickets yet.</p>
                    </div>
                ) : (
                    myTickets.map(ticket => (
                        <div key={ticket.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`p-1 rounded text-xs font-bold ${ticket.type === 'Bug' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'}`}>
                                            {ticket.type === 'Bug' ? <AlertCircle size={12} /> : <Lightbulb size={12} />}
                                        </span>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ticket.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{ticket.description}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <Clock size={10} />
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${ticket.status.toLowerCase() === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                    ticket.status.toLowerCase() === 'dismissed' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700' :
                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                                    }`}>
                                    {ticket.status.toLowerCase() === 'resolved' && <Check size={12} />}
                                    {ticket.status.toLowerCase() === 'dismissed' && <X size={12} />}
                                    {ticket.status.toUpperCase()}
                                </div>
                            </div>

                            {/* Resolution Note */}
                            {ticket.resolution_note && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 mb-1">Resolution Note:</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                        "{ticket.resolution_note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};
