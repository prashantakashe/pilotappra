# Firebase Login and Deploy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Firebase Authentication & Deploy" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Step 1: Login to Firebase
Write-Host "Step 1: Firebase Login" -ForegroundColor Yellow
Write-Host "Opening browser for authentication..." -ForegroundColor Gray
Write-Host ""
.\node_modules\.bin\firebase.cmd login --reauth

if ($LASTEXITCODE -ne 0) {
    Write-Host "Login failed! Please try again." -ForegroundColor Red
    exit 1
}

Write-Host "Login successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Firestore rules
Write-Host "Step 2: Deploying Firestore rules..." -ForegroundColor Yellow
.\node_modules\.bin\firebase.cmd deploy --only firestore:rules --project app-pilot-60ce3

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Firestore rules deployment failed!" -ForegroundColor Yellow
    Write-Host "Continuing with hosting..." -ForegroundColor Gray
}
else {
    Write-Host "Firestore rules deployed!" -ForegroundColor Green
}

Write-Host ""

# Step 3: Deploy hosting
Write-Host "Step 3: Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "Source: web-build/" -ForegroundColor Gray
.\node_modules\.bin\firebase.cmd deploy --only hosting --project app-pilot-60ce3

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Hosting deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now live at:" -ForegroundColor Yellow
Write-Host "  🌐 https://app-pilot-60ce3.web.app" -ForegroundColor Cyan
Write-Host "  🌐 https://app-pilot-60ce3.firebaseapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Firebase Console:" -ForegroundColor Yellow
Write-Host "  https://console.firebase.google.com/project/app-pilot-60ce3/hosting" -ForegroundColor Cyan
Write-Host ""
