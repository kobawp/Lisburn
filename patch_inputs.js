import fs from 'fs';

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Task Title Input (Goon)
    // currently: className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5]"
    content = content.replace(/className="w-full bg-\[#130F14\] border border-\[#130F14\] rounded-xl px-4 py-2\.5 font-bold text-white placeholder:text-\[#777777\] focus:outline-none focus:border-\[#AB70D5\]"/g, 
    'className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5]"');

    // 2. Notes Textarea (Add a note...)
    // currently: className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] resize-none"
    content = content.replace(/className="w-full bg-\[#130F14\] border border-\[#130F14\] rounded-xl px-4 py-2\.5 font-bold text-white placeholder:text-\[#777777\] focus:outline-none focus:border-\[#AB70D5\] resize-none"/g, 
    'className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-normal text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] resize-none"');

    // Also the previously applied regex might have left "font-bold text-lg text-white" instead of just "font-bold text-white"
    content = content.replace(/className="w-full bg-\[#130F14\] border border-\[#130F14\] rounded-xl px-4 py-2\.5 font-bold text-lg text-white placeholder:text-\[#777777\] focus:outline-none focus:border-\[#AB70D5\]"/g, 
    'className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5]"');

    content = content.replace(/className="w-full bg-\[#130F14\] border border-\[#130F14\] rounded-xl px-4 py-2\.5 font-bold text-lg text-white placeholder:text-\[#777777\] focus:outline-none focus:border-\[#AB70D5\] resize-none"/g, 
    'className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-normal text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] resize-none"');

    fs.writeFileSync(file, content);
}

patch('src/components/AddTaskModal.tsx');
patch('src/components/EditTaskModal.tsx');
console.log('done');
