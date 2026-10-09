const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newFormatFunc = `function formatElapsedTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return \`\${years} \${years === 1 ? 'year' : 'years'}\`;
  if (months > 0) return \`\${months} \${months === 1 ? 'month' : 'months'}\`;
  if (weeks > 0) return \`\${weeks} \${weeks === 1 ? 'week' : 'weeks'}\`;
  if (days > 0) return \`\${days} \${days === 1 ? 'day' : 'days'}\`;
  return \`\${hours} \${hours === 1 ? 'hour' : 'hours'}\`;
}`;

content = content.replace(/function formatElapsedTime\([\s\S]*?^}/m, newFormatFunc);

content = content.replace(
  "title: 'Very Gentle Reminder',",
  "title: 'Lisburn',"
);

content = content.replace(
  "body: \`It's been \${elapsedStr} since you last completed \\\"\${task.title}\\\".\`",
  "body: \`It's been \${elapsedStr} since you last completed \${task.title}\`"
);

fs.writeFileSync('server.ts', content);
