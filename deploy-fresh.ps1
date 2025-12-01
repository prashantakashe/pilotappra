# Fresh Firebase Hosting Deployment Script
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Firebase Hosting - Fresh Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Step 1: Build the web app
Write-Host "Step 1: Building web app..." -ForegroundColor Yellow
Write-Host "Running: npx expo export --platform web" -ForegroundColor Gray

# Clean previous build
if (Test-Path "web-build") {
    Write-Host "Cleaning previous build..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "web-build"
}

# Export for web
npx expo export --platform web --output-dir web-build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Firestore rules
Write-Host "Step 2: Deploying Firestore rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

if ($LASTEXITCODE -ne 0) {
    Write-Host "Firestore rules deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Firestore rules deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy hosting
Write-Host "Step 3: Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "Hosting deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now live at:" -ForegroundColor Yellow
Write-Host "https://app-pilot-60ce3.web.app" -ForegroundColor Cyan
Write-Host "https://app-pilot-60ce3.firebaseapp.com" -ForegroundColor Cyan
Write-Host ""
