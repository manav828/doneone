import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Shield, CreditCard, Check, ArrowLeft, Users, Lock, Crown, CheckCircle, Plus, Minus } from 'lucide-react';
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

    const currency = currentUser?.currency || 'USD';
    const currencySymbol = currency === 'INR' ? '₹' : '$';

    const billingParam = searchParams.get('billing');
    const isAnnual = billingParam === 'annual';

    const planParam = searchParams.get('plan');
    const selectedPlan = plans.find((p: any) => p.id === planParam);

    // Per Seat Cost Priority: User Override > Plan Config > Default
    const PER_SEAT_PRICE = currentUser?.perSeatCost ||
        (selectedPlan ? (isAnnual ? (selectedPlan?.price_per_seat_yearly || selectedPlan?.price_per_seat_monthly) : selectedPlan?.price_per_seat_monthly) : 0) ||
        (currentUser?.isPremium ? (currentUser?.perSeatCost || (currency === 'INR' ? 399 : 5)) : (currency === 'INR' ? 399 : 5));

    // Use price_yearly if annual, otherwise price_monthly
    const PLAN_BASE_PRICE = selectedPlan
        ? (isAnnual ? (selectedPlan?.price_yearly || (selectedPlan?.price_monthly * 12)) : (selectedPlan?.price_monthly || 0))
        : (isAnnual ? ((currentUser?.planBaseCost || (currency === 'INR' ? 899 : 12)) * 12) : (currentUser?.planBaseCost || (currency === 'INR' ? 899 : 12)));

    const PLAN_MEMBERS_LIMIT = selectedPlan?.max_members_per_project || (currentUser?.maxResources || 8);

    // Base Capacity (Included Seats): User's DB Limit (if snapshot) > Plan Config > Default
    const INCLUDED_SEATS = currentUser?.maxResources || PLAN_MEMBERS_LIMIT;

    useEffect(() => {
        fetchUsers();
        if (currentUser) {
            fetchProjects();
        }
    }, [currentUser?.id]);

    useEffect(() => {
        const planId = searchParams.get('plan');
        const seatsParam = searchParams.get('seats');

        if (planId) {
            setItemType('plan');
            setQuantity(0);
        } else if (seatsParam) {
            setItemType('seats');
            setQuantity(parseInt(seatsParam) || 1);
        }
    }, [searchParams]);

    // Calculate Total
    const baseAmount = PLAN_BASE_PRICE;
    const seatsAmount = (currentUser?.extraSeats || 0) + quantity > 0
        ? ((currentUser?.extraSeats || 0) + quantity) * (isAnnual ? PER_SEAT_PRICE * 12 : PER_SEAT_PRICE)
        : 0;
    const totalRecurring = baseAmount + seatsAmount;
    const intervalLabel = isAnnual ? 'Year' : 'Month';
    const intervalLabelLower = isAnnual ? 'year' : 'month';

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

    // Prorated Charge (Due Today for new seats in current cycle)
    const MONTHLY_SEAT_PRICE = (selectedPlan?.price_per_seat_monthly) || (currentUser?.perSeatCost) || (currency === 'INR' ? 299 : 5);
    const dailyRate = MONTHLY_SEAT_PRICE / 30;
    const proratedSeatCost = (itemType === 'seats' || isAnnual) && quantity > 0 ? (quantity * dailyRate * remainingDays) : 0;

    // Determine if switching from Monthly to Annual
    const isSwitchingToAnnual = isAnnual && (currentUser?.billingInterval || 'monthly') === 'monthly';

    // Total Due Today
    let totalDueToday = 0;
    if (itemType === 'plan' || isSwitchingToAnnual) {
        // If switching to Annual, we charge:
        // 1. The full Yearly Recurring Amount (which extends expiry by 1 year)
        // 2. PLUS prorated amount for ONLY the new seats for the remainder of this month
        totalDueToday = totalRecurring + proratedSeatCost;
    } else {
        // Just adding seats on the current monthly cycle
        totalDueToday = proratedSeatCost;
    }

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

    // Razorpay Integration Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const processProvisioning = async (currencyCode: string = 'USD', provider: string = 'system') => {
        try {
            // Prepare the Data Snapshot (JSONB-first architecture)
            // If user adds seats or switches plan, we lock in their current plan details into custom_plan_data
            const plan = selectedPlan || plans.find((p: any) => p.id === currentUser.planId);

            const snapshot: any = {
                planBaseCost: PLAN_BASE_PRICE,
                perSeatCost: PER_SEAT_PRICE,
                extraSeats: itemType === 'seats' ? ((currentUser?.extraSeats || 0) + quantity) : (currentUser?.extraSeats || 0),
                maxProjects: plan?.max_projects || currentUser.maxProjects || 3,
                maxLeads: plan?.max_leads_per_project || currentUser.maxLeads || 2,
                maxResources: plan?.max_members_per_project || currentUser.maxResources || 5,
                notifications: !!(plan?.can_use_notifications || currentUser.notificationsEnabled),
                reminders: !!(plan?.can_set_reminders || currentUser.remindersEnabled),
                timeTracking: !!(plan?.price_monthly > 0 || currentUser.timeTrackingEnabled),
                imageUpload: !!(plan?.can_upload_images || currentUser.imageUploadEnabled),
                maxAttachments: plan?.max_uploads_per_task_limit || currentUser.maxAttachmentsPerTask || 3,
                billingInterval: isAnnual ? 'annual' : 'monthly'
            };

            if (itemType === 'seats') {
                // Log Seat Transaction
                const isReduction = quantity < 0;
                const { error: txError } = await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: isReduction ? 0 : totalDueToday,
                    status: isReduction ? 'cancelled' : 'completed',
                    description: isReduction
                        ? `Seat Reduction (Removed ${Math.abs(quantity)} seat${Math.abs(quantity) > 1 ? 's' : ''})`
                        : `Added ${quantity} seat(s) (Prorated for ${remainingDays} days)`,
                    currency: currencyCode,
                    provider: provider,
                    created_at: new Date().toISOString()
                });
                if (txError) throw txError;

                // Update Profile with new JSONB Snapshot
                const { error: profileError } = await supabase.from('profiles').update({
                    custom_plan_data: snapshot
                }).eq('id', currentUser.id);
                if (profileError) throw profileError;

            } else {
                // Plan Renewal/Upgrade Logic
                let newExpiryDate = new Date();
                const currentExpiry = currentUser?.premiumUntil ? new Date(currentUser.premiumUntil) : null;

                if (currentExpiry && !isNaN(currentExpiry.getTime()) && currentExpiry > new Date()) {
                    if (isAnnual) currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
                    else currentExpiry.setDate(currentExpiry.getDate() + 30);
                    newExpiryDate = currentExpiry;
                } else {
                    if (isAnnual) newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
                    else newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                }

                // Update Profile: New Plan ID + Expiry + JSONB Snapshot
                const { error: profileError } = await supabase.from('profiles').update({
                    plan_id: selectedPlan?.id || currentUser.planId,
                    premium_until: newExpiryDate.toISOString(),
                    renewal_date: newExpiryDate.toISOString(),
                    billing_interval: isAnnual ? 'annual' : 'monthly',
                    custom_plan_data: snapshot
                }).eq('id', currentUser.id);

                if (profileError) throw profileError;

                // Log Plan Transaction
                const { error: planTxError } = await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: totalDueToday,
                    status: 'completed',
                    description: `${selectedPlan?.name || 'Premium'} Plan Upgrade/Renewal (until ${newExpiryDate.toLocaleDateString()})`,
                    currency: currencyCode,
                    provider: provider,
                    created_at: new Date().toISOString()
                });
                if (planTxError) throw planTxError;
            }

            await fetchUsers();
            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error: any) {
            console.error("Provisioning failed:", error);
            alert(`Provisioning failed: ${error.message || 'Unknown error'}. Please contact support.`);
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
                ? `${selectedPlan?.name || 'Premium'} Plan (${isAnnual ? 'Annual' : 'Monthly'}) (${currencySymbol}${PLAN_BASE_PRICE})`
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
        <div className="h-full overflow-y-auto bg-slate-50 text-slate-800">
            <div className="flex-1 max-w-6xl mx-auto w-full p-6 md:pt-8 md:px-12 md:pb-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Left Column: Order Details */}
                    <div className="md:col-span-7 space-y-6 animate-in slide-in-from-left duration-500">
                        <div>
                            <button
                                onClick={() => navigate(-1)}
                                className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-4 font-bold"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Back to billing
                            </button>
                            <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                                {itemType === 'plan' ? 'Upgrade workspace' : 'Add capacity'}
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Confirm your order details below to finalize your subscription.
                            </p>
                        </div>

                        {/* Current Plan Snapshot */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-primary rounded-xl border border-orange-100">
                                    <Crown size={22} />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Active Plan</p>
                                    <h3 className="text-base font-black text-slate-900">
                                        {currentUser.isPremium ? 'Premium Core' : 'Free Tier'}
                                    </h3>
                                </div>
                            </div>
                            {currentUser.isPremium && currentUser.premiumUntil && (
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Next Renewal</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(currentUser.premiumUntil).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {/* Base Plan Item */}
                            {(itemType === 'plan' || isSwitchingToAnnual) && (
                                <div className="p-6 flex items-center gap-6 bg-slate-50/50">
                                    <div className="p-4 bg-gradient-to-br from-primary to-orange-600 text-white rounded-2xl shadow-lg shadow-primary/20">
                                        <Crown size={26} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900">Premium Plan Base</h3>
                                                <p className="text-xs text-primary font-bold mt-0.5 uppercase tracking-widest">Foundational features</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-slate-900">{currencySymbol}{PLAN_BASE_PRICE}</span>
                                                <span className="text-xs font-bold text-slate-400 block mt-0.5">/ {intervalLabelLower}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Seats Item */}
                            <div className="p-6">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                                        <Users size={26} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900">Additional Seats</h3>
                                                <p className="text-slate-500 text-xs font-medium">Expand your team collaboration capacity</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-slate-800">{currencySymbol}{PER_SEAT_PRICE}</span>
                                                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">per seat / month</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-6 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => setQuantity(quantity - 1)}
                                                    disabled={itemType === 'seats' && quantity <= -(currentUser?.extraSeats || 0)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-400 disabled:opacity-20 transition-colors border-r border-slate-100"
                                                >
                                                    <Minus size={16} />
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
                                                    className="w-14 bg-transparent text-center font-black text-lg text-slate-900 outline-none"
                                                />
                                                <button
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors border-l border-slate-100"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Capacity will be</span>
                                                <span className="text-lg font-black text-slate-900">{(totalCapacity + (itemType === 'seats' ? (currentUser?.extraSeats || 0) : 0))} members</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="p-6 bg-slate-50/50 flex gap-4 items-center border-t border-slate-100">
                            <Shield className="text-slate-400" size={20} />
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                Payments are secured by industry-standard SSL encryption. By proceeding, you authorize DoneOne to charge your payment method for the amount displayed above.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary */}
                    <div className="md:col-span-5 animate-in slide-in-from-right duration-500">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-8 shadow-xl shadow-slate-200/50">
                            <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight text-center md:text-left">Summary</h2>

                            <div className="space-y-6 mb-8">
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Recurring Subscription</p>
                                        {(itemType === 'plan' || isSwitchingToAnnual) && (
                                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                New Expiry: {(() => {
                                                    const start = (currentUser?.premiumUntil && new Date(currentUser.premiumUntil) > new Date())
                                                        ? new Date(currentUser.premiumUntil)
                                                        : new Date();
                                                    const d = new Date(start);
                                                    if (isAnnual) d.setFullYear(d.getFullYear() + 1);
                                                    else d.setDate(d.getDate() + 30);
                                                    return d.toLocaleDateString();
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-medium">
                                        <span className="text-slate-500">{isAnnual ? 'Annual' : 'Monthly'} Plan Base</span>
                                        <span className="font-bold text-slate-900">{currencySymbol}{PLAN_BASE_PRICE}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-medium pb-4 border-b border-slate-200">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500">Extra Seat Allocation ({((currentUser?.extraSeats || 0) + quantity)})</span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                {((currentUser?.extraSeats || 0) + quantity)} × {currencySymbol}{isAnnual ? PER_SEAT_PRICE * 12 : PER_SEAT_PRICE} / {intervalLabelLower}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-900">{currencySymbol}{(((currentUser?.extraSeats || 0) + quantity) * (isAnnual ? PER_SEAT_PRICE * 12 : PER_SEAT_PRICE))}</span>
                                    </div>

                                    {/* Proration Detail if applicable */}
                                    {proratedSeatCost > 0 && isSwitchingToAnnual && (
                                        <div className="flex justify-between items-center text-xs font-medium text-primary">
                                            <span>New Seats Proration ({remainingDays} days)</span>
                                            <span className="font-bold">+{currencySymbol}{proratedSeatCost.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-xs font-black text-slate-900">Total Recurring {intervalLabel}ly</span>
                                        <span className="text-xl font-black text-slate-900">{currencySymbol}{totalRecurring.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-900">Amount due today</span>
                                            {proratedSeatCost > 0 && (
                                                <span className="text-[10px] text-slate-500 font-bold mt-0.5 italic">Incl. {remainingDays} days for {quantity} new seat(s)</span>
                                            )}
                                            {isSwitchingToAnnual && (
                                                <span className="text-[10px] text-primary font-bold mt-0.5 italic">Initial Annual Subscription</span>
                                            )}
                                        </div>
                                        <span className="text-3xl font-black text-primary">{currencySymbol}{totalDueToday.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleCheckoutButton}
                                    disabled={isProcessing}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>Wait...</>
                                    ) : (
                                        <>Pay & Activate <CheckCircle size={20} /></>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
                                    <Lock size={12} className="text-slate-400" />
                                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Secure Checkout via SSL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Removal Modal - Re-styled */}
            {isRemovalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.2)] p-12 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100">
                        <div className="mb-10">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-8 border border-red-100">
                                <Shield className="animate-pulse" size={40} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Capacity check</h2>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Reducing seats would leave some projects over their limit. Please select members to remove before proceeding.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-8 pr-4 custom-scrollbar">
                            {overLimitProjects.map((p: any) => {
                                const countToRemove = missingCountMap[p.id];
                                const selected = selectedRemovals[p.id] || [];
                                const remaining = Math.max(0, countToRemove - selected.length);

                                const members = [
                                    ...(p.leadIds || []),
                                    ...(p.resourceIds || [])
                                ].map(id => users.find((u: any) => u.id === id)).filter(Boolean);

                                return (
                                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-black text-xl text-slate-900">{p.name}</h3>
                                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${remaining === 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                {remaining === 0 ? 'Limit met' : `Remove ${remaining} more`}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {members.map((m: any) => (
                                                <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${selected.includes(m.id) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected.includes(m.id) ? 'bg-red-600 border-red-600' : 'border-slate-300'}`}>
                                                        {selected.includes(m.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={selected.includes(m.id)}
                                                        onChange={() => toggleMemberRemoval(p.id, m.id)}
                                                    />
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-800 border border-slate-200">
                                                        {m.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">{m.name}</span>
                                                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{m.role}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setIsRemovalModalOpen(false)}
                                className="flex-1 py-3 text-slate-500 hover:text-slate-900 font-black transition-colors"
                            >
                                Cancel Order
                            </button>
                            <button
                                onClick={confirmRemovalAndCheckout}
                                disabled={!isRemovalValid() || isProcessing}
                                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-base shadow-xl shadow-red-200 transition-all disabled:opacity-20 active:scale-95"
                            >
                                {isProcessing ? 'Wait...' : 'Confirm & Proceed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal - Smaller & Centered */}
            {isSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="max-w-md w-full p-10 bg-white rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden flex flex-col items-center mx-4 border border-slate-100">
                        <div className="mb-8 relative">
                            <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center animate-in zoom-in duration-700 border border-green-100">
                                <div className="p-4 bg-green-500 text-white rounded-2xl shadow-xl shadow-green-200">
                                    <CheckCircle size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Payment Successful!</h2>
                        <p className="text-slate-500 text-base leading-relaxed mb-10 font-medium">
                            {itemType === 'seats'
                                ? `Workspace capacity has been increased by ${Math.abs(quantity)} seat${Math.abs(quantity) > 1 ? 's' : ''}.`
                                : `Your premium subscription for ${selectedPlan?.name || 'Premium'} is now active.`
                            }
                        </p>

                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Enter Workspace
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="w-full py-3 text-slate-400 hover:text-slate-900 font-bold transition-colors text-sm"
                            >
                                View Billing Hub
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
