# Collect quick system performance snapshot
Write-Host '--- TOP CPU (15) ---'
Get-Process | Sort-Object CPU -Descending | Select-Object -First 15 Name, CPU, PM | Format-Table -AutoSize

Write-Host "`n--- TOP MEMORY (15) ---"
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 15 Name,@{n='MemoryMB';e={[math]::Round($_.WorkingSet/1MB,1)}} | Format-Table -AutoSize

Write-Host "`n--- DISK FREE ---"
Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{n='FreeGB';e={[math]::Round($_.Free/1GB,1)}},@{n='UsedGB';e={[math]::Round(($_.Used)/1GB,1)}} | Format-Table -AutoSize

Write-Host "`n--- NODE & NPM VERSIONS ---"
node -v
npm -v

Write-Host "`n--- VS CODE EXTENSIONS COUNT (Installed) ---"
code --list-extensions | Measure-Object | Select-Object Count | Format-Table -HideTableHeaders

Write-Host "`nDone. Consider disabling heavy extensions shown in VS Code: Developer: Show Running Extensions."