const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
/  const handleDeleteHistoryEntry = \([\s\S]*?saveTask\(updatedTask\);\n  \};/,
`  const handleDeleteHistoryEntry = (taskId: string, entryId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updatedHistory = target.history.filter((h) => h.id !== entryId);
    
    // Sort to ensure newest first in case deletion removed the top one
    const sortedHistory = [...updatedHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let newLastCompletedAt = sortedHistory.length > 0 ? sortedHistory[0].timestamp : null;

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: newLastCompletedAt,
      history: sortedHistory
    };
    saveTask(updatedTask);
  };`
);

fs.writeFileSync('src/App.tsx', content);
