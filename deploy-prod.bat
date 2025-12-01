@echo off
REM Firebase Deployment Script for Windows
REM Usage: deploy-prod.bat <firebase-token>
REM Or: deploy-prod.bat (will prompt for token)

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   Firebase Deployment Script - APP PILOT                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set TOKEN=%1

if "%TOKEN%"=="" (
    echo.
    echo 📋 STEP 1: Get Firebase Token
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo To deploy, you need a Firebase CI token.
    echo.
    echo Instructions:
    echo 1. Run this command in PowerShell or Command Prompt:
    echo    firebase login:ci
    echo.
    echo 2. A browser will open - sign in with: prashant@univastu.om
    echo 3. Copy the token displayed in console
    echo 4. Run this script again with the token:
    echo    deploy-prod.bat YOUR_TOKEN_HERE
    echo.
    echo Getting Firebase CI token...
    echo.
    call firebase login:ci --no-localhost
    exit /b
)

echo.
echo ✅ Token Provided
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Token: !TOKEN:~0,20!...
echo.

echo 📍 Setting Firebase Project
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call firebase use app-pilot-60ce3 --token %TOKEN%

echo.
echo 🚀 Deploying to Firebase Hosting
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call firebase deploy --only hosting --token %TOKEN%

if %errorlevel% equ 0 (
    echo.
    echo ✅ DEPLOYMENT SUCCESSFUL!
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo Your app is now live at:
    echo 🌐 https://app-pilot-60ce3.web.app
    echo.
    echo 📊 Next Steps:
    echo   1. Open the URL above in your browser
    echo   2. Wait 30-60 seconds for CDN caching
    echo   3. If blank, do a hard refresh (Ctrl+Shift+R)
    echo   4. Check browser console (F12) for errors
    echo.
    echo 📞 Support:
    echo   Firebase Console: https://console.firebase.google.com/
    echo   Project: app-pilot-60ce3
    echo.
) else (
    echo.
    echo ❌ DEPLOYMENT FAILED
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo Check the error above and try again.
    echo Make sure your token is valid and hasn't expired.
    echo.
    exit /b 1
)

endlocal
