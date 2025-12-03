import { motion } from 'framer-motion';

const CTA = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-5xl font-bold mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-2xl mb-8 opacity-90">
                        Join thousands of users who are already managing their projects more efficiently
                    </p>

                    <motion.a
                        href="https://chrome.google.com/webstore"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block bg-white text-primary px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                        Add to Chrome - It's Free
                    </motion.a>

                    <p className="mt-6 text-sm opacity-75">
                        No credit card required • Free forever • Premium features available
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;
