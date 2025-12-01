param(
  [string]$Token
)

Write-Host "`n=== Web Build (Expo) ===" -ForegroundColor Cyan
$node = "C:\Program Files\nodejs\node.exe"
$expoCli = Join-Path $PSScriptRoot "..\node_modules\expo\bin\cli.js"

if (-not (Test-Path $node)) { Write-Error "Node not found at $node"; exit 1 }
if (-not (Test-Path $expoCli)) { Write-Error "Expo CLI not found at $expoCli. Run npm install"; exit 1 }

& $node $expoCli export --platform web -o "web-build"; if ($LASTEXITCODE -ne 0) { Write-Error "Expo web export failed"; exit 1 }

Write-Host "`n=== Deploy to Firebase Hosting ===" -ForegroundColor Cyan
$firebaseCli = Join-Path $PSScriptRoot "..\node_modules\firebase-tools\lib\bin\firebase.js"
if (-not (Test-Path $firebaseCli)) { Write-Error "firebase-tools not found. Run npm install"; exit 1 }

$deployArgs = @("deploy","--only","hosting","--project","app-pilot-60ce3")
if ($Token) { $deployArgs += @("--token", $Token) }

& $node $firebaseCli @deployArgs; $code=$LASTEXITCODE
if ($code -eq 0) {
  Write-Host "`n✅ Deployed: https://app-pilot-60ce3.web.app" -ForegroundColor Green
} else {
  Write-Error "Deployment failed (exit $code). If auth error, run: firebase login or pass -Token <CI_TOKEN>"
  exit $code
}
