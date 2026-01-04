import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../../store';
import { CreditCard, Settings, DollarSign, Activity, Save, RefreshCw, Lock, Unlock, Eye, EyeOff, Calendar, Filter, Plus, X } from 'lucide-react';

export const SuperAdminPayments: React.FC = () => {
    const { paymentConfigs, fetchPaymentConfigs, updatePaymentConfig, adminTransactions, fetchAdminTransactions } = useStore() as any;
    const [activeTab, setActiveTab] = useState<'transactions' | 'settings'>('transactions');
    const [isLoading, setIsLoading] = useState(false);

    // Settings State
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    // Local state for editing configs to allow "Save" action
    const [localConfigs, setLocalConfigs] = useState<any[]>([]);

    // Initialize local state when configs are fetched
    useEffect(() => {
        if (paymentConfigs) {
            setLocalConfigs(JSON.parse(JSON.stringify(paymentConfigs)));
        }
    }, [paymentConfigs]);

    // Reports State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
        end: new Date().toISOString().split('T')[0]
    });

    // Filters State
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [selectedDatePreset, setSelectedDatePreset] = useState('this_month');

    // Date Range Presets
    const applyDatePreset = (preset: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year') => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        switch (preset) {
            case 'today':
                start = today;
                end = today;
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'this_week':
                // current week starts on Sunday (or Monday depending on locale, usually Sunday in JS 0)
                // Let's assume Monday start for business logic
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                start.setDate(diff);
                end = today;
                break;
            case 'last_week':
                const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                const dayLast = lastWeek.getDay();
                const diffLast = lastWeek.getDate() - dayLast + (dayLast === 0 ? -6 : 1);
                start = new Date(lastWeek.setDate(diffLast));
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'this_year':
                start = new Date(today.getFullYear(), 0, 1);
                end = today;
                break;
            case 'last_year':
                start = new Date(today.getFullYear() - 1, 0, 1);
                end = new Date(today.getFullYear() - 1, 11, 31);
                break;
        }

        const newRange = { start: formatDate(start), end: formatDate(end) };
        setDateRange(newRange);
        setSelectedDatePreset(preset);
        fetchAdminTransactions(newRange.start, newRange.end);
    };

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyDatePreset(e.target.value as any);
    };

    useEffect(() => {
        fetchPaymentConfigs();
        fetchAdminTransactions(dateRange.start, dateRange.end); // Initial fetch
    }, []);

    const handleDateChange = (type: 'start' | 'end', val: string) => {
        const newRange = { ...dateRange, [type]: val };
        setDateRange(newRange);
        // fetchAdminTransactions not auto-triggered here to allow manual range picking, user clicks refresh or enter?
        // Actually user request implies filter buttons. Let's keep manual + refresh button.
        // Or auto-refresh if valid.
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLocalConfigChange = (provider: string, field: string, value: any) => {
        setLocalConfigs(prev => prev.map(c => c.provider === provider ? { ...c, [field]: value } : c));
    };

    const saveConfig = async (provider: string) => {
        const config = localConfigs.find(c => c.provider === provider);
        if (!config) return;

        setIsLoading(true);
        try {
            await updatePaymentConfig(provider, {
                is_enabled: config.is_enabled,
                mode: config.mode,
                test_key_id: config.test_key_id,
                test_key_secret: config.test_key_secret,
                live_key_id: config.live_key_id,
                live_key_secret: config.live_key_secret
            });
            alert("Configuration saved successfully!");
        } catch (e) {
            alert("Failed to update");
        }
        setIsLoading(false);
    };

    // Stats Calculation
    // Derived Data
    const filteredTransactions = useMemo(() => {
        return adminTransactions.filter((tx: any) => {
            if (selectedProvider === 'all') return true;
            // If provider column exists, use it. Otherwise guess or just return true for now if we can't tell.
            // Since we just added the column, it might be 'system' or 'razorpay'.
            // Let's rely on currency to guess if provider is missing or use provider if present.
            const provider = tx.provider || (tx.currency === 'INR' ? 'razorpay' : 'lemonsqueezy'); // heuristic fallback
            return provider === selectedProvider ||
                (selectedProvider === 'razorpay' && provider === 'razorpay') || // lenient check
                (selectedProvider === 'lemonsqueezy' && provider === 'lemonsqueezy');
        });
    }, [adminTransactions, selectedProvider]);

    const stats = useMemo(() => {
        const totalUSD = filteredTransactions
            .filter((tx: any) => !tx.currency || tx.currency === 'USD')
            .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);

        const totalINR = filteredTransactions
            .filter((tx: any) => tx.currency === 'INR')
            .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);

        const count = filteredTransactions.length;
        const successful = filteredTransactions.filter((tx: any) => tx.status === 'completed').length;
        const cancelled = filteredTransactions.filter((tx: any) => tx.status === 'cancelled').length;

        return { totalUSD, totalINR, count, successful, cancelled };
    }, [filteredTransactions]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-0">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <DollarSign size={16} /> Transactions & Revenue
                </button>


                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <Settings size={16} /> Gateway Configuration
                </button>
            </div>

            {
                activeTab === 'transactions' && (
                    <div className="space-y-6">
                        {/* Date Filter & Stats */}
                        {/* Filters & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            {/* Filters Card */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700 md:col-span-4 lg:col-span-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    {/* Date Preset Dropdown */}
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Date Range</label>
                                        <select
                                            value={selectedDatePreset}
                                            onChange={handlePresetChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="this_week">This Week</option>
                                            <option value="last_week">Last Week</option>
                                            <option value="this_month">This Month</option>
                                            <option value="last_month">Last Month</option>
                                            <option value="this_year">This Year</option>
                                            <option value="last_year">Last Year</option>
                                        </select>
                                    </div>

                                    {/* Payment Provider Dropdown */}
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Provider</label>
                                        <select
                                            value={selectedProvider}
                                            onChange={(e) => setSelectedProvider(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="all">All Providers</option>
                                            <option value="razorpay">Razorpay</option>
                                            <option value="lemonsqueezy">Lemon Squeezy</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Custom Date Range & Load */}
                                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Range:</span>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => handleDateChange('start', e.target.value)}
                                        className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-1 text-xs w-32"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => handleDateChange('end', e.target.value)}
                                        className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-1 text-xs w-32"
                                    />
                                    <button
                                        onClick={() => fetchAdminTransactions(dateRange.start, dateRange.end)}
                                        className="bg-primary hover:bg-primary-hover text-white p-1.5 rounded-md ml-2 transition-colors"
                                        title="Reload Data"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Revenue Card (Dual Currency) */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2">
                                <h3 className="text-gray-500 font-medium text-sm mb-2 flex items-center gap-2">
                                    <DollarSign size={16} /> Total Revenue
                                </h3>
                                <div className="flex items-baseline gap-4">
                                    <div>
                                        <p className="text-3xl font-bold text-green-600">${stats.totalUSD.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">USD Revenue</p>
                                    </div>
                                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                                    <div>
                                        <p className="text-3xl font-bold text-blue-600">₹{stats.totalINR.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">INR Revenue</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700 col-span-1">
                                <h3 className="text-gray-500 font-medium text-sm mb-2">Transactions</h3>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.count}</p>
                                <p className="text-xs text-gray-400">{stats.successful} Successful, {stats.cancelled} Cancelled</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700 col-span-1">
                                <h3 className="text-gray-500 font-medium text-sm mb-2">Avg. Order Value</h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">${stats.count > 0 ? (stats.totalUSD / stats.count).toFixed(2) : '0.00'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center p-8 text-gray-500">No transactions found matching your filters.</td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map((tx: any) => (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800 dark:text-white">{tx.userName}</span>
                                                            <span className="text-xs text-gray-500">{tx.userEmail}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono mt-1">{tx.user_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                        {tx.description}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">
                                                        {tx.currency === 'INR' ? '₹' : '$'}{Math.abs(tx.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize 
                                                        ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                tx.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                                                    'bg-red-100 text-red-700'}`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }



            {
                activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {localConfigs.map((config: any) => (
                            <div key={config.provider} className={`border rounded-xl overflow-hidden ${config.is_enabled ? 'border-primary shadow-md' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
                                {/* Card Header */}
                                <div className={`p-4 flex justify-between items-center ${config.is_enabled ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <CreditCard size={20} className={config.provider === 'razorpay' ? 'text-blue-600' : 'text-purple-600'} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg capitalize">{config.provider === 'lemonsqueezy' ? 'Lemon Squeezy' : config.provider}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{config.mode} Mode</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.is_enabled}
                                            onChange={(e) => handleLocalConfigChange(config.provider, 'is_enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
                                    {/* Mode Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Environment Mode</span>
                                        <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1">
                                            <button
                                                onClick={() => handleLocalConfigChange(config.provider, 'mode', 'test')}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${config.mode === 'test' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                TEST
                                            </button>
                                            <button
                                                onClick={() => handleLocalConfigChange(config.provider, 'mode', 'live')}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${config.mode === 'live' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                LIVE
                                            </button>
                                        </div>
                                    </div>

                                    {/* API Keys Section */}
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                            <Lock size={12} /> {config.mode} Credentials
                                        </h4>

                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Key ID / Public Key</label>
                                            <input
                                                type="text"
                                                value={config.mode === 'test' ? config.test_key_id : config.live_key_id}
                                                onChange={(e) => handleLocalConfigChange(config.provider, config.mode === 'test' ? 'test_key_id' : 'live_key_id', e.target.value)}
                                                className="w-full text-sm border rounded p-2 font-mono bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                                placeholder={`Ex: ${config.provider === 'razorpay' ? 'rzp_test_...' : 'ls_pub_...'}`}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Key Secret / Private Key</label>
                                            <div className="relative">
                                                <input
                                                    type={showSecrets[`${config.provider}_secret`] ? "text" : "password"}
                                                    value={config.mode === 'test' ? config.test_key_secret : config.live_key_secret}
                                                    onChange={(e) => handleLocalConfigChange(config.provider, config.mode === 'test' ? 'test_key_secret' : 'live_key_secret', e.target.value)}
                                                    className="w-full text-sm border rounded p-2 font-mono bg-gray-50 dark:bg-gray-700 dark:border-gray-600 pr-10"
                                                    placeholder="..."
                                                />
                                                <button
                                                    onClick={() => toggleSecret(`${config.provider}_secret`)}
                                                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showSecrets[`${config.provider}_secret`] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                        <button
                                            onClick={() => saveConfig(config.provider)}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }



        </div>
    );
};
