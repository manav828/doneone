import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { EnterpriseInquiry } from '../../types';
import { Building2, Phone, Globe, Users, Clock, Check, X, MessageSquare, Mail, ChevronDown } from 'lucide-react';

export const AdminEnterpriseInquiries: React.FC = () => {
    const { enterpriseInquiries, fetchEnterpriseInquiries, updateEnterpriseInquiry } = useStore();
    const [filterStatus, setFilterStatus] = useState<'All' | 'pending' | 'contacted' | 'converted' | 'dismissed'>('pending');

    // Action Modal State
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        inquiryId: string;
        action: 'contacted' | 'converted' | 'dismissed' | 'pending';
        notes: string;
    }>({
        isOpen: false,
        inquiryId: '',
        action: 'contacted',
        notes: ''
    });

    useEffect(() => {
        fetchEnterpriseInquiries();
    }, []);

    const filtered = enterpriseInquiries.filter((i: EnterpriseInquiry) => {
        if (filterStatus !== 'All' && i.status !== filterStatus) return false;
        return true;
    });

    const handleActionClick = (id: string, action: 'contacted' | 'converted' | 'dismissed' | 'pending') => {
        const inquiry = enterpriseInquiries.find((i: EnterpriseInquiry) => i.id === id);
        setActionModal({
            isOpen: true,
            inquiryId: id,
            action,
            notes: inquiry?.adminNotes || ''
        });
    };

    const confirmAction = async () => {
        if (!actionModal.inquiryId) return;
        await updateEnterpriseInquiry(actionModal.inquiryId, {
            status: actionModal.action,
            adminNotes: actionModal.notes
        });
        setActionModal(prev => ({ ...prev, isOpen: false }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'contacted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            case 'converted': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'dismissed': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const featureLabels: Record<string, string> = {
        'custom_branding': 'Custom Branding',
        'sso': 'SSO / SAML',
        'api_access': 'API Access',
        'self_hosted': 'Self-Hosted',
        'priority_support': 'Priority Support',
        'audit_logs': 'Audit Logs',
        'custom_integrations': 'Custom Integrations',
        'dedicated_account': 'Dedicated Account Manager'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white">Enterprise Inquiries</h3>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                        <option value="All">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        <Building2 className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={40} />
                        <p className="text-slate-500">No enterprise inquiries found.</p>
                    </div>
                ) : (
                    filtered.map((inquiry: EnterpriseInquiry) => (
                        <div key={inquiry.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">
                                                {inquiry.companyName || 'No Company Name'}
                                            </h4>
                                            <p className="text-sm text-slate-500">{inquiry.userName}</p>
                                        </div>
                                        <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(inquiry.status)}`}>
                                            {inquiry.status}
                                        </span>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Mail size={14} className="text-slate-400" />
                                            <span>{inquiry.email}</span>
                                        </div>
                                        {inquiry.phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>{inquiry.phone}</span>
                                            </div>
                                        )}
                                        {inquiry.country && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Globe size={14} className="text-slate-400" />
                                                <span>{inquiry.country}</span>
                                            </div>
                                        )}
                                        {inquiry.teamSize && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Users size={14} className="text-slate-400" />
                                                <span>{inquiry.teamSize} people</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Required Features */}
                                    {inquiry.requiredFeatures && inquiry.requiredFeatures.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Required Features</p>
                                            <div className="flex flex-wrap gap-2">
                                                {inquiry.requiredFeatures.map(f => (
                                                    <span key={f} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">
                                                        {featureLabels[f] || f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Requirements */}
                                    {inquiry.requirements && (
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Additional Requirements</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{inquiry.requirements}</p>
                                        </div>
                                    )}

                                    {/* Admin Notes */}
                                    {inquiry.adminNotes && (
                                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Admin Notes</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{inquiry.adminNotes}</p>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                                        <Clock size={12} />
                                        <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {inquiry.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleActionClick(inquiry.id, 'contacted')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            >
                                                <Phone size={14} />
                                                Mark Contacted
                                            </button>
                                            <button
                                                onClick={() => handleActionClick(inquiry.id, 'dismissed')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                                Dismiss
                                            </button>
                                        </>
                                    ) : inquiry.status === 'contacted' ? (
                                        <>
                                            <button
                                                onClick={() => handleActionClick(inquiry.id, 'converted')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                            >
                                                <Check size={14} />
                                                Convert
                                            </button>
                                            <button
                                                onClick={() => handleActionClick(inquiry.id, 'dismissed')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                                Dismiss
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleActionClick(inquiry.id, 'pending')}
                                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                                        >
                                            Re-open
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Action Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {actionModal.action === 'contacted' ? 'Mark as Contacted' :
                                actionModal.action === 'converted' ? 'Convert to Customer' :
                                    actionModal.action === 'dismissed' ? 'Dismiss Inquiry' : 'Re-open Inquiry'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Add notes about this action for your records.
                        </p>

                        <textarea
                            value={actionModal.notes}
                            onChange={(e) => setActionModal(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add notes (optional)..."
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none mb-4 min-h-[100px]"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm transition-colors ${actionModal.action === 'converted' ? 'bg-green-600 hover:bg-green-700' :
                                    actionModal.action === 'contacted' ? 'bg-blue-600 hover:bg-blue-700' :
                                        actionModal.action === 'dismissed' ? 'bg-slate-600 hover:bg-slate-700' :
                                            'bg-yellow-600 hover:bg-yellow-700'
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
