import fs from 'fs';
let content = fs.readFileSync('src/components/TaskCompactRow.tsx', 'utf8');

// fix spacing
content = content.replace(
  'className="py-3 flex items-center justify-between gap-3 transition-transform active:scale-95 cursor-pointer group"',
  'className="py-1.5 flex items-center justify-between gap-3 transition-transform active:scale-95 cursor-pointer group"'
);

// fix notes cut off
content = content.replace(
  '<p className="text-sm font-light text-[#777777] truncate mt-1 leading-none">',
  '<p className="text-sm font-light text-[#777777] truncate mt-1 leading-tight">'
);

fs.writeFileSync('src/components/TaskCompactRow.tsx', content);
console.log('patched compact row');
