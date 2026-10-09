import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

async function check() {
  try {
    const subs = await getDocs(collection(db, 'pushSubscriptions'));
    console.log(`Found ${subs.size} subscriptions.`);
    subs.forEach(doc => {
      console.log(doc.id, doc.data().userId);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
