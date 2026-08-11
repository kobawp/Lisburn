import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

if (!content.includes('useState')) {
    content = content.replace("import React, { useRef } from 'react';", "import React, { useRef, useState } from 'react';");
}

if (!content.includes('resetState')) {
    content = content.replace("  const fileInputRef = useRef<HTMLInputElement>(null);", "  const fileInputRef = useRef<HTMLInputElement>(null);\n  const [resetState, setResetState] = useState<'idle' | 'confirm1' | 'confirm2' | 'done'>('idle');\n  const [message, setMessage] = useState<string | null>(null);");
}

const replacementImport = `      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          setMessage('Tasks imported successfully!');
        } else {
          setMessage('Invalid backup file format.');
        }
      } catch (err) {
        setMessage('Failed to parse JSON file.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setMessage(null), 3000);
    };`;
content = content.replace(/      try \{\s*const parsed = JSON\.parse\(event\.target\?\.result as string\);\s*if \(Array\.isArray\(parsed\)\) \{\s*onImportTasks\(parsed\);\s*alert\('Tasks imported successfully!'\);\s*\} else \{\s*alert\('Invalid backup file format\.'\);\s*\}\s*\} catch \(err\) \{\s*alert\('Failed to parse JSON file\.'\);\s*\}\s*if \(fileInputRef\.current\) \{\s*fileInputRef\.current\.value = '';\s*\}\s*\};\s*reader.readAsText\(file\);/, replacementImport + '\n    reader.readAsText(file);');

const replacementReset = `          {/* Reset Data */}
          <div className="border-[#130F14] pt-4 space-y-2">
            <label className="block text-xs font-bold text-[#B91C1C] text-rose-400">
              Reset application data
            </label>
            <p className="text-[11px] text-[#7A746D] text-zinc-400">
              Reset and delete all current tasks.
            </p>
            {resetState === 'idle' && (
              <button
                onClick={() => setResetState('confirm1')}
                id="reset-sample-data-btn"
                className="flex items-center gap-2 py-2 px-4 rounded-full bg-[#FEE2E2] bg-rose-950/60 border border-[#FCA5A5] border-rose-900 hover:bg-[#FCA5A5]/30 text-[#B91C1C] text-rose-300 text-xs font-bold transition-colors w-fit"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset and delete all current tasks</span>
              </button>
            )}
            
            {resetState === 'confirm1' && (
              <button
                onClick={() => setResetState('confirm2')}
                className="flex items-center gap-2 py-2 px-4 rounded-full bg-rose-900 border border-rose-700 hover:bg-rose-800 text-rose-100 text-xs font-bold transition-colors w-fit"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Are you sure? Click to confirm</span>
              </button>
            )}

            {resetState === 'confirm2' && (
              <button
                onClick={() => {
                  onResetTasks();
                  setResetState('done');
                  setTimeout(() => setResetState('idle'), 3000);
                }}
                className="flex items-center gap-2 py-2 px-4 rounded-full bg-red-600 border border-red-500 hover:bg-red-700 text-white text-xs font-bold transition-colors animate-pulse w-fit"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cannot be undone! Click again to delete</span>
              </button>
            )}

            {resetState === 'done' && (
              <div className="text-xs text-green-400 font-bold py-2">
                All tasks have been deleted.
              </div>
            )}
          </div>`;
content = content.replace(/          \{\/\* Reset Data \*\/\}\s*<div className="border-\[#130F14\] pt-4 space-y-2">[\s\S]*?<\/button>\s*<\/div>/, replacementReset);

content = content.replace(/          \{\/\* Backup & Restore Data \*\/\}\s*<div className="space-y-3 border-\[#130F14\] pt-4">\s*<label className="block text-xs font-bold text-\[#4A443F\] text-zinc-300">\s*Data backup & restore\s*<\/label>/, `          {/* Backup & Restore Data */}
          <div className="space-y-3 border-[#130F14] pt-4">
            <label className="block text-xs font-bold text-[#4A443F] text-zinc-300">
              Data backup & restore
            </label>
            {message && <div className="text-xs font-bold text-green-400 mb-2">{message}</div>}`);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('done');
