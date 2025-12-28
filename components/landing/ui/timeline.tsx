"use client";
import {
    useMotionValueEvent,
    useScroll,
    useTransform,
    motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
    title: string;
    content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setHeight(rect.height);
        }
    }, [ref]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 10%", "end 50%"],
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    // Track which item is currently active based on scroll
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const itemProgress = latest * data.length;
        setActiveIndex(Math.floor(itemProgress));
    });

    return (
        <div
            className="w-full font-sans md:px-10"
            style={{ backgroundColor: '#FFFBF7' }}
            ref={containerRef}
        >
            <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
                <h2 className="text-3xl md:text-4xl lg:text-5xl mb-4 text-slate-900 max-w-4xl" style={{ fontWeight: 600 }}>
                    Everything you need to stay organized
                </h2>
                <p className="text-slate-600 text-base md:text-lg max-w-xl leading-relaxed">
                    Powerful features designed to help you and your team stay productive and focused.
                </p>
            </div>

            <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex justify-start pt-10 md:pt-32 md:gap-10"
                    >
                        <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFBF7' }}>
                                <motion.div
                                    className="h-4 w-4 rounded-full border-2 transition-all duration-300"
                                    style={{
                                        borderColor: '#f97316',
                                        backgroundColor: index <= activeIndex ? '#f97316' : 'transparent'
                                    }}
                                    animate={{
                                        scale: index === activeIndex ? 1.2 : 1,
                                    }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <h3
                                className="hidden md:block text-xl md:pl-20 md:text-4xl font-semibold transition-colors duration-300"
                                style={{ color: index <= activeIndex ? '#334155' : '#94a3b8' }}
                            >
                                {item.title}
                            </h3>
                        </div>

                        <div className="relative pl-20 pr-4 md:pl-4 w-full">
                            <h3
                                className="md:hidden block text-2xl mb-4 text-left font-semibold transition-colors duration-300"
                                style={{ color: index <= activeIndex ? '#334155' : '#94a3b8' }}
                            >
                                {item.title}
                            </h3>
                            {item.content}
                        </div>
                    </div>
                ))}
                <div
                    style={{
                        height: height + "px",
                    }}
                    className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-slate-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
                >
                    <motion.div
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                        className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-orange-500 via-orange-400 to-transparent from-[0%] via-[10%] rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default Timeline;
