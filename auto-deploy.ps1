#!/usr/bin/env powershell
# Automated Firebase Deployment with Fresh Token

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║          Automated Firebase Deployment                       ║
║          Rate Analysis - APP PILOT                           ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Step 1: Get fresh token
Write-Host @"
📋 Step 1: Generating fresh Firebase token...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ A browser will open to authenticate with prashant@univastu.om
   Please sign in and copy the token that appears.

"@ -ForegroundColor Yellow

# Run firebase login:ci
$tokenOutput = firebase login:ci --no-localhost 2>&1 | Out-String

Write-Host $tokenOutput

# Extract token from output
$lines = $tokenOutput -split '\n'
$token = ""
foreach ($line in $lines) {
    if ($line -match '^[a-zA-Z0-9/_-]{500,}$') {
        $token = $line.Trim()
        break
    }
}

if (-not $token) {
    Write-Host "❌ Could not extract token from output" -ForegroundColor Red
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host "  firebase login:ci" -ForegroundColor Green
    Write-Host "  firebase deploy --only hosting --token YOUR_TOKEN" -ForegroundColor Green
    exit 1
}

Write-Host "✅ Token received!" -ForegroundColor Green

# Step 2: Deploy
Write-Host @"

🚀 Step 2: Deploying to Firebase Hosting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"@ -ForegroundColor Cyan

cd "E:\APP_PILOT PROJECT"
npx firebase deploy --only hosting --token $token

if ($LASTEXITCODE -eq 0) {
    Write-Host @"

✅ DEPLOYMENT SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Your app is now LIVE at:
   https://app-pilot-60ce3.web.app

📊 Next Steps:
  1. Open the URL above
  2. Wait 30-60 seconds for CDN
  3. Hard refresh if needed: Ctrl+Shift+R
  4. Check browser console (F12) for any errors

📞 Firebase Console:
   https://console.firebase.google.com/project/app-pilot-60ce3

"@ -ForegroundColor Green

    Read-Host "Press Enter to close this window"
} else {
    Write-Host @"

❌ DEPLOYMENT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check the error above. If token expired, try again.
"@ -ForegroundColor Red
    
    Read-Host "Press Enter to close"
    exit 1
}
