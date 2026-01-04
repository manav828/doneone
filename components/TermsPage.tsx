import React from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Terms and Conditions</h1>
                    <p className="text-slate-500 dark:text-slate-400">Last updated: January 2026</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText size={24} className="text-primary" />
                            1. Introduction
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Welcome to DoneOne. By creating an account or purchasing a subscription, you agree to these Terms and Conditions. Please read them carefully.
                        </p>
                    </section>

                    {/* Subscription & Billing */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            2. Subscription & Billing Policy
                        </h2>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                            <p>
                                <strong>2.1 Payment Terms:</strong> Subscription fees are billed in advance on a monthly or yearly basis. Payments are non-refundable unless otherwise required by law.
                            </p>

                            <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                                    <AlertOctagon size={18} />
                                    2.2 Seat Additions & Reductions (No Refunds)
                                </h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Adding Seats:</strong> When you add new seats (members) to your workspace during a billing cycle, you will be charged a prorated amount for the remaining days in the current cycle.
                                    </li>
                                    <li>
                                        <strong>Recuding Seats:</strong> You may reduce the number of seats in your workspace at any time. However, <strong>we do not provide refunds or credits for seat reductions</strong>. The reduction will take effect immediately, but no funds will be returned to your account for the unused time.
                                    </li>
                                    <li>
                                        <strong>Transaction Records:</strong> For record-keeping purposes, seat reductions will appear in your billing history as a <strong>"Cancelled"</strong> transaction with a value of $0.00. This indicates a valid change to your plan capacity but confirms that no monetary refund was processed.
                                    </li>
                                </ul>
                            </div>

                            <p>
                                <strong>2.3 Cancellations:</strong> You can cancel your subscription at any time. Your access to premium features will continue until the end of your current billing period.
                            </p>
                        </div>
                    </section>

                    {/* Usage Limits */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            3. Account Usage Limits
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Your use of DoneOne is subject to the limits of your selected plan (e.g., number of projects, members, file uploads). Exceeding these limits may result in restricted access or the need to upgrade your plan.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="pt-8 border-t border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            4. Contact Us
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            If you have questions about these Terms, please contact us at <a href="mailto:support@doneone.app" className="text-primary hover:underline">support@doneone.app</a>.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};
