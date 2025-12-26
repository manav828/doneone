import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useState } from 'react';

const VideoSection = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section id="demo" className="py-24 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        See It In Action
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Watch how <span className="gradient-text">DoneOne</span> works
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Get a quick overview of how DoneOne can transform your productivity
                    </p>
                </motion.div>

                {/* Video Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative max-w-4xl mx-auto"
                >
                    {/* Glow Effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />

                    {/* Video Wrapper */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                        {/* Video Thumbnail / Player */}
                        <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800">
                            {!isPlaying ? (
                                <>
                                    {/* Thumbnail Placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {/* Animated Background Elements */}
                                        <motion.div
                                            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                        />
                                        <motion.div
                                            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-secondary/20 blur-3xl"
                                            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 5, repeat: Infinity }}
                                        />

                                        {/* Logo Watermark */}
                                        <div className="absolute top-6 left-6 flex items-center gap-2">
                                            <img src="/logo-icon.png" alt="D.one" className="w-8 h-8" />
                                            <span className="text-white/80 font-semibold">D.one Demo</span>
                                        </div>

                                        {/* Play Button */}
                                        <motion.button
                                            onClick={() => setIsPlaying(true)}
                                            className="relative z-10 group"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {/* Pulse Animation */}
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-primary"
                                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-shadow">
                                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                                            </div>
                                        </motion.button>

                                        {/* Hint Text */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center"
                                        >
                                            <span className="text-white/60 text-sm">Click to play demo video</span>
                                        </motion.div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="text-lg font-medium mb-2">Demo Video Coming Soon</p>
                                        <p className="text-white/60 text-sm">We're putting the finishing touches on our demo</p>
                                        <button
                                            onClick={() => setIsPlaying(false)}
                                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Features */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="hidden md:flex absolute -left-4 top-1/4 transform -translate-x-full"
                    >
                        <div className="glass rounded-xl shadow-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-sm font-medium text-slate-700">Easy Setup</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="hidden md:flex absolute -right-4 top-1/2 transform translate-x-full"
                    >
                        <div className="glass rounded-xl shadow-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <span className="text-white text-sm">⚡</span>
                                </div>
                                <span className="text-sm font-medium text-slate-700">Lightning Fast</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 }}
                        className="hidden md:flex absolute -bottom-4 left-1/4 transform translate-y-full"
                    >
                        <div className="glass rounded-xl shadow-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                    <span className="text-white text-sm">🔒</span>
                                </div>
                                <span className="text-sm font-medium text-slate-700">Secure & Private</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default VideoSection;
