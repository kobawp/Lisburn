const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

content = content.replace(
  /className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"/g,
  'className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 text-base"'
);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
