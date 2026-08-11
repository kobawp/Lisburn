import fs from 'fs';

function patchTypes() {
    let content = fs.readFileSync('src/types.ts', 'utf8');
    content = content.replace(/  theme: 'light' \| 'dark' \| 'system';\n/g, '');
    fs.writeFileSync('src/types.ts', content);
}

function patchApp() {
    let content = fs.readFileSync('src/App.tsx', 'utf8');
    
    // Remove the useEffect that toggles dark class
    content = content.replace(/  \/\/ Apply Dark Mode class to document element\n  useEffect\(\(\) => \{\n    if \(settings\.theme === 'dark'\) \{\n      document\.documentElement\.classList\.add\('dark'\);\n      document\.body\.classList\.add\('dark'\);\n    \} else \{\n      document\.documentElement\.classList\.remove\('dark'\);\n      document\.body\.classList\.remove\('dark'\);\n    \}\n  \}, \[settings\.theme\]\);\n\n/g, '');
    
    // Hardcode document add class dark at the top of App, or just in index.html
    // To be safe let's add it in index.html
    fs.writeFileSync('src/App.tsx', content);
}

function patchHtml() {
    let content = fs.readFileSync('index.html', 'utf8');
    content = content.replace(/<html lang="en">/, '<html lang="en" class="dark">');
    fs.writeFileSync('index.html', content);
}

patchTypes();
patchApp();
patchHtml();
console.log('done');
