import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import BentoFeatures from './components/BentoFeatures';
import VideoSection from './components/VideoSection';
import Pricing from './components/Pricing';
import Metrics from './components/Metrics';
import Testimonials from './components/Testimonials';
import SecurityTrust from './components/SecurityTrust';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

function App() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <Hero />

            {/* Trust Bar - Logo Carousel */}
            <TrustBar />

            {/* Features Bento Grid */}
            <BentoFeatures />

            {/* Video Demo Section */}
            <VideoSection />

            {/* Metrics / Stats */}
            <Metrics />

            {/* Testimonials */}
            <Testimonials />

            {/* Pricing Section */}
            <Pricing />

            {/* Security & Trust */}
            <SecurityTrust />

            {/* Final CTA */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default App;
