const fs = require('fs');

// Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const effectToInsert = `
  // Auto-subscribe to Web Push
  useEffect(() => {
    if (user && settings.allowNotifications) {
      subscribeToWebPush();
    }
  }, [user, settings.allowNotifications]);
`;
if (!appContent.includes('subscribeToWebPush();')) {
  appContent = appContent.replace(
    '  useEffect(() => {\n    registerServiceWorker();',
    effectToInsert + '\n  useEffect(() => {\n    registerServiceWorker();'
  );
  fs.writeFileSync('src/App.tsx', appContent);
  console.log('App.tsx updated');
}

// Fix SettingsModal.tsx
let settingsContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
if (!settingsContent.includes('subscribeToWebPush')) {
  settingsContent = settingsContent.replace(
    "import { requestNotificationPermission, registerServiceWorker, sendWebNotification } from '../utils/notifications';",
    "import { requestNotificationPermission, registerServiceWorker, sendWebNotification, subscribeToWebPush } from '../utils/notifications';"
  );
}
if (!settingsContent.includes('await subscribeToWebPush();')) {
  settingsContent = settingsContent.replace(
    "if (permission === 'granted') {",
    "if (permission === 'granted') {\n                        await subscribeToWebPush();"
  );
  fs.writeFileSync('src/components/SettingsModal.tsx', settingsContent);
  console.log('SettingsModal.tsx updated');
}
