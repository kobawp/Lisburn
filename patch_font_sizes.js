import fs from 'fs';

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Date
appContent = appContent.replace(
  '<p className="text-[#777777] font-light text-[14px] mt-0.5">',
  '<p className="text-[#777777] font-light text-[12px] mt-0.5">'
);

// Tasks Header
appContent = appContent.replace(
  '<h2 className="text-[14px] font-light text-[#777777]">',
  '<h2 className="text-[12px] font-light text-[#777777]">'
);

fs.writeFileSync('src/App.tsx', appContent);

// TaskCompactRow.tsx
let rowContent = fs.readFileSync('src/components/TaskCompactRow.tsx', 'utf8');

// Notes
rowContent = rowContent.replace(
  '<p className="text-sm font-light text-[#777777] truncate mt-1 leading-tight">',
  '<p className="text-[12px] font-light text-[#777777] truncate mt-1 leading-tight">'
);

// since
rowContent = rowContent.replace(
  '<span className="text-sm font-light text-[#777777] leading-none mt-1">',
  '<span className="text-[12px] font-light text-[#777777] leading-none mt-1">'
);

fs.writeFileSync('src/components/TaskCompactRow.tsx', rowContent);

console.log('patched font sizes');
