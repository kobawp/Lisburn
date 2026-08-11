import fs from 'fs';

function replaceEmojiSection(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Add import
    if (!content.includes("import { EmojiSelector }")) {
        content = content.replace("import { POPULAR_EMOJIS } from './TaskIcon';", "import { POPULAR_EMOJIS } from './TaskIcon';\nimport { EmojiSelector } from './EmojiSelector';");
    }

    // Identify the block to replace
    // It starts with {/* Emoji Selector */}
    // It ends before {/* I last did this */}
    
    const startIndex = content.indexOf('{/* Emoji Selector */}');
    const endIndex = content.indexOf('{/* I last did this */}');
    
    if (startIndex !== -1 && endIndex !== -1) {
        const replacement = `<EmojiSelector emoji={emoji} setEmoji={setEmoji} />\n\n            `;
        content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    }
    
    fs.writeFileSync(file, content);
}

replaceEmojiSection('src/components/AddTaskModal.tsx');
replaceEmojiSection('src/components/EditTaskModal.tsx');
console.log('done');
