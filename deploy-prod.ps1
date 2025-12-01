#!/usr/bin/env powershell

<#
.SYNOPSIS
Firebase Deployment Setup & Execution Script
.DESCRIPTION
This script handles Firebase authentication and deploys the app
.PARAMETER Token
Firebase CI token (optional - will prompt if not provided)
#>

param(
    [string]$Token
)

Write-Host "
╔════════════════════════════════════════════════════════════╗
║   Firebase Deployment Script - APP PILOT                  ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Check if token is provided
if (-not $Token) {
    Write-Host "
📋 STEP 1: Get Firebase Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To deploy, you need a Firebase CI token.

Instructions:
1. Run this command in PowerShell:
   " -ForegroundColor Yellow
   
    Write-Host "   firebase login:ci" -ForegroundColor Green
    
    Write-Host "
2. A browser will open - sign in with: prashant@univastu.om
3. Copy the token displayed in console
4. Run this script again with:
   " -ForegroundColor Yellow
    
    Write-Host "   .\deploy-prod.ps1 -Token 'YOUR_TOKEN_HERE'" -ForegroundColor Green
    
    Write-Host "
Or continue below to get token now..." -ForegroundColor Yellow
    
    Write-Host "
Getting Firebase CI token..." -ForegroundColor Cyan
    $result = firebase login:ci --no-localhost 2>&1
    
    Write-Host $result
    
    exit
}

Write-Host "
✅ Token Provided
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Token: $($Token.Substring(0, 20))...
" -ForegroundColor Green

# Set project
Write-Host "
📍 Setting Firebase Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

firebase use app-pilot-60ce3 --token $Token
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not set project" -ForegroundColor Yellow
}

# Deploy hosting
Write-Host "
🚀 Deploying to Firebase Hosting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

firebase deploy --only hosting --token $Token

if ($LASTEXITCODE -eq 0) {
    Write-Host "
✅ DEPLOYMENT SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your app is now live at:
🌐 https://app-pilot-60ce3.web.app

📊 Next Steps:
  1. Open the URL above in your browser
  2. Wait 30-60 seconds for CDN caching
  3. If blank, do a hard refresh (Ctrl+Shift+R)
  4. Check browser console (F12) for errors

📞 Support:
  Firebase Console: https://console.firebase.google.com/
  Project: app-pilot-60ce3
" -ForegroundColor Green
} else {
    Write-Host "
❌ DEPLOYMENT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check the error above and try again.
Make sure your token is valid and hasn't expired.
" -ForegroundColor Red
    exit 1
}
