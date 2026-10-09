import fs from 'fs';

let content = fs.readFileSync('src/components/EmojiSelector.tsx', 'utf8');
content = content.replace(/const onMouseDown = \(e\) =>/g, "const onMouseDown = (e: React.MouseEvent) =>");
content = content.replace(/const onMouseMove = \(e\) =>/g, "const onMouseMove = (e: React.MouseEvent) =>");

fs.writeFileSync('src/components/EmojiSelector.tsx', content);
