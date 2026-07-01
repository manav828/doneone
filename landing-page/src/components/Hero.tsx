import { motion } from 'framer-motion';

const Hero = () => {
    const stats = [
        { value: '500+', label: 'Active Users' },
        { value: '10k+', label: 'Tasks Completed' },
    ];

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 mesh-gradient" />

            {/* Floating Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
                    animate={{
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-secondary/20 to-transparent blur-3xl"
                    animate={{
                        y: [0, -40, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
                <motion.div
                    className="absolute top-[40%] right-[30%] w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl"
                    animate={{
                        y: [0, 20, 0],
                        x: [0, -20, 0],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left Column - Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Now with AI-powered insights</span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6"
                    >
                        Get it <span className="gradient-text">done.</span>
                        <br />
                        One task at a time.
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-slate-600 leading-relaxed mb-8 max-w-lg"
                    >
                        The Chrome extension that turns chaos into clarity. Kanban boards,
                        time tracking, and team collaboration — all in your browser.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-wrap gap-4 mb-12"
                    >
                        <motion.a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center gap-2 text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>Add to Chrome — Free</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </motion.a>
                        <motion.a
                            href="#demo"
                            className="btn-secondary inline-flex items-center gap-2 text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span>Watch Demo</span>
                        </motion.a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex gap-8 md:gap-12"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                            >
                                <div className="text-3xl md:text-4xl font-bold gradient-text-orange">{stat.value}</div>
                                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right Column - Product Screenshot */}
                <motion.div
                    initial={{ opacity: 0, x: 60, rotateY: 10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    className="relative"
                >
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative"
                    >
                        {/* Browser Frame */}
                        <div className="relative mx-auto max-w-[600px] perspective-1000">
                            {/* Glow Effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 rounded-3xl blur-2xl opacity-50" />

                            {/* Browser Window */}
                            <div className="relative bg-slate-900 rounded-2xl p-2 shadow-2xl">
                                {/* Browser Header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="bg-slate-800 rounded-lg px-4 py-1.5 text-slate-400 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            doneone.app
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot Content */}
                                <div className="bg-white rounded-lg overflow-hidden">
                                    <img
                                        src="/screenshots/board-view.png"
                                        alt="DoneOne Kanban View"
                                        className="w-full h-auto"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://placehold.co/800x500/f97316/white?text=DoneOne+Kanban';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Base/Stand */}
                            <div className="h-4 bg-slate-800 rounded-b-2xl mx-4" />
                            <div className="h-1 bg-slate-700 rounded-b-lg mx-12" />
                        </div>

                        {/* Floating Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1 }}
                            className="absolute -right-4 top-1/4 glass rounded-2xl px-4 py-3 shadow-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Task Completed!</div>
                                    <div className="text-xs text-slate-500">+15 min tracked</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Timer */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.2 }}
                            className="absolute -left-8 bottom-1/3 glass rounded-2xl px-4 py-3 shadow-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900">02:34:18</div>
                                    <div className="text-xs text-slate-500">Time tracked today</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2 text-slate-400"
                >
                    <span className="text-sm">Scroll to explore</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default Hero;
