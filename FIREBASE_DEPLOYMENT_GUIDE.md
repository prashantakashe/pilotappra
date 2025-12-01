# Firebase Deployment Guide

## Current Status
✅ Web build created successfully at `web-build/`
✅ Firebase project configured: `app-pilot-60ce3`
✅ Firebase tools installed locally

## Issue
The Firebase CLI requires interactive authentication via browser login, which is not available in this environment.

## Solution: Use Service Account Authentication

### Option 1: Create Service Account (Recommended)

1. Go to Google Cloud Console:
   https://console.cloud.google.com/apis/credentials?project=app-pilot-60ce3

2. Click "Create Credentials" → "Service Account"
   - Service account name: "firebase-deployer"
   - Click "Create and Continue"

3. Grant Role: "Editor" → Continue

4. Create Key:
   - Click "Create Key"
   - Choose "JSON"
   - This downloads a JSON file with credentials

5. In VS Code terminal, set environment variable:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\downloaded\service-account-key.json"
   ```

6. Deploy:
   ```powershell
   cd "E:\APP_PILOT PROJECT"
   npx firebase deploy --only hosting
   ```

### Option 2: Manual Web Login (Alternative)

1. Visit: https://auth.firebase.tools/login?code_challenge=...
2. Sign in with: prashant@univastu.om
3. Get the authorization code
4. Paste code back into the terminal when prompted

### Option 3: Use Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project: "app-pilot-60ce3"
3. Go to Hosting
4. Upload the `web-build/` folder contents manually via Firebase Console

## Build Command

Web build is located at: `e:\APP_PILOT PROJECT\web-build\`

To rebuild if needed:
```powershell
cd "E:\APP_PILOT PROJECT"
npx expo export --platform web --output-dir web-build
```

## Firebase Project Details
- **Project ID**: app-pilot-60ce3
- **Hosting URL**: Will be https://app-pilot-60ce3.web.app
- **Public Directory**: `web-build/`

## Next Steps

1. Choose one of the above authentication methods
2. Once authenticated, run:
   ```powershell
   cd "E:\APP_PILOT PROJECT"
   npx firebase deploy --only hosting
   ```

3. Deployment typically takes 1-2 minutes
4. Once complete, your app will be live at: https://app-pilot-60ce3.web.app

## Notes
- The build already includes all dependencies and optimizations
- Firebase rules (firestore.rules, storage.rules) are configured and ready
- The `web-build/` directory is production-ready
