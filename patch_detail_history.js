import fs from 'fs';

let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
  '<History className="w-4 h-4 text-[#AB70D5]" />',
  '<History className="w-4 h-4 text-white" />'
);

content = content.replace(
  'Completion log history ({task.history.length})',
  'Log History ({task.history.length})'
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
console.log('done task detail patch');
