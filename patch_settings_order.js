import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const resetSectionMatch = content.match(/          \{\/\* Danger Zone - Reset Data \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\{\/\* Done Button)/);
if (resetSectionMatch) {
    const resetSection = resetSectionMatch[0];
    
    // Remove it from the end
    content = content.replace(resetSection, '');
    
    // Add subtitle to reset section
    const updatedResetSection = resetSection
      .replace(/          \{\/\* Danger Zone - Reset Data \*\/\}\s*<div className="pt-8">/, 
               '          {/* Reset */}\n          <div>\n            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Reset</h3>')
      .replace(/<div className="bg-\[#130F14\] rounded-\[24px\] overflow-hidden">/, '<div className="bg-[#130F14] rounded-[24px] overflow-hidden">');
      
    // Insert it before About section
    content = content.replace(/          \{\/\* About \*\/\}/, updatedResetSection + '\n\n          {/* About */}');
    
    fs.writeFileSync('src/components/SettingsModal.tsx', content);
    console.log('done');
} else {
    console.log('Reset section not found');
}
