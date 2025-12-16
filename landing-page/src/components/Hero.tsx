import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
                    >
                        Manage Projects{' '}
                        <span className="gradient-text">with DoneOne</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-xl text-gray-600 mb-8 leading-relaxed"
                    >
                        The all-in-one Chrome extension for seamless task management.
                        Kanban boards, List views, and Calendar - all in your browser.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="flex gap-4"
                    >
                        <motion.a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                        >
                            Add to Chrome - It's Free
                        </motion.a>

                        <motion.a
                            href="#features"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-primary hover:text-primary transition-all duration-300"
                        >
                            Learn More
                        </motion.a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="flex gap-8 mt-12"
                    >
                        <div>
                            <div className="text-3xl font-bold text-primary">10k+</div>
                            <div className="text-sm text-gray-500">Active Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">4.8★</div>
                            <div className="text-sm text-gray-500">Chrome Rating</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">50k+</div>
                            <div className="text-sm text-gray-500">Tasks Completed</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Content - Laptop Mockup */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative"
                >
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="relative z-10"
                    >
                        {/* Laptop Frame */}
                        <div className="relative mx-auto" style={{ maxWidth: '600px' }}>
                            {/* Screen */}
                            <div className="relative bg-gray-900 rounded-t-2xl p-2 shadow-2xl">
                                <div className="bg-white rounded-lg overflow-hidden">
                                    <img
                                        src="/screenshots/kanban.png"
                                        alt="DoneOne Kanban View"
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                            {/* Base */}
                            <div className="h-4 bg-gray-800 rounded-b-2xl shadow-lg" />
                            <div className="h-1 bg-gray-700 mx-auto w-32 rounded-b-lg" />
                        </div>
                    </motion.div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            rotate: [0, 5, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute top-10 -left-10 glass px-4 py-3 rounded-xl shadow-xl"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold">Real-time Sync</span>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{
                            y: [0, 15, 0],
                            rotate: [0, -5, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.5,
                        }}
                        className="absolute bottom-20 -right-10 glass px-4 py-3 rounded-xl shadow-xl"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold">42 Tasks Today</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
