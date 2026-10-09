const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "body: \`It's been \${elapsedStr} since you last completed \\\"\${task.title}\\\".\`",
  "body: \`It's been \${elapsedStr} since you last completed \${task.title}\`"
);

fs.writeFileSync('server.ts', content);
