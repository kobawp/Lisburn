const fs = require('fs');
let code = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

code = code.replace(
  /<input\s*type="text"\s*autoFocus\s*placeholder="Add a note \(optional\)\.\.\."\s*value=\{noteInput\}\s*onChange=\{\(e\) => setNoteInput\(e\.target\.value\)\}\s*className="w-full px-5 py-3\.5 bg-\[#130F14\] rounded-\[24px\] text-white focus:outline-none border border-\[#d7ae4c\]\/30 focus:border-\[#d7ae4c\]"\s*\/>/,
  `<textarea
                autoFocus
                placeholder="Add a note (optional)..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
                className="w-full px-5 py-3.5 bg-[#130F14] rounded-[24px] text-white text-[16px] focus:outline-none border border-[#d7ae4c]/30 focus:border-[#d7ae4c] resize-none"
              />`
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', code);
