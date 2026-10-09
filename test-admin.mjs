import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  projectId: 'circular-chiller-vt8c4',
  credential: applicationDefault()
});

try {
  const db = getFirestore('ai-studio-lisburnwebapp-2aae30ea-94e2-46c5-8922-c9c1775c70bb');
  console.log("Success with getFirestore!");
} catch (e) {
  console.log("Error:", e.message);
}
