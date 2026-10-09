const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const pingRoute = `
  server.get('/api/ping', (req, res) => {
    res.json({ status: 'awake', time: new Date().toISOString() });
  });

  server.post('/api/subscribe'`;

if (!content.includes('/api/ping')) {
  content = content.replace("  server.post('/api/subscribe'", pingRoute);
  fs.writeFileSync('server.ts', content);
  console.log('Added /api/ping route');
} else {
  console.log('Route already exists');
}
