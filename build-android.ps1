# Build Android APK for Testing
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Android APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Building APK using EAS Build (Expo Application Services)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will create a production-ready APK that you can install on your Android device." -ForegroundColor Gray
Write-Host ""

# Build APK
Write-Host "Running: eas build --platform android --profile preview" -ForegroundColor Gray
npx eas-cli build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Build Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Download the APK from the link shown above and install it on your Android device." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "Build failed! Trying alternative method..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting Expo Go method instead..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Yellow
    Write-Host "1. Install 'Expo Go' app from Google Play Store on your Android device" -ForegroundColor White
    Write-Host "2. Make sure your phone and PC are on the same Wi-Fi network" -ForegroundColor White
    Write-Host "3. Scan the QR code that will appear below with Expo Go app" -ForegroundColor White
    Write-Host ""
    npx expo start --android
}
