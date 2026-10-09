const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

content = content.replace(
  'className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"',
  'className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-base"'
);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
