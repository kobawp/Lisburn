import fs from 'fs';

const fix = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("      </motion.div>\n    </motion.div>", "      </div>\n    </motion.div>");
  fs.writeFileSync(file, content);
}

fix('src/components/AddTaskModal.tsx');
fix('src/components/EditTaskModal.tsx');
fix('src/components/SettingsModal.tsx');
fix('src/components/TaskDetailModal.tsx');
