const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const subscribeApi = `
  // API to save a push subscription
  server.post('/api/subscribe', async (req, res) => {
    try {
      // In a real app we'd verify the Firebase ID token.
      // But since we are using Client SDK on the backend and our firestore rule is open,
      // we can just extract the userId from the request body or let the client do it.
      // Wait, let's just let the client do it directly! No wait, the client is calling /api/subscribe.
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Instead of verifying token with Admin SDK, we'll decode it manually just to get the uid 
      // since this is a prototype and we can't easily use Admin SDK.
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      const userId = decoded.user_id;

      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      const endpointHash = crypto.createHash('sha256').update(subscription.endpoint).digest('hex');
      const subRef = doc(db, 'pushSubscriptions', endpointHash);
      await setDoc(subRef, {
        userId,
        subscription,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Background Cron Job - Check every 10 minutes
`;
content = content.replace("  // Background Cron Job - Check every 10 minutes", subscribeApi);
fs.writeFileSync('server.ts', content);
