import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Crown, Shield, Globe, Zap, Users, Info, ChevronLeft, Building2, Terminal, ShieldCheck, Mail, Database, Lock } from 'lucide-react';

const ComparePlansPage: React.FC = () => {
    const { plans, fetchPlans, currentUser } = useStore() as any;
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const currencyCode = currentUser?.currency || 'USD';
    const currencySymbol = currencyCode === 'INR' ? '₹' : '$';

    const filteredPlans = plans
        .filter((p: any) => p.currency === currencyCode)
        .sort((a: any, b: any) => {
            const order: Record<string, number> = { 'Free': 1, 'Standard': 2, 'Enterprise': 3 };
            return (order[a.name] || 0) - (order[b.name] || 0);
        });

    const features = [
        { name: 'Base Seats', key: 'max_members_per_project', type: 'count' },
        { name: 'Projects', key: 'max_projects', type: 'count' },
        { name: 'Leads per Project', key: 'max_leads_per_project', type: 'count' },
        { name: 'Max File Size', key: 'max_upload_size_mb', type: 'size' },
        { name: 'Attachments per Task', key: 'max_images_per_task', type: 'count' },
        { name: 'Invite Members', key: 'can_invite_members', type: 'boolean' },
        { name: 'Image Uploads', key: 'can_upload_images', type: 'boolean' },
        { name: 'Reminders', key: 'can_set_reminders', type: 'boolean' },
        { name: 'Notifications', key: 'can_use_notifications', type: 'boolean' },
        { name: 'Export Data', key: 'can_export_data', type: 'boolean' },
        { name: 'Activity History', key: 'history_retention_days', type: 'days' },
    ];

    const renderValue = (plan: any, feature: any) => {
        const val = plan[feature.key];
        const isEnterprise = plan.name === 'Enterprise';

        if (feature.type === 'boolean') {
            const hasFeature = isEnterprise || !!val;
            return hasFeature ? <Check className="text-orange-500 mx-auto" size={18} /> : <X className="text-slate-300 mx-auto" size={18} />;
        }
        if (feature.type === 'count') {
            if (isEnterprise) return 'Unlimited';
            return val === 999 ? 'Unlimited' : val;
        }
        if (feature.type === 'size') {
            if (isEnterprise) return '5 GB'; // Enterprise standard high limit
            return `${val} MB`;
        }
        if (feature.type === 'days') {
            if (isEnterprise) return 'Permanent';
            return val === 0 ? 'No History' : val === 999 ? 'Permanent' : `${val} Days`;
        }
        return val;
    };

    const enterprisePerks = [
        { name: 'Customized Features', icon: <Zap size={14} />, description: 'Dedicated functionality designed specifically for you' },
        { name: 'Self-Hosted Deployment', icon: <Terminal size={14} />, description: 'Integrate on your own private server' },
        { name: 'Custom Domain SSL', icon: <Globe size={14} />, description: 'Host on your company subdomain' },
        { name: '24/7 Priority Support', icon: <ShieldCheck size={14} />, description: 'Dedicated account manager' },
        { name: 'Advanced Audit Logs', icon: <Database size={14} />, description: 'Complete compliance tracking' },
        { name: 'SSO & SAML Auth', icon: <Lock size={14} />, description: 'Enterprise-grade security' },
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950 px-4 py-8 lg:py-12 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-20">
                <div className="text-center mb-10 lg:mb-16">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                        Choose the right path for <span className="text-[#FF6B35]">Success.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                        A detailed breakdown of features across all our tiers, designed to scale with your team's ambitions.
                    </p>
                </div>

                {/* Comparison Desktop Table */}
                <div className="hidden lg:block overflow-hidden rounded-[3rem] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="py-10 px-8 text-left">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Feature Comparison</span>
                                </th>
                                {filteredPlans.map((plan: any) => (
                                    <th key={plan.id} className="py-10 px-8 min-w-[200px]">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${plan.name === 'Enterprise' ? 'text-[#FF6B35]' : 'text-slate-400'}`}>
                                                {plan.name} Tier
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {/* Premium Enterprise Perks at Top */}
                            <tr className="bg-orange-50/20 dark:bg-orange-950/10">
                                <td colSpan={filteredPlans.length + 1} className="py-4 px-8 text-left">
                                    <div className="flex items-center gap-2">
                                        <Crown size={18} className="text-orange-500" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Exclusive Enterprise Perks</span>
                                    </div>
                                </td>
                            </tr>
                            {enterprisePerks.map((perk) => (
                                <tr
                                    key={perk.name}
                                    className={`transition-colors ${perk.name === 'Customized Features'
                                        ? 'bg-orange-500/[0.08] dark:bg-orange-500/[0.12] border-y-2 border-orange-500/20'
                                        : 'bg-orange-50/10 dark:bg-orange-950/5 hover:bg-orange-50/20 dark:hover:bg-orange-950/10'
                                        }`}
                                >
                                    <td className="py-5 px-8 text-left border-r border-slate-50 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <div className={`${perk.name === 'Customized Features' ? 'text-orange-600 dark:text-orange-400 scale-125' : 'text-orange-700 dark:text-orange-300'}`}>
                                                    {perk.icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${perk.name === 'Customized Features' ? 'text-orange-600 dark:text-orange-400 text-base' : ''}`}>
                                                            {perk.name}
                                                        </span>
                                                        {perk.name === 'Customized Features' && (
                                                            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider shadow-sm">
                                                                Main Feature
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium ${perk.name === 'Customized Features' ? 'text-orange-700/80 dark:text-orange-300/80' : 'text-slate-400'}`}>
                                                        {perk.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {filteredPlans.map((plan: any) => (
                                        <td key={plan.id} className="py-5 px-8">
                                            {plan.name === 'Enterprise' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Check className={`${perk.name === 'Customized Features' ? 'text-orange-600 scale-125' : 'text-orange-500'}`} size={20} />
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${perk.name === 'Customized Features' ? 'text-orange-700' : 'text-orange-600/50'}`}>
                                                        Included
                                                    </span>
                                                </div>
                                            ) : (
                                                <X className="text-slate-300 dark:text-slate-700 mx-auto" size={18} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Standard Features Section Header */}
                            <tr className="bg-slate-50/30 dark:bg-slate-900/40">
                                <td colSpan={filteredPlans.length + 1} className="py-4 px-8 text-left">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Core Capabilities</span>
                                </td>
                            </tr>

                            {features.map((feature) => (
                                <tr key={feature.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="py-6 px-8 text-left border-r border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{feature.name}</span>
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                        </div>
                                    </td>
                                    {filteredPlans.map((plan: any) => (
                                        <td key={plan.id} className="py-6 px-8 text-sm font-bold text-slate-900 dark:text-white">
                                            {renderValue(plan, feature)}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Enterprise Contact Row */}
                            <tr className="bg-gradient-to-r from-orange-500/[0.02] to-orange-500/[0.05] dark:from-orange-500/[0.01] dark:to-orange-500/[0.03]">
                                <td className="py-12 px-8 text-left align-top">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-[#FF6B35]">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <span className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">The Enterprise Experience</span>
                                    </div>
                                    <p className="text-xs text-orange-600/70 dark:text-orange-400/50 font-medium max-w-[200px]">Tailored for power, security, and absolute reliability.</p>
                                </td>
                                <td className="py-12 px-8 text-slate-300 text-sm">-</td>
                                <td className="py-12 px-8 text-slate-300 text-sm">-</td>
                                <td className="py-12 px-8 text-left bg-orange-500/[0.02] border-l border-orange-100 dark:border-orange-900/30">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="mt-1 text-[#FF6B35]"><Building2 size={16} /></div>
                                            <p className="text-[12px] font-bold text-orange-900 dark:text-orange-200 leading-relaxed italic">
                                                Deploy a private, dedicated instance on your specific domain with complete data sovereignty.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/billing')}
                                            className="w-full mt-4 py-4 bg-[#FF6B35] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            Contact Sales Team
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Placeholder */}
                <div className="lg:hidden space-y-6">
                    {filteredPlans.map((plan: any) => (
                        <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-2xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plan.name === 'Enterprise' && enterprisePerks.map(p => (
                                    <div key={p.name} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/50">
                                        <div className="text-orange-500">{p.icon}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-orange-900 dark:text-orange-200">{p.name}</span>
                                            <span className="text-[10px] text-orange-700/60 dark:text-orange-400/60">{p.description}</span>
                                        </div>
                                    </div>
                                ))}
                                {plan.name !== 'Enterprise' && enterprisePerks.map(p => (
                                    <div key={p.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 grayscale opacity-60">
                                        <div className="text-slate-400"><X size={14} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{p.name}</span>
                                            <span className="text-[10px] text-slate-400/60 dark:text-slate-500/60">Not included</span>
                                        </div>
                                    </div>
                                ))}
                                {features.map(f => (
                                    <div key={f.key} className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.name}</p>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{renderValue(plan, f)}</div>
                                    </div>
                                ))}
                            </div>
                            {plan.name === 'Enterprise' && (
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 leading-relaxed italic">
                                        Our Enterprise plan offers a fully tailorable experience, meticulously engineered to align with your organization's unique operational requirements and security standards. We provide the flexibility to deploy a private, dedicated instance on your specific domain, ensuring complete data sovereignty and a customized feature set as per your company's needs.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComparePlansPage;
