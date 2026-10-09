const fs = require('fs');
let content = fs.readFileSync('src/components/AddTaskModal.tsx', 'utf8');

// 1. Update State Type
content = content.replace(
  "useState<'days' | 'weeks' | 'months'>('weeks');",
  "useState<'hours' | 'days' | 'weeks' | 'months'>('weeks');"
);

// 2. Update Multiplier Logic
content = content.replace(
  /const multiplier =[\s\S]*?reminderUnit === 'weeks'[\s\S]*?\? 168[\s\S]*?: 720; \/\/ Year/,
  `const multiplier =
        reminderUnit === 'hours'
          ? 1
          : reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : 720;`
);

// 3. Update Grid and Options
content = content.replace(
  "grid-cols-3 gap-2",
  "grid-cols-4 gap-2"
);

content = content.replace(
  "(['days', 'weeks', 'months'] as const)",
  "(['hours', 'days', 'weeks', 'months'] as const)"
);

content = content.replace(
  "onClick={() => setReminderUnit(unit)}",
  `onClick={() => {
                            setReminderUnit(unit);
                            if (unit === 'hours' && reminderAfter > 23) setReminderAfter(23);
                          }}`
);

content = content.replace(
  "onClick={() => setReminderAfter((prev) => prev + 1)}",
  `onClick={() => setReminderAfter((prev) => (reminderUnit === 'hours' && prev >= 23 ? 23 : prev + 1))}`
);

fs.writeFileSync('src/components/AddTaskModal.tsx', content);
