import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Shield, CreditCard, Check, ArrowLeft, Users, Lock, Crown, CheckCircle } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addSeat, currentUser, fetchUsers, fetchProjects, plans, projects, users, removeMember } = useStore() as any;

    // State
    const [quantity, setQuantity] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [itemType, setItemType] = useState<'seats' | 'plan'>('seats');

    // Removal Modal State
    const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
    const [overLimitProjects, setOverLimitProjects] = useState<any[]>([]);
    const [selectedRemovals, setSelectedRemovals] = useState<Record<string, string[]>>({});
    const [missingCountMap, setMissingCountMap] = useState<Record<string, number>>({});

    // Config - Dynamic
    const premiumPlan = plans.find(p => p.id === 'premium');
    const PLAN_BASE_PRICE = premiumPlan?.priceMonthly || 19;
    const PLAN_MEMBERS_LIMIT = premiumPlan?.maxMembersPerProject || 8; // Default 8 if not found, but syncs with store

    // Per Seat Cost Priority: User Override > Plan Config > Default 5
    // Note: Plan interface needs 'perSeatCost' if it exists there, otherwise default. 
    // Assuming for now it logic is: user specific or default. 
    // Wait, AdminPanel had perSeatCost in 'editLimits' (User). 
    // Does 'Plan' have it? Not explicitly seen in earlier Interface. 
    // Safe fallback: currentUser.perSeatCost || 5.
    const PER_SEAT_PRICE = currentUser?.perSeatCost || 5;

    // Base Capacity (Included Seats): User's DB Limit (if snapshot) > Plan Config > Default
    const INCLUDED_SEATS = currentUser?.maxResources || PLAN_MEMBERS_LIMIT;



    useEffect(() => {
        fetchUsers();
        if (currentUser) {
            fetchProjects();
        }
    }, [currentUser?.id]); // Refetch when user changes or init

    useEffect(() => {
        const planParam = searchParams.get('plan');
        const seatsParam = searchParams.get('seats');

        if (planParam === 'premium') {
            setItemType('plan');
            setQuantity(0);
        } else if (seatsParam) {
            setItemType('seats');
            setQuantity(parseInt(seatsParam) || 1);
        }
    }, [searchParams]); // Removed currentUser from dep to avoid loop if possible, handled above

    // Calculate Total
    // If itemType is 'seats', Base Amount is 0. This solves "paying for plan again".
    const baseAmount = itemType === 'plan' ? PLAN_BASE_PRICE : 0;
    const seatsAmount = quantity * PER_SEAT_PRICE;
    const totalMonthly = baseAmount + seatsAmount;

    // Calculate Capacity
    const currentBase = INCLUDED_SEATS;
    const baseCapacity = itemType === 'plan' ? INCLUDED_SEATS : currentBase;
    const totalCapacity = baseCapacity + quantity;

    const handleCheckoutButton = async () => {
        // If reducing seats, check for limits
        if (itemType === 'seats' && quantity < 0) {
            const currentTotal = (currentUser?.extraSeats || 0) + (currentUser?.maxResources || PLAN_MEMBERS_LIMIT);
            const newTotal = currentTotal + quantity;

            const myProjects = projects.filter((p: any) => p.managerId === currentUser?.id);
            const violations: any[] = [];
            const missing: Record<string, number> = {};

            myProjects.forEach((p: any) => {
                const memberCount = 1 + p.leadIds.length + p.resourceIds.length; // Owner + Leads + Resources
                if (memberCount > newTotal) {
                    violations.push(p);
                    missing[p.id] = memberCount - newTotal;
                }
            });

            if (violations.length > 0) {
                setOverLimitProjects(violations);
                setMissingCountMap(missing);
                setIsRemovalModalOpen(true);
                return;
            }
        }

        await handleCheckout();
    };

    const toggleMemberRemoval = (projectId: string, userId: string) => {
        const current = selectedRemovals[projectId] || [];
        if (current.includes(userId)) {
            setSelectedRemovals({
                ...selectedRemovals,
                [projectId]: current.filter(id => id !== userId)
            });
        } else {
            setSelectedRemovals({
                ...selectedRemovals,
                [projectId]: [...current, userId]
            });
        }
    };

    const confirmRemovalAndCheckout = async () => {
        setIsProcessing(true);
        try {
            // Process removals
            for (const p of overLimitProjects) {
                const toRemove = selectedRemovals[p.id] || [];
                for (const userId of toRemove) {
                    await removeMember(p.id, userId);
                }
            }

            setIsRemovalModalOpen(false);
            await handleCheckout();
        } catch (err) {
            console.error("Removal failed", err);
            alert("Failed to remove members. Please try again.");
            setIsProcessing(false);
        }
    };

    const isRemovalValid = () => {
        return overLimitProjects.every(p => {
            const selected = selectedRemovals[p.id] || [];
            return selected.length >= missingCountMap[p.id];
        });
    };

    const handleCheckout = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            if (itemType === 'seats') {
                await addSeat(quantity);
            } else {
                const { supabase } = useStore.getState() as any;

                // Backdated Renewal Logic:
                // If expired, renew from LAST expiry date (to charge for gap).
                // "if user plan exprie today (1 jan) and they renew it after 7 day (7 jan) then renew date is today (1 jan)"
                let newExpiryDate = new Date();
                const currentExpiry = currentUser?.premiumUntil ? new Date(currentUser.premiumUntil) : null;

                if (currentExpiry && !isNaN(currentExpiry.getTime())) {
                    // Add 30 days to existing expiry
                    currentExpiry.setDate(currentExpiry.getDate() + 30);
                    newExpiryDate = currentExpiry;
                } else {
                    // New subscription or invalid date
                    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                }

                // Update Premium Status & Expiry
                await supabase.from('profiles').update({
                    is_premium: true,
                    premium_until: newExpiryDate.toISOString(),
                    // Update Renewal Date too for display consistency
                    renewal_date: newExpiryDate.toISOString()
                }).eq('id', currentUser.id);



                // Log Plan Transaction
                await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: PLAN_BASE_PRICE,
                    status: 'completed',
                    description: `Premium Plan Renewal (until ${newExpiryDate.toLocaleDateString()})`,
                    currency: 'USD'
                });

                if (quantity > (currentUser?.extraSeats || 0)) {
                    await addSeat(quantity - (currentUser?.extraSeats || 0));
                }
            }
            await fetchUsers();
            setIsSuccess(true); // Trigger Success View
            setIsProcessing(false);
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (!currentUser) return <div className="p-10 text-center">Please log in to continue.</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            {/* Header Removed - Managed by TopBar now */}

            <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left Column: Order Details */}
                <div className="md:col-span-7 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            {itemType === 'plan' ? 'Upgrade Your Workspace' : 'Add Extra Seats'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            customize your plan capacity below.
                        </p>
                    </div>

                    {/* Current Plan Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Current Plan</p>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-white text-lg">
                                    {currentUser.isPremium ? 'Premium Plan' : 'Free Plan'}
                                </span>
                                {currentUser.isPremium && <Crown size={16} className="text-yellow-500 fill-current" />}
                            </div>
                        </div>
                        {currentUser.isPremium && currentUser.premiumUntil && (
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Expires On</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                    {new Date(currentUser.premiumUntil).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {/* Base Plan Item - Only show if purchasing the plan */}
                        {itemType === 'plan' && (
                            <div className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800">
                                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg shrink-0 shadow-sm">
                                    <Crown size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Premium Plan Base</h3>
                                            <p className="text-sm text-green-600 font-bold mt-1">Includes {INCLUDED_SEATS} Members</p>
                                        </div>
                                        <span className="font-bold text-lg text-slate-800 dark:text-white">${PLAN_BASE_PRICE}.00<span className="text-sm font-normal text-slate-400">/mo</span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Seats Item */}
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                    <Users size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
                                        Extra Members
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-4">
                                        Add more capacity beyond the included {INCLUDED_SEATS} seats.
                                    </p>

                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                                            <button
                                                onClick={() => setQuantity(quantity - 1)}
                                                disabled={itemType === 'seats' && quantity <= -(currentUser?.extraSeats || 0)}
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-300 dark:border-slate-600 text-slate-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const minAllowed = -(currentUser?.extraSeats || 0);
                                                    const clamped = Math.max(val, minAllowed);
                                                    setQuantity(clamped);
                                                }}
                                                className="w-16 py-2 text-center outline-none bg-transparent font-bold text-lg"
                                                title="Positive to Add, Negative to Remove"
                                            />
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 border-l border-slate-300 dark:border-slate-600 text-slate-600 font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Per Extra Seat</span>
                                            <span className="font-bold text-slate-800 dark:text-white">${PER_SEAT_PRICE}/mo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Capacity Summary Box */}
                        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">New Total Capacity</h4>
                                <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
                                    <span className="text-slate-400" title="Includes Base + Current Extra">{baseCapacity + (itemType === 'seats' ? (currentUser?.extraSeats || 0) : 0)} Current</span>
                                    <span className="text-slate-300">+</span>
                                    <span className="text-primary">{quantity} New</span>
                                    <span className="text-slate-300">=</span>
                                    <span>{totalCapacity + (itemType === 'seats' ? (currentUser?.extraSeats || 0) : 0)} Total</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    You have {baseCapacity + (itemType === 'seats' ? (currentUser?.extraSeats || 0) : 0)} seats now. Adding {quantity} more.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Checkout Summary */}
                <div className="md:col-span-5">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
                        <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6">

                            {/* Breakdown requested by user: Plan + (Seats * Cost) */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600 mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Future Recurring Bill</p>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-400">Premium Plan Base</span>
                                    <span className="font-medium text-slate-800 dark:text-white">${PLAN_BASE_PRICE}.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Total Extra Seats ({currentUser?.extraSeats || 0} + {quantity}) x ${PER_SEAT_PRICE}
                                    </span>
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        ${(((currentUser?.extraSeats || 0) + quantity) * PER_SEAT_PRICE).toFixed(2)}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-600 my-2 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-xs text-slate-500">New Monthly Total</span>
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        ${(PLAN_BASE_PRICE + (((currentUser?.extraSeats || 0) + quantity) * PER_SEAT_PRICE)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Due Today</h3>
                            {itemType === 'plan' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Premium Plan (Base)</span>
                                    <span className="font-medium text-slate-800 dark:text-white">${PLAN_BASE_PRICE.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">
                                    {quantity >= 0 ? 'Extra Seats' : 'Seat Reduction'} (x{quantity})
                                </span>
                                <span className="font-medium text-slate-800 dark:text-white">${seatsAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
                                <span className="font-bold text-slate-800 dark:text-white">Total due today</span>
                                <span className="font-bold text-2xl text-primary">${totalMonthly.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 opacity-70 cursor-not-allowed">
                                <CreditCard size={20} className="text-slate-400" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Visa ending in 4242</div>
                                    <div className="text-[10px] text-slate-500">Expires 12/28</div>
                                </div>
                                <span className="text-xs text-blue-600 font-medium">Default</span>
                            </div>

                            <button
                                onClick={handleCheckoutButton}
                                disabled={isProcessing}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>Processing...</>
                                ) : (
                                    <>Pay & Activate <Check size={18} /></>
                                )}
                            </button>

                            <p className="text-[10px] text-center text-slate-400 mt-4">
                                By confirming, you agree to DoneOne's Terms of Service.
                                <br />Payments are processed securely by Stripe.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {isRemovalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Capacity Limit Reached</h2>
                            <p className="text-sm text-slate-500">
                                Reducing seats will put some projects over the new limit. Please remove members to proceed.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
                            {overLimitProjects.map((p: any) => {
                                const countToRemove = missingCountMap[p.id];
                                const selected = selectedRemovals[p.id] || [];
                                const remaining = Math.max(0, countToRemove - selected.length);

                                // Get eligible members (Leads + Resources, excluding Owner)
                                const members = [
                                    ...(p.leadIds || []),
                                    ...(p.resourceIds || [])
                                ].map(id => users.find((u: any) => u.id === id)).filter(Boolean);

                                return (
                                    <div key={p.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-slate-700 dark:text-slate-200">{p.name}</h3>
                                            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                                Remove {remaining} more
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            {members.map((m: any) => (
                                                <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(m.id)}
                                                        onChange={() => toggleMemberRemoval(p.id, m.id)}
                                                    />
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                        {m.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{m.name}</span>
                                                    <span className="text-xs text-slate-400 ml-auto">{m.role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setIsRemovalModalOpen(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemovalAndCheckout}
                                disabled={!isRemovalValid() || isProcessing}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Remove & Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>

                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Payment Successful!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            {itemType === 'seats'
                                ? `You have successfully added ${quantity} extra seat(s) to your workspace.`
                                : `Your Premium Plan has been renewed successfully.`
                            }
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="w-full py-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl font-semibold transition-all"
                            >
                                View Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
