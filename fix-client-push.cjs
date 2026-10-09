const fs = require('fs');
let content = fs.readFileSync('src/utils/notifications.ts', 'utf8');

// I will just append the subscribeToServer function and modify requestNotificationPermission or registerServiceWorker maybe?
// Let's create a new function `subscribeToWebPush`
content += `\nimport { getAuth } from 'firebase/auth';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
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
          'Authorization': \`Bearer \${idToken}\`
        },
        body: JSON.stringify({ subscription })
      });
      console.log('Successfully subscribed to web push');
    }
  } catch (err) {
    console.error('Failed to subscribe to web push:', err);
  }
}
`;

fs.writeFileSync('src/utils/notifications.ts', content);
