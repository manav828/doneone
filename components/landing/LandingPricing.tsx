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
        <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        Simple Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Choose your{' '}
                        <span className="gradient-text">perfect plan</span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Start free, upgrade when you're ready. No hidden fees, no surprises.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!annual ? 'text-slate-900' : 'text-slate-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setAnnual(!annual)}
                            className="relative w-14 h-8 rounded-full bg-primary/20 transition-colors"
                        >
                            <motion.div
                                className="absolute top-1 w-6 h-6 rounded-full bg-primary shadow-lg"
                                animate={{ left: annual ? '28px' : '4px' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-medium ${annual ? 'text-slate-900' : 'text-slate-500'}`}>
                            Annual
                        </span>
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            Save 25%
                        </span>
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`relative rounded-3xl p-8 ${plan.popular
                                ? 'pricing-popular scale-105 z-10'
                                : 'bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                <p className="text-slate-600 text-sm">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={annual ? 'annual' : 'monthly'}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="text-5xl font-bold text-slate-900"
                                        >
                                            ${annual ? plan.price.annual : plan.price.monthly}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-slate-500">/month</span>
                                </div>
                                {plan.price.annual > 0 && annual && (
                                    <p className="text-sm text-slate-500 mt-1">
                                        Billed annually (${plan.price.annual * 12}/year)
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-slate-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <motion.button
                                onClick={onRegister}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`block w-full text-center py-4 rounded-full font-semibold transition-all duration-300 ${plan.ctaStyle === 'primary'
                                    ? 'bg-primary text-white shadow-lg hover:shadow-xl'
                                    : plan.ctaStyle === 'dark'
                                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {plan.cta}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-slate-500 mt-12"
                >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    30-day money-back guarantee • Cancel anytime • No credit card required for free plan
                </motion.p>
            </div>
        </section>
    );
};

export default LandingPricing;
