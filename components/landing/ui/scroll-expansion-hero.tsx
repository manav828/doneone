import {
    useEffect,
    useRef,
    useState,
    ReactNode,
} from 'react';
import { motion } from 'framer-motion';

interface ScrollExpandMediaProps {
    mediaType?: 'video' | 'image';
    mediaSrc: string;
    posterSrc?: string;
    title?: string;
    subtitle?: string;
    scrollHint?: string;
    textBlend?: boolean;
    children?: ReactNode;
}

const ScrollExpandMedia = ({
    mediaType = 'video',
    mediaSrc,
    posterSrc,
    title = "See DoneOne in action",
    subtitle = "Built for focus. Designed for flow.",
    scrollHint = "Scroll to explore",
    textBlend = true,
    children,
}: ScrollExpandMediaProps) => {
    const [scrollProgress, setScrollProgress] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const sectionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;

            const rect = sectionRef.current.getBoundingClientRect();
            const sectionTop = rect.top;
            const sectionHeight = sectionRef.current.offsetHeight;
            const viewportHeight = window.innerHeight;

            const totalScrollDistance = sectionHeight - viewportHeight;
            // Start expansion ~15% earlier
            const expansionDistance = totalScrollDistance * 0.4;

            if (sectionTop >= 0) {
                setScrollProgress(0);
            } else if (Math.abs(sectionTop) <= expansionDistance) {
                const progress = Math.abs(sectionTop) / expansionDistance;
                setScrollProgress(Math.min(progress, 1));
            } else {
                setScrollProgress(1);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Video dimensions
    const minWidth = isMobile ? 300 : 480;
    const maxWidth = isMobile ? 380 : 1000;
    const minHeight = isMobile ? 200 : 320;
    const maxHeight = isMobile ? 260 : 600;

    const mediaWidth = minWidth + scrollProgress * (maxWidth - minWidth);
    const mediaHeight = minHeight + scrollProgress * (maxHeight - minHeight);

    // Text fade timing - exits EARLY so video becomes focal point
    // "Scroll to explore" fades first, headline by ~20%, subtitle by ~25%
    const scrollHintOpacity = Math.max(0, 1 - scrollProgress * 8);  // Fades by ~12%
    const headlineOpacity = Math.max(0, 1 - scrollProgress * 5);    // Fades by ~20%
    const subtitleOpacity = Math.max(0, 1 - scrollProgress * 4);    // Fades by ~25%

    // Subtle vertical lift
    const textLiftAmount = isMobile ? 15 : 25;
    const textTranslateY = scrollProgress * textLiftAmount;

    return (
        <div ref={sectionRef} style={{ height: '280vh' }}>
            {/* Sticky container */}
            <div
                className='sticky top-0 h-screen w-full overflow-hidden'
                style={{
                    background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 50%, #EEEEEE 100%)'
                }}
            >

                {/* Subtle radial anchor behind video - felt not seen */}
                <div
                    className='absolute inset-0 pointer-events-none flex items-center justify-center'
                    style={{ paddingTop: isMobile ? '60px' : '40px' }}
                >
                    <div
                        style={{
                            width: '900px',
                            height: '700px',
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.03) 0%, transparent 70%)',
                            borderRadius: '50%',
                        }}
                    />
                </div>

                {/* CENTERED TEXT - Above video, fades + lifts on scroll */}
                <div
                    className="absolute inset-x-0 flex flex-col items-center pointer-events-none z-20"
                    style={{
                        top: isMobile ? '12%' : '10%',
                        transform: `translateY(-${textTranslateY}px)`,
                        transition: 'transform 0.12s ease-out'
                    }}
                >
                    {/* Primary Headline - weight reduced to 500 */}
                    <h2
                        className='text-3xl md:text-4xl lg:text-5xl text-center px-6'
                        style={{
                            fontWeight: 500,
                            color: '#1a1a1a',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            opacity: headlineOpacity,
                            transition: 'opacity 0.12s ease-out',
                        }}
                    >
                        {title}
                    </h2>

                    {/* Micro-context line */}
                    {subtitle && (
                        <p
                            className='mt-4 text-center px-6'
                            style={{
                                fontSize: '14px',
                                color: 'rgba(100, 100, 100, 0.75)',
                                maxWidth: '420px',
                                lineHeight: 1.6,
                                opacity: subtitleOpacity,
                                transition: 'opacity 0.12s ease-out',
                            }}
                        >
                            {subtitle}
                        </p>
                    )}

                    {/* Scroll Hint - fades first */}
                    {scrollHint && (
                        <p
                            className='mt-4 text-sm font-medium flex items-center gap-2'
                            style={{
                                color: 'rgba(150, 150, 150, 0.8)',
                                opacity: scrollHintOpacity,
                                transition: 'opacity 0.12s ease-out',
                            }}
                        >
                            <span>{scrollHint}</span>
                            <motion.svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                animate={{ y: [0, 3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                            </motion.svg>
                        </p>
                    )}
                </div>

                {/* VIDEO - Centered, expands on scroll */}
                <div
                    className='absolute inset-0 flex items-center justify-center z-10'
                    style={{ paddingTop: isMobile ? '60px' : '40px' }}
                >
                    <div
                        className='relative overflow-hidden'
                        style={{
                            width: `${mediaWidth}px`,
                            height: `${mediaHeight}px`,
                            borderRadius: '16px',
                            boxShadow: `
                                0 4px 6px -1px rgba(0, 0, 0, 0.05),
                                0 20px 50px -12px rgba(0, 0, 0, 0.12),
                                0 40px 80px -20px rgba(0, 0, 0, 0.08)
                            `,
                            transition: 'width 0.08s ease-out, height 0.08s ease-out',
                            border: '1px solid rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        {mediaType === 'video' ? (
                            mediaSrc.includes('youtube.com') ? (
                                <iframe
                                    width='100%'
                                    height='100%'
                                    src={
                                        mediaSrc.includes('embed')
                                            ? mediaSrc + (mediaSrc.includes('?') ? '&' : '?') +
                                            'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                                            : mediaSrc.replace('watch?v=', 'embed/') +
                                            '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                                            mediaSrc.split('v=')[1]
                                    }
                                    className='w-full h-full pointer-events-none'
                                    style={{ borderRadius: '16px' }}
                                    frameBorder='0'
                                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={mediaSrc}
                                    poster={posterSrc}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload='auto'
                                    className='w-full h-full object-cover'
                                    style={{ borderRadius: '16px' }}
                                    controls={false}
                                    disablePictureInPicture
                                />
                            )
                        ) : (
                            <img
                                src={mediaSrc}
                                alt={title || 'Media content'}
                                className='w-full h-full object-cover'
                                style={{ borderRadius: '16px' }}
                            />
                        )}
                    </div>
                </div>

            </div>

            {/* Children after sticky ends */}
            {children && (
                <div className='bg-white py-20 px-8 md:px-16'>
                    {children}
                </div>
            )}
        </div>
    );
};

export default ScrollExpandMedia;
