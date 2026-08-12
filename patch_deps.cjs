const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

code = code.replace(/\[user\]/g, "[user, activeSyncCode]");

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
