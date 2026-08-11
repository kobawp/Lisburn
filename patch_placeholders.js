import fs from 'fs';

let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// Title placeholder
if (!content.includes('placeholder="Goon"')) {
    content = content.replace(/value={title}\n\s*onChange=\{\(e\) => setTitle\(e.target.value\)\}\n\s*id="edit-task-title-input"/, 'value={title}\n                onChange={(e) => setTitle(e.target.value)}\n                placeholder="Goon"\n                id="edit-task-title-input"');
}

// Textarea placeholder
if (!content.includes('placeholder="Add a note..."')) {
    content = content.replace(/rows={2}\n\s*className="w-full/, 'rows={2}\n                placeholder="Add a note..."\n                className="w-full');
}

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
