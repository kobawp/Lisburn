import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/const handleResetTasks = \(\) => \{\s*const defaults = resetTasksToDefault\(\);\s*setTasks\(defaults\);\s*\};/, `const handleResetTasks = () => {
    setTasks([]);
  };`);

fs.writeFileSync('src/App.tsx', content);
console.log('done app');
