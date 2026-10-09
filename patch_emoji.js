import fs from 'fs';
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

const regex = /\{\/\* Emoji Selection \*\/\}[\s\S]*?\{\/\* I last did this \*\/\}/;

content = content.replace(regex, `<EmojiSelector emoji={emoji} setEmoji={setEmoji} />\n\n            {/* I last did this */}`);

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
console.log('patched emoji selection');
