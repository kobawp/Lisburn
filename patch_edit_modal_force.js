import fs from 'fs';
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// Ensure imports
if (!content.includes('import { Check')) {
    content = content.replace("import { Calendar", "import { Check, X, Calendar");
}

const newReturnStart = `  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09050A] animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
      <div 
        className="w-full max-w-5xl mx-auto flex-1 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-16 pb-8 border-[#130F14] bg-transparent">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Edit Task</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
              >
                <X className="w-8 h-8 stroke-[3]" />
              </button>
              <button
                type="submit"
                id="save-edit-task-btn"
                className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </button>
            </div>
          </div>`;

content = content.replace(/  return \([\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/form>[\s\S]*?\{\/\* Header[\s\S]*?<\/div>\s*<\/div>/, newReturnStart);

content = content.replace(
    /<div className="p-6 space-y-5 max-h-\[80vh\] overflow-y-auto">/,
    '<div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">'
);

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
