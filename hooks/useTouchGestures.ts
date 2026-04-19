import { useEffect, useRef, RefObject } from 'react';

export interface TouchGesture {
    type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'long-press' | 'tap';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    deltaX: number;
    deltaY: number;
    duration: number;
}

export interface TouchGestureOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onLongPress?: () => void;
    onTap?: () => void;
    swipeThreshold?: number; // minimum distance for swipe (default: 50px)
    longPressDelay?: number; // milliseconds for long press (default: 500ms)
    velocityThreshold?: number; // minimum velocity for swipe (default: 0.3)
}

/**
 * Custom hook for detecting touch gestures on mobile devices
 * @param elementRef - React ref to the element to attach gestures to
 * @param options - Configuration options and callback handlers
 * 
 * @example
 * const cardRef = useRef(null);
 * useTouchGestures(cardRef, {
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   onLongPress: () => console.log('Long press detected'),
 * });
 */
export const useTouchGestures = <T extends HTMLElement>(
    elementRef: RefObject<T>,
    options: TouchGestureOptions
) => {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        onLongPress,
        onTap,
        swipeThreshold = 50,
        longPressDelay = 500,
        velocityThreshold = 0.3,
    } = options;

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };

            // Start long press timer
            if (onLongPress) {
                longPressTimerRef.current = setTimeout(() => {
                    onLongPress();
                    touchStartRef.current = null; // Prevent swipe after long press
                }, longPressDelay);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // Cancel long press if finger moves
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            // Clear long press timer
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const duration = Date.now() - touchStartRef.current.time;
            const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / duration;

            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Check if it's a tap (very small movement)
            if (absDeltaX < 10 && absDeltaY < 10 && duration < 200) {
                if (onTap) {
                    onTap();
                }
                touchStartRef.current = null;
                return;
            }

            // Check if velocity is sufficient
            if (velocity < velocityThreshold) {
                touchStartRef.current = null;
                return;
            }

            // Determine swipe direction based on dominant axis
            if (absDeltaX > absDeltaY) {
                // Horizontal swipe
                if (absDeltaX > swipeThreshold) {
                    if (deltaX > 0 && onSwipeRight) {
                        onSwipeRight();
                    } else if (deltaX < 0 && onSwipeLeft) {
                        onSwipeLeft();
                    }
                }
            } else {
                // Vertical swipe
                if (absDeltaY > swipeThreshold) {
                    if (deltaY > 0 && onSwipeDown) {
                        onSwipeDown();
                    } else if (deltaY < 0 && onSwipeUp) {
                        onSwipeUp();
                    }
                }
            }

            touchStartRef.current = null;
        };

        const handleTouchCancel = () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
            touchStartRef.current = null;
        };

        // Add event listeners
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd);
        element.addEventListener('touchcancel', handleTouchCancel);

        // Cleanup
        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchCancel);
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, [
        elementRef,
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        onLongPress,
        onTap,
        swipeThreshold,
        longPressDelay,
        velocityThreshold,
    ]);
};
