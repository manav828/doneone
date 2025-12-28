import { motion } from 'framer-motion';
import { TestimonialsColumn } from './ui/testimonials-columns';

const testimonials = [
    {
        text: "DoneOne completely transformed how our team manages projects. The Chrome extension format is genius - it's always there when you need it!",
        image: "https://randomuser.me/api/portraits/women/1.jpg",
        name: "Sarah Chen",
        role: "Product Manager",
    },
    {
        text: "The time tracking feature alone has saved us hours of manual work. Best investment we've made for our productivity stack.",
        image: "https://randomuser.me/api/portraits/men/2.jpg",
        name: "Marcus Johnson",
        role: "Senior Developer",
    },
    {
        text: "Finally, a task manager that doesn't require switching between apps. The Kanban board is intuitive and the calendar view is a game-changer.",
        image: "https://randomuser.me/api/portraits/women/3.jpg",
        name: "Emily Rodriguez",
        role: "Team Lead",
    },
    {
        text: "We switched from three different tools to just DoneOne. It has everything we need in one beautiful extension.",
        image: "https://randomuser.me/api/portraits/men/4.jpg",
        name: "David Kim",
        role: "Freelance Designer",
    },
    {
        text: "The real-time collaboration features are incredible. Our remote team feels more connected than ever.",
        image: "https://randomuser.me/api/portraits/women/5.jpg",
        name: "Lisa Thompson",
        role: "Engineering Manager",
    },
    {
        text: "Simple yet powerful. DoneOne strikes the perfect balance between features and ease of use.",
        image: "https://randomuser.me/api/portraits/men/6.jpg",
        name: "Alex Rivera",
        role: "Startup Founder",
    },
    {
        text: "The support team is exceptional, guiding us through setup and providing ongoing assistance.",
        image: "https://randomuser.me/api/portraits/women/7.jpg",
        name: "Aliza Khan",
        role: "Business Analyst",
    },
    {
        text: "Our productivity improved significantly. The intuitive interface made team training effortless.",
        image: "https://randomuser.me/api/portraits/men/8.jpg",
        name: "Omar Raza",
        role: "CEO",
    },
    {
        text: "Using DoneOne, our project delivery times improved dramatically. Highly recommend for any team.",
        image: "https://randomuser.me/api/portraits/women/9.jpg",
        name: "Zainab Hussain",
        role: "Project Manager",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-20 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10"
                >
                    <div className="flex justify-center">
                        <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            Testimonials
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-5 text-center text-slate-900">
                        What our <span className="gradient-text">users say</span>
                    </h2>
                    <p className="text-center mt-5 text-slate-600 text-lg">
                        See what our customers have to say about their experience with DoneOne
                    </p>
                </motion.div>

                {/* Scrolling Columns */}
                <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
