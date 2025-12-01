@echo off
echo ========================================
echo  Starting Expo for Android Testing
echo ========================================
echo.
echo INSTRUCTIONS:
echo 1. Install 'Expo Go' app from Play Store on your Android device
echo 2. Make sure phone and PC are on same WiFi network
echo 3. Scan the QR code with Expo Go app
echo.
echo Starting Expo server...
echo.

cd /d "e:\prashant\APP_PILOT PROJECT"
npx expo start --android

pause
