const fs = require('fs');
let settingsContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
settingsContent = settingsContent.replace(
  "import { requestNotificationPermission, registerServiceWorker, sendWebNotification } from '../utils/notifications';",
  "import { requestNotificationPermission, registerServiceWorker, sendWebNotification, subscribeToWebPush } from '../utils/notifications';"
);
fs.writeFileSync('src/components/SettingsModal.tsx', settingsContent);
