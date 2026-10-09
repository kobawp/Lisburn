import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  projectId: 'circular-chiller-vt8c4',
  credential: applicationDefault()
});

const db = getFirestore('ai-studio-lisburnwebapp-2aae30ea-94e2-46c5-8922-c9c1775c70bb');

async function check() {
  const tasks = await db.collection('tasks').get();
  console.log(`Found ${tasks.size} tasks.`);
  tasks.forEach(doc => {
    const data = doc.data();
    console.log(data.title, '|', data.reminderIntervalHours, '|', data.lastCompletedAt);
  });
}
check().catch(console.error);
