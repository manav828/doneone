import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPricingProps {
    onRegister: () => void;
}

const LandingPricing = ({ onRegister }: LandingPricingProps) => {
    const [annual, setAnnual] = useState(true);

    const plans = [
        {
            name: 'Starter',
            description: 'Perfect for individuals getting started',
            price: { monthly: 0, annual: 0 },
            features: [
                'Unlimited tasks',
                'Kanban board view',
                '1 project',
                'Basic time tracking',
                '7-day history',
            ],
            cta: 'Get Started',
            ctaStyle: 'secondary',
        },
        {
            name: 'Pro',
            description: 'For growing teams with premium needs',
            price: { monthly: 12, annual: 9 },
            features: [
                'Everything in Starter',
                'Unlimited projects',
                'List & Calendar views',
                'Team collaboration (up to 10)',
                'Advanced reporting',
                'Priority support',
                'Unlimited history',
            ],
            cta: 'Start Free Trial',
            ctaStyle: 'primary',
            popular: true,
        },
        {
            name: 'Enterprise',
            description: 'For organizations that demand the best',
            price: { monthly: 39, annual: 29 },
            features: [
                'Everything in Pro',
                'Unlimited team members',
                'Admin controls',
                'SSO integration',
                'Custom branding',
                'Dedicated support',
                'SLA guarantee',
            ],
            cta: 'Contact Sales',
            ctaStyle: 'dark',
        },
    ];

    return (
        <section id="pricing" className="py-16 bg-slate-50/50">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3 tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-slate-500 text-base max-w-lg mx-auto">
                        Start free, upgrade when you're ready. No hidden fees.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <span className={`text-sm ${!annual ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setAnnual(!annual)}
                            className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-orange-500' : 'bg-slate-200 hover:bg-slate-300'
                                }`}
                        >
                            <motion.div
                                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                                animate={{ left: annual ? '30px' : '4px' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm ${annual ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                            Annual
                        </span>
                        {annual && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                                Save 25%
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Trust Signal */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8"
                >
                    <p className="text-slate-400 text-sm">
                        Trusted by 50,000+ professionals • 4.9★ Chrome Web Store rating
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{
                                background: plan.popular
                                    ? 'linear-gradient(180deg, rgba(255, 247, 237, 0.9) 0%, rgba(255, 251, 245, 0.95) 100%)'
                                    : 'linear-gradient(180deg, rgba(255, 250, 245, 0.7) 0%, rgba(255, 255, 255, 0.85) 100%)',
                                boxShadow: plan.popular
                                    ? '0 4px 24px -4px rgba(251, 146, 60, 0.12), 0 12px 40px -8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(251, 146, 60, 0.06)'
                                    : '0 2px 16px -4px rgba(251, 146, 60, 0.08), 0 8px 32px -8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
                                border: plan.popular
                                    ? '1px solid rgba(251, 146, 60, 0.12)'
                                    : '1px solid rgba(251, 146, 60, 0.06)'
                            }}
                            className={`relative rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] ${plan.popular ? 'scale-[1.02]' : 'hover:shadow-lg'
                                }`}
                        >
                            {/* Popular Badge - Premium pill on card edge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-medium shadow-sm">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-5 pt-2">
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">{plan.name}</h3>
                                <p className="text-slate-400 text-xs">{plan.description}</p>
                            </div>

                            {/* Price - Most dominant */}
                            <div className="mb-5">
                                <div className="flex items-baseline gap-1">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={annual ? 'annual' : 'monthly'}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="text-4xl font-bold text-slate-900 tracking-tight"
                                        >
                                            ${annual ? plan.price.annual : plan.price.monthly}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-slate-400 text-sm">/mo</span>
                                </div>
                                {plan.price.annual > 0 && annual && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        ${plan.price.annual * 12} billed annually
                                    </p>
                                )}
                                {plan.price.annual === 0 && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        Free forever
                                    </p>
                                )}
                            </div>

                            {/* Features - Calm, readable */}
                            <ul className="space-y-2.5 mb-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2.5">
                                        <svg
                                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-orange-400' : 'text-slate-300'
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-slate-600 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button - Clear hierarchy */}
                            <motion.button
                                onClick={onRegister}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 ${plan.ctaStyle === 'primary'
                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-200'
                                    : plan.ctaStyle === 'dark'
                                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                                        : 'bg-transparent text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {plan.cta}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-10"
                >
                    <p className="text-slate-400 text-xs">
                        30-day money-back guarantee • Cancel anytime • No credit card required
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default LandingPricing;
