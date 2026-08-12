const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/handleGoogleSignIn,\s*/g, "");
code = code.replace(/onGoogleSignIn=\{handleGoogleSignIn\}\s*/g, "");

fs.writeFileSync('src/App.tsx', code);
