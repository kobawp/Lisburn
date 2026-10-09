const fs = require('fs');
let content = fs.readFileSync('src/components/TaskCompactRow.tsx', 'utf8');

content = content.replace(
  "const hasNoDate = task.lastCompletedAt === null;",
  `const hasNoDate = task.lastCompletedAt === null;
  const isOverdue = !hasNoDate && task.reminderIntervalHours !== null && task.reminderIntervalHours > 0 && (new Date().getTime() - new Date(task.lastCompletedAt).getTime()) > (task.reminderIntervalHours * 60 * 60 * 1000);`
);

content = content.replace(
  /<span className="text-lg font-bold text-white leading-none">\s*\{shortTime\}\s*<\/span>/,
  `<span className={\`text-lg font-bold leading-none \${isOverdue ? 'text-rose-500' : 'text-white'}\`}>
              {shortTime}
            </span>`
);

fs.writeFileSync('src/components/TaskCompactRow.tsx', content);
