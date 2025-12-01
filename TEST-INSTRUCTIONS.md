## Test Instructions - Karad Project Tender Creation

### 📋 Overview
This test will verify that tender creation and display works correctly in your app.

### 🎯 Test Data
- **Title:** Karad Project
- **Short Name:** Karad
- **Work Type:** Sports
- **Tender Source:** GEM
- **Estimated Value:** ₹78,000,000 (₹7.8 Crores)
- **Publish Date:** 10/11/2025
- **Submission Deadline:** 25/11/2025
- **Tender Manager:** Prashant

### ✅ Test Steps

#### Option 1: Using Test HTML Page (RECOMMENDED)
1. Open the file: `test-karad-tender.html` in your browser
2. Enter your credentials:
   - Email: `aaa@gmail.com`
   - Password: Your password for this account
3. Click "🚀 Create Tender"
4. Wait for success message showing Tender ID and Tender No
5. Go to your app and navigate to "Tender Main Screen"
6. You should see the "Karad Project" tender card

#### Option 2: Using the App Form
1. Start your app: `npm start`
2. Open in browser (usually http://localhost:8081)
3. Navigate to "Add New Tender"
4. Fill in the form with the data above:
   - Basic Details:
     - Title: `Karad Project`
     - Short Name: `Karad`
     - Work Type: `Sports`
     - Tender Source: `GEM`
     - Estimated Value: `78000000`
     - Currency: `INR`
   - Key Dates:
     - Publish Date: `10/11/2025`
     - Submission Deadline: `25/11/2025`
   - Team:
     - Tender Manager: `Prashant`
5. Click "Submit for Review"
6. Check for success message
7. Navigate to "Tender Main Screen"
8. Filter by "Active" status to see your tender

### 🔍 What to Verify

1. **Tender Card Display:**
   - ✅ Shows tender number (TNR-2025-XXXX)
   - ✅ Shows "Karad Project" title
   - ✅ Shows ₹7.80 Cr estimated value
   - ✅ Shows "Active" status badge (blue)
   - ✅ Shows "GEM" source
   - ✅ Shows "Karad, Maharashtra" location
   - ✅ Shows deadline with urgency indicator (5 days remaining - amber)
   - ✅ Shows "Prashant" in team avatars
   - ✅ Shows progress bar at 0%
   - ✅ Shows document count (0/0)

2. **Real-time Updates:**
   - ✅ Tender appears immediately after creation
   - ✅ No page refresh needed
   - ✅ Can filter by "Active" status
   - ✅ Can search for "Karad"

3. **Navigation:**
   - ✅ Clicking card opens Tender Detail screen
   - ✅ Quick action buttons are visible (Rate Analysis, Upload, More)

### 🐛 Troubleshooting

**If tender doesn't appear:**
1. Check browser console for errors (F12)
2. Verify you're authenticated (check user icon/email in app)
3. Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
4. Check Cloud Functions are deployed: `firebase functions:list`
5. Verify the tender was created in Firebase Console → Firestore → `tenders` collection

**If Cloud Function fails:**
1. Error: "unauthenticated" → You need to log in first
2. Error: "invalid-argument" → Check all required fields are filled
3. Error: "CORS" → This is expected on localhost, use Firebase Hosting or the test HTML page

### 📊 Expected Result

**Success Criteria:**
✅ Tender created with generated number (TNR-2025-XXXX)
✅ Tender visible in Tender Main Screen
✅ Card shows all information correctly
✅ Real-time updates working
✅ Can filter, search, and sort tenders
✅ Can navigate to tender details

**Firebase Console Check:**
1. Go to: https://console.firebase.google.com/project/app-pilot-60ce3/firestore
2. Navigate to `tenders` collection
3. You should see a document with:
   - `title`: "Karad Project"
   - `tenderNo`: "TNR-2025-XXXX"
   - `status`: "active"
   - `estimatedValue`: 78000000
   - `tenderManager`: "Prashant"
