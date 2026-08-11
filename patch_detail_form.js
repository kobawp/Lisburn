import fs from 'fs';
let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
  '<form onSubmit={handleMarkDone} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">',
  '<motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} onSubmit={handleMarkDone} className="flex flex-col gap-3">'
);

content = content.replace(
  '            </form>',
  '            </motion.form>'
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
