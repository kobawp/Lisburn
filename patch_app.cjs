const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/handleSignOut\s*\} = useFirebaseSync/, "handleSignOut,\n    activeSyncCode,\n    updateSyncCode\n  } = useFirebaseSync");

code = code.replace(/syncStatus=\{syncStatus\}/, "syncStatus={syncStatus}\n        activeSyncCode={activeSyncCode}\n        updateSyncCode={updateSyncCode}");

fs.writeFileSync('src/App.tsx', code);
