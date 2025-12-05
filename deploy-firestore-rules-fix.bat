@echo off
echo ================================================
echo Deploying Updated Firestore Rules
echo ================================================
echo.
echo This will fix the BOQ save permission issues
echo.
cd /d "%~dp0"
call npx firebase deploy --only firestore:rules
echo.
echo ================================================
echo Deployment Complete!
echo ================================================
pause
