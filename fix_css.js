import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf8');

const importFont = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');";

content = content.replace(importFont, "");
content = importFont + "\n" + content;
fs.writeFileSync('src/index.css', content);
