import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace import
content = content.replace("import { Reorder } from 'motion/react';", "import { Reorder, AnimatePresence } from 'motion/react';");

// update modals in App.tsx
const modalsRegex = /\{\/\* Modals \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\);\s*\}\s*$/;
const newModals = `{/* Modals */}
      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal
            isOpen={isAddTaskOpen}
            onClose={() => setIsAddTaskOpen(false)}
            onSave={handleAddTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!detailTask && (
          <TaskDetailModal
            task={detailTask}
            isOpen={!!detailTask}
            onClose={() => setDetailTask(null)}
            onEdit={(t) => setEditingTask(t)}
            onDelete={handleDeleteTask}
            onAddHistoryEntry={handleAddHistoryEntry}
            onDeleteHistoryEntry={handleDeleteHistoryEntry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!editingTask && (
          <EditTaskModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSaveEditTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
            tasks={tasks}
            onResetTasks={handleResetTasks}
            onImportTasks={handleImportTasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
}`;

content = content.replace(/\{\/\* Modals \*\/\}[\s\S]*?<\/div>\s*\);\s*\}\s*$/, newModals);

fs.writeFileSync('src/App.tsx', content);
console.log('patched app animate');
