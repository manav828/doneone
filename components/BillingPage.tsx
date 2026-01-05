import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { RefreshCw, Download, CheckCircle, XCircle, Crown, CreditCard, Users, Clock, ArrowUpRight, Plus, Minus } from 'lucide-react';

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
    const planName = currentUser.isPremium ? 'Premium Plan' : 'Free Plan';
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

    const handleSeatReduction = async () => {
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
            navigate(`/checkout?seats=${seatAdjustment}`);
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
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 pb-12">

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Subscription & Usage */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Current Plan Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${currentUser.isPremium ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-slate-100 text-slate-500'} shadow-sm`}>
                                        <Crown size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {planName}
                                            {isExpired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {currentUser.isPremium
                                                ? `Renews on ${renewalDate?.toLocaleDateString()}`
                                                : 'Upgrade to unlock premium features'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Billing Breakdown */}
                            <div className="text-right w-full md:w-auto mt-4 md:mt-0 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 min-w-[280px]">
                                <div className="space-y-2 text-sm">
                                    {/* Row 1: Base Plan */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400">Plan Base</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{currencySymbol}{BASE_PRICE.toFixed(2)}</span>
                                    </div>

                                    {/* Row 2: Existing Extra Seats */}
                                    {(currentExtraSeats > 0 || seatAdjustment === 0 && currentExtraSeats === 0) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                Extra Seats ({currentExtraSeats} × {currencySymbol}{PER_SEAT_PRICE})
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                +{currencySymbol}{(currentExtraSeats * PER_SEAT_PRICE).toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Row 3: Adjustment (If any) */}
                                    {seatAdjustment !== 0 && (
                                        <div className="flex justify-between items-center text-primary font-medium bg-primary/5 -mx-2 px-2 py-1 rounded">
                                            <span className="flex items-center gap-1">
                                                {seatAdjustment > 0 ? <Plus size={12} /> : <Minus size={12} />}
                                                {Math.abs(seatAdjustment)} New Seat{Math.abs(seatAdjustment) !== 1 ? 's' : ''}
                                            </span>
                                            <span>
                                                {seatAdjustment > 0 ? '+' : '-'}{currencySymbol}{Math.abs(seatAdjustment * PER_SEAT_PRICE).toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="border-t border-slate-200 dark:border-slate-600 my-2"></div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">Total Monthly</span>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                                            {currencySymbol}{totalMonthlyBill.toFixed(2)}
                                            <span className="text-xs font-normal text-slate-500 ml-1">/mo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="flex flex-wrap gap-3 relative">
                                {!currentUser.isPremium ? (
                                    <button
                                        onClick={() => navigate('/checkout?plan=premium')}
                                        className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow transition-all hover:shadow-lg active:scale-[0.98]"
                                    >
                                        Upgrade Now
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            // onClick={() => window.open('mailto:support@doneone.app?subject=Cancel Subscription')} // Placeholder
                                            className="px-4 py-2 text-slate-500 hover:text-red-500 transition-colors text-sm font-medium ml-auto"
                                        >
                                            Cancel Subscription
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Seat Management */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seat Management</h3>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* Current Stats */}
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Base Plan Seats</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{baseSeats}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Extra Seats Purchased</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{extraSeats}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total Capacity</span>
                                        <span className="text-lg font-bold text-primary">{totalSeats} Members</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700 mt-2">
                                        <span className="text-xs font-bold text-slate-500">Currently Active</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{uniqueEmployeeCount} / {totalSeats} Used</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-full md:w-px h-px md:h-24 bg-slate-200 dark:bg-slate-700"></div>

                                {/* Seat Adjuster */}
                                <div className="flex-1 w-full flex flex-col items-center justify-center gap-4">
                                    <p className="text-sm text-slate-500 text-center">Need more team members?</p>
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                        <button
                                            onClick={() => setSeatAdjustment(prev => prev - 1)}
                                            disabled={seatAdjustment <= -extraSeats || (totalSeats + (seatAdjustment - 1)) < uniqueEmployeeCount}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-bold text-lg text-slate-900 dark:text-white">
                                            {seatAdjustment > 0 ? `+${seatAdjustment}` : seatAdjustment}
                                        </span>
                                        <button
                                            onClick={() => setSeatAdjustment(prev => prev + 1)}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleUpdateSeats}
                                        disabled={seatAdjustment === 0}
                                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {seatAdjustment > 0 ? 'Proceed to Checkout' : seatAdjustment < 0 ? 'Remove Seats' : 'Adjust Quantity'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white">Billing History</h3>
                                <button
                                    onClick={() => fetchTransactions()}
                                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors font-medium bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <p>No transactions found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {transactions.map((tx: any) => (
                                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                        {tx.description}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                            ${tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                (tx.status === 'cancelled' || tx.status === 'refunded') ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                            {tx.status === 'completed' && <CheckCircle size={12} />}
                                                            {(tx.status === 'cancelled' || tx.status === 'refunded') && <Users size={12} />}
                                                            {tx.status === 'failed' && <XCircle size={12} />}
                                                            <span className="capitalize">{(tx.status === 'refunded' ? 'Cancelled' : tx.status)}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                                        {tx.amount < 0 ? '-' : ''}{tx.currency === 'INR' ? '₹' : '$'}{Math.abs(tx.amount).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Payment & Info */}
                    <div className="space-y-6">
                        {/* Payment Method */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-slate-400" />
                                Payment Method
                            </h3>
                            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-4 mb-4 bg-slate-50 dark:bg-slate-700/50">
                                <div className="text-sm text-slate-500">
                                    Payments are securely managed by our payment processor.
                                    <br />
                                    Payment details are handled at checkout.
                                </div>
                            </div>
                        </div>

                        {/* Support Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Need help with billing?</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                                Contact our support team for help with invoices, refunds, or custom enterprise plans.
                            </p>
                            <a
                                href="mailto:billing@doneone.app"
                                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                            >
                                Contact Support <ArrowUpRight size={14} />
                            </a>
                        </div>
                    </div>

                </div>

                {isConfirmationModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Seat Reduction</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                You are removing <span className="font-bold text-slate-900 dark:text-white">{Math.abs(seatAdjustment)} seat{Math.abs(seatAdjustment) !== 1 ? 's' : ''}</span> from your subscription.
                                <br /><br />
                                Your future monthly bill will be reduced to <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{(totalMonthlyBill).toFixed(2)}</span>.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsConfirmationModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSeatReduction}
                                    disabled={isProcessing}
                                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-md transition-all active:scale-[0.98]"
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm Reduction'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingPage;
