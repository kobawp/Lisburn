const fs = require('fs');
let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
/    if \(diffMs < 0\) \{[\s\S]*?\} else if \(\!task\.reminderIntervalHours\)/,
`    if (diffMs < 0) {
      if (diffDays > 0) {
        nextDueRelative = diffDays === 1 ? '1 day overdue' : \`\${diffDays} days overdue\`;
      } else if (diffHours > 0) {
        nextDueRelative = diffHours === 1 ? '1 hour overdue' : \`\${diffHours} hours overdue\`;
      } else {
        nextDueRelative = 'due now';
      }
    } else {
      if (diffDays > 0) {
        nextDueRelative = diffDays === 1 ? 'in 1 day' : \`in \${diffDays} days\`;
      } else if (diffHours > 0) {
        nextDueRelative = diffHours === 1 ? 'in 1 hour' : \`in \${diffHours} hours\`;
      } else {
        nextDueRelative = '< 1 hour';
      }
    }
  } else if (!task.reminderIntervalHours)`
);
fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
