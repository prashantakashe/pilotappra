@echo off
cd /d "%~dp0"
echo Deploying Firestore security rules...
node node_modules\firebase-tools\lib\bin\firebase.js deploy --only firestore:rules
pause
