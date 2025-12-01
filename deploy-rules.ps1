# Deploy Firestore Rules
Write-Host "Deploying Firestore Security Rules..." -ForegroundColor Cyan

try {
    # Get the path to firebase CLI
    $firebasePath = Join-Path $PSScriptRoot "node_modules\.bin\firebase.cmd"
    
    if (Test-Path $firebasePath) {
        Write-Host "Found Firebase CLI at: $firebasePath" -ForegroundColor Green
        & $firebasePath deploy --only firestore:rules
    } else {
        Write-Host "Firebase CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g firebase-tools
        firebase deploy --only firestore:rules
    }
    
    Write-Host "`n✅ Firestore rules deployed successfully!" -ForegroundColor Green
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Write-Host "`n❌ Error deploying rules: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
