import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// 1. Remove purple settings logo
content = content.replace(/<div className="p-2 rounded-xl bg-\[#3A1E4D\] text-\[#AB70D5\]">\s*<Settings className="w-5 h-5" \/>\s*<\/div>/, '');

// 2. Make Settings text the same font size and thickness as in times past
content = content.replace(/<h2 className="text-lg font-bold text-\[#2D2A26\] text-zinc-100">Settings<\/h2>/, '<h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Settings</h2>');

// 3. Reset application data button confirm twice and change text
content = content.replace(/<p className="text-\[11px\] text-\[#7A746D\] text-zinc-400">\s*Reset all tasks to sample placeholder data\.\s*<\/p>/, '<p className="text-[11px] text-[#7A746D] text-zinc-400">\n              Reset and delete all current tasks.\n            </p>');

content = content.replace(/onClick=\{\(\) => \{\s*if \(confirm\('Are you sure you want to reset all tasks to sample default data\?'\)\) \{\s*onResetTasks\(\);\s*alert\('Reset to default tasks!'\);\s*\}\s*\}\}/, `onClick={() => {
                if (confirm('Are you sure you want to reset and delete all current tasks?')) {
                  if (confirm('This action cannot be undone. Are you absolutely sure?')) {
                    onResetTasks();
                    alert('All tasks have been deleted.');
                  }
                }
              }}`);

content = content.replace(/<span>Reset to sample data<\/span>/, '<span>Reset and delete all current tasks</span>');

// 4. Remove privacy note
content = content.replace(/\{\/\* Privacy Note \*\/\}\s*<div className="p-3 bg-\[#3A1E4D\] border border-\[#AB70D5\]\/30 rounded-2xl flex items-center gap-2 text-\[#AB70D5\]">\s*<ShieldCheck className="w-4 h-4 text-\[#AB70D5\] shrink-0" \/>\s*<span>All task data is stored securely and privately in your browser's local storage\.<\/span>\s*<\/div>/, '');

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('done');
