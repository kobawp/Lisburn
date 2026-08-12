const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('order?: number')) {
    code = code.replace(/createdAt: string; \/\/ ISO String/, "createdAt: string; // ISO String\n  order?: number;");
    fs.writeFileSync('src/types.ts', code);
}
