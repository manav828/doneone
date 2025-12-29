"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";

interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

export const TestimonialsColumn = (props: {
    className?: string;
    testimonials: Testimonial[];
    duration?: number;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimationControls();
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentY, setCurrentY] = useState(0);

    useEffect(() => {
        if (isHovered) {
            // Pause: stop at current position
            controls.stop();
        } else {
            // Calculate remaining progress (0% to -50% is the range)
            // currentY is negative when scrolling, so we calculate how much is left
            const totalRange = 50; // 0% to -50%
            const currentProgress = Math.abs(currentY); // How far we've gone (0 to 50)
            const remainingProgress = (totalRange - currentProgress) / totalRange;

            // Calculate remaining duration proportionally to maintain same speed
            const baseDuration = props.duration || 10;
            const remainingDuration = baseDuration * remainingProgress;

            // Resume: continue animation from current position at consistent speed
            controls.start({
                translateY: [currentY + "%", "-50%"],
                transition: {
                    duration: Math.max(remainingDuration, 0.5), // Minimum 0.5s to avoid jerky animation
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }
            });
        }
    }, [isHovered, controls, props.duration]);

    // Initial animation start
    useEffect(() => {
        controls.start({
            translateY: ["0%", "-50%"],
            transition: {
                duration: props.duration || 10,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
            }
        });
    }, []);

    const handleMouseEnter = () => {
        // Get current transform value before stopping
        if (containerRef.current) {
            const style = window.getComputedStyle(containerRef.current);
            const matrix = new DOMMatrix(style.transform);
            const containerHeight = containerRef.current.scrollHeight;
            if (containerHeight > 0) {
                setCurrentY((matrix.m42 / containerHeight) * 100);
            }
        }
        setIsHovered(true);
    };

    return (
        <div
            className={`cursor-pointer ${props.className || ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                ref={containerRef}
                animate={controls}
                className="flex flex-col gap-6 pb-6"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <motion.div
                                    className="p-10 rounded-3xl border border-slate-200 bg-white shadow-lg shadow-primary/10 max-w-xs w-full"
                                    key={i}
                                    whileHover={{
                                        scale: 1.03,
                                        boxShadow: '0 20px 40px rgba(232, 90, 53, 0.15)'
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-slate-600 leading-relaxed">{text}</div>
                                    <div className="flex items-center gap-2 mt-5">
                                        <img
                                            width={40}
                                            height={40}
                                            src={image}
                                            alt={name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                        <div className="flex flex-col">
                                            <div className="font-medium tracking-tight leading-5 text-slate-900">{name}</div>
                                            <div className="leading-5 opacity-60 tracking-tight text-slate-600">{role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.div>
        </div>
    );
};

export default TestimonialsColumn;
