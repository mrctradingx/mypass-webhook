const express = require('express');
const admin = require('firebase-admin');

// Đọc thông tin xác thực từ biến môi trường hoặc file JSON
let serviceAccount;

// Nếu chạy trên Render, sử dụng biến môi trường FIREBASE_CREDENTIALS
if (process.env.FIREBASE_CREDENTIALS) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  // Nếu chạy cục bộ, sử dụng file JSON
  serviceAccount = require('./mypass-29358-firebase-adminsdk-fbsvc-be9f0a02b9.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(express.json());

// Xử lý webhook từ Brevo
app.post('/webhook/brevo', async (req, res) => {
  const events = req.body;

  for (const event of events) {
    if (event.event === 'opened') {
      const messageId = event.message_id; // Lấy messageId từ Brevo event
      const emailDocRef = db.collection('emailTracking').doc(messageId);

      try {
        await emailDocRef.update({
          opened: true,
          openedAt: new Date().toISOString(),
        });
        console.log(`Email opened: ${messageId}`);
      } catch (err) {
        console.error(`Error updating email tracking for ${messageId}:`, err);
      }
    }
  }

  res.status(200).send('Webhook received');
});

// Lắng nghe trên cổng do Render cung cấp (hoặc 3000 khi chạy cục bộ)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));