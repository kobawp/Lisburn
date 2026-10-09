import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// Replace Done Button block with empty string
content = content.replace(/      \{\/\* Done Button[\s\S]*?<\/div>/, '');

// Import Check from lucide-react if not already
if (!content.includes('import { Check }')) {
    content = content.replace("import { AppSettings, Task } from '../types';", "import { Check } from 'lucide-react';\nimport { AppSettings, Task } from '../types';");
}

// Replace Settings Header
content = content.replace(
  '<h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white mb-2">Settings</h2>',
  `<div className="flex items-center justify-between mb-2">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none">
              <Check className="w-8 h-8 stroke-[3]" />
            </button>
          </div>`
);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('done settings patch');
