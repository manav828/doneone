import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, CheckCircle, XCircle, Crown, CreditCard, Users, Clock, Plus, Minus, Search, Filter, MoreHorizontal, MessageSquare, Send, Info, Check, Image, ShieldCheck, FileText, Zap, Phone, Globe, Building2, Mail } from 'lucide-react';

const BillingPage: React.FC = () => {
    const { currentUser, transactions, fetchTransactions, addSeat, projects, users, removeMember, fetchUsers, fetchProjects, teams, teamMembers, fetchTeams, fetchTeamMembers, plans, fetchPlans, submitEnterpriseInquiry } = useStore() as any;
    const navigate = useNavigate();
    const [seatAdjustment, setSeatAdjustment] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Loading State to prevent Flash of Wrong Currency
    const [isLoading, setIsLoading] = useState(true);
    const [detectedCurrency, setDetectedCurrency] = useState<'USD' | 'INR'>('USD');

    // Confirmation Modal State (Only for valid reductions)
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    // Enterprise Contact Form State
    const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [annual, setAnnual] = useState(true);

    // Enterprise Inquiry Form State
    const [enterpriseForm, setEnterpriseForm] = useState({
        email: currentUser?.email || '',
        phone: '',
        country: '',
        companyName: '',
        teamSize: '',
        requiredFeatures: [] as string[],
        requirements: ''
    });

    const handleSendEnterpriseRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enterpriseForm.email.trim()) {
            alert('Email is required');
            return;
        }

        setIsSendingMessage(true);
        try {
            const success = await submitEnterpriseInquiry(enterpriseForm);
            if (success) {
                setEnterpriseForm({
                    email: currentUser?.email || '',
                    phone: '',
                    country: '',
                    companyName: '',
                    teamSize: '',
                    requiredFeatures: [],
                    requirements: ''
                });
                setIsEnterpriseModalOpen(false);
                alert('Thank you! Our team will contact you within 24 hours.');
            } else {
                alert('Failed to submit inquiry. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchTransactions(),
                    fetchUsers(),
                    fetchProjects(),
                    fetchTeams(),
                    fetchPlans()
                ]);

                const { teams: loadedTeams, currentUser: loadedUser, transactions: loadedTx } = useStore.getState() as any;
                const myTeams = loadedTeams.filter((t: any) =>
                    t.ownerId === loadedUser?.id || t.managerIds?.includes(loadedUser?.id)
                );
                await Promise.all(myTeams.map((t: any) => fetchTeamMembers(t.id)));

                const hasInrHistory = loadedTx.some((t: any) => t.currency === 'INR');
                if (hasInrHistory) {
                    setDetectedCurrency('INR');
                } else if (!loadedTx || loadedTx.length === 0) {
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        const data = await res.json();
                        if (data.country_code === 'IN') setDetectedCurrency('INR');
                    } catch (err) {
                        console.warn('Failed to detect location for currency', err);
                    }
                }
            } catch (error) {
                console.error("Error loading billing data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser) loadData();
    }, [currentUser?.id]);

    if (!currentUser) return null;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-white dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-slate-400" size={32} />
                    <p className="text-slate-500 font-medium">Loading subscription details...</p>
                </div>
            </div>
        );
    }

    // Derived State
    const currentPlan = plans.find((p: any) => p.id === currentUser.planId);
    const totalSeats = (currentUser.maxResources || 0) + (currentUser.extraSeats || 0);
    const hasInrHistory = transactions.some((t: any) => t.currency === 'INR');
    const currencyCode = currentUser.currency || (hasInrHistory ? 'INR' : detectedCurrency);
    const currencySymbol = currencyCode === 'INR' ? '₹' : '$';

    // Custom Plan Detection
    const isCustomPlanUser = currentUser.isCustomPlan ||
        (currentUser.customPlanData && Object.keys(currentUser.customPlanData).length > 0);

    const getUniqueEmployeeCount = () => {
        const myTeams = teams.filter((t: any) => t.ownerId === currentUser.id);
        const allMembers = teamMembers.filter((m: any) =>
            myTeams.some((t: any) => t.id === m.teamId) && m.status === 'active'
        );
        const uniqueIds = new Set(allMembers.map((m: any) => m.userId));
        return uniqueIds.size;
    };

    const uniqueEmployeeCount = getUniqueEmployeeCount();

    const handleConfirmReduction = async () => {
        setIsProcessing(true);
        try {
            await supabase.from('transactions').insert({
                user_id: currentUser.id,
                amount: 0,
                status: 'cancelled',
                description: `Seat Reduction (Removed ${Math.abs(seatAdjustment)} seats)`,
                currency: currencyCode
            });
            await addSeat(seatAdjustment);
            await fetchUsers();
            await fetchTransactions();
            setSeatAdjustment(0);
            setIsConfirmationModalOpen(false);
            setIsProcessing(false);
        } catch (error) {
            console.error("Reduction failed:", error);
            setIsProcessing(false);
        }
    };

    const handleUpdateSeats = async () => {
        const intervalChanged = (annual ? 'annual' : 'monthly') !== currentUser.billingInterval;
        if (seatAdjustment === 0 && !intervalChanged) return;

        if (seatAdjustment > 0 || intervalChanged) {
            navigate(`/checkout?seats=${seatAdjustment}${annual ? '&billing=annual' : '&billing=monthly'}`);
            return;
        }

        if (seatAdjustment < 0) {
            const newTotalCapacity = totalSeats + seatAdjustment;
            if (newTotalCapacity < uniqueEmployeeCount) {
                alert(`Cannot reduce seats. You have ${uniqueEmployeeCount} active employees.`);
                return;
            }
            setIsConfirmationModalOpen(true);
        }
    };

    const handleAddSeats = () => {
        handleUpdateSeats();
    };

    return (
        <div className="h-full overflow-hidden bg-slate-50/30 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto w-full p-6 space-y-6 pb-20">

                    <section>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subscription Plans</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Scale your workspace as your team grows.</p>
                            </div>
                            <div className="flex items-center gap-6">
                                {/* Billing Toggle */}
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!annual ? 'text-[#FF6B35]' : 'text-slate-400'}`}>Monthly</span>
                                    <button
                                        onClick={() => setAnnual(!annual)}
                                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${annual ? 'bg-[#FF6B35]' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <motion.div
                                            className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm"
                                            animate={{ left: annual ? '22px' : '2px' }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${annual ? 'text-[#FF6B35]' : 'text-slate-400'}`}>Yearly</span>
                                </div>

                                <button
                                    onClick={() => navigate('/compare')}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                >
                                    <RefreshCw size={14} className="rotate-90" />
                                    Compare Plans
                                </button>
                            </div>
                        </div>

                        {isCustomPlanUser ? (
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                {/* Left Side: Enterprise Plan Info */}
                                <div className="flex-1 w-full bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Crown className="text-white" size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Plan (Custom)</h2>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Tailored for your organization</p>
                                            </div>
                                        </div>
                                        <span className="px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-md">
                                            ACTIVE
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">Base Cost</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                {currencySymbol}{currentUser.customPlanData?.planBaseCost || currentUser.customPlanData?.baseCost || 0}
                                                <span className="text-sm text-slate-400 font-medium ml-2">/{currentUser.customPlanData?.billingInterval || 'monthly'}</span>
                                            </p>
                                        </div>
                                        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">Per Seat Cost</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                {currencySymbol}{currentUser.customPlanData?.perSeatCost || currentUser.customPlanData?.seatCost || 0}
                                                <span className="text-sm text-slate-400 font-medium ml-2">/user/{currentUser.customPlanData?.billingInterval || 'monthly'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 mb-6 border border-purple-100 dark:border-purple-900">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Plan Limits</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                                    {currentUser.customPlanData?.maxProjects || currentUser.maxProjects || 0}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Projects</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                                    {currentUser.customPlanData?.maxResources || currentUser.maxResources || 0}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Resources</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                                    {currentUser.customPlanData?.maxLeads || currentUser.maxLeads || 0}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Leads</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => window.location.href = 'mailto:support@flowboard.com?subject=Custom Plan Modification Request'}
                                        className="w-full py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2 border-purple-200 dark:border-purple-800 shadow-sm"
                                    >
                                        <MessageSquare size={18} />
                                        Need Changes? Contact Support
                                    </button>
                                </div>

                                {/* Right Side: Workspace Capacity */}
                                <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Workspace Capacity</h2>

                                    <div className="text-center mb-6">
                                        <div className="text-6xl font-black text-slate-900 dark:text-white mb-2">{uniqueEmployeeCount}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                            OF {totalSeats} SEATS USED
                                        </div>
                                    </div>

                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-8">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalSeats) * 100)}%` }}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adjust Seats</h3>

                                        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                            <button
                                                onClick={() => setSeatAdjustment(Math.max(seatAdjustment - 1, -(currentUser.extraSeats || 0)))}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                                            >
                                                <Minus size={18} />
                                            </button>

                                            <div className="flex-1 text-center">
                                                <div className="text-3xl font-black text-slate-900 dark:text-white">{totalSeats + seatAdjustment}</div>
                                            </div>

                                            <button
                                                onClick={() => setSeatAdjustment(seatAdjustment + 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                                            <div className="flex items-start gap-3">
                                                <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                                    Changes to your seat count will be prorated and reflected in your next billing cycle.
                                                </p>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                {/* Left Side: Select Plan */}
                                <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Select Plan</h2>

                                    <div className="space-y-4">
                                        {plans
                                            .filter((p: any) => p.currency === currencyCode)
                                            .sort((a: any, b: any) => {
                                                const order: Record<string, number> = { 'Free': 1, 'Standard': 2, 'Enterprise': 3 };
                                                return (order[a.name] || 0) - (order[b.name] || 0);
                                            })
                                            .map((p: any) => {
                                                const isSelected = currentUser.planId === p.id;
                                                const isCurrent = currentUser.planId === p.id;

                                                const price = annual
                                                    ? (p.price_yearly ? Math.round(p.price_yearly / 12) : Math.round(p.price_monthly * 0.75))
                                                    : p.price_monthly;

                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            if (p.name === 'Enterprise') setIsEnterpriseModalOpen(true);
                                                            else navigate(`/checkout?plan=${p.id}${annual ? '&billing=annual' : '&billing=monthly'}`);
                                                        }}
                                                        className={`relative flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer select-none
                                                        ${isSelected
                                                                ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            {/* Radio Button */}
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                            ${isSelected ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                {isSelected && <div className="w-3 h-3 rounded-full bg-indigo-500" />}
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                                        {p.name === 'Enterprise' ? 'Unlimited Plan' : p.name === 'Standard' ? 'Growth Plan' : 'Core Plan'}
                                                                    </h3>
                                                                    {isCurrent && (
                                                                        <span className="bg-[#10B981] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
                                                                            Current Plan
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                                    {p.max_members_per_project === 999 ? 'Maximum capacity and scale' : p.price_monthly === 0 ? 'Basic features for small teams' : 'Advanced analytics & priority support'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                                {price === 0 ? 'Free' : `${currencySymbol}${price}`}
                                                            </span>
                                                            {price > 0 && <span className="text-xs text-slate-400 font-bold ml-1">/mo</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => navigate('/compare')}
                                            className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                                        >
                                            Compare Plans in Detail →
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Workspace Capacity */}
                                <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Workspace Capacity</h2>

                                    <div className="text-center mb-6">
                                        <div className="text-6xl font-black text-slate-900 dark:text-white mb-2">{uniqueEmployeeCount}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                            OF {totalSeats} SEATS USED
                                        </div>
                                    </div>

                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-8">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalSeats) * 100)}%` }}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adjust Seats</h3>

                                        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                            <button
                                                onClick={() => setSeatAdjustment(Math.max(seatAdjustment - 1, -(currentUser.extraSeats || 0)))}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                                            >
                                                <Minus size={18} />
                                            </button>

                                            <div className="flex-1 text-center">
                                                <div className="text-3xl font-black text-slate-900 dark:text-white">{totalSeats + seatAdjustment}</div>
                                            </div>

                                            <button
                                                onClick={() => setSeatAdjustment(seatAdjustment + 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                                            <div className="flex items-start gap-3">
                                                <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                                    Changes to your seat count will be prorated and reflected in your next billing cycle.
                                                </p>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Workspace Capacity - COMMENTED OUT: Seat adjustment is now included in plan display above
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-0 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                        <div className="flex-1 p-8 lg:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-2xl text-[#FF6B35]">
                                    <Users size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Workspace Capacity</h3>
                            </div>

                            <div className="flex items-end justify-between mb-3">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Occupied Seats</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{uniqueEmployeeCount} / {totalSeats}</span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#FF6B35] transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(255,107,53,0.4)]"
                                    style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalSeats) * 100)}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4 font-medium flex items-center gap-2">
                                <Info size={14} />
                                Your plan includes {currentUser.maxResources || 0} base seats + {currentUser.extraSeats || 0} extra seats.
                            </p>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-800/30 p-8 lg:p-10 min-w-[360px] flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Adjust Seats</span>
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev - 1)}
                                        disabled={totalSeats + seatAdjustment <= (currentUser.maxResources || 0)}
                                        className="p-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                        title={totalSeats + seatAdjustment <= (currentUser.maxResources || 0) ? "Cannot reduce below base seats" : ""}
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className={`text-lg font-black min-w-[2.5ch] text-center ${seatAdjustment === 0 ? 'text-slate-900 dark:text-white' : seatAdjustment > 0 ? 'text-[#FF6B35]' : 'text-red-500'}`}>
                                        {seatAdjustment > 0 ? `+${seatAdjustment}` : seatAdjustment}
                                    </span>
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev + 1)}
                                        className="p-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateSeats}
                                disabled={(seatAdjustment === 0 && (annual ? 'annual' : 'monthly') === currentUser.billingInterval) || isProcessing}
                                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${(seatAdjustment === 0 && (annual ? 'annual' : 'monthly') === currentUser.billingInterval)
                                    ? 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98]'}`}
                            >
                                {isProcessing ? (
                                    <RefreshCw className="animate-spin" size={16} />
                                ) : seatAdjustment === 0 && (annual ? 'annual' : 'monthly') !== currentUser.billingInterval ? (
                                    <>Switch to {annual ? 'Yearly' : 'Monthly'}</>
                                ) : seatAdjustment >= 0 ? (
                                    <>Add {seatAdjustment || ''} Seats</>
                                ) : (
                                    <>Remove {Math.abs(seatAdjustment)} Seats</>
                                )}
                            </button>
                        </div>
                    </div>
                </section>
                */}
                </div>
            </div>

            {/* Sticky Update Subscription Bar - respects sidebar */}
            {(seatAdjustment !== 0 || (annual ? 'annual' : 'monthly') !== currentUser.billingInterval) && (
                <div className="fixed bottom-0 left-72 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 z-40">
                    <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
                        <div>
                            {/* Show different label based on what changed */}
                            {(() => {
                                const currentPlan = plans.find((p: any) => p.id === currentUser.planId);
                                const billingChanged = (annual ? 'annual' : 'monthly') !== currentUser.billingInterval;
                                const seatsChanged = seatAdjustment !== 0;

                                const basePrice = annual
                                    ? (currentPlan?.price_yearly || (currentPlan?.price_monthly || 0) * 12 * 0.75)
                                    : (currentPlan?.price_monthly || 0);
                                const seatPrice = annual
                                    ? (currentPlan?.price_per_seat_yearly || (currentPlan?.price_per_seat || 0) * 12 * 0.75)
                                    : (currentPlan?.price_per_seat || currentPlan?.price_per_seat_monthly || 0);
                                const seatCost = Math.abs(seatAdjustment) * (seatPrice || 0);

                                if (billingChanged && seatsChanged) {
                                    // Both plan and seats changed - show both
                                    return (
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Plan ({annual ? 'Yearly' : 'Monthly'})</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{currencySymbol}{basePrice.toFixed(2)}</p>
                                            </div>
                                            <div className="text-slate-300 dark:text-slate-600">+</div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{seatAdjustment > 0 ? '+' : ''}{seatAdjustment} Seat{Math.abs(seatAdjustment) > 1 ? 's' : ''}</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{currencySymbol}{seatCost.toFixed(2)}<span className="text-xs font-medium text-slate-400 ml-1">/{annual ? 'yr' : 'mo'}</span></p>
                                            </div>
                                        </div>
                                    );
                                } else if (seatsChanged && !billingChanged) {
                                    // Only seats changed
                                    return (
                                        <>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                                                {seatAdjustment > 0 ? 'Add' : 'Remove'} {Math.abs(seatAdjustment)} Seat{Math.abs(seatAdjustment) > 1 ? 's' : ''}
                                            </p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                {currencySymbol}{seatCost.toFixed(2)}
                                                <span className="text-sm font-medium text-slate-400 ml-1">/ {annual ? 'year' : 'month'}</span>
                                            </p>
                                        </>
                                    );
                                } else {
                                    // Only billing interval changed
                                    const newSeats = (currentUser.extraSeats || 0) + seatAdjustment;
                                    const totalSeatCost = Math.max(0, newSeats) * (seatPrice || 0);
                                    const total = basePrice + totalSeatCost;
                                    return (
                                        <>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                                                New Total ({annual ? 'Yearly' : 'Monthly'})
                                            </p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                {currencySymbol}{total.toFixed(2)}
                                            </p>
                                        </>
                                    );
                                }
                            })()}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSeatAdjustment(0);
                                    setAnnual(currentUser.billingInterval === 'annual');
                                }}
                                className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSeats}
                                disabled={isProcessing}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {isProcessing ? 'Processing...' : 'Update Subscription'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center mb-3">Confirm seat reduction?</h2>
                        <p className="text-slate-500 text-center text-sm leading-relaxed px-4">
                            You are about to remove <span className="font-bold text-slate-900">{Math.abs(seatAdjustment)}</span> seats from your subscription.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsConfirmationModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleConfirmReduction} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {isEnterpriseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-slate-100 dark:border-slate-700 mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Enterprise Inquiry</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Custom solutions for your team</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEnterpriseModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSendEnterpriseRequest} className="space-y-6">
                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Mail size={14} className="inline mr-1" />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={enterpriseForm.email}
                                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="your@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Phone size={14} className="inline mr-1" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={enterpriseForm.phone}
                                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, phone: e.target.value })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Building2 size={14} className="inline mr-1" />
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        value={enterpriseForm.companyName}
                                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, companyName: e.target.value })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Globe size={14} className="inline mr-1" />
                                        Country/Region
                                    </label>
                                    <input
                                        type="text"
                                        value={enterpriseForm.country}
                                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, country: e.target.value })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="United States"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    <Users size={14} className="inline mr-1" />
                                    Team Size
                                </label>
                                <select
                                    value={enterpriseForm.teamSize}
                                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, teamSize: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                    <option value="">Select team size</option>
                                    <option value="1-10">1-10 people</option>
                                    <option value="11-50">11-50 people</option>
                                    <option value="51-200">51-200 people</option>
                                    <option value="200+">200+ people</option>
                                </select>
                            </div>

                            {/* Required Features */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                    Required Features
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { value: 'custom_branding', label: 'Custom Branding' },
                                        { value: 'sso', label: 'SSO / SAML Auth' },
                                        { value: 'api_access', label: 'API Access' },
                                        { value: 'self_hosted', label: 'Self-Hosted Deployment' },
                                        { value: 'priority_support', label: '24/7 Priority Support' },
                                        { value: 'audit_logs', label: 'Advanced Audit Logs' },
                                        { value: 'custom_integrations', label: 'Custom Integrations' },
                                        { value: 'dedicated_account', label: 'Dedicated Account Manager' }
                                    ].map(feature => (
                                        <label key={feature.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={enterpriseForm.requiredFeatures.includes(feature.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEnterpriseForm({
                                                            ...enterpriseForm,
                                                            requiredFeatures: [...enterpriseForm.requiredFeatures, feature.value]
                                                        });
                                                    } else {
                                                        setEnterpriseForm({
                                                            ...enterpriseForm,
                                                            requiredFeatures: enterpriseForm.requiredFeatures.filter(f => f !== feature.value)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary/20"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{feature.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Requirements */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Additional Requirements
                                </label>
                                <textarea
                                    value={enterpriseForm.requirements}
                                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, requirements: e.target.value })}
                                    placeholder="Tell us about your specific needs, compliance requirements, integration needs, etc..."
                                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSendingMessage}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSendingMessage ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Send Inquiry
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlanCard: React.FC<{ plan: any, currencySymbol: string, isCurrent: boolean, annual: boolean, onSwitch: () => void }> = ({ plan, currencySymbol, isCurrent, annual, onSwitch }) => {
    const isFree = plan.name === 'Free';
    const isEnterprise = plan.name === 'Enterprise';

    const getPrice = () => {
        if (isFree) return 0;
        if (annual) {
            return plan.price_yearly ? Math.round(plan.price_yearly / 12) : Math.round(plan.price_monthly * 0.75);
        }
        return plan.price_monthly;
    };

    const currentPrice = getPrice();

    return (
        <div className={`relative border rounded-[1.4rem] p-7 flex flex-col justify-between transition-all duration-300 min-h-[220px] group
            ${isCurrent
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12)] scale-[1.01] z-10'
                : 'bg-[#FDFDFD] dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-2xl'}`}>

            {isEnterprise && (
                <div className="absolute top-0 right-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none group-hover:scale-110 transition-transform duration-700 origin-top-right">
                    <RefreshCw size={140} className="rotate-90" strokeWidth={0.5} />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {plan.name === 'Enterprise' ? 'Unlimited' : plan.name === 'Standard' ? 'Growth' : 'Core'}
                    </h3>
                    <Info size={12} className="text-slate-300 dark:text-slate-600" />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium max-w-[90%]">
                    {plan.max_members_per_project === 999 ? 'Unlimited seats' : `${plan.max_members_per_project} seats`} and 200 GB bandwidth.
                </p>

                <div className="pt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {currencySymbol}{currentPrice}
                        </span>
                        <span className="text-[12px] text-slate-400 font-medium">per month</span>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={onSwitch}
                    disabled={isCurrent && !isEnterprise}
                    className={`w-full py-3.5 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] ${isCurrent
                        ? 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white cursor-default'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                        }`}
                >
                    {isCurrent ? (
                        'Current plan'
                    ) : (
                        <>
                            <RefreshCw size={14} className="rotate-90" />
                            Switch plan
                        </>
                    )}
                </button>
            </div>
        </div>


    );
};

export default BillingPage;
