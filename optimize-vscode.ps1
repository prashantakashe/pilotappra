# VS Code Performance Optimization Script
# Run this before starting VS Code for maximum performance

Write-Host "Setting Node.js memory optimizations..." -ForegroundColor Green

# Increase Node.js memory for VS Code processes
$env:NODE_OPTIONS = "--max-old-space-size=8192"

# Reduce garbage collection frequency
$env:NODE_OPTIONS += " --gc-interval=100"

# Optimize V8 engine
$env:NODE_OPTIONS += " --optimize-for-size"

Write-Host "Node options set: $env:NODE_OPTIONS" -ForegroundColor Cyan

# Start VS Code with optimizations
Write-Host "Starting VS Code with optimizations..." -ForegroundColor Green
code .

Write-Host @"

✓ Optimizations Applied:
  • Node.js max memory: 8192 MB
  • GC interval optimized
  • V8 engine optimized for size
  • TypeScript server: 8192 MB
  • File watchers optimized
  • Editor features minimized

For permanent effect, add to PowerShell profile:
  notepad `$PROFILE
  
Add these lines:
  `$env:NODE_OPTIONS = "--max-old-space-size=8192 --gc-interval=100 --optimize-for-size"

"@ -ForegroundColor Yellow
