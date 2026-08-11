import fs from 'fs';

const patchGap = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<div className="flex items-center gap-2">',
    '<div className="flex items-center gap-1">'
  );
  fs.writeFileSync(file, content);
}

patchGap('src/components/AddTaskModal.tsx');
patchGap('src/components/EditTaskModal.tsx');
console.log('patched gaps');
