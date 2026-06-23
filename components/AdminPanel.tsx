
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { Users, FolderKanban, Shield, Check, X, Bell, Crown, Edit2, Clock, Timer, Lock, Unlock, HardDrive, Database, Trash2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, StorageStats } from '../types';
import { AdminFeedback } from './admin/AdminFeedback';
import { SuperAdminPayments } from './admin/SuperAdminPayments';
import { SuperAdminPlans } from './admin/SuperAdminPlans';
import { AdminEnterpriseInquiries } from './admin/AdminEnterpriseInquiries';
import { MessageSquare, CreditCard, Building2 } from 'lucide-react';
export const AdminPanel: React.FC = () => {
    const { currentUser, updateUserProfile, deleteUser, setActiveProject, getRegistrationStatus, toggleRegistration, fetchStorageStats, users: storeUsers, projects: storeProjects, fetchUsers, fetchProjects, teams, teamMembers, plans, fetchPlans, signIn, refreshData } = useStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [regOpen, setRegOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'custom_users' | 'feedback' | 'enterprise_inquiries' | 'payments' | 'plans'>('overview');
    const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'USD' | 'INR'>('ALL');

    // Derived Roles
    const isSuperAdmin = currentUser?.email === 'manavss828@gmail.com';
    const managedTeamIds = useMemo(() => teams
        .filter(t => t.managerIds?.includes(currentUser?.id || '') || t.ownerId === currentUser?.id)
        .map(t => t.id), [teams, currentUser]);
    const isTeamHead = managedTeamIds.length > 0;


    const [editLimits, setEditLimits] = useState({
        maxProjects: 3,
        maxLeads: 2,
        maxResources: 5,
        historyRetentionDays: null as number | null,
        addPremiumDays: 0,
        planBaseCost: 0,
        perSeatCost: 5,
        extraSeats: 0,
        isCustomPlan: false,
        renewalDate: null as string | null,
        currency: 'USD',
        billingInterval: 'monthly' as 'monthly' | 'yearly',
        planId: null as string | null
    });

    useEffect(() => {
        // Access Check: Super Admin ONLY
        if (!isSuperAdmin) {
            navigate('/');
            return;
        }

        const loadAdminData = async () => {
            if (storeUsers.length === 0) await fetchUsers();
            if (storeProjects.length === 0) await fetchProjects();
            if (plans.length === 0) await fetchPlans();

            const status = await getRegistrationStatus();
            setRegOpen(status);
            const stats = await fetchStorageStats();
            setStorageStats(stats);

            setLoading(false);
        };

        loadAdminData();
    }, [currentUser, navigate, isSuperAdmin, isTeamHead]);

    // Sync from Store to Local State for Display (and Sorting)
    useEffect(() => {
        let relevantUsers = [...storeUsers];

        // Filter for Team Heads: Only show members of MY teams
        if (!isSuperAdmin && isTeamHead) {
            const myTeamMemberIds = teamMembers
                .filter(tm => managedTeamIds.includes(tm.teamId))
                .map(tm => tm.userId);
            // Also include self
            if (currentUser) myTeamMemberIds.push(currentUser.id);

            relevantUsers = relevantUsers.filter(u => myTeamMemberIds.includes(u.id));
        }

        const sorted = relevantUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        let filtered = sorted;
        if (currencyFilter !== 'ALL') {
            filtered = sorted.filter(u => u.currency === currencyFilter);
        }
        setUsers(filtered);
    }, [storeUsers, isSuperAdmin, isTeamHead, managedTeamIds, teamMembers, currencyFilter]);

    useEffect(() => {
        let relevantProjects = [...storeProjects];

        // Filter for Team Heads: Only show projects of MY teams
        if (!isSuperAdmin && isTeamHead) {
            relevantProjects = relevantProjects.filter(p => p.teamId && managedTeamIds.includes(p.teamId));
        }

        setProjects(relevantProjects);
    }, [storeProjects, isSuperAdmin, isTeamHead, managedTeamIds]);


    const handleToggleReg = async () => {
        await toggleRegistration(!regOpen);
        setRegOpen(!regOpen);
    };

    const handleAddPremium = async (userId: string, days: number) => {
        const until = new Date();
        until.setDate(until.getDate() + days);
        await updateUserProfile(userId, { premiumUntil: days > 0 ? until.getTime() : null }); // 0 days = reset/remove
        fetchUsers();
    };

    const handleToggleNotifs = async (userId: string, currentVal: boolean) => {
        await updateUserProfile(userId, { notificationsEnabled: !currentVal });
        fetchUsers();
    };

    const handleToggleReminders = async (userId: string, currentVal: boolean) => {
        await updateUserProfile(userId, { remindersEnabled: !currentVal });
        fetchUsers();
    };

    const handleToggleTimeTracking = async (userId: string, currentVal: boolean) => {
        await updateUserProfile(userId, { timeTrackingEnabled: !currentVal });
        fetchUsers();
    };

    const handleToggleImageUpload = async (userId: string, currentVal: boolean) => {
        await updateUserProfile(userId, { imageUploadEnabled: !currentVal });
        fetchUsers();
    };

    const handleUpdateMaxAttachments = async (userId: string, val: number) => {
        await updateUserProfile(userId, { maxAttachmentsPerTask: val });
        fetchUsers();
    };

    const handleDeleteUser = async (user: User) => {
        if (user.email === 'manavss828@gmail.com') {
            alert('Cannot delete admin account.');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to DELETE user "${user.name}" (${user.email})?\n\n` +
            `This will permanently delete:\n` +
            `• All their tasks\n` +
            `• All their projects\n` +
            `• All their data\n\n` +
            `This action CANNOT be undone.`
        );

        if (confirmed) {
            await deleteUser(user.id);
        }
    };

    const handleLoginAsUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to log in as ${user.name}? You can revert back to admin by refreshing the page.`)) {
            signIn(user);
            await refreshData();
            navigate('/');
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user.id);
        setEditLimits({
            maxProjects: user.customPlanData?.maxProjects || user.maxProjects || 3,
            maxLeads: user.customPlanData?.maxLeads || user.maxLeads || 2,
            maxResources: user.customPlanData?.maxResources || user.maxResources || 5,
            historyRetentionDays: user.historyRetentionDays || null,
            addPremiumDays: 0,
            planBaseCost: user.customPlanData?.baseCost || user.planBaseCost || 0,
            perSeatCost: user.customPlanData?.seatCost || user.perSeatCost || 5,
            extraSeats: user.customPlanData?.extraSeats || user.extraSeats || 0,
            isCustomPlan: user.isCustomPlan || false,
            renewalDate: user.renewalDate ? new Date(user.renewalDate).toISOString().split('T')[0] : (user.premiumUntil ? new Date(user.premiumUntil).toISOString().split('T')[0] : null),
            currency: user.currency || 'USD',
            billingInterval: user.customPlanData?.billingInterval || user.billingInterval || 'monthly',
            planId: user.planId || null
        });
    };

    const handleSave = async (u: User) => {
        try {
            await saveEdit(u.id);
            alert('Settings saved successfully!');
        } catch (err: any) {
            alert(`Failed to save settings: ${err.message}`);
        }
    };

    const saveEdit = async (userId: string) => {
        const renewalTime = editLimits.renewalDate ? new Date(editLimits.renewalDate).getTime() : undefined;

        // 1. Update Profile Limits
        await updateUserProfile(userId, {
            maxProjects: editLimits.maxProjects,
            maxLeads: editLimits.maxLeads,
            maxResources: editLimits.maxResources,
            // Enterprise
            planBaseCost: editLimits.planBaseCost,
            perSeatCost: editLimits.perSeatCost,
            extraSeats: editLimits.extraSeats,
            isCustomPlan: editLimits.isCustomPlan,
            billingInterval: editLimits.billingInterval,
            currency: editLimits.currency as any,
            renewalDate: renewalTime,
            premiumUntil: renewalTime, // Set both to ensure consistency across UI and backend checks
            planId: editLimits.planId || undefined
        });

        // Handle Premium Extension if set
        if (editLimits.addPremiumDays !== 0) {
            const until = new Date();
            if (editLimits.addPremiumDays > 0) {
                until.setDate(until.getDate() + editLimits.addPremiumDays);
                await updateUserProfile(userId, { premiumUntil: until.getTime() });
            }
        }

        // 2. Update History Retention
        const { data: existingSettings } = await supabase
            .from('user_archive_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        const payload = {
            user_id: userId,
            auto_archive_days: existingSettings?.auto_archive_days || 0,
            history_retention_days: editLimits.historyRetentionDays,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('user_archive_settings').upsert(payload);

        if (error) {
            console.error('Error saving history retention:', error);
            throw error;
        }

        setEditingUser(null);
        await fetchUsers();
    };

    const bulkAssignIndianPlan = async () => {
        const indianPlan = plans.find((p: any) => p.name === 'Growth' && p.currency === 'INR');
        if (!indianPlan) {
            alert("Growth (INR) Plan not found in plans table.");
            return;
        }

        const confirmAction = window.confirm(`This will assign the '${indianPlan.name} (INR)' to ALL users who currently have no plan. Are you sure?`);
        if (!confirmAction) return;

        setLoading(true);
        try {
            // Find all users who are NOT premium or don't have a planId
            const usersToUpdate = storeUsers.filter(u => !u.planId || u.planId === (plans.find((p: any) => p.price_monthly === 0 || p.price_monthly === '0')?.id));

            for (const user of usersToUpdate) {
                await updateUserProfile(user.id, {
                    planId: indianPlan.id,
                    isCustomPlan: false,
                    premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
                    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime()
                });
            }
            alert(`Success! Updated ${usersToUpdate.length} users.`);
            await fetchUsers();
        } catch (error) {
            console.error("Bulk update failed:", error);
            alert("Failed to update some users. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const openProject = (id: string) => {
        setActiveProject(id);
        navigate('/');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Admin Panel...</div>;

    return (
        <div className="h-full overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                    <Shield className="text-red-600" /> Super Admin Control Center
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleToggleReg}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${regOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {regOpen ? <Unlock size={16} /> : <Lock size={16} />}
                        {regOpen ? 'Registration Open' : 'Registration Closed'}
                    </button>
                    <div className="text-sm text-gray-500">
                        Logged in as: <span className="font-mono text-gray-700 dark:text-gray-300">manavss828@gmail.com</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Overview & Management
                </button>
                <button
                    onClick={() => setActiveTab('custom_users')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'custom_users' ? 'border-primary text-primary' : 'border-transparent text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300'}`}
                >
                    <Crown size={16} />
                    Custom / Enterprise
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'feedback' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    <MessageSquare size={16} />
                    User Feedback
                </button>
                <button
                    onClick={() => setActiveTab('enterprise_inquiries')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'enterprise_inquiries' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    <Building2 size={16} />
                    Enterprise Inquiries
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Payments & Revenue
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    <Crown size={16} />
                    Plan Management
                </button>
            </div>

            {
                activeTab === 'payments' ? (
                    <SuperAdminPayments />
                ) : activeTab === 'plans' ? (
                    <SuperAdminPlans />
                ) : activeTab === 'feedback' ? (
                    <AdminFeedback />
                ) : activeTab === 'enterprise_inquiries' ? (
                    <AdminEnterpriseInquiries />
                ) : activeTab === 'custom_users' ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                    <Crown size={20} />
                                    Enterprise / Custom Plan Users
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-300 uppercase text-xs font-bold border-b border-purple-100 dark:border-purple-800">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-4 py-4 text-center">Plan Type</th>
                                            <th className="px-4 py-4 text-center">Custom Pricing</th>
                                            <th className="px-4 py-4 text-center">Limits</th>
                                            <th className="px-4 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {users.filter(u => u.isCustomPlan).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    No users are currently on a Custom / Enterprise plan.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.filter(u => u.isCustomPlan).map(u => (
                                                <React.Fragment key={u.id}>
                                                    <tr className="hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold border border-purple-200">Enterprise</span>
                                                            {u.premiumUntil && <div className="mt-1 text-[10px] text-gray-400">Renews: {new Date(u.premiumUntil).toLocaleDateString()}</div>}
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="flex flex-col text-xs">
                                                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                                                    {u.currency === 'INR' ? '₹' : '$'}{u.customPlanData?.baseCost || 0} base
                                                                </span>
                                                                <span className="text-gray-500">+ {u.currency === 'INR' ? '₹' : '$'}{u.customPlanData?.seatCost || 0} / user</span>
                                                                <span className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                                                                    {u.customPlanData?.billingInterval || 'monthly'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                                                {u.customPlanData?.maxProjects || u.maxProjects || 0} P / {u.customPlanData?.maxLeads || u.maxLeads || 0} L / {u.customPlanData?.maxResources || u.maxResources || 0} R
                                                            </div>
                                                            {(u.customPlanData?.extraSeats || 0) > 0 && <div className="text-[10px] text-green-600 font-bold mt-0.5">+{u.customPlanData.extraSeats} Extra Seats</div>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {editingUser === u.id ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handleSave(u)} className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"><Check size={18} /></button>
                                                                    <button onClick={() => setEditingUser(null)} className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors"><X size={18} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2 text-xs font-bold ml-auto">
                                                                    <button onClick={() => handleLoginAsUser(u)} className="text-green-600 hover:bg-green-50 p-1.5 rounded flex items-center gap-1 transition-colors" title="Login as User">
                                                                        <LogIn size={14} /> Login
                                                                    </button>
                                                                    <button onClick={() => startEdit(u)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded flex items-center gap-1 transition-colors">
                                                                        <Edit2 size={14} /> Edit Plan
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {editingUser === u.id && (
                                                        <tr className="bg-purple-50 dark:bg-slate-800/50 border-b border-purple-200 shadow-inner">
                                                            <td colSpan={5} className="p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-900/50 shadow-sm">
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Currency</label>
                                                                        <select
                                                                            value={editLimits.currency}
                                                                            onChange={e => setEditLimits({ ...editLimits, currency: e.target.value })}
                                                                            className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold"
                                                                        >
                                                                            <option value="USD">USD ($)</option>
                                                                            <option value="INR">INR (₹)</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Base Cost ({editLimits.currency === 'INR' ? '₹' : '$'})</label>
                                                                        <input type="number" value={editLimits.planBaseCost} onChange={e => setEditLimits({ ...editLimits, planBaseCost: +e.target.value })} className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 199" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Per User Cost ({editLimits.currency === 'INR' ? '₹' : '$'})</label>
                                                                        <input type="number" value={editLimits.perSeatCost} onChange={e => setEditLimits({ ...editLimits, perSeatCost: +e.target.value })} className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 15" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Extra Seats</label>
                                                                        <input type="number" value={editLimits.extraSeats} onChange={e => setEditLimits({ ...editLimits, extraSeats: +e.target.value })} className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 5" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Limits (P / L / R)</label>
                                                                        <div className="flex gap-2">
                                                                            <input type="number" className="w-full p-2 text-sm border rounded text-center" value={editLimits.maxProjects} onChange={e => setEditLimits({ ...editLimits, maxProjects: +e.target.value })} title="Max Projects" />
                                                                            <input type="number" className="w-full p-2 text-sm border rounded text-center" value={editLimits.maxLeads} onChange={e => setEditLimits({ ...editLimits, maxLeads: +e.target.value })} title="Max Leads" />
                                                                            <input type="number" className="w-full p-2 text-sm border rounded text-center" value={editLimits.maxResources} onChange={e => setEditLimits({ ...editLimits, maxResources: +e.target.value })} title="Max Resources" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Billing Interval</label>
                                                                        <select
                                                                            value={editLimits.billingInterval}
                                                                            onChange={e => setEditLimits({ ...editLimits, billingInterval: e.target.value as any })}
                                                                            className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold"
                                                                        >
                                                                            <option value="monthly">Monthly</option>
                                                                            <option value="yearly">Yearly</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="md:col-span-4 flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                                                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-purple-700">
                                                                            <input type="checkbox" checked={editLimits.isCustomPlan} onChange={e => setEditLimits({ ...editLimits, isCustomPlan: e.target.checked })} className="w-4 h-4 text-purple-600 rounded" />
                                                                            Enable Custom Plan Status
                                                                        </label>
                                                                        <div className="text-xs text-gray-400 italic">
                                                                            Uncheck to revert to Standard Plan
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* ... existing stats cards ... */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-500 font-medium">Total Users</h3>
                                        <Users className="text-blue-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{users.length}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-500 font-medium">Total Projects</h3>
                                        <FolderKanban className="text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{projects.length}</p>
                                </div>

                                {/* Storage Monitor */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-500 font-medium">Storage Used</h3>
                                        <div className={`p-1.5 rounded-full ${(!storageStats || storageStats.totalBytes < 750000000) ? 'bg-green-100 text-green-600' : (storageStats.totalBytes < 900000000) ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                            <HardDrive size={16} />
                                        </div>
                                    </div>
                                    {storageStats ? (
                                        <div>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{(storageStats.totalBytes / 1024 / 1024).toFixed(1)} MB</p>
                                                <span className="text-xs text-gray-400">of 1,000 MB</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${(!storageStats || storageStats.totalBytes < 750000000) ? 'bg-green-500' : (storageStats.totalBytes < 900000000) ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min((storageStats.totalBytes / 1000000000) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-400">{storageStats.fileCount} files stored</p>
                                        </div>
                                    ) : (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Database Monitor */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-500 font-medium">Database Used</h3>
                                        <div className={`p-1.5 rounded-full ${(!storageStats || (storageStats.databaseBytes || 0) < 350000000) ? 'bg-green-100 text-green-600' : ((storageStats.databaseBytes || 0) < 450000000) ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                            <Database size={16} />
                                        </div>
                                    </div>
                                    {storageStats ? (
                                        <div>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{((storageStats.databaseBytes || 0) / 1024 / 1024).toFixed(1)} MB</p>
                                                <span className="text-xs text-gray-400">of 500 MB</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${(!storageStats || (storageStats.databaseBytes || 0) < 350000000) ? 'bg-green-500' : ((storageStats.databaseBytes || 0) < 450000000) ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(((storageStats.databaseBytes || 0) / 500000000) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-400">Core data & text logs</p>
                                        </div>
                                    ) : (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-4 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-bold text-gray-700 dark:text-gray-200">User Management & Limits</h3>
                                        <button
                                            onClick={bulkAssignIndianPlan}
                                            className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-lg border border-orange-200 dark:border-orange-800/50 hover:bg-orange-200 transition-colors"
                                        >
                                            Force Premium India for All
                                        </button>
                                    </div>
                                    <select
                                        value={currencyFilter}
                                        onChange={e => setCurrencyFilter(e.target.value as 'ALL' | 'USD' | 'INR')}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="ALL">All Currencies</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>



                                {/* STANDARD USERS HEAD */}
                                <div className="px-6 py-2 bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Standard Users</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 lowercase text-xs">
                                            {/* Standard Headers */}
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {users.filter(u => !u.isCustomPlan).map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {u.planId && plans.find(p => p.id === u.planId) ? (
                                                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                                    {plans.find(p => p.id === u.planId)?.name}
                                                                </span>
                                                            ) : u.premiumUntil && u.premiumUntil > Date.now() ? (
                                                                (() => {
                                                                    const isTrial = u.createdAt && (Date.now() - u.createdAt < 30 * 24 * 60 * 60 * 1000);
                                                                    const daysLeft = Math.ceil((u.premiumUntil - Date.now()) / (1000 * 60 * 60 * 24));
                                                                    return (
                                                                        <span className={`text-xs ${isTrial ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'} px-2 py-0.5 rounded-full font-bold flex items-center gap-1`}>
                                                                            {isTrial ? 'Trial' : 'Premium'} ({daysLeft}d)
                                                                        </span>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className="text-xs text-gray-400 font-mono">Basic</span>
                                                            )}

                                                            {editingUser === u.id ? (
                                                                <div className="flex flex-col gap-2 mt-2 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm w-64 text-left">
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Assign Plan</label>
                                                                        <select
                                                                            value={editLimits.planId || ''}
                                                                            onChange={e => setEditLimits({ ...editLimits, planId: e.target.value || null })}
                                                                            className="w-full text-xs p-1.5 border rounded bg-white font-medium"
                                                                        >
                                                                            <option value="">No Plan (Basic)</option>
                                                                            {plans.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">End / Renewal Date</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editLimits.renewalDate || ''}
                                                                            onChange={e => setEditLimits({ ...editLimits, renewalDate: e.target.value })}
                                                                            className="w-full text-xs p-1.5 border rounded"
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-between border-t pt-2">
                                                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editLimits.isCustomPlan}
                                                                                onChange={e => setEditLimits({ ...editLimits, isCustomPlan: e.target.checked })}
                                                                                className="w-3 h-3 text-blue-600 rounded"
                                                                            />
                                                                            Custom Plan
                                                                        </label>
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => handleSave(u)}
                                                                                className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition-colors"
                                                                                title="Save Changes"
                                                                            >
                                                                                <Check size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditingUser(null)}
                                                                                className="bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300 transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {editLimits.isCustomPlan && (
                                                                        <div className="mt-2 text-[9px] text-gray-400 italic">
                                                                            * Further custom details can be edited in the "Custom Users" tab.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 hover:underline font-bold"
                                                                    onClick={() => startEdit(u)}
                                                                >
                                                                    Edit Plan / Status
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleNotifs(u.id, !!u.notificationsEnabled)}
                                                            className={`p-2 rounded-full ${u.notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                                            title="Toggle Task Notifications"
                                                        >
                                                            <Bell size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleReminders(u.id, !!u.remindersEnabled)}
                                                            className={`p-2 rounded-full ${u.remindersEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}
                                                            title="Toggle Task Reminders"
                                                        >
                                                            <Clock size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleTimeTracking(u.id, !!u.timeTrackingEnabled)}
                                                            className={`p-2 rounded-full ${u.timeTrackingEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                                            title="Toggle Time Tracking"
                                                        >
                                                            <Timer size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleImageUpload(u.id, !!u.imageUploadEnabled)}
                                                            className={`p-2 rounded-full ${u.imageUploadEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
                                                            title="Toggle Image Upload"
                                                        >
                                                            <FolderKanban size={16} />
                                                        </button>
                                                        {u.imageUploadEnabled && (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="10"
                                                                    value={u.maxAttachmentsPerTask || 3}
                                                                    onChange={(e) => handleUpdateMaxAttachments(u.id, parseInt(e.target.value))}
                                                                    className="w-12 p-1 text-xs border rounded text-center"
                                                                    title="Max Attachments per Task"
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {editingUser === u.id ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={editLimits.historyRetentionDays || ''}
                                                                placeholder="∞"
                                                                onChange={(e) => setEditLimits({
                                                                    ...editLimits,
                                                                    historyRetentionDays: e.target.value ? parseInt(e.target.value) : null
                                                                })}
                                                                className="w-16 px-2 py-1 text-sm text-center border border-purple-300 rounded bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                                title="Delete history older than X days (empty = keep forever)"
                                                            />
                                                        ) : (
                                                            <span className="font-mono text-gray-700 dark:text-gray-300">
                                                                {u.historyRetentionDays ? u.historyRetentionDays : '∞'}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400">
                                                            {editingUser === u.id || u.historyRetentionDays ? 'days' : 'forever'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {editingUser === u.id ? (
                                                            <div className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editLimits.isCustomPlan}
                                                                        onChange={(e) => setEditLimits({ ...editLimits, isCustomPlan: e.target.checked })}
                                                                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                                    />
                                                                    Custom Plan
                                                                </label>

                                                                {editLimits.isCustomPlan && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between gap-2 text-[10px]">
                                                                            <span className="font-bold text-slate-400 uppercase">Currency</span>
                                                                            <select
                                                                                value={editLimits.currency}
                                                                                onChange={e => setEditLimits({ ...editLimits, currency: e.target.value })}
                                                                                className="w-20 p-1 border rounded bg-white text-xs font-bold dark:bg-slate-800 dark:border-slate-600"
                                                                            >
                                                                                <option value="USD">USD ($)</option>
                                                                                <option value="INR">INR (₹)</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                                            <div>
                                                                                <span className="text-slate-400 block mb-0.5">Base ({editLimits.currency === 'INR' ? '₹' : '$'})</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={editLimits.planBaseCost}
                                                                                    onChange={(e) => setEditLimits({ ...editLimits, planBaseCost: parseFloat(e.target.value) })}
                                                                                    className="w-full p-1 border rounded text-right dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                                                    title="Custom Base Cost"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-slate-400 block mb-0.5">Seat ({editLimits.currency === 'INR' ? '₹' : '$'})</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={editLimits.perSeatCost}
                                                                                    onChange={(e) => setEditLimits({ ...editLimits, perSeatCost: parseFloat(e.target.value) })}
                                                                                    className="w-full p-1 border rounded text-right dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                                                    title="Custom Per Seat Cost"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-1 justify-center mt-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                                    <input type="number" className="w-10 p-1 border rounded text-center text-xs" value={editLimits.maxProjects} onChange={e => setEditLimits({ ...editLimits, maxProjects: +e.target.value })} title="Max Projects" />
                                                                    <span className="text-gray-400">/</span>
                                                                    <input type="number" className="w-10 p-1 border rounded text-center text-xs" value={editLimits.maxLeads} onChange={e => setEditLimits({ ...editLimits, maxLeads: +e.target.value })} title="Max Leads" />
                                                                    <span className="text-gray-400">/</span>
                                                                    <input type="number" className="w-10 p-1 border rounded text-center text-xs" value={editLimits.maxResources} onChange={e => setEditLimits({ ...editLimits, maxResources: +e.target.value })} title="Max Resources" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="font-mono text-gray-600 dark:text-gray-400 text-xs">
                                                                    {u.customPlanData?.maxProjects || u.maxProjects || 0}/{u.customPlanData?.maxLeads || u.maxLeads || 0}/{u.customPlanData?.maxResources || u.maxResources || 0}
                                                                </div>
                                                                {u.isCustomPlan && (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] uppercase font-bold rounded">
                                                                            Custom ({u.currency || 'USD'})
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase">
                                                                            {u.customPlanData?.billingInterval || 'monthly'}
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-400 mt-0.5">
                                                                            {u.currency === 'INR' ? '₹' : '$'}{u.customPlanData?.baseCost || 0} + {u.currency === 'INR' ? '₹' : '$'}{u.customPlanData?.seatCost || 0}/s
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {(u.customPlanData?.extraSeats || 0) > 0 && (
                                                                    <span className="text-[10px] text-green-600 font-bold">
                                                                        (+{u.customPlanData?.extraSeats} seats)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {editingUser === u.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleSave(u)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={16} /></button>
                                                                <button onClick={() => setEditingUser(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={16} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleLoginAsUser(u)} className="text-gray-400 hover:text-green-500 p-1 rounded" title="Login as User">
                                                                    <LogIn size={16} />
                                                                </button>
                                                                <button onClick={() => startEdit(u)} className="text-gray-400 hover:text-blue-500 p-1 rounded" title="Edit User">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                {u.email !== 'manavss828@gmail.com' && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u)}
                                                                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                                                                        title="Delete User"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Global Projects</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {projects.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => openProject(p.id)}
                                            className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:shadow-md cursor-pointer bg-gray-50 dark:bg-gray-800/50 transition-all"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                <h4 className="font-bold text-gray-800 dark:text-white truncate">{p.name}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">Owner: {users.find(u => u.id === p.ownerId)?.name || p.owner?.name || 'Unknown'}</p>
                                            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit text-gray-600 dark:text-gray-300">
                                                Code: {p.code}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )
            }
        </div>
    );
};

