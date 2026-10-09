const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
/  const handleEditHistoryEntry = \([\s\S]*?saveTask\(updatedTask\);\n  \};/,
`  const handleEditHistoryEntry = (taskId: string, entryId: string, isoTimestamp: string, note: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let finalNote = note.trim();
    if (!finalNote) {
      finalNote = formatDateTimeInZone(isoTimestamp, settings.timeZone);
    }

    const updatedHistory = target.history.map((h) => 
      h.id === entryId ? { ...h, timestamp: isoTimestamp, note: finalNote } : h
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let newLastCompletedAt = target.lastCompletedAt;
    if (updatedHistory.length > 0) {
      newLastCompletedAt = updatedHistory[0].timestamp;
    } else {
      newLastCompletedAt = null;
    }

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: newLastCompletedAt,
      history: updatedHistory
    };
    saveTask(updatedTask);
  };`
);

fs.writeFileSync('src/App.tsx', content);
