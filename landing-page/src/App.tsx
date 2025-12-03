import { motion } from 'framer-motion';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import Screenshots from './components/Screenshots';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
    return (
        <div className="min-h-screen overflow-hidden">
            <Navigation />
            <Hero />
            <Features />
            <Screenshots />
            <CTA />
            <Footer />
        </div>
    );
}

export default App;
