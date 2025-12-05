// Direct email test - bypasses Cloud Functions
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'erpsolutionglobal@gmail.com',
    pass: 'dorjqgxirmgkrtqy',
  },
});

async function sendTestEmail(to) {
  console.log(`Sending test email to: ${to}`);
  
  try {
    const info = await transporter.sendMail({
      from: '"APP PILOT" <erpsolutionglobal@gmail.com>',
      to: to,
      subject: '✅ Test Email - Daily Work Status Reminder System',
      html: `
        <h2>🎉 Test Email Successful!</h2>
        <p>This is a test email from the Daily Work Status Reminder System.</p>
        <p>Your email notification setup is working correctly.</p>
        <hr>
        <h3>System Information:</h3>
        <ul>
          <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Recipient:</strong> ${to}</li>
          <li><strong>Status:</strong> ✅ Email sent successfully!</li>
        </ul>
        <p>If you received this email, your reminder system is ready to use!</p>
        <br>
        <p><small>This is an automated test email from APP_PILOT Daily Work Status Reminder System</small></p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nPlease check your inbox at:', to);
    console.log('Also check spam/junk folder if not in inbox.');
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'pmakashe@gmail.com';
sendTestEmail(email);
