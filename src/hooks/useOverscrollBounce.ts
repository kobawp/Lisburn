import { useEffect, useRef } from 'react';

interface UseOverscrollBounceOptions {
  maxPull?: number;
}

export function useOverscrollBounce<T extends HTMLElement = HTMLDivElement>({
  maxPull = 100,
}: UseOverscrollBounceOptions = {}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY: number | null = null;
    let isPulling = false;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        isPulling = false;
      } else {
        startY = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only handle downward pull when at the very top of scroll
      if (diff > 0 && el.scrollTop <= 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();

        isPulling = true;
        // Dampened rubberband resistance formula
        const damped = Math.min(Math.pow(diff, 0.72) * 1.5, maxPull);

        el.style.transform = `translateY(${damped}px)`;
        el.style.transition = 'none';
      } else if (isPulling) {
        el.style.transform = 'translateY(0px)';
        el.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        isPulling = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startY === null) return;
      startY = null;

      if (isPulling) {
        isPulling = false;
        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();

        // Elastic spring snap-back animation
        el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25)';
        el.style.transform = 'translateY(0px)';

        setTimeout(() => {
          if (el) {
            el.style.transform = '';
            el.style.transition = '';
          }
        }, 400);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [maxPull]);

  return {
    containerRef,
    touchHandlers: {},
  };
}
