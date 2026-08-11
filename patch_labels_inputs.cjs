const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove icons
    content = content.replace(/<Smile className="[^"]*" \/> /g, '');
    content = content.replace(/<Calendar className="[^"]*" \/>\n\s*/g, '');
    content = content.replace(/<Bell className="[^"]*" \/>\n\s*/g, '');

    // 2. Update labels font
    content = content.replace(/text-xs font-bold text-\[#4A443F\] dark:text-zinc-300/g, 'text-[#777777] font-light text-[14px]');

    // 3. Update inputs font and color
    content = content.replace(/text-sm text-\[#2D2A26\] dark:text-zinc-100 placeholder-\[#9A948D\] dark:placeholder-zinc-500/g, 'font-bold text-lg text-[#2D2A26] dark:text-white placeholder:text-[#777777] dark:placeholder:text-[#777777]');
    content = content.replace(/text-sm text-\[#2D2A26\] dark:text-zinc-100 placeholder-\[#9A948D\]/g, 'font-bold text-lg text-[#2D2A26] dark:text-white placeholder:text-[#777777] dark:placeholder:text-[#777777]');

    fs.writeFileSync(file, content);
}

patch('src/components/AddTaskModal.tsx');
patch('src/components/EditTaskModal.tsx');
