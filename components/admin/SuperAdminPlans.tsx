import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Plus, Check, Trash2, X } from 'lucide-react';
import { Plan } from '../../types';

export const SuperAdminPlans: React.FC = () => {
    const { plans, fetchPlans, updatePlan, addPlan, deletePlan } = useStore();
    const [localPlans, setLocalPlans] = useState<Plan[]>([]);
    const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);

    // New Plan State - Snake Case
    const [newPlan, setNewPlan] = useState<Partial<Plan>>({
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
        max_images_per_task: 0, // 0 = Unlimited
        history_retention_days: 30,

        can_invite_members: false,
        can_upload_images: false,
        can_set_reminders: false,
        can_use_notifications: false,
        can_export_data: false,
        can_view_history: false
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        // Sort by ID to keep order stable
        const sorted = [...plans].sort((a, b) => a.name.localeCompare(b.name));
        setLocalPlans(sorted);
    }, [plans]);

    const handlePlanChange = (planId: string, field: keyof Plan, value: any) => {
        setLocalPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
    };

    const savePlan = async (planId: string) => {
        const plan = localPlans.find(p => p.id === planId);
        if (!plan) return;

        await updatePlan(planId, plan);
    };

    const handleDeletePlan = async (planId: string, planName: string) => {
        if (window.confirm(`Are you sure you want to delete the plan "${planName}"? This cannot be undone.`)) {
            await deletePlan(planId);
            fetchPlans();
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.currency) return;

        await addPlan(newPlan as Omit<Plan, 'id'>);
        setIsAddPlanModalOpen(false);
        // Reset form
        setNewPlan({
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
        fetchPlans();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="text-yellow-500">👑</span> Manage Plans & Pricing
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure subscription limits, pricing, features, and currencies.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddPlanModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Add New Plan
                </button>
            </div>

            {/* Plans Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 min-w-[150px]">Plan Name</th>
                                <th className="px-4 py-3 w-20 text-center">Curr</th>
                                <th className="px-4 py-3 w-24">Base/Mo</th>
                                <th className="px-4 py-3 w-24">User/Mo</th>
                                <th className="px-4 py-3 w-20 text-center" title="Max Projects">Projs</th>
                                <th className="px-4 py-3 w-20 text-center" title="Max Members per Project">Mem/Pr</th>
                                <th className="px-4 py-3 w-20 text-center" title="Max Leads per Project">Lead/Pr</th>
                                <th className="px-4 py-3 w-20 text-center" title="Max Images per Task">Img/Task</th>
                                <th className="px-4 py-3 text-center">Features</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {localPlans.map(plan => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    {/* Name & ID */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={plan.name}
                                            onChange={e => handlePlanChange(plan.id, 'name', e.target.value)}
                                            className="w-full bg-transparent font-bold text-gray-800 dark:text-white border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                                        />
                                        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{plan.id}</div>
                                    </td>

                                    {/* Currency */}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${plan.currency === 'INR' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                            {plan.currency}
                                        </span>
                                    </td>

                                    {/* Detailed Pricing */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400 text-xs">{plan.currency === 'INR' ? '₹' : '$'}</span>
                                            <input
                                                type="number"
                                                value={plan.price_monthly}
                                                onChange={e => handlePlanChange(plan.id, 'price_monthly', parseInt(e.target.value) || 0)}
                                                className="w-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 text-right"
                                                placeholder="Base"
                                                title="Base Monthly Price"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400 text-xs">{plan.currency === 'INR' ? '₹' : '$'}</span>
                                            <input
                                                type="number"
                                                value={plan.price_per_seat_monthly}
                                                onChange={e => handlePlanChange(plan.id, 'price_per_seat_monthly', parseInt(e.target.value) || 0)}
                                                className="w-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 text-right"
                                                placeholder="Seat"
                                                title="Per User Monthly Price"
                                            />
                                        </div>
                                    </td>

                                    {/* Limits */}
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            value={plan.max_projects}
                                            onChange={e => handlePlanChange(plan.id, 'max_projects', parseInt(e.target.value))}
                                            className="w-12 text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                            title="Max Projects (999=Unl)"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            value={plan.max_members_per_project}
                                            onChange={e => handlePlanChange(plan.id, 'max_members_per_project', parseInt(e.target.value))}
                                            className="w-12 text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            value={plan.max_leads_per_project}
                                            onChange={e => handlePlanChange(plan.id, 'max_leads_per_project', parseInt(e.target.value))}
                                            className="w-12 text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            value={plan.max_images_per_task || 0}
                                            onChange={e => handlePlanChange(plan.id, 'max_images_per_task', parseInt(e.target.value))}
                                            className="w-12 text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                            title="0 = Unlimited"
                                        />
                                    </td>

                                    {/* Features Checkboxes */}
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-2">
                                            {[
                                                { key: 'can_invite_members', label: 'Invite' },
                                                { key: 'can_upload_images', label: 'Upload' },
                                                { key: 'can_set_reminders', label: 'Remind' },
                                                { key: 'can_use_notifications', label: 'Notif' },
                                                { key: 'can_export_data', label: 'Export' },
                                                { key: 'can_view_history', label: 'History' },
                                            ].map(feat => (
                                                <div key={feat.key} className="relative group cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={plan[feat.key as keyof Plan] as boolean}
                                                        onChange={e => handlePlanChange(plan.id, feat.key as keyof Plan, e.target.checked)}
                                                        className="peer sr-only "
                                                        id={`${plan.id}-${feat.key}`}
                                                    />
                                                    <label
                                                        htmlFor={`${plan.id}-${feat.key}`}
                                                        className={`block w-4 h-4 rounded border cursor-pointer transition-colors ${(plan[feat.key as keyof Plan] as boolean)
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                            }`}
                                                    ></label>
                                                    {/* Tooltip */}
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                        {feat.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => savePlan(plan.id)}
                                                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                title="Save Changes"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                                className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                                                title="Delete Plan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {localPlans.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 italic">
                                        No plans found. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Plan Modal */}
            {isAddPlanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="text-xl font-bold dark:text-white">Add New Plan</h3>
                            <button onClick={() => setIsAddPlanModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Plan Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Premium Plan"
                                        value={newPlan.name}
                                        onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Currency</label>
                                    <select
                                        value={newPlan.currency}
                                        onChange={e => setNewPlan({ ...newPlan, currency: e.target.value })}
                                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Base Price (Monthly)</label>
                                    <input
                                        type="number"
                                        value={newPlan.price_monthly}
                                        onChange={e => setNewPlan({ ...newPlan, price_monthly: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Per User Price (Monthly)</label>
                                    <input
                                        type="number"
                                        value={newPlan.price_per_seat_monthly}
                                        onChange={e => setNewPlan({ ...newPlan, price_per_seat_monthly: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Limits */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Limits & Quotas</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Max Projects</label>
                                        <input type="number" value={newPlan.max_projects} onChange={e => setNewPlan({ ...newPlan, max_projects: parseInt(e.target.value) })} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Members/Proj</label>
                                        <input type="number" value={newPlan.max_members_per_project} onChange={e => setNewPlan({ ...newPlan, max_members_per_project: parseInt(e.target.value) })} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Leads/Proj</label>
                                        <input type="number" value={newPlan.max_leads_per_project} onChange={e => setNewPlan({ ...newPlan, max_leads_per_project: parseInt(e.target.value) })} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Max Images/Task</label>
                                        <input type="number" value={newPlan.max_images_per_task || 0} onChange={e => setNewPlan({ ...newPlan, max_images_per_task: parseInt(e.target.value) })} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0=Unlimited" />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Enabled Features</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'can_invite_members', label: 'Invite Members' },
                                        { key: 'can_upload_images', label: 'Image Uploads' },
                                        { key: 'can_set_reminders', label: 'Reminders' },
                                        { key: 'can_use_notifications', label: 'Notifications' },
                                        { key: 'can_export_data', label: 'Export Data' },
                                        { key: 'can_view_history', label: 'View Full History' },
                                    ].map(feat => (
                                        <label key={feat.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={newPlan[feat.key as keyof Plan] as boolean || false}
                                                onChange={e => setNewPlan({ ...newPlan, [feat.key]: e.target.checked })}
                                                className="w-4 h-4 text-orange-600 rounded"
                                            />
                                            {feat.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddPlanModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlan}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95"
                            >
                                Create Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
