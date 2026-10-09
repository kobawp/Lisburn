const fs = require('fs');
let content = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

content = content.replace(
  'className="w-full bg-[#130F14] border border-[#261C29] rounded-lg px-3 py-2 text-white text-[14px] focus:outline-none focus:border-[#d7ae4c]"',
  'className="w-full bg-[#130F14] border border-[#261C29] rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-[#d7ae4c]"'
);

content = content.replace(
  'className="w-full bg-[#130F14] border border-[#261C29] rounded-lg px-3 py-2 text-white text-[14px] focus:outline-none focus:border-[#d7ae4c] resize-none"',
  'className="w-full bg-[#130F14] border border-[#261C29] rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-[#d7ae4c] resize-none"'
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', content);
