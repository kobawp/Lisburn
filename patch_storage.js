import fs from 'fs';
let content = fs.readFileSync('src/utils/storage.ts', 'utf8');
content = content.replace("soundEnabled: true", "soundEnabled: true,\n  allowNotifications: true,\n  quietHoursEnabled: false,\n  quietHoursFrom: '22:00',\n  quietHoursTo: '08:00'");
fs.writeFileSync('src/utils/storage.ts', content);
console.log('done');
