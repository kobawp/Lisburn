const fs = require('fs');
console.log(fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8').match(/const reorderTasks = useCallback\([\s\S]*?\},/)[0]);
