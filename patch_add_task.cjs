const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/history: taskData\.lastCompletedAt \? \[([\s\S]*?)\] : \[\]/, "history: taskData.lastCompletedAt ? [$1] : [],\n      order: tasks.length");

fs.writeFileSync('src/App.tsx', code);
