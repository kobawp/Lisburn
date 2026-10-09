const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

// Remove the `if (!user) return;` check
code = code.replace(/if \(!user\) return;/g, '');

// Change `if (user) {` to just execute the block without checking user
code = code.replace(/if \(user\) \{/g, 'if (true) {');

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
