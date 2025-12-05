/**
 * Daily Work Status Reminder System
 * Sends notifications for:
 * - Upcoming target dates
 * - Daily status updates required
 * - Overdue activities
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled function that runs daily at 8 AM
 * Checks for activities requiring reminders
 */
export const sendDailyWorkStatusReminders = functions.pubsub
  .schedule('0 8 * * *') // Runs at 8:00 AM every day
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('[DWS Reminders] Starting daily reminder check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Fetch all active daily work entries
      const entriesSnapshot = await db.collection('dailyWorkEntries').get();

      const reminders: any[] = [];

      entriesSnapshot.forEach((doc) => {
        const entry = doc.data();
        
        // Check if target date is approaching
        if (entry.targetDate) {
          const targetDate = entry.targetDate.toDate();
          targetDate.setHours(0, 0, 0, 0);

          const daysUntilTarget = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Send reminder if target date is:
          // - Tomorrow (1 day)
          // - In 3 days
          // - In 7 days
          // - Overdue
          if (daysUntilTarget === 1 || daysUntilTarget === 3 || daysUntilTarget === 7 || daysUntilTarget < 0) {
            reminders.push({
              type: daysUntilTarget < 0 ? 'overdue' : 'upcoming',
              daysUntilTarget,
              entry,
              entryId: doc.id
            });
          }
        }

        // Check if status update is required (no update in last 24 hours)
        if (entry.finalStatus === 'Ongoing' && entry.statusUpdates) {
          const lastUpdate = entry.statusUpdates[entry.statusUpdates.length - 1];
          if (lastUpdate && lastUpdate.timestamp) {
            const lastUpdateDate = lastUpdate.timestamp.toDate();
            const hoursSinceUpdate = (today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

            if (hoursSinceUpdate > 24) {
              reminders.push({
                type: 'status_update_required',
                hoursSinceUpdate,
                entry,
                entryId: doc.id
              });
            }
          }
        }
      });

      // Send reminders via email/SMS
      console.log(`[DWS Reminders] Found ${reminders.length} reminders to send`);

      for (const reminder of reminders) {
        await sendReminderNotification(reminder);
      }

      return { success: true, remindersSent: reminders.length };
    } catch (error) {
      console.error('[DWS Reminders] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

/**
 * Send reminder notification via email and/or SMS
 */
async function sendReminderNotification(reminder: any) {
  const { type, entry, daysUntilTarget, hoursSinceUpdate } = reminder;

  // Get assigned personnel details
  const personnelSnapshot = await db.collection('dailyWorkPersonnel')
    .where('name', '==', entry.assignedTo)
    .limit(1)
    .get();

  if (personnelSnapshot.empty) {
    console.log(`[DWS Reminders] No contact info for ${entry.assignedTo}`);
    return;
  }

  const personnel = personnelSnapshot.docs[0].data();
  const email = personnel.email;
  const mobile = personnel.mobile;

  let subject = '';
  let message = '';

  switch (type) {
    case 'overdue':
      subject = `⚠️ Overdue Activity: ${entry.mainActivity}`;
      message = `Activity "${entry.mainActivity}" for project "${entry.projectName}" is ${Math.abs(daysUntilTarget)} days overdue. Please update the status.`;
      break;

    case 'upcoming':
      subject = `📅 Upcoming Deadline: ${entry.mainActivity}`;
      message = `Activity "${entry.mainActivity}" for project "${entry.projectName}" is due in ${daysUntilTarget} days (Target: ${entry.targetDate?.toDate().toLocaleDateString()}).`;
      break;

    case 'status_update_required':
      subject = `📝 Status Update Required: ${entry.mainActivity}`;
      message = `No status update for "${entry.mainActivity}" in the last ${Math.floor(hoursSinceUpdate)} hours. Please provide an update.`;
      break;
  }

  // Send email
  if (email) {
    await sendEmail(email, subject, message, entry);
  }

  // Send SMS (requires Twilio or similar service)
  if (mobile) {
    await sendSMS(mobile, message);
  }

  console.log(`[DWS Reminders] Sent reminder to ${entry.assignedTo} - ${type}`);
}

/**
 * Send email using Firebase Email Extension or custom service
 */
async function sendEmail(to: string, subject: string, message: string, entry: any) {
  try {
    // Option 1: Use Firebase Email Extension
    // Install: firebase ext:install firebase/firestore-send-email
    
    await db.collection('mail').add({
      to: [to],
      message: {
        subject: subject,
        html: `
          <h2>${subject}</h2>
          <p>${message}</p>
          <hr>
          <h3>Activity Details:</h3>
          <ul>
            <li><strong>Project:</strong> ${entry.projectName}</li>
            <li><strong>Activity:</strong> ${entry.mainActivity}</li>
            <li><strong>Assigned To:</strong> ${entry.assignedTo}</li>
            <li><strong>Target Date:</strong> ${entry.targetDate?.toDate().toLocaleDateString() || 'N/A'}</li>
            <li><strong>Status:</strong> ${entry.finalStatus}</li>
          </ul>
          <p><a href="http://localhost:8081/daily-work-status">View Daily Work Status</a></p>
        `,
      },
    });

    console.log(`[DWS Reminders] Email queued for ${to}`);
  } catch (error) {
    console.error('[DWS Reminders] Email error:', error);
  }
}

/**
 * Send SMS using Twilio or similar service
 */
async function sendSMS(to: string, message: string) {
  try {
    // Option: Integrate with Twilio
    // Requires: npm install twilio
    // And Twilio account credentials in Firebase config
    
    const twilioAccountSid = functions.config().twilio?.account_sid;
    const twilioAuthToken = functions.config().twilio?.auth_token;
    const twilioPhoneNumber = functions.config().twilio?.phone_number;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('[DWS Reminders] Twilio not configured, skipping SMS');
      return;
    }

    // Uncomment when Twilio is set up:
    /*
    const twilio = require('twilio');
    const client = twilio(twilioAccountSid, twilioAuthToken);

    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });

    console.log(`[DWS Reminders] SMS sent to ${to}`);
    */
    
    console.log(`[DWS Reminders] SMS would be sent to ${to}: ${message}`);
  } catch (error) {
    console.error('[DWS Reminders] SMS error:', error);
  }
}

/**
 * Manual trigger for testing reminders
 */
export const triggerDailyWorkStatusReminders = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log('[DWS Reminders] Manual trigger by:', context.auth.uid);

  try {
    // Manually call the logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entriesSnapshot = await db.collection('dailyWorkEntries').get();
    const reminders: any[] = [];

    entriesSnapshot.forEach((doc) => {
      const entry = doc.data();
      
      if (entry.targetDate) {
        const targetDate = entry.targetDate.toDate();
        targetDate.setHours(0, 0, 0, 0);
        const daysUntilTarget = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilTarget === 1 || daysUntilTarget === 3 || daysUntilTarget === 7 || daysUntilTarget < 0) {
          reminders.push({
            type: daysUntilTarget < 0 ? 'overdue' : 'upcoming',
            daysUntilTarget,
            entry,
            entryId: doc.id
          });
        }
      }
    });

    for (const reminder of reminders) {
      await sendReminderNotification(reminder);
    }

    return { success: true, remindersSent: reminders.length };
  } catch (error) {
    console.error('[DWS Reminders] Manual trigger error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

/**
 * Send test email to verify setup
 */
export const sendTestEmail = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email address is required');
  }

  console.log('[DWS Test] Sending test email to:', email);

  try {
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

    console.log(`[DWS Test] Test email queued for ${email}`);
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('[DWS Test] Error sending test email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test email');
  }
});

/**
 * Generate daily summary report
 */
export const generateDailySummaryReport = functions.pubsub
  .schedule('0 18 * * *') // Runs at 6:00 PM every day
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('[DWS Summary] Generating daily summary report...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all entries updated today
      const entriesSnapshot = await db.collection('dailyWorkEntries')
        .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('dateTime', '<', admin.firestore.Timestamp.fromDate(tomorrow))
        .get();

      const projectSummary: Record<string, any> = {};

      entriesSnapshot.forEach((doc) => {
        const entry = doc.data();
        
        if (!projectSummary[entry.projectName]) {
          projectSummary[entry.projectName] = {
            total: 0,
            ongoing: 0,
            completed: 0,
            onHold: 0,
            notStarted: 0,
            activities: []
          };
        }

        projectSummary[entry.projectName].total++;
        projectSummary[entry.projectName][entry.finalStatus.toLowerCase().replace(' ', '')] = 
          (projectSummary[entry.projectName][entry.finalStatus.toLowerCase().replace(' ', '')] || 0) + 1;
        
        projectSummary[entry.projectName].activities.push({
          activity: entry.mainActivity,
          assignedTo: entry.assignedTo,
          status: entry.finalStatus
        });
      });

      // Send summary to project managers
      await sendDailySummary(projectSummary, today);

      return { success: true, projectCount: Object.keys(projectSummary).length };
    } catch (error) {
      console.error('[DWS Summary] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

async function sendDailySummary(projectSummary: Record<string, any>, date: Date) {
  // Get admin/manager emails
  const managersSnapshot = await db.collection('users')
    .where('role', 'in', ['admin', 'manager'])
    .get();

  const managerEmails = managersSnapshot.docs
    .map(doc => doc.data().email)
    .filter(email => email);

  if (managerEmails.length === 0) {
    console.log('[DWS Summary] No managers to send summary to');
    return;
  }

  let htmlContent = `
    <h2>Daily Work Status Summary - ${date.toLocaleDateString()}</h2>
    <p>Summary of all activities updated today:</p>
  `;

  for (const [projectName, summary] of Object.entries(projectSummary)) {
    htmlContent += `
      <h3>📁 ${projectName}</h3>
      <ul>
        <li>Total Activities: ${summary.total}</li>
        <li>✅ Completed: ${summary.completed || 0}</li>
        <li>🔄 Ongoing: ${summary.ongoing || 0}</li>
        <li>⏸️ On Hold: ${summary.onHold || 0}</li>
        <li>📝 Not Started: ${summary.notStarted || 0}</li>
      </ul>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #4472C4; color: white;">
          <th>Activity</th>
          <th>Assigned To</th>
          <th>Status</th>
        </tr>
        ${summary.activities.map((act: any) => `
          <tr>
            <td>${act.activity}</td>
            <td>${act.assignedTo}</td>
            <td>${act.status}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // Send to all managers
  await db.collection('mail').add({
    to: managerEmails,
    message: {
      subject: `Daily Work Status Summary - ${date.toLocaleDateString()}`,
      html: htmlContent,
    },
  });

  console.log(`[DWS Summary] Summary sent to ${managerEmails.length} managers`);
}

/**
 * Delay Analysis Report
 * Runs daily at 9 AM to identify delayed tasks and their impact
 */
export const generateDelayAnalysisReport = functions.pubsub
  .schedule('0 9 * * *') // Runs at 9:00 AM every day
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('[DWS Delay Analysis] Generating delay analysis report...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all entries with target dates
      const entriesSnapshot = await db.collection('dws_entries')
        .where('targetDate', '!=', null)
        .get();

      const delayedTasks: any[] = [];
      const dueTodayTasks: any[] = [];
      const upcomingTasks: any[] = [];

      entriesSnapshot.forEach((doc) => {
        const entry = doc.data();
        
        if (!entry.targetDate) return;

        const targetDate = entry.targetDate.toDate();
        targetDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const pendingSinceDays = Math.abs(daysDiff);
        const delayPercentage = daysDiff < 0 ? Math.round((pendingSinceDays / (pendingSinceDays + 1)) * 100) : 0;

        // Calculate actual completion date from status updates
        let actualCompletionDate = null;
        if (entry.finalStatus === 'Completed' && entry.statusUpdates && entry.statusUpdates.length > 0) {
          const completedUpdate = entry.statusUpdates
            .filter((u: any) => u.note && u.note.toLowerCase().includes('completed'))
            .pop();
          if (completedUpdate && completedUpdate.timestamp) {
            actualCompletionDate = completedUpdate.timestamp.toDate();
          }
        }

        const taskData = {
          id: doc.id,
          projectName: entry.projectName || 'N/A',
          mainActivity: entry.mainActivity || 'N/A',
          assignedTo: entry.assignedTo || 'Unassigned',
          targetDate: targetDate,
          currentStatus: entry.finalStatus || 'Not Started',
          daysDiff: daysDiff,
          pendingSinceDays: pendingSinceDays,
          delayPercentage: delayPercentage,
          actualCompletionDate: actualCompletionDate,
          hours: entry.hours || 0,
          subActivitiesCount: entry.subActivities ? entry.subActivities.length : 0,
          statusUpdates: entry.statusUpdates || [],
          createdAt: entry.createdAt ? entry.createdAt.toDate() : new Date()
        };

        if (daysDiff < 0 && entry.finalStatus !== 'Completed') {
          delayedTasks.push(taskData);
        } else if (daysDiff === 0 && entry.finalStatus !== 'Completed') {
          dueTodayTasks.push(taskData);
        } else if (daysDiff > 0 && daysDiff <= 7 && entry.finalStatus !== 'Completed') {
          upcomingTasks.push(taskData);
        }
      });

      // Sort by delay severity
      delayedTasks.sort((a, b) => a.daysDiff - b.daysDiff);
      upcomingTasks.sort((a, b) => a.daysDiff - b.daysDiff);

      // Generate and send report
      await sendDelayAnalysisEmail(delayedTasks, dueTodayTasks, upcomingTasks, today);

      return {
        success: true,
        delayedCount: delayedTasks.length,
        dueTodayCount: dueTodayTasks.length,
        upcomingCount: upcomingTasks.length
      };
    } catch (error) {
      console.error('[DWS Delay Analysis] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

async function sendDelayAnalysisEmail(
  delayedTasks: any[],
  dueTodayTasks: any[],
  upcomingTasks: any[],
  date: Date
) {
  // Get managers and admins
  const managersSnapshot = await db.collection('users')
    .where('role', 'in', ['admin', 'manager'])
    .get();

  const managerEmails = managersSnapshot.docs
    .map(doc => doc.data().email)
    .filter(email => email);

  if (managerEmails.length === 0) {
    console.log('[DWS Delay Analysis] No recipients to send report to');
    return;
  }

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
      <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
        ⚠️ Delay Analysis Report - ${date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </h2>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📊 Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">🔴 Overdue Tasks:</td>
            <td style="padding: 8px; color: #dc3545; font-size: 18px; font-weight: bold;">${delayedTasks.length}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">🟡 Due Today:</td>
            <td style="padding: 8px; color: #ffc107; font-size: 18px; font-weight: bold;">${dueTodayTasks.length}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">🟢 Upcoming (Next 7 Days):</td>
            <td style="padding: 8px; color: #28a745; font-size: 18px; font-weight: bold;">${upcomingTasks.length}</td>
          </tr>
        </table>
      </div>
  `;

  // Delayed Tasks Section
  if (delayedTasks.length > 0) {
    htmlContent += `
      <h3 style="color: #dc3545; margin-top: 30px;">🔴 OVERDUE TASKS (${delayedTasks.length})</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #dc3545; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Project</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Activity</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Assigned To</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Target Date</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Delay (Days)</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Hours</th>
          </tr>
        </thead>
        <tbody>
    `;

    delayedTasks.forEach((task, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
      const lastUpdate = task.statusUpdates && task.statusUpdates.length > 0
        ? task.statusUpdates[task.statusUpdates.length - 1].note
        : 'No updates';

      htmlContent += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px; border: 1px solid #ddd;">${task.projectName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>${task.mainActivity}</strong>
            ${task.subActivitiesCount > 0 ? `<br><small style="color: #6c757d;">(${task.subActivitiesCount} sub-activities)</small>` : ''}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${task.assignedTo}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${task.targetDate.toLocaleDateString('en-IN')}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #dc3545;">
            ${task.pendingSinceDays} days
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <span style="padding: 4px 8px; border-radius: 4px; background: #ffc107; color: #000; font-size: 12px;">
              ${task.currentStatus}
            </span>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${task.hours}h</td>
        </tr>
        <tr style="background-color: ${bgColor};">
          <td colspan="7" style="padding: 5px 8px; border: 1px solid #ddd; font-size: 12px; color: #6c757d;">
            <strong>Last Update:</strong> ${lastUpdate.substring(0, 100)}${lastUpdate.length > 100 ? '...' : ''}
          </td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  // Due Today Section
  if (dueTodayTasks.length > 0) {
    htmlContent += `
      <h3 style="color: #ffc107; margin-top: 30px;">🟡 DUE TODAY (${dueTodayTasks.length})</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #ffc107; color: #000;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Project</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Activity</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Assigned To</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Hours</th>
          </tr>
        </thead>
        <tbody>
    `;

    dueTodayTasks.forEach((task, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#fffef7';
      htmlContent += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px; border: 1px solid #ddd;">${task.projectName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>${task.mainActivity}</strong>
            ${task.subActivitiesCount > 0 ? `<br><small style="color: #6c757d;">(${task.subActivitiesCount} sub-activities)</small>` : ''}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${task.assignedTo}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <span style="padding: 4px 8px; border-radius: 4px; background: #ffc107; color: #000; font-size: 12px;">
              ${task.currentStatus}
            </span>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${task.hours}h</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  // Upcoming Tasks Section (Next 7 Days)
  if (upcomingTasks.length > 0) {
    htmlContent += `
      <h3 style="color: #28a745; margin-top: 30px;">🟢 UPCOMING (Next 7 Days) - ${upcomingTasks.length} Tasks</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #28a745; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Project</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Activity</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Assigned To</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Target Date</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Days Left</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    upcomingTasks.forEach((task, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f7fef8';
      htmlContent += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px; border: 1px solid #ddd;">${task.projectName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${task.mainActivity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${task.assignedTo}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${task.targetDate.toLocaleDateString('en-IN')}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #28a745;">
            ${task.daysDiff} days
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <span style="padding: 4px 8px; border-radius: 4px; background: #e8f5e9; color: #000; font-size: 12px;">
              ${task.currentStatus}
            </span>
          </td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  // Action Items
  htmlContent += `
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #856404;">💡 Recommended Actions</h3>
      <ul style="margin: 10px 0;">
        ${delayedTasks.length > 0 ? '<li><strong>Immediate:</strong> Review overdue tasks and reassign resources if needed</li>' : ''}
        ${dueTodayTasks.length > 0 ? '<li><strong>Today:</strong> Ensure all tasks due today are completed or status updated</li>' : ''}
        ${upcomingTasks.length > 0 ? '<li><strong>Planning:</strong> Review upcoming deadlines and allocate resources</li>' : ''}
        <li><strong>Follow-up:</strong> Contact assigned personnel for status updates</li>
        <li><strong>Support:</strong> Identify and provide required support for delayed tasks</li>
      </ul>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #6c757d;">
      <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
      <p>This is an automated report from the Daily Work Status system.</p>
    </div>
    </div>
  `;

  // Send email
  await db.collection('mail').add({
    to: managerEmails,
    message: {
      subject: `⚠️ Delay Analysis Report - ${date.toLocaleDateString('en-IN')} - ${delayedTasks.length} Overdue, ${dueTodayTasks.length} Due Today`,
      html: htmlContent,
    },
  });

  console.log(`[DWS Delay Analysis] Report sent to ${managerEmails.length} recipients`);
  console.log(`[DWS Delay Analysis] Overdue: ${delayedTasks.length}, Due Today: ${dueTodayTasks.length}, Upcoming: ${upcomingTasks.length}`);
}

/**
 * Manual trigger for Delay Analysis Report (for testing)
 */
export const triggerDelayAnalysisReport = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log('[DWS Delay Analysis] Manual trigger by:', context.auth.uid);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all entries with target dates
    const entriesSnapshot = await db.collection('dws_entries')
      .where('targetDate', '!=', null)
      .get();

    const delayedTasks: any[] = [];
    const dueTodayTasks: any[] = [];
    const upcomingTasks: any[] = [];

    entriesSnapshot.forEach((doc) => {
      const entry = doc.data();
      
      if (!entry.targetDate) return;

      const targetDate = entry.targetDate.toDate();
      targetDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const pendingSinceDays = Math.abs(daysDiff);

      let actualCompletionDate = null;
      if (entry.finalStatus === 'Completed' && entry.statusUpdates && entry.statusUpdates.length > 0) {
        const completedUpdate = entry.statusUpdates
          .filter((u: any) => u.note && u.note.toLowerCase().includes('completed'))
          .pop();
        if (completedUpdate && completedUpdate.timestamp) {
          actualCompletionDate = completedUpdate.timestamp.toDate();
        }
      }

      const taskData = {
        id: doc.id,
        projectName: entry.projectName || 'N/A',
        mainActivity: entry.mainActivity || 'N/A',
        assignedTo: entry.assignedTo || 'Unassigned',
        targetDate: targetDate,
        currentStatus: entry.finalStatus || 'Not Started',
        daysDiff: daysDiff,
        pendingSinceDays: pendingSinceDays,
        actualCompletionDate: actualCompletionDate,
        hours: entry.hours || 0,
        subActivitiesCount: entry.subActivities ? entry.subActivities.length : 0,
        statusUpdates: entry.statusUpdates || [],
        createdAt: entry.createdAt ? entry.createdAt.toDate() : new Date()
      };

      if (daysDiff < 0 && entry.finalStatus !== 'Completed') {
        delayedTasks.push(taskData);
      } else if (daysDiff === 0 && entry.finalStatus !== 'Completed') {
        dueTodayTasks.push(taskData);
      } else if (daysDiff > 0 && daysDiff <= 7 && entry.finalStatus !== 'Completed') {
        upcomingTasks.push(taskData);
      }
    });

    delayedTasks.sort((a, b) => a.daysDiff - b.daysDiff);
    upcomingTasks.sort((a, b) => a.daysDiff - b.daysDiff);

    await sendDelayAnalysisEmail(delayedTasks, dueTodayTasks, upcomingTasks, today);

    return {
      success: true,
      message: 'Delay Analysis Report generated and sent successfully',
      delayedCount: delayedTasks.length,
      dueTodayCount: dueTodayTasks.length,
      upcomingCount: upcomingTasks.length
    };
  } catch (error) {
    console.error('[DWS Delay Analysis] Manual trigger error:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});
