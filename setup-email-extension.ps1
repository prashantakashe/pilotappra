# Firebase Email Extension Setup Script
# This script guides you through setting up the Firebase Email Extension

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firebase Email Extension Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebasePath = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebasePath) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Firebase CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g firebase-tools" -ForegroundColor Green
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Firebase CLI found: $($firebasePath.Source)" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check Firebase login
Write-Host "Step 2: Checking Firebase authentication..." -ForegroundColor Yellow
try {
    $loginStatus = firebase login:list 2>&1
    Write-Host "✅ Already logged in to Firebase" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Firebase" -ForegroundColor Red
    Write-Host "Attempting to login..." -ForegroundColor Yellow
    firebase login
}

Write-Host ""

# Step 3: List current Firebase projects
Write-Host "Step 3: Listing Firebase projects..." -ForegroundColor Yellow
firebase projects:list

Write-Host ""

# Step 4: Select/Verify project
Write-Host "Step 4: Verifying current project..." -ForegroundColor Yellow
$currentProject = firebase use 2>&1
Write-Host "Current project: $currentProject" -ForegroundColor Cyan

Write-Host ""

# Step 5: Check billing (required for extensions)
Write-Host "Step 5: Important - Billing Check" -ForegroundColor Yellow
Write-Host "⚠️  Firebase Extensions require the Blaze (Pay-as-you-go) plan" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please verify in Firebase Console:" -ForegroundColor Cyan
Write-Host "1. Go to: https://console.firebase.google.com" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click 'Upgrade' if you're on the Spark (free) plan" -ForegroundColor White
Write-Host ""

$confirmBilling = Read-Host "Have you verified your project is on the Blaze plan? (yes/no)"

if ($confirmBilling -ne "yes") {
    Write-Host "❌ Please upgrade to Blaze plan and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Install Email Extension
Write-Host "Step 6: Installing Firebase Email Extension..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be asked to configure:" -ForegroundColor Cyan
Write-Host "  - SMTP connection URI (Gmail, SendGrid, or custom)" -ForegroundColor White
Write-Host "  - Email collection name: Use 'mail'" -ForegroundColor White
Write-Host "  - Default FROM address" -ForegroundColor White
Write-Host ""

Write-Host "Example SMTP URIs:" -ForegroundColor Cyan
Write-Host "  Gmail: smtps://username:app_password@smtp.gmail.com:465" -ForegroundColor White
Write-Host "  SendGrid: smtps://apikey:YOUR_API_KEY@smtp.sendgrid.net:465" -ForegroundColor White
Write-Host ""

$confirmInstall = Read-Host "Ready to install? (yes/no)"

if ($confirmInstall -eq "yes") {
    firebase ext:install firebase/firestore-send-email
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Email Extension installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Deploy Cloud Functions: firebase deploy --only functions" -ForegroundColor White
        Write-Host "2. Configure reminder settings in the app (Daily Work Status > Reminder Settings)" -ForegroundColor White
        Write-Host "3. Add personnel email addresses in the app" -ForegroundColor White
        Write-Host "4. Test reminders using the 'Send Test Reminder' button" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Installation failed. Please check the errors above." -ForegroundColor Red
    }
} else {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
