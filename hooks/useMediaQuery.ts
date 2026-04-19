import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using CSS media queries
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        // Check if window is defined (SSR safety)
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia(query);

        // Set initial value
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Create listener function
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

        // Add listener (modern browsers)
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            // Fallback for older browsers
            media.addListener(listener);
        }

        // Cleanup
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [matches, query]);

    return matches;
};

/**
 * Pre-configured breakpoint hooks for common use cases
 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
