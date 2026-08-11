import fs from 'fs';
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');
content = content.replace(
    /<div className="p-6 space-y-5 max-h-\[80vh\] overflow-y-auto">/,
    '<div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">'
);
fs.writeFileSync('src/components/EditTaskModal.tsx', content);
