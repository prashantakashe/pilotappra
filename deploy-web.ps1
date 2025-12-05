# deploy-web.ps1
# Auto-deployment script for web changes to GitHub Pages

param(
    [string]$Message = "Deploy: Auto-commit at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WEB DEPLOYMENT TO GITHUB PAGES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build web app
Write-Host "[1/5] Building web application..." -ForegroundColor Yellow
npx expo export --platform web 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Write-Host "Run manually: npx expo export --platform web" -ForegroundColor Gray
    exit 1
}

# Copy dist to web-build (Metro exports to dist, but GitHub Pages uses web-build)
if (Test-Path "dist") {
    if (-not (Test-Path "web-build")) {
        New-Item -ItemType Directory -Path "web-build" -Force | Out-Null
    }
    # Clean web-build first
    Remove-Item web-build/* -Recurse -Force -ErrorAction SilentlyContinue
    # Copy all dist contents including hidden folders
    Get-ChildItem -Path "dist" -Force | Copy-Item -Destination "web-build" -Recurse -Force -ErrorAction SilentlyContinue
    # Add .nojekyll file for GitHub Pages
    New-Item -ItemType File -Path "web-build/.nojekyll" -Force | Out-Null
}

Write-Host "SUCCESS: Build completed" -ForegroundColor Green
Write-Host ""

# Step 2: Check for changes
Write-Host "[2/5] Checking for changes..." -ForegroundColor Yellow
$hasChanges = git status --short
if (-not $hasChanges) {
    Write-Host "INFO: No changes to deploy" -ForegroundColor Yellow
    exit 0
}
Write-Host "SUCCESS: Changes detected" -ForegroundColor Green
Write-Host ""

# Step 3: Stage all changes
Write-Host "[3/5] Staging changes..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to stage changes" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Changes staged" -ForegroundColor Green
Write-Host ""

# Step 4: Commit changes
Write-Host "[4/5] Committing changes..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to commit" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Changes committed" -ForegroundColor Green
Write-Host ""

# Step 5: Push to GitHub
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT INITIATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor deployment:" -ForegroundColor Cyan
Write-Host "  https://github.com/prashantakashe/pilotappra/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "Live site (~1 minute):" -ForegroundColor Cyan
Write-Host "  https://prashantakashe.github.io/pilotappra/" -ForegroundColor Blue
Write-Host ""
Write-Host "TIP: Clear browser cache (Ctrl+Shift+R) to see changes" -ForegroundColor Yellow
Write-Host ""

exit 0
