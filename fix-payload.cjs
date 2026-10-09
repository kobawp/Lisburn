const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const formatFunc = `
function formatElapsedTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return \`\${years} \${years === 1 ? 'year' : 'years'}\`;
  if (months > 0) return \`\${months} \${months === 1 ? 'month' : 'months'}\`;
  if (days > 0) return \`\${days} \${days === 1 ? 'day' : 'days'}\`;
  return \`\${hours} \${hours === 1 ? 'hour' : 'hours'}\`;
}

async function startServer() {`;

content = content.replace('async function startServer() {', formatFunc);

const oldPayloadBody = 'body: `It is time to complete "${task.title}".`,';
const newPayloadBody = `const timeSinceLastDone = now - lastDoneMs;
                const elapsedStr = formatElapsedTime(timeSinceLastDone);
                const payload = JSON.stringify({
                  title: 'Task Overdue!',
                  body: \`It's been \${elapsedStr} since you last completed "\${task.title}".\`,`;

content = content.replace(`const payload = JSON.stringify({
                  title: 'Task Overdue!',
                  body: \`It is time to complete "\${task.title}".\`,`
, newPayloadBody);

fs.writeFileSync('server.ts', content);
