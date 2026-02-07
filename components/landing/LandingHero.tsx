import { motion } from 'framer-motion';

interface LandingHeroProps {
    onRegister: () => void;
}

const LandingHero = ({ onRegister }: LandingHeroProps) => {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Background - Warm off-white with subtle orange atmosphere */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF9F5 50%, #FFFBF7 100%)'
                }}
            />

            {/* Orange atmospheric gradient - felt not seen */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(249, 115, 22, 0.05) 0%, transparent 60%)'
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(249, 115, 22, 0.03) 0%, transparent 50%)'
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Column - Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="max-w-xl"
                    >
                        {/* Enterprise Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Now Enterprise Ready
                        </motion.div>

                        {/* Main Headline - Semi-bold with strong orange "done." */}
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] mb-6"
                            style={{ fontWeight: 600 }}
                        >
                            Get it{' '}
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.15))',
                                }}
                            >
                                done.
                            </span>
                            <br />
                            One task at a time.
                        </h1>

                        {/* Supporting Paragraph */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                            className="text-lg text-slate-600 leading-relaxed mb-10"
                            style={{ maxWidth: '440px' }}
                        >
                            The Chrome extension that turns chaos into clarity.
                            Kanban boards, time tracking, and team collaboration — all in your browser.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
                            className="flex flex-wrap items-center gap-4"
                        >
                            {/* Primary CTA - Brand anchor with glow */}
                            <motion.button
                                onClick={onRegister}
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-medium text-base"
                                style={{
                                    background: 'linear-gradient(180deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
                                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35), 0 8px 32px rgba(249, 115, 22, 0.2)'
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow: '0 6px 24px rgba(249, 115, 22, 0.4), 0 12px 40px rgba(249, 115, 22, 0.25)'
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>Get Started Free</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </motion.button>

                            {/* Secondary CTA */}
                            <motion.a
                                href="#demo"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-base text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors"
                                style={{ backgroundColor: 'rgba(255, 251, 247, 0.8)' }}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span>Watch Demo</span>
                            </motion.a>
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Product Screenshot */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        className="relative"
                    >
                        {/* Browser Frame */}
                        <div className="relative mx-auto max-w-[580px]">
                            {/* Orange-tinted ambient shadow under product */}
                            <div
                                className="absolute -inset-6 rounded-3xl"
                                style={{
                                    background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.08) 0%, transparent 70%)'
                                }}
                            />

                            {/* Secondary shadow for depth */}
                            <div
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                    boxShadow: '0 40px 80px -20px rgba(249, 115, 22, 0.15), 0 20px 40px -10px rgba(0, 0, 0, 0.08)'
                                }}
                            />

                            {/* Browser Window */}
                            <div
                                className="relative rounded-2xl overflow-hidden"
                                style={{
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
                                    border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                {/* Browser Header */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700/50">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                    </div>
                                    <div className="flex-1 mx-3">
                                        <div className="bg-slate-700/50 rounded-md px-3 py-1 text-slate-400 text-xs flex items-center gap-2 max-w-[200px]">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            doneone.in
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot Content */}
                                <div style={{ backgroundColor: '#FFFBF7' }}>
                                    <img
                                        src="/guide/board-view.png"
                                        alt="DoneOne Kanban Board"
                                        className="w-full h-auto"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://placehold.co/800x500/FFFBF7/64748b?text=DoneOne+Board';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Floating UI Highlight - Task Completed */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 0.95, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                                className="absolute -right-3 top-[30%] rounded-xl px-3 py-2.5"
                                style={{
                                    backgroundColor: 'rgba(255, 251, 247, 0.95)',
                                    boxShadow: '0 8px 30px rgba(249, 115, 22, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid rgba(249, 115, 22, 0.08)',
                                    transform: 'scale(0.9)'
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-slate-800">Task Completed</div>
                                        <div className="text-[10px] text-slate-400">+12 min tracked</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating UI Highlight - Time Tracked */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 0.95, y: 0 }}
                                transition={{ duration: 0.5, delay: 1 }}
                                className="absolute -left-3 bottom-[25%] rounded-xl px-3 py-2.5"
                                style={{
                                    backgroundColor: 'rgba(255, 251, 247, 0.95)',
                                    boxShadow: '0 8px 30px rgba(249, 115, 22, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid rgba(249, 115, 22, 0.08)',
                                    transform: 'scale(0.9)'
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800">02:34:18</div>
                                        <div className="text-[10px] text-slate-400">Time today</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="text-xs text-slate-400 font-medium">Scroll to explore</span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default LandingHero;
