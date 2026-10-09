import fs from 'fs';
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');
content = content.replace("import { POPULAR_EMOJIS } from './TaskIcon';\n", "");
fs.writeFileSync('src/components/EditTaskModal.tsx', content);
