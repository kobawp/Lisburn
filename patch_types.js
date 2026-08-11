import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');
if (!content.includes('allowNotifications')) {
    content = content.replace('soundEnabled: boolean;', 'soundEnabled: boolean;\n  allowNotifications: boolean;\n  quietHoursEnabled: boolean;\n  quietHoursFrom: string;\n  quietHoursTo: string;');
}
fs.writeFileSync('src/types.ts', content);
console.log('done');
