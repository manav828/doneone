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
    const [annual, setAnnual] = useState(true);

    const handleSendEnterpriseRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enterpriseRequirements.trim()) return;

        setIsSendingMessage(true);
        try {
            await supabase.from('transactions').insert({
                user_id: currentUser.id,
                amount: 0,
                status: 'pending',
                description: `Enterprise Inquiry: ${enterpriseRequirements.substring(0, 100)}...`,
                currency: currencyCode
            });

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

    // Currency Logic
    const hasInrHistory = transactions.some((t: any) => t.currency === 'INR');
    const currencyCode = currentUser.currency || (hasInrHistory ? 'INR' : detectedCurrency);
    const currencySymbol = currencyCode === 'INR' ? '₹' : '$';

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

    return (
        <div className="h-full overflow-y-auto bg-white text-slate-800">
            <div className="max-w-6xl mx-auto w-full p-8 space-y-12 pb-24">

                <section>
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-5 mb-12">
                        <span className={`text-sm font-medium transition-colors ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setAnnual(!annual)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${annual ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200'}`}
                        >
                            <motion.div
                                className={`absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-md transition-colors duration-300 ${annual ? 'bg-white' : 'bg-slate-900'}`}
                                animate={{ left: annual ? '27px' : '3px' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
                            Yearly <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">-25%</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {plans
                            .filter((p: any) => p.currency === currencyCode)
                            .sort((a: any, b: any) => {
                                const order: Record<string, number> = { 'Free': 1, 'Standard': 2, 'Enterprise': 3 };
                                return (order[a.name] || 0) - (order[b.name] || 0);
                            })
                            .map((p: any) => (
                                <PlanCard
                                    key={p.id}
                                    plan={p}
                                    currencySymbol={currencySymbol}
                                    isCurrent={currentUser.planId === p.id}
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

                {/* Workspace Capacity */}
                <section className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="flex-1 p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Workspace Capacity</h3>
                            </div>

                            <div className="flex items-end justify-between mb-2">
                                <span className="text-sm text-slate-500">Occupied Seats</span>
                                <span className="text-sm font-bold text-slate-900">{uniqueEmployeeCount} / {totalSeats}</span>
                            </div>

                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(255,107,0,0.3)]"
                                    style={{ width: `${Math.min(100, (uniqueEmployeeCount / totalSeats) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-3 font-medium">Your plan includes {currentUser.maxResources || 0} base seats + {currentUser.extraSeats || 0} extra seats.</p>
                        </div>

                        <div className="bg-slate-50/50 p-8 min-w-[340px] flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-slate-700">Adjust Seats</span>
                                <div className="flex items-center gap-3 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev - 1)}
                                        className="p-1 px-2 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className={`text-base font-bold min-w-[2.5ch] text-center ${seatAdjustment === 0 ? 'text-slate-900' : seatAdjustment > 0 ? 'text-primary' : 'text-red-500'}`}>
                                        {seatAdjustment > 0 ? `+${seatAdjustment}` : seatAdjustment}
                                    </span>
                                    <button
                                        onClick={() => setSeatAdjustment(prev => prev + 1)}
                                        className="p-1 px-2 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        <Plus size={14} />
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

                {/* Transaction History */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Transaction history</h2>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length > 0 ? transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{tx.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{currencySymbol}{tx.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100 mx-4">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900">
                                <MessageSquare size={24} />
                            </div>
                            <button onClick={() => setIsEnterpriseModalOpen(false)} className="text-slate-400">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Inquiry</h2>
                        <form onSubmit={handleSendEnterpriseRequest} className="space-y-4">
                            <textarea
                                required
                                value={enterpriseRequirements}
                                onChange={(e) => setEnterpriseRequirements(e.target.value)}
                                placeholder="Organization requirements..."
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-400 outline-none transition-all resize-none"
                            />
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3">
                                {isSendingMessage ? 'Sending...' : 'Send Request'}
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
        <div className={`relative bg-neutral-50/50 border rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 min-h-[220px] ${isCurrent ? 'border-neutral-200 shadow-sm' : 'border-neutral-100 hover:border-neutral-200 shadow-sm'}`}>
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{plan.name}</h3>
                    <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center cursor-help">
                        <span className="text-[10px] font-bold text-slate-400">?</span>
                    </div>
                </div>

                <p className="text-sm text-slate-500 leading-normal max-w-[240px]">
                    {plan.max_projects === 999 ? 'Unlimited' : plan.max_projects} projects and {plan.max_members_per_project === 999 ? 'unlimited' : plan.max_members_per_project} members.
                </p>

                <div className="pt-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">
                            {currencySymbol}{currentPrice}
                        </span>
                        <span className="text-sm text-slate-400 font-medium font-sans">per month</span>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={onSwitch}
                    disabled={isCurrent && !isEnterprise}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCurrent
                        ? 'bg-white border border-slate-200 text-slate-900 cursor-default'
                        : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-[0.98]'
                        }`}
                >
                    {isCurrent ? (
                        'Current plan'
                    ) : (
                        <>
                            {isEnterprise ? <MessageSquare size={16} /> : <RefreshCw size={16} />}
                            {isEnterprise ? 'Contact sales' : 'Switch plan'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BillingPage;
