import { useEffect, useRef } from 'react';

interface UseOverscrollBounceOptions {
  maxPull?: number;
}

export function useOverscrollBounce<T extends HTMLElement = HTMLDivElement>({
  maxPull = 120,
}: UseOverscrollBounceOptions = {}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Enforce vertical touch pan only to eliminate horizontal swiping/overscroll
    el.style.touchAction = 'pan-y';

    let startY = 0;
    let startX = 0;
    let mode: 'top' | 'bottom' | null = null;
    let isDragging = false;

    const getScrollInfo = () => {
      const style = window.getComputedStyle(el);
      const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';

      if (isScrollable) {
        return {
          scrollTop: el.scrollTop,
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
        };
      }

      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const clientHeight = window.innerHeight;
      const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, el.scrollHeight);

      return { scrollTop, clientHeight, scrollHeight };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      mode = null;
      isDragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.defaultPrevented || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY;
      const deltaX = currentX - startX;

      // Ignore if movement is primarily horizontal when drag has not started
      if (!isDragging && Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }

      const { scrollTop, clientHeight, scrollHeight } = getScrollInfo();

      const isAtTop = scrollTop <= 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1;

      if (!isDragging) {
        if (isAtTop && deltaY > 1) {
          isDragging = true;
          mode = 'top';
        } else if (isAtBottom && deltaY < -1) {
          isDragging = true;
          mode = 'bottom';
        }
      }

      if (isDragging && mode) {
        if (e.cancelable) {
          e.preventDefault();
        }

        let pull = deltaY;
        if (mode === 'top') {
          if (pull < 0) {
            isDragging = false;
            mode = null;
            el.style.transform = 'translateY(0px)';
            return;
          }
        } else if (mode === 'bottom') {
          if (pull > 0) {
            isDragging = false;
            mode = null;
            el.style.transform = 'translateY(0px)';
            return;
          }
        }

        const absPull = Math.abs(pull);
        // iOS rubberband logarithmic damping formula
        const damped = (absPull * 0.52) / (1 + absPull * 0.0035);
        const clampedDamped = Math.min(damped, maxPull);
        const finalY = mode === 'top' ? clampedDamped : -clampedDamped;

        el.style.transition = 'none';
        el.style.transform = `translateY(${finalY}px)`;
      }
    };

    const onTouchEnd = () => {
      if (isDragging || (el.style.transform && el.style.transform !== 'translateY(0px)' && el.style.transform !== 'none')) {
        isDragging = false;
        mode = null;

        el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)';
        el.style.transform = 'translateY(0px)';

        setTimeout(() => {
          if (el) {
            el.style.transition = '';
            el.style.transform = '';
          }
        }, 400);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
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

