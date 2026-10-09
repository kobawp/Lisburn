const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // In EditTaskModal.tsx, fix the years parsing
    content = content.replace(
        /if \(hrs % 8760 === 0\) \{\s+setReminderUnit\('years'\);\s+setReminderAfter\(hrs \/ 8760\);\s+\} else /,
        ''
    );
    
    // Also remove the type error 'years'
    content = content.replace(/\| 'years'/g, '');

    fs.writeFileSync(file, content);
}

patch('src/components/EditTaskModal.tsx');
