import { useEffect, useRef } from 'react';

interface UseOverscrollBounceOptions {
  maxPull?: number;
}

export function useOverscrollBounce<T extends HTMLElement = HTMLDivElement>({
  maxPull = 90,
}: UseOverscrollBounceOptions = {}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let anchorY: number | null = null;
    let mode: 'top' | 'bottom' | null = null;
    let isPulling = false;

    const onTouchStart = (e: TouchEvent) => {
      anchorY = e.touches[0].clientY;
      mode = null;
      isPulling = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (anchorY === null) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - anchorY;

      // Determine current scroll position
      const scrollTop = el.scrollTop > 0 ? el.scrollTop : window.scrollY;
      const scrollHeight = Math.max(el.scrollHeight, document.documentElement.scrollHeight);
      const clientHeight = el.clientHeight || window.innerHeight;

      const isAtTop = scrollTop <= 1;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 3;

      if (!isPulling) {
        if (isAtTop && diff > 0) {
          mode = 'top';
          anchorY = currentY;
          isPulling = true;
        } else if (isAtBottom && diff < 0) {
          mode = 'bottom';
          anchorY = currentY;
          isPulling = true;
        }
      }

      if (isPulling && mode) {
        const pullDiff = currentY - anchorY;

        if (mode === 'top') {
          if (pullDiff > 0) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            const damped = Math.min(Math.pow(pullDiff, 0.72) * 1.1, maxPull);
            el.style.transform = `translateY(${damped}px)`;
            el.style.transition = 'none';
          } else {
            isPulling = false;
            mode = null;
            el.style.transform = 'translateY(0px)';
          }
        } else if (mode === 'bottom') {
          if (pullDiff < 0) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            const damped = -1 * Math.min(Math.pow(Math.abs(pullDiff), 0.72) * 1.1, maxPull);
            el.style.transform = `translateY(${damped}px)`;
            el.style.transition = 'none';
          } else {
            isPulling = false;
            mode = null;
            el.style.transform = `translateY(0px)`;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      anchorY = null;

      if (isPulling) {
        isPulling = false;
        mode = null;

        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();

        // Smooth spring snapback
        el.style.transition = 'transform 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
        el.style.transform = 'translateY(0px)';

        setTimeout(() => {
          if (el) {
            el.style.transform = '';
            el.style.transition = '';
          }
        }, 380);
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
  };
}
