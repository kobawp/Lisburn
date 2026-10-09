const admin = require('firebase-admin');
const app = admin.initializeApp({ projectId: 'circular-chiller-vt8c4' });
const db = admin.firestore(app, 'ai-studio-lisburnwebapp-2aae30ea-94e2-46c5-8922-c9c1775c70bb');

async function check() {
  const subs = await db.collection('pushSubscriptions').get();
  console.log(`Found ${subs.size} subscriptions.`);
  subs.forEach(doc => console.log(doc.id, doc.data().userId));
}
check().catch(console.error);
