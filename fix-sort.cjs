const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (!searchQuery.trim() && newSort === 'custom') {
      reorderTasks(filteredTasks);
    }`;

if (content.includes(target)) {
  content = content.replace(target, '');
  fs.writeFileSync('src/App.tsx', content);
  console.log('Fixed sort issue.');
} else {
  console.log('Target not found.');
}
