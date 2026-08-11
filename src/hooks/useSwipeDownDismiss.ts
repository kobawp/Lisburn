import React, { useRef, useCallback } from 'react';

interface UseSwipeDownDismissOptions {
  onClose: () => void;
  threshold?: number;
}

export function useSwipeDownDismiss<T extends HTMLElement = HTMLDivElement>({
  onClose,
  threshold = 90,
}: UseSwipeDownDismissOptions) {
  const containerRef = useRef<T | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentDiffRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;

    // Only initiate swipe-down dismiss if container is at top
    if (el.scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      currentDiffRef.current = 0;
      isPullingRef.current = false;
    } else {
      startYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || startYRef.current === null) return;

    // Ignore if touch target is inside a scrollable child element (nested scroll container)
    let target = e.target as HTMLElement | null;
    while (target && target !== el) {
      const style = window.getComputedStyle(target);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        if (target.scrollHeight > target.clientHeight) {
          return;
        }
      }
      target = target.parentElement;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Only drag downwards if scroll position is at the very top
    if (diff > 0 && el.scrollTop <= 1) {
      // Elastic damping
      const dampedDiff = Math.pow(diff, 0.85);
      currentDiffRef.current = dampedDiff;
      isPullingRef.current = true;

      // Hardware accelerated GPU translation without React state re-renders
      el.style.transform = `translateY(${dampedDiff}px)`;
      el.style.transition = 'none';

      // Prevent native scroll interference while dragging modal down
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    } else {
      currentDiffRef.current = 0;
      if (isPullingRef.current) {
        el.style.transform = '';
        isPullingRef.current = false;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const el = containerRef.current;
    if (!el || startYRef.current === null) return;

    const diff = currentDiffRef.current;
    startYRef.current = null;

    if (diff >= threshold) {
      // Animate off-screen smoothly then trigger onClose
      el.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
      el.style.transform = 'translateY(100vh)';
      setTimeout(() => {
        onClose();
        if (el) {
          el.style.transform = '';
          el.style.transition = '';
        }
      }, 180);
    } else if (isPullingRef.current) {
      // Bounce back smoothly
      el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
      el.style.transform = 'translateY(0px)';
      setTimeout(() => {
        if (el) {
          el.style.transform = '';
          el.style.transition = '';
        }
      }, 250);
    }

    isPullingRef.current = false;
    currentDiffRef.current = 0;
  }, [onClose, threshold]);

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
