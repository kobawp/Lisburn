const fs = require('fs');
let content = fs.readFileSync('src/utils/notifications.ts', 'utf8');

content = content.replace(
  '(import.meta as any).env.VITE_VAPID_PUBLIC_KEY',
  'import.meta.env.VITE_VAPID_PUBLIC_KEY'
);

fs.writeFileSync('src/utils/notifications.ts', content);
