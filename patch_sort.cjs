const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

code = code.replace(/cloudTasks\.sort\(\(a, b\) => \(a\.order \?\? 0\) - \(b\.order \?\? 0\)\);/, 
`cloudTasks.sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });`);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
