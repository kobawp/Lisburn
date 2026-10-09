const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
if (!content.includes('process.env.VAPID_PUBLIC_KEY')) {
  console.log("Missing public key logic");
}
