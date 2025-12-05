# 🔔 Daily Work Status Reminder System - Quick Start Guide

## ✅ What's Been Added

The **Reminder Settings** tab has been integrated into your Daily Work Status module with:

- **Email notifications** for target dates and status updates
- **SMS support** (optional, requires Twilio)
- **Daily summary reports** sent to managers
- **Visual UI** matching your app's theme and design
- **Easy configuration** directly from the app

---

## 📍 How to Access

1. **Navigate to Daily Work Status**
   - From main menu, click **"Daily Work Status"**

2. **Click "Reminder Settings"** in the sidebar
   - Located after "Report" in the left sidebar
   - Icon: 🔔

3. **Configure your preferences**
   - Enable/disable email and SMS
   - Set reminder schedules
   - Add recipient emails for daily summaries

---

## 🚀 Setup Process (First Time Only)

### Option A: Quick Setup (Recommended)

Run the automated setup script:

```powershell
.\setup-email-extension.ps1
```

This script will:
- ✅ Check Firebase CLI installation
- ✅ Verify you're logged in
- ✅ Check billing plan (Blaze required)
- ✅ Install Email Extension
- ✅ Guide you through configuration

### Option B: Manual Setup

If you prefer manual setup:

#### 1. Install Firebase CLI (if not installed)

```powershell
npm install -g firebase-tools
```

#### 2. Login to Firebase

```powershell
firebase login
```

#### 3. Verify Project

```powershell
firebase use
```

#### 4. Upgrade to Blaze Plan

- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Click **"Upgrade to Blaze"** if you're on Spark plan
- ⚠️ **Required for Cloud Functions and Extensions**

#### 5. Install Email Extension

```powershell
firebase ext:install firebase/firestore-send-email
```

**Configuration options:**
- **SMTP Connection URI**: See examples below
- **Email Documents Collection**: Enter `mail`
- **Default FROM Address**: Your email (e.g., `noreply@yourcompany.com`)

#### 6. Deploy Cloud Functions

```powershell
firebase deploy --only functions
```

---

## 📧 SMTP Configuration Examples

### For Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use this SMTP URI format:
   ```
   smtps://your.email@gmail.com:app_password_here@smtp.gmail.com:465
   ```

### For SendGrid:

1. Create account at https://sendgrid.com
2. Generate API Key
3. Use this SMTP URI format:
   ```
   smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
   ```

### For Custom SMTP:

```
smtps://username:password@smtp.yourserver.com:465
```

---

## ⚙️ Configure Reminder Settings in App

### 1. Enable Notification Channels

- **Email Notifications**: Toggle ON (requires Email Extension)
- **SMS Notifications**: Toggle ON (requires Twilio - optional)

### 2. Target Date Reminders

Choose when to send reminders:
- ✅ **7 days before** - Weekly advance notice
- ✅ **3 days before** - Mid-week reminder
- ✅ **1 day before** - Final reminder
- ✅ **Overdue alerts** - For missed deadlines

### 3. Status Update Reminders

- Toggle ON to remind personnel when no status update
- Default: 24 hours threshold (customizable)

### 4. Daily Summary Reports

- Toggle ON to send end-of-day summaries to managers
- **Time**: Default 18:00 (6 PM IST)
- **Recipients**: Add manager email addresses
  - Click in email field
  - Type email address
  - Click **"Add"** button
  - Repeat for each manager

### 5. Save Settings

Click **"💾 Save Settings"** button at bottom

### 6. Test Reminders

Click **"🧪 Send Test Reminder"** to verify configuration

---

## 📊 How Reminders Work

### Automatic Schedule

1. **Daily Reminders**: Run at **8:00 AM IST** every day
   - Checks all active activities
   - Sends reminders for upcoming target dates
   - Alerts for status updates needed

2. **Daily Summaries**: Run at **6:00 PM IST** (configurable)
   - Compiles all day's activities
   - Sends to configured managers
   - Includes project-wise breakdown

### Who Receives Reminders?

Reminders are sent to personnel based on:
- **Assigned To** field in Daily Work Status entries
- Personnel must have email/mobile in `dailyWorkPersonnel` collection

### Email Content

Each reminder includes:
- Activity name and project
- Current status
- Target date (if applicable)
- Direct link to Daily Work Status

---

## 👥 Add Personnel Contact Information

For reminders to work, personnel need contact details:

### Option 1: Via Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **Firestore Database**
3. Create collection: `dailyWorkPersonnel`
4. Add documents with this structure:

```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@company.com",
  "mobile": "+919876543210",
  "role": "Site Engineer",
  "projects": ["Jalgaon Bridge", "Karad Tender"],
  "active": true
}
```

### Option 2: Use Script (Faster for Multiple Entries)

1. Edit `scripts/addDWSPersonnel.ts` with your personnel data
2. Run:
   ```powershell
   npx ts-node scripts/addDWSPersonnel.ts
   ```

---

## 🧪 Testing

### 1. Test Email Configuration

After setup, test by:
1. Adding a document to `mail` collection in Firestore:

```json
{
  "to": ["your.email@test.com"],
  "message": {
    "subject": "Test Email",
    "text": "This is a test from Firebase Email Extension"
  }
}
```

2. Check email delivery in Firestore (document will have `delivery` field)

### 2. Test Reminder Function

In the app:
1. Go to **Daily Work Status > Reminder Settings**
2. Click **"🧪 Send Test Reminder"**
3. Check your email inbox

---

## 📱 SMS Setup (Optional)

To enable SMS notifications:

### 1. Create Twilio Account

- Sign up at https://www.twilio.com
- Get a phone number
- Note your Account SID and Auth Token

### 2. Configure Firebase Functions

```powershell
firebase functions:config:set twilio.account_sid="YOUR_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_AUTH_TOKEN"
firebase functions:config:set twilio.phone_number="+1234567890"
```

### 3. Uncomment SMS Code

Edit `functions/src/dailyWorkStatusReminders.ts`:
- Find the `sendSMS` function (around line 161)
- Uncomment the Twilio code block

### 4. Install Twilio SDK

```powershell
cd functions
npm install twilio
```

### 5. Redeploy Functions

```powershell
firebase deploy --only functions
```

### 6. Enable in App

In **Reminder Settings**, toggle **"SMS Notifications"** to ON

---

## 💰 Cost Estimates

### Firebase Services

- **Cloud Functions**: ~$0.40 per million invocations
  - Daily reminders: 2 runs/day × 30 days = 60 runs/month
  - **Cost**: Nearly free (well within free tier)

- **Firestore**: Minimal reads/writes for settings
  - **Cost**: < $0.10/month

### Email Service

- **Gmail SMTP**: Free (up to 500/day)
- **SendGrid**: Free tier = 100 emails/day
  - **Cost**: $0 for moderate use

### SMS (Optional)

- **Twilio**: ~$0.0075 per SMS (India rates)
  - 10 reminders/day × 30 days = 300 SMS
  - **Cost**: ~$2.25/month

**Total Estimated Monthly Cost**: $3-5 for moderate usage

---

## 🔍 Monitoring

### Check Reminder Logs

```powershell
firebase functions:log --only sendDailyWorkStatusReminders
```

### Check Summary Logs

```powershell
firebase functions:log --only generateDailySummaryReport
```

### Monitor Email Queue

In Firestore Console:
- Collection: `mail`
- Check `delivery.state` field:
  - `SUCCESS` = Delivered
  - `ERROR` = Failed (check `delivery.error`)
  - `PENDING` = Queued

---

## 🐛 Troubleshooting

### Reminders Not Sending

**Check:**
1. Functions deployed: `firebase deploy --only functions`
2. Email extension installed: `firebase ext:list`
3. Firestore rules allow function access
4. Personnel have valid email addresses
5. Function logs for errors: `firebase functions:log`

### Emails Not Delivering

**Check:**
1. `mail` collection for error messages
2. SMTP credentials are correct
3. Spam folder
4. Sender email is verified
5. Email extension status: `firebase ext:list`

### SMS Not Sending

**Check:**
1. Twilio credentials configured: `firebase functions:config:get`
2. Twilio code uncommented in function
3. Phone numbers in E.164 format: `+919876543210`
4. Twilio dashboard for error logs

---

## 📞 Support

For detailed documentation, see:
- **DWS_REMINDER_SETUP.md** - Complete technical guide
- **dailyWorkStatusReminders.ts** - Function source code
- Firebase Console - Logs and monitoring

---

## ✨ Features Summary

✅ **Email reminders** for target dates (7/3/1 days, overdue)  
✅ **Status update alerts** when no update for 24+ hours  
✅ **Daily summaries** to managers with project breakdown  
✅ **SMS support** (optional)  
✅ **Visual UI** integrated in Daily Work Status module  
✅ **Easy configuration** - no coding required  
✅ **Test function** to verify setup  
✅ **Matches app theme** and design language  

---

## 🎯 Next Steps

1. ✅ Run `.\setup-email-extension.ps1`
2. ✅ Configure SMTP settings
3. ✅ Deploy functions: `firebase deploy --only functions`
4. ✅ Add personnel contacts
5. ✅ Configure settings in app
6. ✅ Send test reminder
7. ✅ Monitor first automated run (8 AM next day)

**Ready to use! 🚀**
