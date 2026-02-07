import { motion } from 'framer-motion';

const LandingBentoFeatures = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    // Small Feature Card
    const SmallCard = ({ title, description, image, gradient }: {
        title: string;
        description: string;
        image: string;
        gradient: string;
    }) => (
        <motion.div
            variants={itemVariants}
            className="flex-1 min-h-0 group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col"
        >
            <div className={`h-1 bg-gradient-to-r ${gradient} flex-shrink-0`} />
            <div className="p-3 flex-shrink-0">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-slate-500 text-xs">{description}</p>
            </div>
            <div className="px-2 pb-2 flex-1 min-h-0 flex items-center overflow-hidden">
                <div className="rounded-lg overflow-hidden border border-slate-100 w-full">
                    <img src={image} alt={title} className="w-full h-auto max-h-[180px] object-cover block" loading="lazy" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <section id="features" className="py-16 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                        Powerful Features
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                        Everything you need to{' '}
                        <span className="gradient-text">stay organized</span>
                    </h2>
                    <p className="text-base text-slate-600 max-w-2xl mx-auto">
                        DoneOne brings powerful project management features right into your browser
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="space-y-4"
                >
                    {/* Row 1: Big Kanban + 2 stacked cards */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Kanban - Big Card (2/3 width) */}
                        <motion.div
                            variants={itemVariants}
                            className="lg:w-2/3 group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Kanban Board</h3>
                                <p className="text-slate-500 text-sm">Visualize your workflow with drag-and-drop boards. Organize tasks across custom columns effortlessly.</p>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="rounded-lg overflow-hidden border border-slate-100">
                                    <img src="/guide/board-view.png" alt="Kanban Board" className="w-full h-auto block" loading="lazy" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Right column - 2 stacked cards (1/3 width) */}
                        <div className="lg:w-1/3 flex flex-col gap-4">
                            <SmallCard
                                title="Time Tracking"
                                description="Track every minute with one-click timer."
                                image="/guide/timeline-view.png"
                                gradient="from-blue-500 to-cyan-500"
                            />
                            <SmallCard
                                title="Calendar View"
                                description="See deadlines and drag to reschedule."
                                image="/guide/calendar-view.png"
                                gradient="from-violet-500 to-purple-500"
                            />
                        </div>
                    </div>

                    {/* Row 2: 3 equal cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                            variants={itemVariants}
                            className="group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">List View</h3>
                                <p className="text-slate-500 text-sm">Detailed task overview in a sortable table.</p>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="rounded-lg overflow-hidden border border-slate-100">
                                    <img src="/guide/list-view.png" alt="List View" className="w-full h-auto block" loading="lazy" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Reports & Analytics</h3>
                                <p className="text-slate-500 text-sm">Track productivity with detailed insights.</p>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="rounded-lg overflow-hidden border border-slate-100">
                                    <img src="/guide/reports-view.png" alt="Reports" className="w-full h-auto block" loading="lazy" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Team Collaboration</h3>
                                <p className="text-slate-500 text-sm">Invite members, assign tasks in real-time.</p>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="rounded-lg overflow-hidden border border-slate-100">
                                    <img src="/guide/board-view.png" alt="Team Collaboration" className="w-full h-auto block" loading="lazy" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Row 3: Enterprise Features (Full Width) */}
                    <motion.div
                        variants={itemVariants}
                        className="group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 p-8 relative"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                Enterprise Grade
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4">Unmatched Security & Control</h3>
                            <p className="text-slate-400 text-lg max-w-2xl mb-8 font-medium">
                                Designed for organizations that require the highest standards of security, compliance, and deployment flexibility.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="text-white font-bold text-base">Self-Hosted</div>
                                    <p className="text-slate-500 text-xs">Deploy on your private infrastructure</p>
                                </div>
                                <div className="space-y-2 text-center md:text-left border-l border-slate-800 pl-6">
                                    <div className="text-white font-bold text-base">SSO & SAML</div>
                                    <p className="text-slate-500 text-xs">Standardized identity management</p>
                                </div>
                                <div className="space-y-2 text-center md:text-left border-l border-slate-800 pl-6">
                                    <div className="text-white font-bold text-base">Custom SSL</div>
                                    <p className="text-slate-500 text-xs">Your domain, your security</p>
                                </div>
                                <div className="space-y-2 text-center md:text-left border-l border-slate-800 pl-6">
                                    <div className="text-white font-bold text-base">24/7 Support</div>
                                    <p className="text-slate-500 text-xs">Dedicated account management</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default LandingBentoFeatures;
