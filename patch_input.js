import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const replacement = `      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };`;

content = content.replace(/      \} catch \(err\) \{\s*alert\('Failed to parse JSON file\.'\);\s*\}\s*\};\s*reader.readAsText\(file\);/, replacement + '\n    reader.readAsText(file);');

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('done');
