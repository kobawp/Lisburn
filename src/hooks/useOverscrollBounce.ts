import { useEffect, useRef } from 'react';

interface UseOverscrollBounceOptions {
  maxPull?: number;
}

export function useOverscrollBounce<T extends HTMLElement = HTMLDivElement>({
  maxPull = 80,
}: UseOverscrollBounceOptions = {}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY: number | null = null;
    let startX: number | null = null;
    let currentMode: 'top' | 'bottom' | null = null;
    let isPulling = false;

    const getScrollInfo = () => {
      const style = window.getComputedStyle(el);
      const isScrollContainer = style.overflowY === 'auto' || style.overflowY === 'scroll';

      if (isScrollContainer) {
        return {
          scrollTop: el.scrollTop,
          scrollHeight: Math.max(el.scrollHeight, el.clientHeight),
          clientHeight: el.clientHeight,
        };
      }

      // Page / Window level scrolling
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, el.scrollHeight);
      const clientHeight = window.innerHeight;

      return { scrollTop, scrollHeight, clientHeight };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      currentMode = null;
      isPulling = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null || startX === null) return;

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const diffY = touchY - startY;
      const diffX = touchX - startX;

      // Ignore if movement is primarily horizontal
      if (!isPulling && Math.abs(diffX) > Math.abs(diffY)) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = getScrollInfo();

      const isAtTop = scrollTop <= 1;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 2;

      if (!isPulling) {
        if (isAtTop && diffY > 2) {
          currentMode = 'top';
          startY = touchY;
          isPulling = true;
        } else if (isAtBottom && diffY < -2) {
          currentMode = 'bottom';
          startY = touchY;
          isPulling = true;
        }
      }

      if (isPulling && currentMode) {
        const deltaY = touchY - startY;

        if (currentMode === 'top') {
          if (deltaY > 0) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            const damped = Math.min(Math.pow(deltaY, 0.72) * 1.15, maxPull);
            el.style.transform = `translateY(${damped}px)`;
            el.style.transition = 'none';
          } else {
            isPulling = false;
            currentMode = null;
            el.style.transform = 'translateY(0px)';
          }
        } else if (currentMode === 'bottom') {
          if (deltaY < 0) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            const damped = -1 * Math.min(Math.pow(Math.abs(deltaY), 0.72) * 1.15, maxPull);
            el.style.transform = `translateY(${damped}px)`;
            el.style.transition = 'none';
          } else {
            isPulling = false;
            currentMode = null;
            el.style.transform = 'translateY(0px)';
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      startY = null;
      startX = null;

      if (isPulling) {
        isPulling = false;
        currentMode = null;

        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();

        el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)';
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
  };
}
