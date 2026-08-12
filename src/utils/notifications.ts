import { AppSettings } from '../types';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export function isQuietHours(settings: AppSettings): boolean {
  if (!settings.quietHoursEnabled || !settings.quietHoursFrom || !settings.quietHoursTo) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [fromH, fromM] = settings.quietHoursFrom.split(':').map(Number);
  const [toH, toM] = settings.quietHoursTo.split(':').map(Number);

  const fromMinutes = (fromH || 0) * 60 + (fromM || 0);
  const toMinutes = (toH || 0) * 60 + (toM || 0);

  if (fromMinutes <= toMinutes) {
    return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
  } else {
    // Overnight (e.g. 22:00 to 08:00)
    return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
  }
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted' ? 'granted' : 'denied';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function sendWebNotification(
  title: string,
  options: NotificationOptions & { settings?: AppSettings }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  if (options.settings && isQuietHours(options.settings)) {
    console.log('Notification suppressed due to Quiet Hours.');
    return;
  }

  const notificationOptions: Record<string, unknown> = {
    body: options.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    ...options,
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as NotificationOptions);
        return;
      }
    } catch (e) {
      console.warn('Could not show notification via Service Worker, falling back:', e);
    }
  }

  // Fallback to standard web Notification
  try {
    new Notification(title, notificationOptions as NotificationOptions);
  } catch (e) {
    console.error('Failed to instantiate Web Notification:', e);
  }
}
