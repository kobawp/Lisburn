const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

// Add import for sync code
code = code.replace(/import \{ Task, AppSettings \} from '\.\.\/types';/, "import { Task, AppSettings } from '../types';\nimport { getStoredSyncCode } from '../utils/syncCode';");

// Use syncCode instead of user.uid for queries and document IDs
code = code.replace(/where\('userId', '==', user\.uid\)/g, "where('syncId', '==', getStoredSyncCode())");

// Replace doc(db, 'settings', user.uid) with doc(db, 'settings', getStoredSyncCode())
code = code.replace(/doc\(db, 'settings', user\.uid\)/g, "doc(db, 'settings', getStoredSyncCode())");

// Replace { ...t, userId: user.uid } with { ...t, syncId: getStoredSyncCode() }
code = code.replace(/\{ \.\.\.t, userId: user\.uid \}/g, "{ ...t, syncId: getStoredSyncCode() }");

// Replace { ...localSettings, userId: user.uid }
code = code.replace(/\{ \.\.\.localSettings, userId: user\.uid \}/g, "{ ...localSettings, syncId: getStoredSyncCode() }");

// Replace { ...task, userId: user.uid }
code = code.replace(/\{ \.\.\.task, userId: user\.uid \}/g, "{ ...task, syncId: getStoredSyncCode() }");

// Replace { ...newSettings, userId: user.uid }
code = code.replace(/\{ \.\.\.newSettings, userId: user\.uid \}/g, "{ ...newSettings, syncId: getStoredSyncCode() }");

// We need to re-trigger useEffect when syncCode changes. Let's expose setSyncCode.
fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
