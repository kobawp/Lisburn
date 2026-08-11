import React, { useRef, useCallback } from 'react';

interface UseOverscrollBounceOptions {
  maxPull?: number;
}

export function useOverscrollBounce<T extends HTMLElement = HTMLDivElement>({
  maxPull = 100,
}: UseOverscrollBounceOptions = {}) {
  const containerRef = useRef<T | null>(null);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;

    if (el.scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
    } else {
      startYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const el = containerRef.current;
      if (!el || startYRef.current === null) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Only pull down when scrolled at the very top
      if (diff > 0 && el.scrollTop <= 1) {
        // Elastic rubber-band resistance
        const damped = Math.min(Math.pow(diff, 0.75) * 1.5, maxPull);
        isPullingRef.current = true;

        el.style.transform = `translateY(${damped}px)`;
        el.style.transition = 'none';

        if (diff > 5 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        if (isPullingRef.current) {
          el.style.transform = 'translateY(0px)';
          el.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
          isPullingRef.current = false;
        }
      }
    },
    [maxPull]
  );

  const handleTouchEnd = useCallback(() => {
    const el = containerRef.current;
    if (!el || startYRef.current === null) return;

    startYRef.current = null;

    if (isPullingRef.current) {
      // Elastic snap-back bounce
      el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25)';
      el.style.transform = 'translateY(0px)';

      setTimeout(() => {
        if (el) {
          el.style.transform = '';
          el.style.transition = '';
        }
      }, 400);
    }

    isPullingRef.current = false;
  }, []);

  return {
    containerRef,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}
