@echo off
REM Simple Firebase Hosting Upload
REM This script uses npm/firebase-tools to deploy

setlocal

cd /d "E:\APP_PILOT PROJECT"

echo.
echo Deploying to Firebase Hosting...
echo.
echo You have 2 options:
echo.
echo 1. Use your saved authentication (if logged in):
echo    npx firebase deploy --only hosting
echo.
echo 2. Use a fresh token:
echo    First get token: firebase login:ci
echo    Then: npx firebase deploy --only hosting --token TOKEN
echo.

REM Try without token first (uses saved auth if available)
echo Attempting deployment with saved authentication...
npx firebase deploy --only hosting --project app-pilot-60ce3 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! App deployed to:
    echo    https://app-pilot-60ce3.web.app
    echo.
) else (
    echo.
    echo ❌ Deployment failed. You need to authenticate.
    echo.
    echo Run: firebase login:ci
    echo Then paste the token you receive
    echo.
)

endlocal
pause
