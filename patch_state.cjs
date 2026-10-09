const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

code = code.replace(/const \[syncInput, setSyncInput\] = useState\(''\);/, "const [syncInput, setSyncInput] = useState('');\n  const [isCopied, setIsCopied] = useState(false);");

fs.writeFileSync('src/components/SettingsModal.tsx', code);
