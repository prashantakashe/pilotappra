# Android APK Build Instructions

## Option 1: Using EAS Build (Cloud Build - Recommended)

### Step 1: Create Expo Account
1. Go to https://expo.dev/signup
2. Create a free Expo account
3. Verify your email

### Step 2: Install EAS CLI
Open PowerShell as Administrator and run:
```powershell
npm install -g eas-cli
```

### Step 3: Login to EAS
```powershell
eas login
```
Enter your Expo email and password

### Step 4: Build APK
```powershell
cd "e:\prashant\APP_PILOT PROJECT"
eas build --platform android --profile preview
```

### Step 5: Download and Install
- The build will take 10-15 minutes
- You'll get a link to download the APK
- Download it to your Android device
- Install the APK (you may need to enable "Install from Unknown Sources" in Android settings)

---

## Option 2: Using APK from Pre-Built Version (If Available)

If you have Android Studio installed, you can build locally:

```powershell
cd "e:\prashant\APP_PILOT PROJECT"
eas build --platform android --profile preview --local
```

Note: This requires Android SDK and tools to be installed on your PC.

---

## Current Status

✅ eas.json configuration file created
✅ Android build profile configured
✅ Package name: com.example.myapp

The APK will include all your latest features:
- Master Rate Data screen
- SSR/DSR screen
- Excel export functionality
- Fixed horizontal scrolling
- All other app features

---

## Troubleshooting

If the build fails:
1. Make sure you're logged into Expo account
2. Check your internet connection
3. Try again with: `eas build --platform android --profile preview --clear-cache`

For local builds, you need:
- Android Studio
- Android SDK
- JDK 17 or higher
