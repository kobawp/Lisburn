const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('formatDateTimeInZone')) {
  content = content.replace(
    "import { TaskCompactRow } from './components/TaskCompactRow';",
    "import { TaskCompactRow } from './components/TaskCompactRow';\nimport { formatDateTimeInZone } from './utils/timezone';"
  );
}

fs.writeFileSync('src/App.tsx', content);
