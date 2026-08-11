import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<Reorder.Item key=\{task.id\} value=\{task\}>/,
  `<Reorder.Item \n                key={task.id} \n                value={task}\n                initial={{ opacity: 0, scale: 0.95 }}\n                animate={{ opacity: 1, scale: 1 }}\n                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}\n                transition={{ duration: 0.2, ease: "easeOut" }}\n              >`
);

content = content.replace(
  /<Reorder.Group/,
  `<AnimatePresence mode="popLayout">\n            {filteredTasks.map((task) => (\n              <Reorder.Item \n                key={task.id} \n                value={task}\n                initial={{ opacity: 0, scale: 0.95 }}\n                animate={{ opacity: 1, scale: 1 }}\n                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}\n                transition={{ duration: 0.2, ease: "easeOut" }}\n              >\n                <TaskCompactRow\n                  task={task}\n                  onClickTask={(t) => setDetailTask(t)}\n                />\n              </Reorder.Item>\n            ))}\n          </AnimatePresence>\n          {/* Original Reorder.Group replaced, but we want to KEEP Reorder.Group */}`
);
