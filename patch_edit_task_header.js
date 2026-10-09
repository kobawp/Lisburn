import fs from 'fs';

let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// Ensure Check and X are imported
if (!content.includes('import { Check')) {
    content = content.replace("import { X", "import { Check, X");
}

const headerRegex = /          \{\/\* Header with Cancel on Top Left and Save on Top Right \*\/\}[\s\S]*?<\/h2>/;

const newHeader = `          {/* Header */}
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

// Wait, the EditTaskModal has Save button at the bottom maybe?
// Let's check what's inside the header in EditTaskModal.
