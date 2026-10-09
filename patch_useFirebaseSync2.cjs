const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

code = code.replace(
  /setTasks\(\[\]\); \/\/ clear local to force pull/g,
  `setTasks([]); // clear local to force pull\n      localStorage.removeItem('days_since_tracker_tasks_v1');`
);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
