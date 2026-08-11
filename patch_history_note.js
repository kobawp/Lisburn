import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "note: note || 'Historical log entry'",
  "note: note || ''"
);
fs.writeFileSync('src/App.tsx', content);
console.log('done patching history note in App.tsx');
