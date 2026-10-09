const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace the import
content = content.replace(
  "import { registerServiceWorker, requestNotificationPermission } from './utils/notifications';",
  "import { registerServiceWorker, requestNotificationPermission, subscribeToWebPush } from './utils/notifications';"
);

// find the useEffect for settings/auth
// I'll just append it to the main `useEffect` that checks settings or Auth, or create a new one.
const newEffect = `
  // Auto-subscribe to Web Push if notifications are allowed and user is signed in
  useEffect(() => {
    if (signedInUser && settings.allowNotifications) {
      subscribeToWebPush();
    }
  }, [signedInUser, settings.allowNotifications]);
`;

content = content.replace("  // Request Notifications on mount if not prompted", newEffect + "\n  // Request Notifications on mount if not prompted");

fs.writeFileSync('src/App.tsx', content);
