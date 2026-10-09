const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

// Add syncCode state
code = code.replace(/const \[syncStatus, setSyncStatus\] = useState<'synced' \| 'syncing' \| 'error' \| 'offline'>\('synced'\);/, `const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [activeSyncCode, setActiveSyncCode] = useState(() => getStoredSyncCode());`);

// Change the dependency array from [user] to [user, activeSyncCode] for the main useEffect
code = code.replace(/}, \[user\]\);/g, "}, [user, activeSyncCode]);");

// Make getStoredSyncCode() dynamic
code = code.replace(/getStoredSyncCode\(\)/g, "activeSyncCode");
code = code.replace(/useState\(\(\) => activeSyncCode\)/, "useState(() => getStoredSyncCode())"); // fix the first one

// Add updateSyncCode handler
const updateHandler = `
  const updateSyncCode = (newCode: string) => {
    import('../utils/syncCode').then(({ setStoredSyncCode }) => {
      setStoredSyncCode(newCode);
      setActiveSyncCode(newCode.toUpperCase().trim());
      setTasks([]); // clear local to force pull
    });
  };
`;

code = code.replace(/const handleSignOut/, updateHandler + "\n  const handleSignOut");
code = code.replace(/handleSignOut\s*\}/, "handleSignOut,\n    activeSyncCode,\n    updateSyncCode\n  }");

fs.writeFileSync('src/hooks/useFirebaseSync.ts', code);
