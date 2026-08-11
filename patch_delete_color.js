import fs from 'fs';

let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');
content = content.replace(
  'className="text-[14px] font-normal text-rose-500 hover:text-rose-400 transition-colors px-2"',
  'className="text-[14px] font-normal text-[#B91C1C] hover:text-[#9F1818] transition-colors px-2"'
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
