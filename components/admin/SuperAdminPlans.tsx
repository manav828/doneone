import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Plus, Check, Trash2, X, Pencil, ShieldCheck, Settings, Users, Briefcase, IndianRupee, DollarSign, Info } from 'lucide-react';
import { Plan } from '../../types';

export const SuperAdminPlans: React.FC = () => {
    const { plans, fetchPlans, updatePlan, addPlan, deletePlan } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const openAddModal = () => {
        setModalMode('add');
        setCurrentPlan({
            name: '',
            currency: 'USD',
            description: '',
            price_monthly: 0,
            price_yearly: 0,
            price_per_seat_monthly: 0,
            price_per_seat_yearly: 0,
            max_projects: 3,
            max_members_per_project: 5,
            max_leads_per_project: 5,
            max_images_per_task: 0,
            history_retention_days: 30,
            can_invite_members: false,
            can_upload_images: false,
            can_set_reminders: false,
            can_use_notifications: false,
            can_export_data: false,
            can_view_history: false
        });
        setIsModalOpen(true);
    };

    const openEditModal = (plan: Plan) => {
        setModalMode('edit');
        setCurrentPlan({ ...plan });
        setIsModalOpen(true);
    };

    const handleDeletePlan = async (planId: string, planName: string) => {
        if (window.confirm(`Are you sure you want to delete the plan "${planName}"? This cannot be undone.`)) {
            await deletePlan(planId);
            fetchPlans();
        }
    };

    const handleSavePlan = async () => {
        if (!currentPlan.name || !currentPlan.currency) return;

        if (modalMode === 'add') {
            await addPlan(currentPlan as Omit<Plan, 'id'>);
        } else {
            if (currentPlan.id) {
                await updatePlan(currentPlan.id, currentPlan);
            }
        }

        setIsModalOpen(false);
        fetchPlans();
    };

    const sortedPlans = [...plans].sort((a, b) => {
        const order: Record<string, number> = { 'Solo': 1, 'Free': 1, 'Growth': 2, 'Standard': 2, 'Enterprise': 3 };
        return (order[a.name] || 99) - (order[b.name] || 99) || a.currency.localeCompare(b.currency);
    });

    const getFeatureCount = (p: Plan) => {
        return [p.can_invite_members, p.can_upload_images, p.can_set_reminders, p.can_use_notifications, p.can_export_data, p.can_view_history].filter(Boolean).length;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg text-orange-600">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            Plans & Pricing
                        </h3>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                        Configure subscription tiers, feature gates, and tiered pricing.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <Plus size={16} /> Add New Plan
                </button>
            </div>

            {/* Plans List */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Plan Identity</th>
                                <th className="px-6 py-5 text-center">Currency</th>
                                <th className="px-6 py-5">Base Pricing</th>
                                <th className="px-6 py-5">Per Seat</th>
                                <th className="px-6 py-5 text-center">Limits</th>
                                <th className="px-6 py-5 text-center">Access</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedPlans.map(plan => (
                                <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">{plan.name}</span>
                                            <span className="text-[11px] text-slate-400 font-medium line-clamp-1 max-w-[200px]" title={plan.description}>
                                                {plan.description || 'No description provided.'}
                                            </span>
                                            <span className="text-[9px] text-slate-300 font-mono mt-1">{plan.id}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${plan.currency === 'INR' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {plan.currency}
                                        </span>
                                    </td>

                                    <td className="px-6 py-6 font-bold text-slate-700 dark:text-slate-300">
                                        <div className="flex flex-col">
                                            <span className="text-sm">{plan.currency === 'INR' ? '₹' : '$'}{plan.price_monthly}<span className="text-[10px] text-slate-400 ml-1">/mo</span></span>
                                            <span className="text-[11px] text-slate-400">{plan.currency === 'INR' ? '₹' : '$'}{plan.price_yearly}<span className="text-[10px] text-slate-400 ml-1">/yr</span></span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 font-bold text-slate-700 dark:text-slate-300">
                                        <div className="flex flex-col">
                                            <span className="text-sm">{plan.currency === 'INR' ? '₹' : '$'}{plan.price_per_seat_monthly}<span className="text-[10px] text-slate-400 ml-1">/mo</span></span>
                                            <span className="text-[11px] text-slate-400">{plan.currency === 'INR' ? '₹' : '$'}{plan.price_per_seat_yearly}<span className="text-[10px] text-slate-400 ml-1">/yr</span></span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 tracking-tighter">
                                                <div className="flex flex-col items-center"><span className="text-slate-900 dark:text-white text-sm">{plan.max_projects === 999 ? '∞' : plan.max_projects}</span>P</div>
                                                <div className="flex flex-col items-center"><span className="text-slate-900 dark:text-white text-sm">{plan.max_members_per_project === 999 ? '∞' : plan.max_members_per_project}</span>M</div>
                                                <div className="flex flex-col items-center"><span className="text-slate-900 dark:text-white text-sm">{plan.history_retention_days}</span>D</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-indigo-600">{getFeatureCount(plan)}/6</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enables</span>
                                        </div>
                                    </td>

                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(plan)}
                                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 rounded-xl transition-all"
                                                title="Edit Plan"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                                className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                                                title="Delete Plan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Plan Configuration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {modalMode === 'add' ? 'Create New Plan' : `Configure ${currentPlan.name}`}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">Define pricing, limits, and feature gates for this tier.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 overflow-y-auto space-y-8 scrollbar-hide">
                            {/* Identity Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Info size={12} /> Plan Identity
                                    </label>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Plan Name (e.g. Pro, Growth)"
                                            value={currentPlan.name}
                                            onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                                        />
                                        <textarea
                                            placeholder="Detailed description for marketing copy..."
                                            value={currentPlan.description || ''}
                                            onChange={e => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all h-24 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Currency</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['USD', 'INR'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCurrentPlan({ ...currentPlan, currency: c })}
                                                    className={`py-3 rounded-xl font-black text-xs transition-all ${currentPlan.currency === c
                                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-tight">
                                            Note: Subscription currencies must match the target market (USD/Global or INR/India).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Grid */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <DollarSign size={12} /> Commercial Configuration
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Base / Mo', key: 'price_monthly', icon: currentPlan.currency === 'INR' ? <IndianRupee size={12} /> : <DollarSign size={12} /> },
                                        { label: 'Base / Yr', key: 'price_yearly', icon: currentPlan.currency === 'INR' ? <IndianRupee size={12} /> : <DollarSign size={12} /> },
                                        { label: 'User / Mo', key: 'price_per_seat_monthly', icon: <Users size={12} /> },
                                        { label: 'User / Yr', key: 'price_per_seat_yearly', icon: <Users size={12} /> },
                                    ].map(f => (
                                        <div key={f.key} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                {f.icon}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={(currentPlan[f.key as keyof Plan] as number) || 0}
                                                onChange={e => setCurrentPlan({ ...currentPlan, [f.key]: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white border-none focus:ring-0 p-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Limits Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Settings size={12} /> Resource Limits
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Max Projects', key: 'max_projects', hint: '999 = Unl' },
                                            { label: 'Members/Proj', key: 'max_members_per_project', hint: '999 = Unl' },
                                            { label: 'Leads/Proj', key: 'max_leads_per_project', hint: 'Admin Role' },
                                            { label: 'History Days', key: 'history_retention_days', hint: 'Data Life' },
                                        ].map(f => (
                                            <div key={f.key} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl relative">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                                                <input
                                                    type="number"
                                                    value={(currentPlan[f.key as keyof Plan] as number) || 0}
                                                    onChange={e => setCurrentPlan({ ...currentPlan, [f.key]: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-transparent text-lg font-black text-slate-900 dark:text-white border-none focus:ring-0 p-0"
                                                />
                                                <span className="absolute top-4 right-4 text-[8px] font-bold text-slate-300 dark:text-slate-600">{f.hint}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <ShieldCheck size={12} /> Feature Availability
                                    </label>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 space-y-3 border border-slate-100 dark:border-slate-700/50">
                                        {[
                                            { key: 'can_invite_members', label: 'External Invitations' },
                                            { key: 'can_upload_images', label: 'Image Assets Upload' },
                                            { key: 'can_set_reminders', label: 'Push & Mail Reminders' },
                                            { key: 'can_use_notifications', label: 'Global Notifications' },
                                            { key: 'can_export_data', label: 'Advanced Data Export' },
                                            { key: 'can_view_history', label: 'Full Audit History' },
                                        ].map(feat => (
                                            <label key={feat.key} className="flex items-center justify-between group cursor-pointer">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">{feat.label}</span>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentPlan[feat.key as keyof Plan] as boolean || false}
                                                        onChange={e => setCurrentPlan({ ...currentPlan, [feat.key]: e.target.checked })}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-slate-900 dark:peer-checked:bg-white transition-all"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 text-slate-500 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSavePlan}
                                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {modalMode === 'add' ? 'Create Tier' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
