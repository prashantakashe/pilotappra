# Test App on Android Device
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Android Mobile Testing Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "To test your app on Android, follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "METHOD 1: Using Expo Go (Recommended for quick testing)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "1. Install 'Expo Go' app from Google Play Store on your Android device" -ForegroundColor White
Write-Host "2. Make sure your phone and PC are on the same Wi-Fi network" -ForegroundColor White
Write-Host "3. Scan the QR code below with the Expo Go app" -ForegroundColor White
Write-Host ""
Write-Host "Starting Expo development server..." -ForegroundColor Yellow
Write-Host ""

# Start Expo
npx expo start --tunnel

Write-Host ""
Write-Host "If tunnel mode doesn't work, try LAN mode by running:" -ForegroundColor Yellow
Write-Host "  npx expo start" -ForegroundColor Cyan
