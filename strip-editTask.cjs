const fs = require('fs');
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// 1. Remove states
content = content.replace(/  \/\/ Last Done options\n  const \[doneMode, setDoneMode\] = useState\<'today' \| 'choose' \| 'dont-remember'\>\([\s\S]*?\);\n  const \[customLastCompletedDate, setCustomLastCompletedDate\] = useState\<string\>\([\s\S]*?\);\n\n/, '');

// 2. Remove from useEffect
content = content.replace(/      setCustomLastCompletedDate\([\s\S]*?\);\n      setDoneMode\([\s\S]*?\);\n/, '');

// 3. Clean up handleSubmit
content = content.replace(/    let lastCompletedISO = task\.lastCompletedAt;\n    if \(doneMode === 'today'\) {[\s\S]*?\} if \(doneMode === 'dont-remember'\) \{\n      lastCompletedISO = null;\n    }/, '    let lastCompletedISO = task.lastCompletedAt;');

// 4. Clean up JSX
content = content.replace(/            \{\/\* I last did this \*\/\}[\s\S]*?\{\/\* Remind me every \(Optional\) Section \*\/\}/, '{/* Remind me every (Optional) Section */}');

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
