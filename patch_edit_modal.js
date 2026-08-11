import fs from 'fs';

let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

if (!content.includes('import { Check')) {
    content = content.replace("import { Calendar", "import { Check, X, Calendar");
}

const oldReturnStart = `  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#09050A] border border-[#130F14] rounded-[24px] shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header with Cancel on Top Left and Save on Top Right */}
          <div className="flex items-center justify-between px-6 py-4 border-[#130F14] bg-[#130F14]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#7A746D] text-zinc-400 hover:text-white transition-colors py-1 px-2.5 rounded-full hover:bg-[#1C151E]"
            >
              Cancel
            </button>
            <h2 className="text-base font-bold text-[#2D2A26] text-zinc-100">Edit Task</h2>
            <button
              type="submit"
              className="text-xs font-bold bg-[#AB70D5] hover:bg-[#9759C4] text-white px-4 py-1.5 rounded-full shadow-2xs transition-all active:scale-95"
            >
              Save
            </button>
          </div>`;

const newReturnStart = `  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09050A] animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
      <div 
        className="w-full max-w-5xl mx-auto flex-1 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-16 pb-8 border-[#130F14] bg-transparent">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Edit</h2>
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

content = content.replace(oldReturnStart, newReturnStart);

// Since we replaced `<form onSubmit={handleSubmit}>` with `<form onSubmit={handleSubmit} className="flex-1 flex flex-col">`,
// we also need to change the content wrapper to be `flex-1 overflow-y-auto`.
// Let's check how EditTaskModal Content looks like.
fs.writeFileSync('src/components/EditTaskModal.tsx', content);
console.log('done initial patch');
