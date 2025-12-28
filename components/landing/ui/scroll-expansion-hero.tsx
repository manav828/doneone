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
    title,
    subtitle,
    scrollHint,
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
            const expansionDistance = totalScrollDistance * 0.5;

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
    const minWidth = isMobile ? 280 : 400;
    const maxWidth = isMobile ? 360 : 950;
    const minHeight = isMobile ? 180 : 280;
    const maxHeight = isMobile ? 240 : 560;

    const mediaWidth = minWidth + scrollProgress * (maxWidth - minWidth);
    const mediaHeight = minHeight + scrollProgress * (maxHeight - minHeight);

    // Text animation
    const textOpacity = Math.max(0, 1 - scrollProgress * 1.8);
    const textTranslateVW = scrollProgress * (isMobile ? 80 : 60);
    const bottomTextTranslate = scrollProgress * (isMobile ? 60 : 40);

    const firstWord = title ? title.split(' ')[0] : '';
    const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

    return (
        <div ref={sectionRef} style={{ height: '280vh' }}>
            {/* Sticky container - pt-16 accounts for navbar height */}
            <div className='sticky top-0 h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16'>

                {/* Background gradient orbs */}
                <div className='absolute inset-0 pointer-events-none'>
                    <div
                        className='absolute w-96 h-96 rounded-full blur-3xl'
                        style={{ top: '10%', left: '5%', background: 'rgba(232, 90, 53, 0.2)' }}
                    />
                    <div
                        className='absolute w-80 h-80 rounded-full blur-3xl'
                        style={{ bottom: '10%', right: '5%', background: 'rgba(100, 116, 139, 0.2)' }}
                    />
                </div>

                {/* VIDEO - z-10, offset by half navbar height to center in visible area */}
                <div
                    className='absolute inset-0 flex items-center justify-center z-10'
                    style={{ paddingTop: '32px' }}
                >
                    <div
                        className='relative rounded-2xl overflow-hidden'
                        style={{
                            width: `${mediaWidth}px`,
                            height: `${mediaHeight}px`,
                            boxShadow: '0 30px 100px rgba(0, 0, 0, 0.5)',
                            transition: 'width 0.08s ease-out, height 0.08s ease-out',
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
                                    className='w-full h-full rounded-2xl pointer-events-none'
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
                                    className='w-full h-full object-cover rounded-2xl'
                                    controls={false}
                                    disablePictureInPicture
                                />
                            )
                        ) : (
                            <img
                                src={mediaSrc}
                                alt={title || 'Media content'}
                                className='w-full h-full object-cover rounded-2xl'
                            />
                        )}

                        {/* Dark overlay */}
                        <div
                            className='absolute inset-0 bg-black/30 rounded-2xl pointer-events-none'
                            style={{ opacity: Math.max(0, 0.4 - scrollProgress * 0.4) }}
                        />
                    </div>
                </div>

                {/* TEXT - z-20 - ON TOP of video, same offset as video */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 ${textBlend ? 'mix-blend-difference' : ''}`}
                    style={{ opacity: textOpacity, paddingTop: '32px' }}
                >
                    <motion.h2
                        className='text-5xl md:text-7xl lg:text-8xl font-bold text-white whitespace-nowrap'
                        style={{
                            transform: `translateX(-${textTranslateVW}vw)`,
                            transition: 'transform 0.05s ease-out'
                        }}
                    >
                        {firstWord}
                    </motion.h2>
                    <motion.h2
                        className='text-5xl md:text-7xl lg:text-8xl font-bold text-white whitespace-nowrap mt-2'
                        style={{
                            transform: `translateX(${textTranslateVW}vw)`,
                            transition: 'transform 0.05s ease-out'
                        }}
                    >
                        {restOfTitle}
                    </motion.h2>
                </div>

                {/* Bottom hints */}
                <div
                    className='absolute bottom-12 left-0 right-0 z-20 pointer-events-none'
                    style={{ opacity: textOpacity }}
                >
                    <div className='flex justify-between px-8'>
                        {subtitle && (
                            <p
                                className='text-xl font-medium text-white/70 whitespace-nowrap'
                                style={{
                                    transform: `translateX(-${bottomTextTranslate}vw)`,
                                    transition: 'transform 0.05s ease-out'
                                }}
                            >
                                {subtitle}
                            </p>
                        )}
                        {scrollHint && (
                            <p
                                className='text-white/50 text-sm whitespace-nowrap'
                                style={{
                                    transform: `translateX(${bottomTextTranslate}vw)`,
                                    transition: 'transform 0.05s ease-out'
                                }}
                            >
                                {scrollHint}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Children after sticky ends - simple approach */}
            {children && (
                <div className='bg-white py-20 px-8 md:px-16'>
                    {children}
                </div>
            )}
        </div>
    );
};

export default ScrollExpandMedia;
