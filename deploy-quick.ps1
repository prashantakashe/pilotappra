# Quick Firebase Hosting Deploy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Firebase Hosting - Quick Deploy" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH to include Node.js
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "Environment configured" -ForegroundColor Gray
Write-Host ""

# Deploy Firestore rules first
Write-Host "[1/2] Deploying Firestore rules..." -ForegroundColor Yellow
.\node_modules\.bin\firebase.cmd deploy --only firestore:rules --project app-pilot-60ce3

if ($LASTEXITCODE -ne 0) {
    Write-Host "Firestore rules deployment failed!" -ForegroundColor Red
    Write-Host "Continuing with hosting deployment..." -ForegroundColor Yellow
}
else {
    Write-Host "Firestore rules deployed!" -ForegroundColor Green
}

Write-Host ""

# Deploy hosting
Write-Host "[2/2] Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "Deploying from: web-build/" -ForegroundColor Gray
.\node_modules\.bin\firebase.cmd deploy --only hosting --project app-pilot-60ce3

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deployment Success!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://app-pilot-60ce3.web.app" -ForegroundColor Cyan
Write-Host "  https://app-pilot-60ce3.firebaseapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "View Firebase Console:" -ForegroundColor Yellow
Write-Host "  https://console.firebase.google.com/project/app-pilot-60ce3/hosting" -ForegroundColor Cyan
Write-Host ""
