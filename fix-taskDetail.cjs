const fs = require('fs');
let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
  /const diffDays = Math\.floor\(Math\.abs\(diffMs\) \/ \(1000 \* 60 \* 60 \* 24\)\);[\s\S]*?\} else \{[\s\S]*?\}/,
  `const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    
    if (diffMs < 0) {
      if (diffDays > 0) {
        nextDueRelative = diffDays === 1 ? '1 day overdue' : \`\${diffDays} days overdue\`;
      } else {
        nextDueRelative = diffHours === 1 ? '1 hour overdue' : \`\${diffHours} hours overdue\`;
      }
    } else {
      if (diffDays > 0) {
        nextDueRelative = diffDays === 1 ? 'in 1 day' : \`in \${diffDays} days\`;
      } else {
        nextDueRelative = diffHours === 1 ? 'in 1 hour' : \`in \${diffHours} hours\`;
      }
    }`
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
