import fs from 'fs';

const cleanFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/animate-in slide-in-from-bottom-4 duration-300 /g, "");
  content = content.replace(/animate-in fade-in duration-200 /g, "");
  fs.writeFileSync(file, content);
}

cleanFile('src/components/AddTaskModal.tsx');
cleanFile('src/components/EditTaskModal.tsx');
cleanFile('src/components/SettingsModal.tsx');
cleanFile('src/components/TaskDetailModal.tsx');
console.log('cleaned tailwind animations');
