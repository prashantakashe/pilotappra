/**
 * Direct Email Service using Nodemailer
 * Bypasses Firebase Email Extension issues
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
const cors = require('cors')({ origin: true });

const db = admin.firestore();

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'erpsolutionglobal@gmail.com',
    pass: 'dorjqgxirmgkrtqy', // App password (no spaces)
  },
});

/**
 * Send test email directly
 */
export const sendDirectTestEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email address is required');
  }

  console.log('[Email Service] Sending test email to:', email);

  try {
    const info = await transporter.sendMail({
      from: '"APP PILOT" <erpsolutionglobal@gmail.com>',
      to: email,
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
          <li><strong>Status:</strong> ✅ Email sent successfully!</li>
        </ul>
        <p>If you received this email, your reminder system is ready to use!</p>
        <br>
        <p><small>This is an automated test email from APP_PILOT Daily Work Status Reminder System</small></p>
      `,
    });

    console.log('[Email Service] Email sent successfully:', info.messageId);
    return { 
      success: true, 
      message: 'Test email sent successfully',
      messageId: info.messageId
    };
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error);
    throw new functions.https.HttpsError('internal', `Failed to send email: ${error?.message || 'Unknown error'}`);
  }
});

/**
 * HTTP endpoint for sending test emails (with CORS)
 */
export const sendTestEmailHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed' });
      return;
    }

    const { email } = req.body;

    if (!email) {
      res.status(400).send({ error: 'Email address is required' });
      return;
    }

    console.log('[Email Service HTTP] Sending test email to:', email);

    try {
      const info = await transporter.sendMail({
        from: '"APP PILOT" <erpsolutionglobal@gmail.com>',
        to: email,
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
            <li><strong>Status:</strong> ✅ Email sent successfully!</li>
          </ul>
          <p>If you received this email, your reminder system is ready to use!</p>
          <br>
          <p><small>This is an automated test email from APP_PILOT Daily Work Status Reminder System</small></p>
        `,
      });

      console.log('[Email Service HTTP] Email sent successfully:', info.messageId);
      res.status(200).send({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: info.messageId
      });
    } catch (error: any) {
      console.error('[Email Service HTTP] Error sending email:', error);
      res.status(500).send({ 
        error: 'Failed to send email',
        details: error?.message || 'Unknown error'
      });
    }
  });
});
