import { AppSettings } from '../types';
import { getEffectiveTimeZone } from './timezone';

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

  const effectiveTz = getEffectiveTimeZone(settings.timeZone);
  const now = new Date();
  
  // Extract hours and minutes in user's active timezone
  let currentHours = now.getHours();
  let currentMins = now.getMinutes();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hPart = parts.find(p => p.type === 'hour')?.value;
    const mPart = parts.find(p => p.type === 'minute')?.value;
    if (hPart !== undefined) currentHours = parseInt(hPart, 10);
    if (mPart !== undefined) currentMins = parseInt(mPart, 10);
  } catch {
    // Fallback to local
  }

  const currentMinutes = currentHours * 60 + currentMins;

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

import { getAuth } from 'firebase/auth';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToWebPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // @ts-ignore
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('Missing VITE_VAPID_PUBLIC_KEY');
        return;
      }
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Send subscription to server
    const auth = getAuth();
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ subscription })
      });
      console.log('Successfully subscribed to web push');
    }
  } catch (err) {
    console.error('Failed to subscribe to web push:', err);
  }
}
