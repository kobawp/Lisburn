const fs = require('fs');
const content = `import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import webpush from 'web-push';
import cron from 'node-cron';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs2 from 'fs';

dotenv.config();

const firebaseConfig = JSON.parse(fs2.readFileSync('firebase-applet-config.json', 'utf8'));

const config = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const app = initializeApp(config);
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Configure Web Push
webpush.setVapidDetails(
  'mailto:monsterboyy20000@gmail.com', // user email from context
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

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

async function startServer() {
  const server = express();
  const PORT = 3000;

  server.use(express.json());

  // Background Cron Job - Check every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running background cron job to check overdue tasks...');
    try {
      const q = query(collection(db, 'tasks'), where('reminderIntervalHours', '>', 0));
      const tasksSnapshot = await getDocs(q);
      
      const now = Date.now();
      
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        if (!task.lastCompletedAt || !task.userId) continue;

        const lastDoneMs = new Date(task.lastCompletedAt).getTime();
        const intervalMs = task.reminderIntervalHours * 60 * 60 * 1000;
        const nextDueMs = lastDoneMs + intervalMs;

        if (now > nextDueMs) {
          const lastNotified = task.lastNotifiedAt ? new Date(task.lastNotifiedAt).getTime() : 0;
          const timeSinceNotification = now - lastNotified;

          if (timeSinceNotification > 12 * 60 * 60 * 1000) {
            const settingsDocRef = doc(db, 'settings', task.userId);
            const settingsDoc = await getDoc(settingsDocRef);
            const settings = settingsDoc.exists() ? settingsDoc.data() : null;
            
            if (settings && settings.allowNotifications === false) {
              continue;
            }

            const subsQ = query(collection(db, 'pushSubscriptions'), where('userId', '==', task.userId));
            const subsSnapshot = await getDocs(subsQ);
            
            let sent = false;
            for (const subDoc of subsSnapshot.docs) {
              const { subscription } = subDoc.data();
              try {
                const timeSinceLastDone = now - lastDoneMs;
                const elapsedStr = formatElapsedTime(timeSinceLastDone);
                const payload = JSON.stringify({
                  title: 'Very Gentle Reminder',
                  body: \`It's been \${elapsedStr} since you last completed "\${task.title}".\`,
                  url: '/'
                });
                await webpush.sendNotification(subscription, payload);
                sent = true;
                console.log(\`Sent notification for task \${task.title} to user \${task.userId}\`);
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await deleteDoc(subDoc.ref);
                } else {
                  console.error('Failed to send push:', err);
                }
              }
            }

            if (sent) {
              await updateDoc(taskDoc.ref, {
                lastNotifiedAt: new Date(now).toISOString()
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in cron job:', err);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    server.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    server.use(express.static(distPath));
    server.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;
fs.writeFileSync('server.ts', content);
