const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("    syncStatus,\n    user,", "    syncStatus,");

fs.writeFileSync('src/App.tsx', content);
