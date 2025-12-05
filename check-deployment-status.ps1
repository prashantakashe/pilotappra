# check-deployment-status.ps1
# Quick script to check GitHub Pages deployment status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Pages Deployment Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check latest commit
Write-Host "Latest Commit:" -ForegroundColor Yellow
$latestCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
if ($latestCommit) {
    Write-Host "   $latestCommit" -ForegroundColor Green
} else {
    Write-Host "   Unable to fetch commit info" -ForegroundColor Red
}

Write-Host ""
Write-Host "Useful Links:" -ForegroundColor Yellow
Write-Host "   GitHub Actions:" -ForegroundColor Cyan
Write-Host "      https://github.com/prashantakashe/pilotappra/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "   Live Website:" -ForegroundColor Cyan  
Write-Host "      https://prashantakashe.github.io/pilotappra/" -ForegroundColor Blue
Write-Host ""

Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "   - Deployment takes 2-3 minutes after push" -ForegroundColor Gray
Write-Host "   - Clear browser cache (Ctrl+Shift+R) to see changes" -ForegroundColor Gray
Write-Host "   - Check Actions page for build logs if issues occur" -ForegroundColor Gray
Write-Host ""
