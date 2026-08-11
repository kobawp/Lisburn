const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');

    const toReplace = `      const multiplier =
        reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : reminderUnit === 'months'
          ? 720
          : 8760;`;

    const replacement = `      const multiplier =
        reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : 720;`;

    content = content.replace(toReplace, replacement);
    // Also handle AddTaskModal which has `8760; // Year`
    const toReplace2 = `      const multiplier =
        reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : reminderUnit === 'months'
          ? 720
          : 8760; // Year`;

    content = content.replace(toReplace2, replacement);
    
    fs.writeFileSync(file, content);
}

patch('src/components/AddTaskModal.tsx');
patch('src/components/EditTaskModal.tsx');
