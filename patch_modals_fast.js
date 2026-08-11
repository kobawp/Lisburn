import fs from 'fs';

const patchFast = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /initial=\{\{ y: "100%", opacity: 0 \}\} animate=\{\{ y: 0, opacity: 1 \}\} exit=\{\{ y: "100%", opacity: 0 \}\} transition=\{\{ duration: 0.25, ease: \[0.16, 1, 0.3, 1\] \}\}/,
    `initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }}`
  );
  content = content.replace(
    /initial=\{\{ opacity: 0, y: 40 \}\} animate=\{\{ opacity: 1, y: 0 \}\} exit=\{\{ opacity: 0, y: 40 \}\} transition=\{\{ duration: 0.2, ease: "easeOut" \}\}/,
    `initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }}`
  );
  fs.writeFileSync(filePath, content);
};

patchFast('src/components/AddTaskModal.tsx');
patchFast('src/components/EditTaskModal.tsx');
patchFast('src/components/SettingsModal.tsx');
patchFast('src/components/TaskDetailModal.tsx');
console.log('patched fast animations');
