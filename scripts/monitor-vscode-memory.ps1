# Monitors VS Code and related Node/TypeScript processes for high memory usage
# Saves a timestamped report under scripts/monitor-logs

$ErrorActionPreference = 'SilentlyContinue'

# Ensure log directory exists
$logDir = Join-Path $PSScriptRoot 'monitor-logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

# Collect VS Code + Node/TS processes
$procs = Get-Process | Where-Object {
  $_.ProcessName -match 'Code|CodeHelper|node|tsserver|electron|Terminal|powershell' 
}

# Map common roles
function Get-Role($p) {
  if ($p.ProcessName -match 'Code') { return 'VSCode' }
  if ($p.ProcessName -match 'electron') { return 'VSCode-Electron' }
  if ($p.ProcessName -match 'node') { return 'Node/Extension Host' }
  if ($p.ProcessName -match 'tsserver') { return 'TypeScript Server' }
  if ($p.ProcessName -match 'powershell|Terminal') { return 'Terminal' }
  return $p.ProcessName
}

# Build enriched objects
$items = $procs | ForEach-Object {
  [PSCustomObject]@{
    PID = $_.Id
    Name = $_.ProcessName
    Role = Get-Role $_
    CPU = '{0:N1} %' -f ($_.CPU)
    MemoryMB = [math]::Round($_.WorkingSet64 / 1MB, 1)
    StartTime = $_.StartTime
    MainWindowTitle = $_.MainWindowTitle
  }
}

# Flag heavy processes
$thresholdMB = 300
$heavy = $items | Where-Object { $_.MemoryMB -ge $thresholdMB } | Sort-Object MemoryMB -Descending

# Group summary
$grouped = $items | Group-Object Role | ForEach-Object {
  [PSCustomObject]@{
    Role = $_.Name
    Count = $_.Count
    TotalMB = [math]::Round(($_.Group | Measure-Object -Property MemoryMB -Sum).Sum, 1)
    MaxMB = [math]::Round(($_.Group | Measure-Object -Property MemoryMB -Maximum).Maximum, 1)
  }
} | Sort-Object TotalMB -Descending

# Write to log file
$ts = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$logFile = Join-Path $logDir "vscode-memory-$ts.txt"

"=== VS Code Memory Report ($ts) ===" | Out-File -FilePath $logFile -Encoding utf8
"" | Out-File -FilePath $logFile -Append
"Top heavy processes (>${thresholdMB} MB):" | Out-File -FilePath $logFile -Append
$heavy | Format-Table -AutoSize | Out-String | Out-File -FilePath $logFile -Append
"" | Out-File -FilePath $logFile -Append
"Grouped totals by role:" | Out-File -FilePath $logFile -Append
$grouped | Format-Table -AutoSize | Out-String | Out-File -FilePath $logFile -Append
"" | Out-File -FilePath $logFile -Append
"Hint: Extension hosts appear as 'node'. Consider disabling heavy extensions (GitLens, Python, YAML, Remote)." | Out-File -FilePath $logFile -Append

# Also print to console for immediate visibility
$heavy | Format-Table -AutoSize
$grouped | Format-Table -AutoSize

Write-Host "Saved report to: $logFile"