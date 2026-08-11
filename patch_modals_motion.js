import fs from 'fs';

const patchModal = (filePath, isFullPage = false) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes("import { motion } from 'motion/react';")) {
    content = content.replace("import React", "import React");
    content = content.replace(/import React(.*?);/, "import React$1;\nimport { motion } from 'motion/react';");
  }

  // Remove if (!isOpen) return null;
  content = content.replace(/  if \(!isOpen[\s\S]*?return null;/, "");

  // Update wrapper
  const animateIn = isFullPage
    ? `initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}`
    : `initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }}`;
  
  if (isFullPage) {
    // For AddTask, EditTask, Settings
    // Replace outer div with motion.div
    content = content.replace(
      /<div className="fixed inset-0 z-50 flex flex-col bg-\[#09050A\] animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto">/,
      `<motion.div \n      ${animateIn}\n      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto">`
    );
    // Replace outer closing div
    content = content.replace(/<\/div>\s*<\/div>\s*\);\s*\};/g, "</motion.div>\n    </div>\n  );\n};"); // this might be risky, better to use lastIndexOf
  } else {
    // For TaskDetail
    // The wrapper has bg-black/75
    // we want to animate the background fade and the inner content scale
    // Actually just fading the outer div and scaling the inner div is best.
    
    // Replace outer div
    content = content.replace(
      /<div className="fixed inset-0 z-50 flex flex-col bg-\[#09050A\] animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto">/,
      `<motion.div \n      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.2, ease: "easeOut" }}\n      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto">`
    );
  }
  
  const lastDiv = content.lastIndexOf('</div>');
  if (lastDiv !== -1) {
    content = content.substring(0, lastDiv) + '</motion.div>' + content.substring(lastDiv + 6);
  }

  fs.writeFileSync(filePath, content);
};

// AddTaskModal
patchModal('src/components/AddTaskModal.tsx', true);
// EditTaskModal
patchModal('src/components/EditTaskModal.tsx', true);
// SettingsModal
let sm = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
if (!sm.includes("import { motion } from 'motion/react';")) {
  sm = sm.replace(/import React(.*?);/, "import React$1;\nimport { motion } from 'motion/react';");
}
sm = sm.replace(/  if \(!isOpen[\s\S]*?return null;/, "");
sm = sm.replace(
    /<div className="fixed inset-0 z-50 flex flex-col bg-\[#09050A\] animate-in slide-in-from-bottom-4 duration-300">/,
    `<motion.div \n      initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}\n      className="fixed inset-0 z-50 flex flex-col bg-[#09050A]">`
);
const smLastDiv = sm.lastIndexOf('</div>');
if (smLastDiv !== -1) {
  sm = sm.substring(0, smLastDiv) + '</motion.div>' + sm.substring(smLastDiv + 6);
}
fs.writeFileSync('src/components/SettingsModal.tsx', sm);

// TaskDetailModal
let td = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');
if (!td.includes("import { motion } from 'motion/react';")) {
  td = td.replace(/import React(.*?);/, "import React$1;\nimport { motion } from 'motion/react';");
}
td = td.replace(/  if \(!isOpen[\s\S]*?return null;/, "");
td = td.replace(
    /<div className="fixed inset-0 z-50 flex flex-col bg-\[#09050A\] animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto">/,
    `<motion.div \n      initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}\n      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto">`
);
const tdLastDiv = td.lastIndexOf('</div>');
if (tdLastDiv !== -1) {
  td = td.substring(0, tdLastDiv) + '</motion.div>' + td.substring(tdLastDiv + 6);
}
fs.writeFileSync('src/components/TaskDetailModal.tsx', td);

console.log('patched modals motion');
