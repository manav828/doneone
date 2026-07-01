import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
    end: number;
    suffix?: string;
    duration?: number;
}

const AnimatedCounter = ({ end, suffix = '', duration = 2 }: CounterProps) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    useEffect(() => {
        if (!isInView) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setCount(Math.floor(easeOutExpo * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [isInView, end, duration]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const LandingMetrics = () => {
    const stats = [
        { 
            value: 500, 
            suffix: '+', 
            label: 'Active Users', 
            icon: (
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ), 
            useCounter: true 
        },
        { 
            displayValue: '10k+', 
            label: 'Tasks Completed', 
            icon: (
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ), 
            useCounter: false 
        },
        { 
            value: 99.9, 
            suffix: '%', 
            label: 'Uptime', 
            icon: (
                <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ), 
            useCounter: false 
        },
    ];

    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* Floating Gradients */}
            <motion.div
                className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
                animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-3xl"
                animate={{ y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
                transition={{ duration: 10, repeat: Infinity }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Trusted by <span className="gradient-text">thousands</span> worldwide
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Join the community of productive professionals who rely on DoneOne every day
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="glass-dark rounded-2xl p-8 text-center h-full transition-all duration-300 group-hover:scale-105">
                                {/* Icon */}
                                <div className="flex justify-center mb-4">{stat.icon}</div>

                                {/* Number */}
                                <div className="stat-number mb-2">
                                    {stat.displayValue ? (
                                        <span>{stat.displayValue}</span>
                                    ) : stat.useCounter && stat.value ? (
                                        <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                                    ) : (
                                        <span>{stat.value}{stat.suffix}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <p className="text-slate-400 font-medium">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingMetrics;
