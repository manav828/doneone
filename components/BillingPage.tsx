import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, CheckCircle, XCircle, Crown, CreditCard, Users, Clock, Plus, Minus, Search, Filter, MoreHorizontal, MessageSquare, Send, Info, Check, Image, ShieldCheck, FileText, Zap } from 'lucide-react';

const BillingPage: React.FC = () => {
    const { currentUser, transactions, fetchTransactions, addSeat, projects, users, removeMember, fetchUsers, fetchProjects, teams, teamMembers, fetchTeams, fetchTeamMembers, plans, fetchPlans } = useStore() as any;
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
    const [enterpriseRequirements, setEnterpriseRequirements] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [allCardsFlipped, setAllCardsFlipped] = useState(false);
    const [annual, setAnnual] = useState(true);

    const handleSendEnterpriseRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enterpriseRequirements.trim()) return;

        setIsSendingMessage(true);
        try {
            // Log interaction as a special transaction or "contact request"
            await supabase.from('transactions').insert({
                user_id: currentUser.id,
                amount: 0,
                status: 'pending',
                description: `Enterprise Inquiry: ${enterpriseRequirements.substring(0, 100)}...`,
                currency: currencyCode
            });

            // In a real app, you'd send an email via Edge Function here.

            setEnterpriseRequirements('');
            setIsEnterpriseModalOpen(false);
            alert("Requirements received! Our team will contact you within 24 hours.");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSendingMessage(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Key Data
                await Promise.all([
                    fetchTransactions(),
                    fetchUsers(),
                    fetchProjects(),
                    fetchTeams(),
                    fetchPlans()
                ]);

                // 2. Fetch Team Members
                const { teams: loadedTeams, currentUser: loadedUser, transactions: loadedTx } = useStore.getState() as any;
                const myTeams = loadedTeams.filter((t: any) =>
                    t.ownerId === loadedUser?.id || t.managerIds?.includes(loadedUser?.id)
                );
                await Promise.all(myTeams.map((t: any) => fetchTeamMembers(t.id)));

                // 3. Determine Currency (History vs IP)
                // Check loaded transactions for any INR history
                const hasInrHistory = loadedTx.some((t: any) => t.currency === 'INR');

                if (hasInrHistory) {
                    setDetectedCurrency('INR');
                } else if (!loadedTx || loadedTx.length === 0) {
                    // No history -> Check IP
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        const data = await res.json();
                        if (data.country_code === 'IN') {
                            setDetectedCurrency('INR');
                        }
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

        if (currentUser) {
            loadData();
        }
    }, [currentUser?.id]);

    if (!currentUser) return null;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-orange-500" size={32} />
                    <p className="text-slate-500 font-medium">Loading subscription details...</p>
                </div>
            </div>
        );
    }

    // Derived State
    const currentPlan = plans.find((p: any) => p.id === currentUser.planId);
    const planName = currentPlan?.name || (currentUser.isPremium ? 'Premium Core' : 'Free Tier');
    const baseSeats = currentUser.maxResources || 0;
    const extraSeats = currentUser.extraSeats || 0;
    const totalSeats = baseSeats + extraSeats;
    const renewalDate = currentUser.premiumUntil ? new Date(currentUser.premiumUntil) : null;
    const isExpired = renewalDate && renewalDate < new Date();

    // Currency Logic
    const hasInrHistory = transactions.some((t: any) => t.currency === 'INR');
    const currencyCode = currentUser.currency || (hasInrHistory ? 'INR' : detectedCurrency);
    const currencySymbol = currencyCode === 'INR' ? '₹' : '$';

    // Pricing Constants
    // Pricing Constants
    // Find relevant plan details from store (Market Rate for Shopping)
    const marketPlan = plans.find((p: any) => p.name.includes('Premium') && p.currency === currencyCode) ||
        plans.find((p: any) => p.currency === currencyCode && p.price_monthly > 0);

    // LOGIC:
    // 1. If User is Premium (or Custom), use the price LOCKED in their profile.
    // 2. If User is Free, show them the current Market Rate from the Plans table.

    // We check both snake_case (DB raw) and camelCase (if transformed) just to be safe.
    const userBaseCost = currentUser.plan_base_cost ?? currentUser.planBaseCost;
    const userSeatCost = currentUser.per_seat_cost ?? currentUser.perSeatCost;

    const BASE_PRICE = currentUser.isPremium
        ? (userBaseCost || 0)
        : (marketPlan?.price_monthly || (currencyCode === 'INR' ? 899 : 12));

    const PER_SEAT_PRICE = currentUser.isPremium
        ? (userSeatCost || 0)
        : (marketPlan?.price_per_seat_monthly || (currencyCode === 'INR' ? 399 : 5));

    // Calculate Dynamic Total
    const currentExtraSeats = currentUser.extraSeats || 0;
    const itemsInCart = currentExtraSeats + seatAdjustment;
    const totalExtraCost = Math.max(0, itemsInCart) * PER_SEAT_PRICE;
    const totalMonthlyBill = BASE_PRICE + totalExtraCost;

    // --- NEW: Calculate True Company Employee Usage ---
    const getUniqueEmployeeCount = () => {
        // Filter teams owned by current user
        const myTeams = teams.filter((t: any) => t.ownerId === currentUser.id);

        // Get all members in these teams
        const allMembers = teamMembers.filter((m: any) =>
            myTeams.some((t: any) => t.id === m.teamId) && m.status === 'active'
        );

        // Deduplicate by userId
        const uniqueIds = new Set(allMembers.map((m: any) => m.userId));
        return uniqueIds.size;
    };

    const uniqueEmployeeCount = getUniqueEmployeeCount();

    const handleConfirmReduction = async () => {
        setIsProcessing(true);
        try {
            // 1. Log Transaction (Cancelled/Reduction)
            await supabase.from('transactions').insert({
                user_id: currentUser.id,
                amount: 0,
                status: 'cancelled',
                description: `Seat Reduction (Removed ${Math.abs(seatAdjustment)} seat${Math.abs(seatAdjustment) > 1 ? 's' : ''})`,
                currency: currencyCode
            });

            // 2. Update Seat Count
            await addSeat(seatAdjustment); // Negative value reduces seats

            // 3. Refresh
            await fetchUsers();
            await fetchTransactions();

            // Refresh Teams/Members to ensure numbers align
            // (Optional but good practice)
            const { teams: loadedTeams, currentUser: loadedUser } = useStore.getState() as any;
            const myTeams = loadedTeams.filter((t: any) =>
                t.ownerId === loadedUser?.id || t.managerIds?.includes(loadedUser?.id)
            );
            for (const team of myTeams) {
                await fetchTeamMembers(team.id);
            }

            setSeatAdjustment(0);
            setIsConfirmationModalOpen(false);
            setIsProcessing(false);
            // Alert removed as per user request
        } catch (error) {
            console.error("Reduction failed:", error);
            alert("Failed to update subscription. Please try again.");
            setIsProcessing(false);
        }
    };

    const handleUpdateSeats = async () => {
        if (seatAdjustment === 0) return;

        // CASE 1: Adding Seats -> Go to Checkout
        if (seatAdjustment > 0) {
            navigate(`/checkout?seats=${seatAdjustment}${annual ? '&billing=annual' : '&billing=monthly'}`);
            return;
        }

        // CASE 2: Removing Seats
        if (seatAdjustment < 0) {
            setIsProcessing(true);

            const currentTotalCapacity = totalSeats; // base + extra
            const newTotalCapacity = currentTotalCapacity + seatAdjustment;

            // Validation: Cannot reduce below occupied count
            // We use the already calculated 'uniqueEmployeeCount' from render
            if (newTotalCapacity < uniqueEmployeeCount) {
                alert(`Cannot reduce seats. You have ${uniqueEmployeeCount} active employees occupying seats.\n\nPlease remove members from your Organization (Workspace Settings) before reducing your plan.`);
                setIsProcessing(false);
                return;
            }

            setIsProcessing(false);
            // Valid -> Open Confirmation
            setIsConfirmationModalOpen(true);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 text-slate-800">
            {/* Settings Header - Simplified */}
            <div className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4">
                <div className="flex justify-between items-center mb-0 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your plan, seats, and view transaction history.</p>
                    </div>
                    <div className="hidden md:flex -space-x-2">
                        {users.slice(0, 3).map((u: any) => (
                            <div key={u.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shadow-sm">
                                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                            </div>
                        ))}
                        {users.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                                +{users.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full p-6 space-y-8 pb-16">

                <section>
                    <div className="text-center mb-12">
                        {/* Billing Toggle (Copied from PricingModal) */}
                        <div className="flex items-center justify-center gap-6 mt-10">
                            <span className={`text-sm font-black transition-colors ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setAnnual(!annual)}
                                className="relative w-16 h-8 rounded-full bg-slate-100 border-2 border-slate-200 transition-all hover:border-slate-300 shadow-inner"
                            >
                                <motion.div
                                    className="absolute top-1 w-5 h-5 rounded-full bg-primary shadow-lg shadow-primary/30"
                                    animate={{ left: annual ? '34px' : '5px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                            <span className={`text-sm font-black transition-colors ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
                                Annual
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 shadow-sm animate-pulse-soft">
                                <span className="text-primary text-[10px] font-black uppercase tracking-wider">Save 25%</span>
                            </div>

                            <button
                                onClick={() => setAllCardsFlipped(!allCardsFlipped)}
                                className={`ml-8 p-3 rounded-full transition-all flex items-center gap-2 font-black text-xs ${allCardsFlipped ? 'bg-primary text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary shadow-sm'}`}
                                title="Toggle detailed specifications"
                            >
                                <Info size={16} />
                                {allCardsFlipped ? 'Hide Specs' : 'View Specs'}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {plans
                            .filter((p: any) => p.currency === currencyCode)
                            .sort((a: any, b: any) => {
                                // Specific order: Free, Standard, Enterprise
                                const order: Record<string, number> = { 'Free': 1, 'Standard': 2, 'Enterprise': 3 };
                                return (order[a.name] || 0) - (order[b.name] || 0);
                            })
                            .map((p: any) => (
                                <PlanCard
                                    key={p.id}
                                    plan={p}
                                    currencySymbol={currencySymbol}
                                    isCurrent={currentUser.planId === p.id}
                                    currentUserBillingInterval={currentUser.billingInterval}
                                    isFlipped={allCardsFlipped}
                                    annual={annual}
                                    onSwitch={() => {
                                        if (p.name === 'Enterprise') {
                                            setIsEnterpriseModalOpen(true);
                                        } else {
                                            navigate(`/checkout?plan=${p.id}${annual ? '&billing=annual' : '&billing=monthly'}`);
                                        }
                                    }}
                                />
                            ))
                        }
                    </div>
                </section>

                {/* Seat Management / Utilization */}
                <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-0.5">Workspace Capacity</h3>
                                    <p className="text-xs text-slate-500">{uniqueEmployeeCount} of {totalSeats} seats currently occupied</p>
                                </div>
                                <span className="text-2xl font-black text-primary">{Math.round((uniqueEmployeeCount / totalSeats) * 100)}%</span>
                            </div>

                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                                    style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalSeats) * 100)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Base Capacity</span>
                                    <span className="text-base font-bold text-slate-800">{currentUser.maxResources || 8} Seats</span>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block mb-0.5">Extra Seats</span>
                                    <span className="text-base font-bold text-orange-600">+{currentUser.extraSeats || 0} Seats</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col gap-4">
                            <div className="text-center md:text-left">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adjust Seats</span>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev - 1)}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-3xl font-black ${seatAdjustment === 0 ? 'text-slate-900' : seatAdjustment > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {seatAdjustment > 0 ? `+${seatAdjustment}` : seatAdjustment}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Seats</span>
                                    </div>
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev + 1)}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateSeats}
                                disabled={seatAdjustment === 0 || isProcessing}
                                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 ${seatAdjustment === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary-dark text-white active:scale-[0.98]'}`}
                            >
                                {isProcessing ? 'Wait...' : seatAdjustment >= 0 ? 'Add Seats' : 'Remove Seats'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Transaction History */}
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Transaction history</h2>
                            <p className="text-slate-500 text-xs">Download receipts and track your workspace spending.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                            <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary transition-all shadow-sm active:scale-95">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.length > 0 ? transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{new Date(tx.created_at).toLocaleDateString()}</span>
                                                    <span className="text-[9px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                        <CreditCard size={14} className="text-slate-500" />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{tx.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {tx.status === 'completed' ? <CheckCircle size={8} /> : <Clock size={8} />}
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs font-bold text-slate-900">{currencySymbol}{tx.amount.toFixed(2)}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                        <CreditCard size={32} />
                                                    </div>
                                                    <p className="text-slate-400 font-medium">No transactions found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* Confirmation Modal for Reduction */}
            {isConfirmationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center mb-3">Confirm seat reduction?</h2>
                        <p className="text-slate-500 text-center text-xs leading-relaxed px-4">
                            You are about to remove <span className="font-bold text-slate-900">{Math.abs(seatAdjustment)}</span> seats from your subscription. This change will be reflected in your next billing cycle.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsConfirmationModalOpen(false)}
                                className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
                            >
                                Go back
                            </button>
                            <button
                                onClick={handleConfirmReduction}
                                disabled={isProcessing}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? 'Wait...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Enterprise Contact Modal */}
            {isEnterpriseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100 mx-4">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-primary">
                                <MessageSquare size={28} />
                            </div>
                            <button
                                onClick={() => setIsEnterpriseModalOpen(false)}
                                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 mb-2">Enterprise Inquiry</h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Need a custom plan? Tell us your organization's requirements (seats, features, SLAs) and we'll build a tailored solution for you.
                        </p>

                        <form onSubmit={handleSendEnterpriseRequest} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Your Requirements</label>
                                <textarea
                                    required
                                    value={enterpriseRequirements}
                                    onChange={(e) => setEnterpriseRequirements(e.target.value)}
                                    placeholder="e.g. 500 seats, dedicated support, custom project limits..."
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSendingMessage || !enterpriseRequirements.trim()}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-base shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                            >
                                {isSendingMessage ? 'Sending...' : (
                                    <>
                                        Send Request <Send size={18} />
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

// Sub-components for cleaner code
const PlanCard: React.FC<{ plan: any, currencySymbol: string, isCurrent: boolean, currentUserBillingInterval?: string, isFlipped: boolean, annual: boolean, onSwitch: () => void }> = ({ plan, currencySymbol, isCurrent, currentUserBillingInterval, isFlipped, annual, onSwitch }) => {
    const isEnterprise = plan.name === 'Enterprise';
    const isStandard = plan.name === 'Standard';
    const isFree = plan.name === 'Free';

    const projectLimit = plan.max_projects === 9999 || plan.max_projects === 999 ? 'Unlimited' : plan.max_projects;
    const seatLimit = plan.max_members_per_project === 9999 || plan.max_members_per_project === 999 ? 'Unlimited' : plan.max_members_per_project;

    // Feature list mapping to match the PricingModal preciesly
    const getFeatures = () => {
        if (isFree) {
            return [
                'Unlimited tasks',
                'Kanban board view',
                '1 project',
                'Basic time tracking',
                '7-day history',
            ];
        }
        if (isStandard) {
            return [
                'Everything in Starter',
                'Unlimited projects',
                'List & Calendar views',
                'Team collaboration (up to 10)',
                'Advanced reporting',
                'Priority support',
                'Unlimited history',
            ];
        }
        return [
            'Everything in Pro',
            'Unlimited team members',
            'Admin controls',
            'SSO integration',
            'Custom branding',
            'Dedicated support',
            'SLA guarantee',
        ];
    };

    const canUpgradeToYearly = isCurrent && annual && currentUserBillingInterval === 'monthly';
    const buttonDisabled = isCurrent && !canUpgradeToYearly;

    const getButtonText = (side: 'front' | 'back') => {
        if (canUpgradeToYearly) return 'Upgrade to Yearly';
        if (isCurrent) return 'Current Plan';
        if (isEnterprise) return 'Contact Sales';
        if (side === 'back' && isStandard) return 'Upgrade to Pro';
        return side === 'front' ? 'Switch Plan' : 'Get Started';
    };

    const getDescription = () => {
        if (isFree) return "Perfect for individuals getting started";
        if (isStandard) return "For growing teams with premium needs";
        return "For organizations that demand the best";
    };

    const getDisplayName = () => {
        if (isFree) return "Starter";
        if (isStandard) return "Pro";
        return "Enterprise";
    };

    // Pricing logic matches PricingModal - annual is pro-rated / 12
    const getPrice = () => {
        if (isFree) return 0;
        const monthly = plan.price_monthly;
        if (annual) {
            const annualPrice = plan.price_yearly ? Math.round(plan.price_yearly / 12) : Math.round(monthly * 0.75);
            return annualPrice;
        }
        return monthly;
    };

    const currentPrice = getPrice();

    return (
        <div className={`relative w-full [perspective:1000px] group transition-all duration-700 ${isFlipped ? 'h-[580px]' : 'h-[240px]'}`}>
            <div className={`relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

                {/* Front Side (Compact) */}
                <div className={`absolute inset-0 h-full w-full rounded-3xl border bg-white p-6 shadow-sm [backface-visibility:hidden] flex flex-col justify-between ${isCurrent ? 'border-primary shadow-xl shadow-primary/10 transition-transform' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                    {isStandard && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <span className="px-4 py-1.5 rounded-full bg-primary text-white text-[9px] font-black shadow-lg shadow-primary/30 uppercase tracking-widest whitespace-nowrap">
                                Most Popular
                            </span>
                        </div>
                    )}

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{getDisplayName()}</h3>
                            {isCurrent && (
                                <span className="text-[8px] text-primary font-black uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full ml-auto">Active</span>
                            )}
                        </div>
                        <p className="text-slate-400 text-xs font-bold leading-tight">
                            {projectLimit} projects and {seatLimit} members per project.
                        </p>
                    </div>

                    <div>
                        <div className="mb-4">
                            {isEnterprise ? (
                                <div className="text-xl font-black text-slate-900 leading-none py-1">Custom Enterprise</div>
                            ) : (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{currencySymbol}{currentPrice}</span>
                                    <span className="text-[10px] font-bold text-slate-400">/month</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onSwitch}
                            disabled={buttonDisabled}
                            className={`w-full py-4 rounded-full text-[10px] font-black transition-all border-none ${buttonDisabled ? 'bg-slate-50 text-slate-400 cursor-default' : isStandard || canUpgradeToYearly ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98]' : isEnterprise ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-black' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 uppercase tracking-widest'}`}
                        >
                            {getButtonText('front')}
                        </button>
                    </div>
                </div>

                {/* Back Side (PricingModal Style) */}
                <div className={`absolute inset-0 h-full w-full rounded-3xl border bg-white px-8 py-10 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col ${isCurrent ? 'border-primary shadow-2xl' : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                    {isStandard && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                            <span className="px-5 py-2.5 rounded-full bg-primary text-white text-[10px] font-black shadow-xl shadow-primary/30 uppercase tracking-[0.2em] whitespace-nowrap">
                                Most Popular
                            </span>
                        </div>
                    )}

                    <div className="mb-8 text-left">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2">{getDisplayName()}</h3>
                        <p className="text-slate-600 text-sm">{getDescription()}</p>
                    </div>

                    <div className="mb-10 text-left">
                        <div className="flex items-baseline gap-2">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={annual ? 'annual' : 'monthly'}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="text-5xl font-bold text-slate-900"
                                >
                                    {currencySymbol}{currentPrice}
                                </motion.span>
                            </AnimatePresence>
                            <span className="text-slate-500">/month</span>
                        </div>
                        {currentPrice > 0 && annual && (
                            <p className="text-sm text-slate-500 mt-1">
                                Billed annually ({currencySymbol}{currentPrice * 12}/year)
                            </p>
                        )}
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {getFeatures().map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-slate-700 text-[14px] font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10">
                        <button
                            onClick={onSwitch}
                            disabled={buttonDisabled}
                            className={`block w-full text-center py-4 rounded-full font-bold transition-all duration-300 ${isStandard || canUpgradeToYearly
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                : isEnterprise
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {getButtonText('back')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillingPage;
