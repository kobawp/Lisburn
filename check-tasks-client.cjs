const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

async function check() {
  const q = query(collection(db, 'tasks'), where('reminderIntervalHours', '>', 0));
  const tasks = await getDocs(q);
  console.log(`Found ${tasks.size} tasks with reminderIntervalHours > 0.`);
  tasks.forEach(doc => {
    console.log(doc.data());
  });
  process.exit(0);
}
check().catch(console.error);
