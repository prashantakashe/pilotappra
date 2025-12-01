# Setup Guide - Step by Step

This guide walks you through setting up the complete React Native (Expo) + Firebase application.

## Phase 1: Local Setup (15 minutes)

### Step 1: Clone and Install

```bash
# Navigate to project
cd myapp

# Install dependencies
npm install

# Install Expo CLI globally (if not already)
npm install -g expo-cli
```

### Step 2: Verify Installation

```bash
# Check Expo is installed
expo --version

# Check Node version (should be 16+)
node --version

# Test web build
npm run web
# Should open browser at localhost:19006
```

## Phase 2: Firebase Setup (20 minutes)

### Step 3: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create Project**
3. Enter project name: `myapp`
4. Accept defaults, click **Create project**
5. Wait for project to initialize

### Step 4: Get Firebase Config

1. In Firebase Console, click **Project Settings** (⚙️)
2. Scroll down to **Your apps** section
3. Click **Web icon** (</>)
4. Enter app name: `myapp-web`
5. Click **Register app**
6. Copy the config object that appears

Example config:
```javascript
{
  "apiKey": "AIza...",
  "authDomain": "myapp-xxxxx.firebaseapp.com",
  "projectId": "myapp-xxxxx",
  "storageBucket": "myapp-xxxxx.appspot.com",
  "messagingSenderId": "123...",
  "appId": "1:123:web:abc..."
}
```

### Step 5: Update Firebase Config in App

Edit `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Paste from Firebase
  authDomain: "YOUR_AUTH_DOMAIN",            // Paste from Firebase
  projectId: "YOUR_PROJECT_ID",              // Paste from Firebase
  storageBucket: "YOUR_STORAGE_BUCKET",      // Paste from Firebase
  messagingSenderId: "YOUR_SENDER_ID",       // Paste from Firebase
  appId: "YOUR_APP_ID",                      // Paste from Firebase
};
```

## Phase 3: Firebase Services Setup (15 minutes)

### Step 6: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Under **Sign-in method**, click **Email/Password**
4. Enable **Email/Password**
5. Click **Save**

**Expected result:** Email/Password auth is now enabled

### Step 7: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Select **Start in test mode** (for development)
4. Choose location (recommended: nearest to you)
5. Click **Enable**

**Expected result:** Firestore is initialized

### Step 8: Deploy Firestore Security Rules

1. In Firestore, go to **Rules** tab
2. Replace entire content with this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    
    match /messages/{messageId} {
      allow create: if false;
      allow read: if request.auth != null && (resource.data.fromUserId == request.auth.uid || resource.data.toUserId == request.auth.uid);
      allow update, delete: if false;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

**Expected result:** Rules published successfully

### Step 9: Setup Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Accept defaults, click **Next**
4. Accept defaults, click **Done**

### Step 10: Deploy Storage Security Rules

1. In Storage, go to **Rules** tab
2. Replace entire content with:

```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

**Expected result:** Storage rules deployed

## Phase 4: Cloud Functions Setup (Optional but Recommended) (20 minutes)

### Step 11: Install Firebase CLI

```bash
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Step 12: Initialize Firebase Functions

```bash
firebase login
# This opens browser to authenticate with your Google account

firebase init functions
# Follow prompts:
# - Select project: myapp
# - Choose TypeScript
# - Accept defaults for other options
```

### Step 13: Deploy Functions

```bash
cd functions
npm install
firebase deploy --only functions

# Monitor deployment
firebase functions:log
```

**Expected result:** Functions deployed successfully

## Phase 5: Test the Application (10 minutes)

### Step 14: Start Web Dev Server

```bash
npm run web
# App opens at localhost:19006
```

### Step 15: Test Sign Up

1. Click **Sign Up** link
2. Enter:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPass123!"
   - Confirm: "TestPass123!"
3. Click **Create Account**
4. Should see success message

**Check Firestore:**
- Go to Firebase Console → Firestore
- Look for new document in `/users/{uid}`
- Should have fields: name, email, role, createdAt

### Step 16: Test Login

1. Click **Sign In**
2. Enter:
   - Email: "test@example.com"
   - Password: "TestPass123!"
3. Click **Sign In**
4. Should see Dashboard

**Check AuthContext:**
- Open browser DevTools → Console
- You should be logged in
- User email visible in TopBar

### Step 17: Test Profile

1. Click user email in TopBar
2. Navigate to Profile
3. Click **Edit Profile**
4. Change name, click **Save**
5. Verify Firestore updated

### Step 18: Test Logout

1. Click Profile
2. Click **Logout**
3. Confirm
4. Should return to Login screen

## Phase 6: Deploy to Production (Optional)

### Android Build

```bash
eas build --platform android

# After build completes, download APK:
# eas build:list
```

### iOS Build (requires macOS)

```bash
eas build --platform ios

# Download IPA file after build completes
```

### Web Deployment

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**Expo.dev:**
```bash
expo publish
```

## Troubleshooting

### Issue: "Module not found: 'react'"

**Solution:**
```bash
npm install
npm run web
```

### Issue: Firebase config not recognized

**Solution:**
1. Check `src/services/firebase.ts`
2. Verify all placeholders replaced with real values
3. No extra spaces or quotes in config
4. Restart dev server

### Issue: Authentication fails

**Solution:**
1. Verify Email/Password enabled in Firebase
2. Check browser console for error message
3. Open Firebase Console → Authentication → check if user created
4. Test in Firestore Emulator first

### Issue: Firestore rules reject reads/writes

**Solution:**
1. Check rules in Firestore Console
2. Verify user is authenticated (check AuthContext)
3. Test with emulator locally
4. Check that uid matches in rules condition

### Issue: Can't deploy functions

**Solution:**
```bash
firebase login
firebase functions:config:set environment=production
firebase deploy --only functions
```

## Next Steps After Setup

1. ✅ Customize colors in `src/theme/colors.ts`
2. ✅ Add your branding/logo
3. ✅ Create additional screens as needed
4. ✅ Add more Firestore collections and rules
5. ✅ Implement additional Cloud Functions
6. ✅ Add push notifications (optional)
7. ✅ Set up analytics (optional)
8. ✅ Deploy to production

## Team Setup

For team members to join development:

1. **Firebase Project Access:**
   - Go to Firebase Console → Project Settings → Users and permissions
   - Click **Add member**
   - Enter developer email
   - Select **Editor** role
   - They should NOT have direct Firebase account credentials

2. **Git Access:**
   - Push to GitHub (or your Git host)
   - Team members clone repo
   - Run `npm install`
   - Add their own Firebase config to local `src/services/firebase.ts`

3. **Environment Variables (Optional):**
   ```bash
   # Create .env file (don't commit)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   ```

## Quick Command Reference

```bash
# Development
npm start              # Start Expo CLI
npm run web           # Web dev server
npm run android       # Android
npm run ios           # iOS

# Firebase
firebase login        # Authenticate
firebase deploy       # Deploy all
firebase deploy --only firestore  # Deploy Firestore rules only
firebase deploy --only storage    # Deploy Storage rules only
firebase deploy --only functions  # Deploy Cloud Functions only

# Emulator
firebase emulators:start          # Start all emulators
firebase emulators:start --only firestore  # Firestore only
```

---

**You're all set!** The app is now ready for development. Start with the web version for fastest development cycle, then test on mobile.

Questions? Check README.md or QA_TEST_PLAN.md
