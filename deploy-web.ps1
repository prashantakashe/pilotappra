# deploy-web.ps1
# Auto-deployment script for web changes to GitHub Pages

param(
    [string]$Message = "Deploy: Auto-commit at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for changes
Write-Host "📋 Checking for changes..." -ForegroundColor Yellow
git status --short
$hasChanges = git status --short
if (-not $hasChanges) {
    Write-Host "✅ No changes to deploy" -ForegroundColor Green
    exit 0
}

# Step 2: Stage all changes
Write-Host ""
Write-Host "📦 Staging changes..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to stage changes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes staged" -ForegroundColor Green

# Step 3: Commit changes
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes committed" -ForegroundColor Green

# Step 4: Push to GitHub
Write-Host ""
Write-Host "🌐 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to GitHub successfully" -ForegroundColor Green

# Step 5: Success message
Write-Host ""
Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitor deployment progress at:" -ForegroundColor Cyan
Write-Host "   https://github.com/prashantakashe/pilotappra/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Your site will be updated at:" -ForegroundColor Cyan
Write-Host "   https://prashantakashe.github.io/pilotappra/" -ForegroundColor Blue
Write-Host ""
Write-Host "⏱️  Deployment typically takes 2-3 minutes to complete" -ForegroundColor Yellow

exit 0
