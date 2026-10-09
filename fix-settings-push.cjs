const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

content = content.replace(
  "import { registerServiceWorker, requestNotificationPermission, sendWebNotification } from '../utils/notifications';",
  "import { registerServiceWorker, requestNotificationPermission, sendWebNotification, subscribeToWebPush } from '../utils/notifications';"
);

content = content.replace(
  "if (permission === 'granted') {",
  "if (permission === 'granted') {\n                        await subscribeToWebPush();"
);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
