import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Reorder.Group[\s\S]*?<\/Reorder.Group>/;
const replacement = `<Reorder.Group 
            axis="y" 
            values={filteredTasks} 
            onReorder={handleReorder}
            className="flex flex-col"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <Reorder.Item 
                  key={task.id} 
                  value={task}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <TaskCompactRow
                    task={task}
                    onClickTask={(t) => setDetailTask(t)}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
