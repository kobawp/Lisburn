const fs = require('fs');
let content = fs.readFileSync('src/utils/notifications.ts', 'utf8');

content = content.replace(
  'const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;',
  '// @ts-ignore\n      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;'
);

fs.writeFileSync('src/utils/notifications.ts', content);
