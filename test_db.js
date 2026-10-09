const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function checkTasks() {
  const q = collection(db, 'tasks');
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.docs.length} tasks in db`);
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data().userId);
  });
}
checkTasks().catch(console.error);
