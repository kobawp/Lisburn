import fs from 'fs';
let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
  '            Edit Task',
  '            Edit'
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
