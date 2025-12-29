import LandingNavbar from './LandingNavbar';
import LandingHero from './LandingHero';
import LandingTrustBar from './LandingTrustBar';
import TimelineFeatures from './TimelineFeatures';
import LandingVideoSection from './LandingVideoSection';
import LandingMetrics from './LandingMetrics';
import LandingTestimonials from './LandingTestimonials';
import LandingPricing from './LandingPricing';
import LandingSecurityTrust from './LandingSecurityTrust';
import LandingCTASection from './LandingCTASection';
import LandingFooter from './LandingFooter';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const LandingPage = ({ onLogin, onRegister }: LandingPageProps) => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <LandingNavbar onLogin={onLogin} onRegister={onRegister} />

            {/* Hero Section */}
            <LandingHero onRegister={onRegister} />

            {/* Trust Bar - Logo Carousel */}
            <LandingTrustBar />

            {/* Features Timeline */}
            <TimelineFeatures />

            {/* Video Demo Section */}
            <LandingVideoSection />

            {/* Testimonials */}
            <LandingTestimonials />

            {/* Metrics / Stats */}
            <LandingMetrics />

            {/* Pricing Section */}
            <LandingPricing onRegister={onRegister} />

            {/* Security & Trust */}
            <LandingSecurityTrust />

            {/* Final CTA */}
            <LandingCTASection onRegister={onRegister} />

            {/* Footer */}
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
