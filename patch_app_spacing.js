import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-12"',
  'className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-12 flex flex-col"'
);

// Add margins to children
content = content.replace(
  '<div className="flex flex-col mt-4">',
  '<div className="flex flex-col mt-6">'
);

// Search Bar has mt-6 already:
// <div className="relative mt-6">
// So that's fine.

// Tasks section
content = content.replace(
  '<div className="flex flex-col">',
  '<div className="flex flex-col mt-3">'
);

fs.writeFileSync('src/App.tsx', content);
console.log('patched app spacing');
