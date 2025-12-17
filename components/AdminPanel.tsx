
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { Users, FolderKanban, Shield, Check, X, Bell, Crown, Edit2, Clock, Timer, Lock, Unlock, HardDrive, Database, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, StorageStats, Plan } from '../types';
import { AdminFeedback } from './admin/AdminFeedback';
import { MessageSquare } from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const { currentUser, updateUserProfile, deleteUser, setActiveProject, getRegistrationStatus, toggleRegistration, fetchStorageStats, plans, updatePlan, users: storeUsers, projects: storeProjects, fetchUsers, fetchProjects } = useStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    // Use store data directly for rendering, or keep local state sync if needed (sorting).
    // Given the sort requirement, we'll sync from storeUsers.
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [regOpen, setRegOpen] = useState(true);
    const [localPlans, setLocalPlans] = useState<Plan[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'feedback'>('overview');

    useEffect(() => {
        // Enforce sorted order locally to prevent jumping
        const sorted = [...plans].sort((a, b) => a.id.localeCompare(b.id));
        setLocalPlans(sorted);
    }, [plans]);

    const handlePlanChange = (planId: string, field: keyof Plan, value: any) => {
        setLocalPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
    };

    const savePlan = async (planId: string) => {
        const plan = localPlans.find(p => p.id === planId);
        if (!plan) return;
        await updatePlan(planId, plan);
        // alert('Plan updated successfully!'); // Removed alert to be less intrusive
    };

    const [editLimits, setEditLimits] = useState({
        maxProjects: 3,
        maxLeads: 2,
        maxResources: 5,
        historyRetentionDays: null as number | null,
        addPremiumDays: 0 // New field for temp premium
    });

    useEffect(() => {
        if (currentUser?.email !== 'manavss828@gmail.com') {
            navigate('/');
            return;
        }

        const loadAdminData = async () => {
            // 1. Initial Data check (if store empty)
            if (storeUsers.length === 0) await fetchUsers();
            if (storeProjects.length === 0) await fetchProjects();

            // 2. Fetch Admin specific stats
            const status = await getRegistrationStatus();
            setRegOpen(status);
            const stats = await fetchStorageStats();
            setStorageStats(stats);

            setLoading(false);
        };

        loadAdminData();
    }, [currentUser, navigate]); // Removed fetchUsers/Projects from dependency to avoid loop if they change reference

    // Sync from Store to Local State for Display (and Sorting)
    useEffect(() => {
        const sorted = [...storeUsers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUsers(sorted);
    }, [storeUsers]);

    useEffect(() => {
        setProjects(storeProjects);
    }, [storeProjects]);

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

    const startEdit = (user: User) => {
        setEditingUser(user.id);
        setEditLimits({
            maxProjects: user.maxProjects || 3,
            maxLeads: user.maxLeads || 2,
            maxResources: user.maxResources || 5,
            historyRetentionDays: user.historyRetentionDays || null,
            addPremiumDays: 0
        });
    };

    const saveEdit = async (userId: string) => {
        // 1. Update Profile Limits
        await updateUserProfile(userId, {
            maxProjects: editLimits.maxProjects,
            maxLeads: editLimits.maxLeads,
            maxResources: editLimits.maxResources,
        });

        // Handle Premium Extension if set
        if (editLimits.addPremiumDays !== 0) {
            const until = new Date();
            if (editLimits.addPremiumDays > 0) {
                until.setDate(until.getDate() + editLimits.addPremiumDays);
                await updateUserProfile(userId, { premiumUntil: until.getTime() });
            } else {
                // Negative implies remove? checking use case. Let's stick to 0=ignore for now in edit mode, 
                // and handle removal separately or support negative for 'remove access'. 
                // Better: If user inputs 0 in edit mode, we do nothing. 
                // To remove, passing a special flag or separate button is better.
                // Let's implement specific "Grant/Revoke" logic in the loop below.
            }
        }

        // 2. Update History Retention
        // First check if settings exist
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
            alert(`Failed to save history retention: ${error.message || error.details || JSON.stringify(error)}`);
        } else {
            // Optional: Verification logic remains silently or removed if preferred, but user just said "unnecessary logs". 
            // I will remove the success logs.
        }

        setEditingUser(null);
        fetchUsers();
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

            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Overview & Management
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'feedback' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    <MessageSquare size={16} />
                    User Feedback
                </button>
            </div>

            {activeTab === 'feedback' ? (
                <AdminFeedback />
            ) : (
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

                    {/* Plan Management Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Crown size={20} className="text-yellow-500" /> Manage Plans & Pricing
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {localPlans.map(plan => (
                                <div key={plan.id} className={`border rounded-xl p-5 ${plan.id === 'premium' ? 'border-yellow-400 bg-yellow-50/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xl font-bold capitalize text-gray-800 dark:text-white">{plan.name}</h4>
                                        <button onClick={() => savePlan(plan.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                                            <Check size={14} /> Save Changes
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Pricing */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Monthly ($)</label>
                                                <input
                                                    type="number"
                                                    value={plan.priceMonthly}
                                                    onChange={e => handlePlanChange(plan.id, 'priceMonthly', parseInt(e.target.value))}
                                                    className="w-full border rounded p-2"
                                                    disabled={plan.id === 'free'}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Yearly ($)</label>
                                                <input
                                                    type="number"
                                                    value={plan.priceYearly}
                                                    onChange={e => handlePlanChange(plan.id, 'priceYearly', parseInt(e.target.value))}
                                                    className="w-full border rounded p-2"
                                                    disabled={plan.id === 'free'}
                                                />
                                            </div>
                                        </div>

                                        {/* Limits */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Max Projects</label>
                                                <input
                                                    type="number"
                                                    value={plan.maxProjects}
                                                    onChange={e => handlePlanChange(plan.id, 'maxProjects', parseInt(e.target.value))}
                                                    className="w-full border rounded p-2"
                                                />
                                                <p className="text-[10px] text-gray-400">999999 = Unlimited</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Members/Proj</label>
                                                <input
                                                    type="number"
                                                    value={plan.maxMembersPerProject}
                                                    onChange={e => handlePlanChange(plan.id, 'maxMembersPerProject', parseInt(e.target.value))}
                                                    className="w-full border rounded p-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Upload Limit (Count)</label>
                                                <input
                                                    type="number"
                                                    value={plan.maxUploadsPerTaskLimit}
                                                    onChange={e => handlePlanChange(plan.id, 'maxUploadsPerTaskLimit', parseInt(e.target.value))}
                                                    className="w-full border rounded p-2"
                                                />
                                                <p className="text-[10px] text-gray-400">0 = Use Toggle</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Retention (Days)</label>
                                                <input
                                                    type="number"
                                                    value={plan.historyRetentionDays || ''}
                                                    placeholder="Unlimited"
                                                    onChange={e => handlePlanChange(plan.id, 'historyRetentionDays', e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full border rounded p-2"
                                                />
                                            </div>
                                        </div>

                                        {/* Toggles */}
                                        <div className="space-y-2 pt-2 border-t">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase">Features Enabled</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { key: 'canInviteMembers', label: 'Invite Members' },
                                                    { key: 'canUploadImages', label: 'Image Uploads' },
                                                    { key: 'canSetReminders', label: 'Reminders' },
                                                    { key: 'canUseNotifications', label: 'Notifications' },
                                                    { key: 'canExportData', label: 'CSV Export' },
                                                    { key: 'canViewHistory', label: 'View History' }
                                                ].map(feature => (
                                                    <label key={feature.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={plan[feature.key as keyof Plan] as boolean}
                                                            onChange={e => handlePlanChange(plan.id, feature.key as keyof Plan, e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        {feature.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {localPlans.length === 0 && <p className="text-gray-500 italic p-4">Loading plans...</p>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">User Management & Limits</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-4 py-3 text-center">Premium</th>
                                        <th className="px-4 py-3 text-center">Features</th>
                                        <th className="px-4 py-3 text-center">History Retention</th>
                                        <th className="px-4 py-3 text-center">Limits (Proj/Lead/Res)</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {u.premiumUntil && u.premiumUntil > Date.now() ? (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                            Manual ({Math.ceil((u.premiumUntil - Date.now()) / (1000 * 60 * 60 * 24))}d)
                                                        </span>
                                                    ) : (u.createdAt && (Date.now() - u.createdAt < 30 * 24 * 60 * 60 * 1000)) ? (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                            Trial ({Math.ceil((30 - (Date.now() - u.createdAt) / (1000 * 60 * 60 * 24)))}d)
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-mono">Basic</span>
                                                    )}

                                                    {editingUser === u.id ? (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <input
                                                                type="number"
                                                                className="w-12 text-xs p-1 border rounded text-center"
                                                                placeholder="+Days"
                                                                value={editLimits.addPremiumDays || ''}
                                                                onChange={(e) => setEditLimits({ ...editLimits, addPremiumDays: parseInt(e.target.value) })}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    if (editLimits.addPremiumDays) handleAddPremium(u.id, editLimits.addPremiumDays);
                                                                }}
                                                                className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200"
                                                                title="Add/Set Premium Days (Overwrite)"
                                                            >
                                                                <Check size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 hover:underline"
                                                            onClick={() => startEdit(u)}
                                                        >
                                                            Edit
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
                                                <div className="flex flex-col items-center gap-1">
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
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {editingUser === u.id ? (
                                                    <div className="flex gap-1 justify-center">
                                                        <input type="number" className="w-12 p-1 border rounded text-center" value={editLimits.maxProjects} onChange={e => setEditLimits({ ...editLimits, maxProjects: +e.target.value })} title="Max Projects" />
                                                        <span className="text-gray-400">/</span>
                                                        <input type="number" className="w-12 p-1 border rounded text-center" value={editLimits.maxLeads} onChange={e => setEditLimits({ ...editLimits, maxLeads: +e.target.value })} title="Max Leads" />
                                                        <span className="text-gray-400">/</span>
                                                        <input type="number" className="w-12 p-1 border rounded text-center" value={editLimits.maxResources} onChange={e => setEditLimits({ ...editLimits, maxResources: +e.target.value })} title="Max Resources" />
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-gray-600 dark:text-gray-400">
                                                        {u.maxProjects} / {u.maxLeads} / {u.maxResources}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingUser === u.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => saveEdit(u.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={16} /></button>
                                                        <button onClick={() => setEditingUser(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
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
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.themeColor || p.theme_color }}></div>
                                        <h4 className="font-bold text-gray-800 dark:text-white truncate">{p.name}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">Manager: {users.find(u => u.id === p.managerId)?.name || p.manager?.name || 'Unknown'}</p>
                                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit text-gray-600 dark:text-gray-300">
                                        Code: {p.code}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
