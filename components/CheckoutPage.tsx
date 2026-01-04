import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Shield, CreditCard, Check, ArrowLeft, Users, Lock, Crown, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const CheckoutPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addSeat, currentUser, fetchUsers, fetchProjects, plans, projects, users, removeMember, paymentConfigs, fetchPaymentConfigs } = useStore() as any;

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

    useEffect(() => {
        if (fetchPaymentConfigs) fetchPaymentConfigs();
    }, []);

    // Per Seat Cost Priority: User Override > Plan Config > Default 5
    const PER_SEAT_PRICE = currentUser?.perSeatCost || 5;

    const currency = currentUser?.currency || 'USD';
    const currencySymbol = currency === 'INR' ? '₹' : '$';

    const premiumPlan = plans.find(p => p.id === 'premium' && p.currency === currency) || plans.find(p => p.id === 'premium');
    const PLAN_BASE_PRICE = premiumPlan?.price_monthly || (currency === 'INR' ? 899 : 19);
    const PLAN_MEMBERS_LIMIT = premiumPlan?.max_members_per_project || premiumPlan?.maxMembersPerProject || 8;

    // Base Capacity (Included Seats): User's DB Limit (if snapshot) > Plan Config > Default
    const INCLUDED_SEATS = currentUser?.maxResources || PLAN_MEMBERS_LIMIT;


    useEffect(() => {
        fetchUsers();
        if (currentUser) {
            fetchProjects();
        }
    }, [currentUser?.id]);

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
    }, [searchParams]);

    // Calculate Total
    const baseAmount = itemType === 'plan' ? PLAN_BASE_PRICE : 0;
    const seatsAmount = quantity * PER_SEAT_PRICE;
    const totalMonthly = baseAmount + seatsAmount;

    // Calculate Capacity
    const currentBase = INCLUDED_SEATS;
    const baseCapacity = itemType === 'plan' ? INCLUDED_SEATS : currentBase;
    const totalCapacity = baseCapacity + quantity;

    // Proration Logic
    const renewalDate = currentUser?.premiumUntil ? new Date(currentUser.premiumUntil) : new Date();
    const today = new Date();
    const isExpired = renewalDate < today;

    // If expired or no date, we charge full month (30 days)
    // If active, we charge remaining days
    const diffTime = Math.abs(renewalDate.getTime() - today.getTime());
    const remainingDays = isExpired ? 30 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Prorated Charge (Due Today)
    const dailyRate = PER_SEAT_PRICE / 30;
    const proratedCost = quantity > 0 ? (quantity * dailyRate * remainingDays) : 0;

    // Total Due Today
    const totalDueToday = itemType === 'plan' ? PLAN_BASE_PRICE : proratedCost;

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

    // Razorpay IntegrationScript
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const processProvisioning = async (currency: string = 'USD', provider: string = 'system') => {
        try {
            if (itemType === 'seats') {
                // Log Seat Transaction (Purchase or Reduction)
                const isReduction = quantity < 0;

                console.log("Provisioning Seat Transaction:", { quantity, amount: totalDueToday, isReduction });
                await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: isReduction ? 0 : totalDueToday,
                    status: isReduction ? 'cancelled' : 'completed',
                    description: isReduction
                        ? `Seat Reduction (Removed ${Math.abs(quantity)} seat${Math.abs(quantity) > 1 ? 's' : ''})`
                        : `Added ${quantity} seat(s) (Prorated for ${remainingDays} days)`,
                    currency: currency,
                    provider: provider,
                    created_at: new Date().toISOString()
                });

                await addSeat(quantity);
            } else {
                // Plan Renewal Logic
                let newExpiryDate = new Date();
                const currentExpiry = currentUser?.premiumUntil ? new Date(currentUser.premiumUntil) : null;

                if (currentExpiry && !isNaN(currentExpiry.getTime())) {
                    currentExpiry.setDate(currentExpiry.getDate() + 30);
                    newExpiryDate = currentExpiry;
                } else {
                    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                }

                // Update Premium Status & Expiry
                await supabase.from('profiles').update({
                    is_premium: true,
                    premium_until: newExpiryDate.toISOString(),
                    renewal_date: newExpiryDate.toISOString()
                }).eq('id', currentUser.id);

                // Log Plan Transaction
                console.log("Provisioning Plan Renewal:", { amount: totalDueToday });
                await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: totalDueToday,
                    status: 'completed',
                    description: `Premium Plan Renewal (until ${newExpiryDate.toLocaleDateString()})`,
                    currency: currency,
                    provider: provider,
                    created_at: new Date().toISOString()
                });

                if (quantity > (currentUser?.extraSeats || 0)) {
                    await addSeat(quantity - (currentUser?.extraSeats || 0));
                }
            }
            await fetchUsers();
            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error) {
            console.error("Provisioning failed:", error);
            alert("Failed to update account. Please support.");
            setIsProcessing(false);
        }
    };

    const handleCheckout = async () => {
        setIsProcessing(true);

        // CASE 1: Seat Reduction (No Payment Needed)
        if (itemType === 'seats' && quantity < 0) {
            await processProvisioning('USD', 'system');
            return;
        }

        // CASE 2: Payment Required (Purchase)

        // --- Dynamic Gateway Selection ---
        const razorpayConfig = paymentConfigs?.find((c: any) => c.provider === 'razorpay');
        const isRazorpayActive = razorpayConfig && razorpayConfig.is_enabled;

        // Default to Razorpay if active (as per user preference flows), otherwise fallback to others
        // For now, let's assume Razorpay is the primary since we have specific code for it.

        if (!isRazorpayActive) {
            // Fallback or Lemon Squeezy logic could go here
            alert("Payment gateway is currently disabled. Please contact support.");
            setIsProcessing(false);
            return;
        }

        const apiKey = razorpayConfig.mode === 'live' ? razorpayConfig.live_key_id : razorpayConfig.test_key_id;

        if (!apiKey) {
            alert("Payment configuration missing. Please report this to support.");
            setIsProcessing(false);
            return;
        }

        // Strict INR Conversion for Razorpay to support UPI
        const amountInINR = currency === 'INR'
            ? Math.ceil(totalDueToday)
            : Math.ceil(totalDueToday * 84); // Fallback exchange rate for USD->INR
        const amountInPaise = amountInINR * 100;

        const options = {
            key: apiKey,
            amount: amountInPaise,
            currency: "INR",
            name: "DoneOne",
            description: itemType === 'plan'
                ? `Premium Plan (${currencySymbol}${PLAN_BASE_PRICE})`
                : `Extra Seats (${currencySymbol}${totalDueToday.toFixed(2)})`,
            image: "https://doneone.app/logo_icon.png",
            handler: async function (response: any) {
                console.log("Payment Successful", response);
                await processProvisioning();
            },
            prefill: {
                name: currentUser?.name || "",
                email: currentUser?.email || "",
                contact: ""
            },
            notes: {
                address: "DoneOne Corporate"
            },
            theme: {
                color: "#f97316"
            },
            modal: {
                ondismiss: function () {
                    setIsProcessing(false);
                }
            }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
    };

    if (!currentUser) return <div className="p-10 text-center">Please log in to continue.</div>;

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 flex flex-col">
            <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left Column: Order Details */}
                <div className="md:col-span-7 space-y-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
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
                        {/* Base Plan Item */}
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
                                        <span className="font-bold text-lg text-slate-800 dark:text-white">{currencySymbol}{PLAN_BASE_PRICE}.00<span className="text-sm font-normal text-slate-400">/mo</span></span>
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
                                            <span className="font-bold text-slate-800 dark:text-white">{currencySymbol}{PER_SEAT_PRICE}/mo</span>
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

                            {/* Breakdown */}
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
                                        {currencySymbol}{(PLAN_BASE_PRICE + (((currentUser?.extraSeats || 0) + quantity) * PER_SEAT_PRICE)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Due Today {itemType === 'seats' && quantity > 0 && <span className="text-xs font-normal text-slate-500">(Prorated for {remainingDays} days)</span>}</h3>
                            {itemType === 'plan' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Premium Plan (Base)</span>
                                    <span className="font-medium text-slate-800 dark:text-white">${PLAN_BASE_PRICE.toFixed(2)}</span>
                                </div>
                            )}
                            {itemType === 'seats' && quantity > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {quantity} Extra Seat{quantity > 1 ? 's' : ''} (x{remainingDays} days)
                                    </span>
                                    <span className="font-medium text-slate-800 dark:text-white">${proratedCost.toFixed(2)}</span>
                                </div>
                            )}
                            {itemType === 'seats' && quantity < 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Seat Reduction (x{Math.abs(quantity)})
                                    </span>
                                    <span className="font-medium text-slate-800 dark:text-white">$0.00</span>
                                </div>
                            )}

                            <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
                                <span className="font-bold text-slate-800 dark:text-white">Total due today</span>
                                <span className="font-bold text-2xl text-primary">{currencySymbol}{totalDueToday.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">


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
                                By confirming, you agree to DoneOne's <button onClick={() => window.open('/terms', '_blank')} className="underline hover:text-slate-600 transition-colors cursor-pointer text-slate-500">Terms and Conditions</button>.
                                <br />Payments are processed securely by Razorpay.
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
