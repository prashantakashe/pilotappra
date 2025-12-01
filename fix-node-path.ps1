# Attempt to locate Node.js installation and add it to PATH (current user)
$possiblePaths = @(
  "$Env:ProgramFiles\nodejs",
  "$Env:ProgramFiles(x86)\nodejs",
  "$Env:LocalAppData\Programs\nodejs",
  "C:\Program Files\nodejs",
  "C:\Program Files (x86)\nodejs",
  "$Env:LOCALAPPDATA\Microsoft\WindowsApps" # winget/MSIX installs sometimes link here
)

$nodePath = $null
foreach ($p in $possiblePaths) {
  if (Test-Path (Join-Path $p 'node.exe')) { $nodePath = $p; break }
}

if (-not $nodePath) {
  Write-Host "Node.exe not found in common locations."
  Write-Host "Please install Node LTS via: winget install OpenJS.NodeJS.LTS"
  exit 1
}

Write-Host "Found Node at: $nodePath"

# Read current user PATH
$regPath = 'HKCU:\Environment'
$envPath = (Get-ItemProperty -Path $regPath -Name Path -ErrorAction SilentlyContinue).Path
if (-not $envPath) { $envPath = '' }

# Check if already present
$already = $envPath.Split(';') | Where-Object { $_ -eq $nodePath }
if ($already) {
  Write-Host "PATH already contains: $nodePath"
} else {
  $newPath = if ($envPath) { $envPath + ';' + $nodePath } else { $nodePath }
  Set-ItemProperty -Path $regPath -Name Path -Value $newPath
  Write-Host "Added to PATH for current user: $nodePath"
  Write-Host "You must restart VS Code or sign out/in for changes to take effect."
}

Write-Host "Verifying node/npm availability in this session..."
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($nodeCmd -and $npmCmd) {
  node -v
  npm -v
} else {
  Write-Host "Node/npm may not be available until you restart VS Code or your shell."
}