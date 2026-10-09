export const isSideloadedApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Capacitor iOS default protocol
  if (window.location.protocol === 'capacitor:') return true;
  
  // Capacitor object injected by native layer
  if ((window as any).Capacitor?.isNative) return true;

  // Check if we are running in a standalone iOS webview (not Safari)
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  
  // Note: PWA (Add to Home Screen) is also standalone. 
  // But Capacitor apps often don't have navigator.standalone set to true.
  
  // So we rely on capacitor: or window.Capacitor.
  // If we still can't detect it, we can check for file: protocol
  if (window.location.protocol === 'file:') return true;
  
  return false;
};
