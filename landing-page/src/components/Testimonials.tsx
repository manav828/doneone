import { motion } from 'framer-motion';

const Testimonials = () => {
    const testimonials = [
        {
            quote: "DoneOne completely transformed how our team manages projects. The Chrome extension format is genius - it's always there when you need it!",
            author: "Sarah Chen",
            role: "Product Manager at TechCorp",
            avatar: "SC",
            rating: 5,
        },
        {
            quote: "The time tracking feature alone has saved us hours of manual work. Best investment we've made for our productivity stack.",
            author: "Marcus Johnson",
            role: "Senior Developer at StartupXYZ",
            avatar: "MJ",
            rating: 5,
        },
        {
            quote: "Finally, a task manager that doesn't require switching between apps. The Kanban board is intuitive and the calendar view is a game-changer.",
            author: "Emily Rodriguez",
            role: "Team Lead at DesignStudio",
            avatar: "ER",
            rating: 5,
        },
        {
            quote: "We switched from three different tools to just DoneOne. It has everything we need in one beautiful extension.",
            author: "David Kim",
            role: "Freelance Designer",
            avatar: "DK",
            rating: 5,
        },
        {
            quote: "The real-time collaboration features are incredible. Our remote team feels more connected than ever.",
            author: "Lisa Thompson",
            role: "Engineering Manager at CloudTech",
            avatar: "LT",
            rating: 5,
        },
        {
            quote: "Simple yet powerful. DoneOne strikes the perfect balance between features and ease of use.",
            author: "Alex Rivera",
            role: "Startup Founder",
            avatar: "AR",
            rating: 5,
        },
    ];

    // Double the testimonials for seamless infinite scroll
    const doubledTestimonials = [...testimonials, ...testimonials];

    const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
        <div className="flex-shrink-0 w-[350px] p-6 rounded-2xl bg-white border border-slate-200 shadow-lg">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>

            {/* Quote */}
            <p className="text-slate-600 mb-6 leading-relaxed">
                "{testimonial.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                </div>
                <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
            </div>
        </div>
    );

    return (
        <section id="testimonials" className="py-20 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        Testimonials
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Loved by <span className="gradient-text">productive teams</span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        See what our users have to say about their experience with DoneOne
                    </p>
                </motion.div>
            </div>

            {/* Infinite Scrolling Testimonials */}
            <div className="relative">
                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

                {/* Scrolling Container */}
                <motion.div
                    className="flex gap-6 py-4"
                    animate={{
                        x: [0, -2100],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                >
                    {doubledTestimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Testimonials;
