const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

// replace 'signInWithGoogle' import
code = code.replace(/signInWithGoogle,\s*/, '');

// remove handleGoogleSignIn implementation
code = code.replace(/const handleGoogleSignIn = async \(\) => {[\s\S]*?};/, '');

// remove handleGoogleSignIn from exports
code = code.replace(/handleGoogleSignIn,\s*/, '');

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
