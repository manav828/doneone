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
            className="flex-1 group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col"
        >
            <div className={`h-1 bg-gradient-to-r ${gradient} flex-shrink-0`} />
            <div className="p-3 flex-shrink-0">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-slate-500 text-xs">{description}</p>
            </div>
            <div className="px-2 pb-2 flex-1 flex items-end">
                <div className="rounded-lg overflow-hidden border border-slate-100 w-full">
                    <img src={image} alt={title} className="w-full h-auto block" loading="lazy" />
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
                </motion.div>
            </div>
        </section>
    );
};

export default LandingBentoFeatures;
