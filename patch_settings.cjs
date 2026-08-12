const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

if (!code.includes('import { generateSyncCode } from')) {
    code = code.replace(/import \{ isSideloadedApp \} from '\.\.\/utils\/env';/, "import { isSideloadedApp } from '../utils/env';\nimport { generateSyncCode } from '../utils/syncCode';");
}

fs.writeFileSync('src/components/SettingsModal.tsx', code);
