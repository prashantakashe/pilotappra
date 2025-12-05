// Quick test script to send email directly
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function sendTestEmail(email) {
  try {
    console.log(`Sending test email to: ${email}`);
    
    await db.collection('mail').add({
      to: [email],
      message: {
        subject: '✅ Test Email - Daily Work Status Reminder System',
        html: `
          <h2>🎉 Test Email Successful!</h2>
          <p>This is a test email from the Daily Work Status Reminder System.</p>
          <p>Your email notification setup is working correctly.</p>
          <hr>
          <h3>System Information:</h3>
          <ul>
            <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Recipient:</strong> ${email}</li>
            <li><strong>Status:</strong> Email queued for delivery</li>
          </ul>
          <p>If you received this email, your reminder system is ready to use!</p>
          <br>
          <p><small>This is an automated test email from APP_PILOT Daily Work Status Reminder System</small></p>
        `,
      },
    });

    console.log('✅ Test email added to mail queue successfully!');
    console.log('Check Firestore "mail" collection for delivery status.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node test-send-email.js <email-address>');
  process.exit(1);
}

sendTestEmail(email);
