import fs from 'fs';

let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// Labels
content = content.replace(/text-xs font-bold text-\[#4A443F\] text-zinc-300/g, 'text-[#777777] font-light text-[14px]');

// Icons
content = content.replace(/<Smile className="[^"]*" \/> /g, '');
content = content.replace(/<Calendar className="[^"]*" \/>\n\s*/g, '');
content = content.replace(/<Bell className="[^"]*" \/>\n\s*/g, '');

// Inputs
content = content.replace(/text-sm text-\[#2D2A26\] text-zinc-100/g, 'font-bold text-lg text-white placeholder:text-[#777777]');

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
