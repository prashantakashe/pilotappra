# Daily Work Status Reminder System - Setup Guide

## Overview
This system automatically sends email and SMS reminders for:
- **Target Date Reminders**: 7 days, 3 days, 1 day before, and overdue notifications
- **Status Update Reminders**: When no update in 24+ hours for ongoing activities
- **Daily Summary Reports**: End-of-day summary sent to managers at 6 PM

## Prerequisites

1. **Firebase Blaze Plan** (Pay-as-you-go) - Required for Cloud Functions
2. **Email Service** - Firebase Email Extension or SendGrid
3. **SMS Service** (Optional) - Twilio account
4. **Personnel Database** - Contact information for all assigned personnel

---

## Step 1: Deploy Cloud Functions

### 1.1 Install Dependencies

```powershell
cd functions
npm install firebase-functions firebase-admin
```

### 1.2 Deploy Functions

```powershell
# Deploy all reminder functions
firebase deploy --only functions:sendDailyWorkStatusReminders,functions:triggerDailyWorkStatusReminders,functions:generateDailySummaryReport
```

---

## Step 2: Set Up Email Service

### Option A: Firebase Email Extension (Recommended)

1. **Install Extension**:
   ```powershell
   firebase ext:install firebase/firestore-send-email
   ```

2. **Configure Extension**:
   - SMTP Connection URI: Use Gmail, SendGrid, or custom SMTP
   - Email Documents Collection: `mail`
   - Default FROM Email: `noreply@yourproject.com`

3. **For Gmail**:
   - Enable 2-Factor Authentication
   - Create App Password: https://myaccount.google.com/apppasswords
   - SMTP URI format: `smtps://username:password@smtp.gmail.com:465`

### Option B: SendGrid

1. **Install SendGrid**:
   ```powershell
   cd functions
   npm install @sendgrid/mail
   ```

2. **Configure SendGrid API Key**:
   ```powershell
   firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
   ```

---

## Step 3: Set Up SMS Service (Optional)

### Using Twilio

1. **Create Twilio Account**: https://www.twilio.com/

2. **Get Credentials**:
   - Account SID
   - Auth Token
   - Twilio Phone Number

3. **Install Twilio SDK**:
   ```powershell
   cd functions
   npm install twilio
   ```

4. **Configure Firebase**:
   ```powershell
   firebase functions:config:set twilio.account_sid="YOUR_ACCOUNT_SID"
   firebase functions:config:set twilio.auth_token="YOUR_AUTH_TOKEN"
   firebase functions:config:set twilio.phone_number="+1234567890"
   ```

5. **Uncomment Twilio Code** in `dailyWorkStatusReminders.ts` (lines 161-174)

---

## Step 4: Create Personnel Contact Database

### 4.1 Add Collection Schema

Create a new Firestore collection: `dailyWorkPersonnel`

**Document Structure**:
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "mobile": "+919876543210",
  "role": "Engineer",
  "projects": ["Project A", "Project B"],
  "active": true
}
```

### 4.2 Populate Data

You can add personnel via Firestore Console or create a script:

```typescript
// scripts/addPersonnel.ts
import * as admin from 'firebase-admin';

const personnel = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@company.com",
    mobile: "+919876543210",
    role: "Site Engineer",
    projects: ["Jalgaon Bridge", "Karad Tender"],
    active: true
  },
  // Add more...
];

async function addPersonnel() {
  const db = admin.firestore();
  
  for (const person of personnel) {
    await db.collection('dailyWorkPersonnel').add(person);
    console.log(`Added ${person.name}`);
  }
}
```

---

## Step 5: Configure User Roles for Summary Reports

Add role field to users who should receive daily summaries:

```typescript
// In Firestore: users/{userId}
{
  "email": "manager@company.com",
  "role": "manager", // or "admin"
  "name": "Manager Name"
}
```

---

## Step 6: Test the System

### Manual Test Trigger

You can manually trigger reminders for testing:

```typescript
// In your app or Firebase Console
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const triggerReminders = httpsCallable(functions, 'triggerDailyWorkStatusReminders');

// Call the function
await triggerReminders();
```

### Check Logs

```powershell
firebase functions:log --only sendDailyWorkStatusReminders
firebase functions:log --only generateDailySummaryReport
```

---

## Step 7: Customize Schedule

Edit `dailyWorkStatusReminders.ts` to change timing:

```typescript
// Current: 8:00 AM daily
.schedule('0 8 * * *')

// Examples:
.schedule('0 9 * * *')     // 9:00 AM
.schedule('0 7,18 * * *')  // 7:00 AM and 6:00 PM
.schedule('0 8 * * 1-5')   // 8:00 AM weekdays only
```

**Cron Format**: `minute hour day month weekday`

---

## Step 8: Monitor and Maintain

### Email Queue Monitoring

Check the `mail` collection in Firestore for queued/sent emails:

```typescript
db.collection('mail')
  .where('delivery.state', '==', 'SUCCESS')
  .get()
```

### Error Handling

Emails/SMS that fail will have `delivery.state == 'ERROR'` with error details.

---

## Cost Estimates

### Firebase Blaze Plan
- **Cloud Functions**: ~$0.40 per million invocations
- **Scheduled Functions**: 2 runs/day = ~60 runs/month (minimal cost)

### Email Service
- **Firebase Extension + Gmail**: Free for <500 emails/day
- **SendGrid**: Free tier = 100 emails/day

### SMS Service
- **Twilio**: ~$0.0075 per SMS (India)
- Estimate: 10 reminders/day = $2.25/month

**Total Estimated Cost**: $3-5/month for moderate usage

---

## Troubleshooting

### Reminders Not Sending

1. **Check Function Logs**:
   ```powershell
   firebase functions:log
   ```

2. **Verify Schedule**:
   ```powershell
   gcloud scheduler jobs list
   ```

3. **Check Firestore Rules**: Ensure functions have access to collections

### Email Not Delivering

1. Check `mail` collection for error messages
2. Verify SMTP credentials
3. Check spam folder
4. Ensure sender email is verified

### SMS Not Sending

1. Verify Twilio credentials
2. Check Twilio console for error logs
3. Ensure phone numbers are in E.164 format: `+919876543210`

---

## Security Best Practices

1. **Never commit credentials** - Use Firebase config only
2. **Restrict function access** - Add authentication checks
3. **Validate input** - Check data before sending notifications
4. **Rate limiting** - Prevent abuse of manual trigger function

---

## Next Steps

1. ✅ Deploy functions
2. ✅ Configure email service
3. ✅ Add personnel contacts
4. ✅ Test with manual trigger
5. ✅ Monitor first automated run
6. ✅ Adjust schedule if needed
7. ✅ Configure SMS (optional)
8. ✅ Set up monitoring/alerts

---

## Support

For issues:
- Check Firebase Console > Functions logs
- Review Firestore > `mail` collection
- Check Twilio dashboard (if using SMS)
