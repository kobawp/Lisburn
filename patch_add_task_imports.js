import fs from 'fs';

let content = fs.readFileSync('src/components/AddTaskModal.tsx', 'utf8');

content = content.replace(
  "import { Calendar, Bell, Smile, Plus, Minus } from 'lucide-react';",
  "import { Calendar, Bell, Smile, Plus, Minus, Check, X } from 'lucide-react';"
);

fs.writeFileSync('src/components/AddTaskModal.tsx', content);
console.log('done add task imports');
