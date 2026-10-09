const fs = require('fs');
let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

// 1. Update State Type
content = content.replace(
  "useState<'days' | 'weeks' | 'months'>('weeks');",
  "useState<'hours' | 'days' | 'weeks' | 'months'>('weeks');"
);

// 2. Update Initialization logic
content = content.replace(
  /if \(hrs % 720 === 0\) {[\s\S]*?setReminderAfter\(Math.max\(1, Math.round\(hrs \/ 24\)\)\);\n\s*}/,
  `if (hrs % 720 === 0) {
          setReminderUnit('months');
          setReminderAfter(hrs / 720);
        } else if (hrs % 168 === 0) {
          setReminderUnit('weeks');
          setReminderAfter(hrs / 168);
        } else if (hrs % 24 === 0) {
          setReminderUnit('days');
          setReminderAfter(hrs / 24);
        } else {
          setReminderUnit('hours');
          setReminderAfter(Math.max(1, hrs));
        }`
);

// 3. Update Multiplier Logic
content = content.replace(
  /const multiplier =[\s\S]*?reminderUnit === 'weeks'[\s\S]*?\? 168[\s\S]*?: 720;/,
  `const multiplier =
        reminderUnit === 'hours'
          ? 1
          : reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : 720;`
);

// 4. Update Grid and Options
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

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
