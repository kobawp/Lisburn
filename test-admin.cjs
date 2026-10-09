const admin = require('firebase-admin');
const app = admin.initializeApp({ projectId: 'circular-chiller-vt8c4' });
try {
  const db = admin.firestore(app, 'ai-studio-lisburnwebapp-2aae30ea-94e2-46c5-8922-c9c1775c70bb');
  console.log("Database ID supported in firestore() func!");
} catch (e) {
  console.log("Error:", e.message);
}
try {
  const db2 = admin.firestore();
  db2.settings({ databaseId: 'ai-studio-lisburnwebapp-2aae30ea-94e2-46c5-8922-c9c1775c70bb' });
  console.log("Database ID supported in settings!");
} catch (e) {
  console.log("Error settings:", e.message);
}
