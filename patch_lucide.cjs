const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

code = code.replace(/import \{ Check, Clock, Cloud, CloudCheck, CloudOff, RefreshCw \} from 'lucide-react';/, "import { Check, Clock, Cloud, CloudCheck, CloudOff, RefreshCw, Key, Copy, Shuffle, ArrowRight } from 'lucide-react';");

fs.writeFileSync('src/components/SettingsModal.tsx', code);
