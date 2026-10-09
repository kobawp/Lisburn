const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
/  const handleAddHistoryEntry = \([\s\S]*?saveTask\(updatedTask\);\n  \};/,
`  const handleAddHistoryEntry = (taskId: string, isoTimestamp: string, note?: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let finalNote = (note || '').trim();
    if (!finalNote) {
      finalNote = formatDateTimeInZone(isoTimestamp, settings.timeZone);
    }

    const newEntry = {
      id: 'hist-' + Date.now(),
      timestamp: isoTimestamp,
      note: finalNote
    };

    const combined = [newEntry, ...target.history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: combined[0].timestamp,
      history: combined
    };
    saveTask(updatedTask);
  };`
);

content = content.replace(
/  const handleAddTask = \([\s\S]*?saveTask\(newTask\);\n  \};/,
`  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'history'> & { initialReference?: string }) => {
    const nowISO = new Date().toISOString();
    // Separate out initialReference so it doesn't get spread into Task
    const { initialReference, ...baseTaskData } = taskData as any;
    
    let finalNote = (initialReference || '').trim();
    if (baseTaskData.lastCompletedAt && !finalNote) {
      finalNote = formatDateTimeInZone(baseTaskData.lastCompletedAt, settings.timeZone);
    }

    const newTask: Task = {
      ...baseTaskData,
      id: 'task-' + Date.now(),
      createdAt: nowISO,
      history: baseTaskData.lastCompletedAt ? [
        {
          id: 'hist-' + Date.now(),
          timestamp: baseTaskData.lastCompletedAt,
          note: finalNote
        }
      ] : [],
      order: tasks.length
    };
    saveTask(newTask);
  };`
);

fs.writeFileSync('src/App.tsx', content);
