const fs = require('fs');

let content = fs.readFileSync('src/components/EditTaskModal.tsx', 'utf8');

content = content.replace(
`      if (task.reminderIntervalHours) {
        const hrs = task.reminderIntervalHours;
          setReminderUnit('months');
          setReminderAfter(hrs / 720);
        } if (hrs % 168 === 0) {`,
`      if (task.reminderIntervalHours) {
        const hrs = task.reminderIntervalHours;
        if (hrs % 720 === 0) {
          setReminderUnit('months');
          setReminderAfter(hrs / 720);
        } else if (hrs % 168 === 0) {`
);

fs.writeFileSync('src/components/EditTaskModal.tsx', content);
