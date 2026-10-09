const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// Define the blocks by their exact start and end markers
// Each block starts with `          {/* BlockName */}` and ends right before the next `          {/* NextBlockName */}` or `          {/* Footer */}`
const blocks = [
  'Appearance',
  'Time Zone',
  'Notifications',
  'Account & Cloud Sync',
  'Backup and Restore',
  'Reset',
  'About'
];

let parts = content.split(/(\s*\{\/\*\s*(?:Appearance|Time Zone|Notifications|Account & Cloud Sync|Backup and Restore|Reset|About|Footer)\s*\*\/\}\s*)/);

let sections = {};
let currentKey = null;
let newContent = parts[0];

for (let i = 1; i < parts.length; i += 2) {
  const marker = parts[i];
  const body = parts[i+1] || "";
  
  const match = marker.match(/\{\/\*\s*(.*?)\s*\*\/\}/);
  if (match) {
    const key = match[1];
    if (key === 'Footer') {
      sections['Footer'] = marker + body;
    } else {
      sections[key] = marker + body;
    }
  }
}

// target order: Account & Cloud Sync, Notifications, Time Zone, Appearance, Backup and Restore, Reset, About
const targetOrder = [
  'Account & Cloud Sync',
  'Notifications',
  'Time Zone',
  'Appearance',
  'Backup and Restore',
  'Reset',
  'About'
];

for (const key of targetOrder) {
  newContent += sections[key];
}

newContent += sections['Footer'];

fs.writeFileSync('src/components/SettingsModal.tsx', newContent);
console.log("Reordered sections successfully!");
