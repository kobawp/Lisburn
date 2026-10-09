import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId
});
const auth = getAuth(app);
signInAnonymously(auth).then(user => {
  console.log("SUCCESS:", user.user.uid);
  process.exit(0);
}).catch(err => {
  console.log("ERROR:", err.code);
  process.exit(1);
});
