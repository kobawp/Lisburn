const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

async function check() {
  const subs = await getDocs(collection(db, 'pushSubscriptions'));
  console.log(`Found ${subs.size} subscriptions.`);
  subs.forEach(doc => {
    console.log(doc.id, doc.data().userId);
  });
}
check().catch(console.error);
