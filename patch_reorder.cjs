const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

// 1. In onSnapshot, parse order field
code = code.replace(/color: data\.color \|\| 'violet'/g, "color: data.color || 'violet',\n            order: data.order ?? 0");

// 2. Sort by order after gathering them in onSnapshot
// Find this block:
/*
        if (cloudTasks.length === 0 && snapshot.empty) {
          const localTasks = loadTasksFromStorage();
*/
code = code.replace(/if \(cloudTasks\.length === 0 && snapshot\.empty\) \{/, "cloudTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));\n        if (cloudTasks.length === 0 && snapshot.empty) {");

// 3. Update reorderTasks to inject the order field
code = code.replace(/const reorderTasks = useCallback\(\s*async \(reorderedTasks: Task\[\]\) => \{([\s\S]*?)const promises = reorderedTasks\.map\(\(t\) =>\s*setDoc\(doc\(db, 'tasks', t\.id\), \{ \.\.\.t, syncId: activeSyncCode \}, \{ merge: true \}\)\s*\);/m, 
`const reorderTasks = useCallback(
    async (reorderedTasks: Task[]) => {
      const ordered = reorderedTasks.map((t, i) => ({ ...t, order: i }));
      setTasks(ordered);
      saveTasksToStorage(ordered);
      if (user) {
        setSyncStatus('syncing');
        try {
          const promises = ordered.map((t) =>
            setDoc(doc(db, 'tasks', t.id), { ...t, syncId: activeSyncCode }, { merge: true })
          );`);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
