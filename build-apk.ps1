# Build APK for Android
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Android APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "This will build a production APK that you can install on any Android device." -ForegroundColor Yellow
Write-Host ""
Write-Host "Step 1: Installing EAS CLI..." -ForegroundColor Cyan
npm install -g eas-cli

Write-Host ""
Write-Host "Step 2: Building APK (this may take 10-15 minutes)..." -ForegroundColor Cyan
Write-Host "You will be prompted to log in with your Expo account." -ForegroundColor Yellow
Write-Host "If you don't have an Expo account, you can create one at https://expo.dev/signup" -ForegroundColor Yellow
Write-Host ""

# Build APK
eas build --platform android --profile preview --local

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Local build failed. Trying cloud build..." -ForegroundColor Yellow
    Write-Host ""
    eas build --platform android --profile preview
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host " Build Queued!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your APK is being built in the cloud." -ForegroundColor Yellow
        Write-Host "You can download it from the link that will be provided." -ForegroundColor Yellow
        Write-Host "Or check your builds at: https://expo.dev" -ForegroundColor Cyan
    }
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Build Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK file has been created locally." -ForegroundColor Yellow
    Write-Host "Transfer the APK to your Android device and install it." -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
