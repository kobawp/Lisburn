import { useEffect } from 'react';

export function useiOSKeyboardFix() {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      if (isInput) {
        // Trigger scrollIntoView after keyboard animation starts and completes on iOS
        setTimeout(() => {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 150);

        setTimeout(() => {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 450);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      if (isInput) {
        // Reset scroll position on blur if iOS shifted the body
        setTimeout(() => {
          if (!document.activeElement || document.activeElement.tagName === 'BODY') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    };

    const handleVisualViewportChange = () => {
      if (!window.visualViewport) return;
      
      const vv = window.visualViewport;
      document.documentElement.style.setProperty('--vv-height', `${vv.height}px`);
      document.documentElement.style.setProperty('--vv-offset-top', `${vv.offsetTop}px`);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
      handleVisualViewportChange();
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, []);
}
