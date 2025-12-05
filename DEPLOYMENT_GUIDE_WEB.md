# Web Deployment Guide

## 🚀 Quick Deployment

### Method 1: Using the Deploy Script (Recommended)

```powershell
# Navigate to project directory
cd "E:\prashant\APP_PILOT PROJECT"

# Run deployment script
.\deploy-web.ps1
```

This script automatically handles:
- ✅ Builds web app (`npx expo export --platform web`)
- ✅ Copies `dist` to `web-build` (including `_expo` folder)
- ✅ **Fixes _expo paths** (changes `/_expo` → `./_expo`) ⚠️ CRITICAL
- ✅ Adds `.nojekyll` file for GitHub Pages
- ✅ Stages all changes (`git add .`)
- ✅ Commits with timestamp
- ✅ Pushes to GitHub (`git push origin main`)

### Method 2: Using Deploy Button in Settings

1. Open app in browser
2. Navigate to **Settings**
3. Click **"🚀 Deploy to Web"** button
4. Follow displayed instructions
5. Command automatically copied to clipboard

### Method 3: Manual Deployment

```powershell
# 1. Build web app
npx expo export --platform web

# 2. Clean and copy to web-build
Remove-Item web-build/* -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "dist" -Force | Copy-Item -Destination "web-build" -Recurse -Force

# 3. Fix paths in index.html (CRITICAL!)
$content = Get-Content web-build/index.html -Raw
$content = $content -replace '="/_expo/', '="./_expo/'
Set-Content web-build/index.html -Value $content -NoNewline

# 4. Add .nojekyll file
New-Item -ItemType File -Path "web-build/.nojekyll" -Force

# 5. Deploy
git add .
git commit -m "Deploy: Manual deployment"
git push origin main
```

## 📋 What Happens During Deployment

1. **Build Process** (local)
   - Metro bundler exports to `dist` folder
   - JavaScript bundles created in `dist/_expo/static/js/web/`
   - Assets copied to `dist/assets/`

2. **Copy to web-build** (local)
   - All `dist` contents copied to `web-build`
   - **CRITICAL**: Uses `Get-ChildItem -Force` to copy hidden `_expo` folder
   - Regular `Copy-Item dist/*` misses folders starting with `_`

3. **Path Fixing** (local) ⚠️ **MOST IMPORTANT**
   - Changes `src="/_expo/` → `src="./_expo/` in `index.html`
   - Absolute paths don't work on GitHub Pages subdirectories
   - Relative paths required for `https://username.github.io/repo/`

4. **GitHub Pages Setup** (local)
   - `.nojekyll` file prevents Jekyll processing
   - Without it, `_expo` folder ignored (Jekyll treats `_` folders as hidden)

5. **Git Push** (local → remote)
   - Commits all changes including `web-build` folder
   - Pushes to `main` branch
   - Triggers GitHub Actions workflow

6. **GitHub Actions** (remote)
   - Workflow: `.github/workflows/deploy.yml`
   - Checks out code
   - Uploads `web-build` folder to GitHub Pages
   - No build step needed (already built locally)

7. **Live Update** (GitHub Pages)
   - Site updates at: https://prashantakashe.github.io/pilotappra/
   - Takes ~30-60 seconds

## ⚠️ CRITICAL: Path Issues & Solutions

### Problem 1: Missing _expo Folder

**Symptom**: White screen, console shows 404 errors for JavaScript files

**Cause**: `Copy-Item dist/*` doesn't copy folders starting with underscore

**Solution**: Use `Get-ChildItem -Force` instead
```powershell
# ❌ WRONG - misses _expo folder
Copy-Item -Recurse dist/* web-build/

# ✅ CORRECT - copies all including _expo
Get-ChildItem -Path "dist" -Force | Copy-Item -Destination "web-build" -Recurse -Force
```

### Problem 2: Absolute Path in index.html

**Symptom**: Site loads but shows "not available" or 404 for JavaScript

**Cause**: `index.html` has `src="/_expo/..."` (absolute path)

**Solution**: Change to relative path `./_expo/`
```html
<!-- ❌ WRONG - absolute path -->
<script src="/_expo/static/js/web/AppEntry-xxx.js" defer></script>

<!-- ✅ CORRECT - relative path -->
<script src="./_expo/static/js/web/AppEntry-xxx.js" defer></script>
```

### Problem 3: Jekyll Processing

**Symptom**: `_expo` folder not accessible, 404 errors

**Cause**: GitHub Pages uses Jekyll by default, which ignores `_` folders

**Solution**: Add `.nojekyll` file to `web-build` root
```powershell
New-Item -ItemType File -Path "web-build/.nojekyll" -Force
```

## 🔍 Troubleshooting

### Site Shows White Screen

1. **Check Browser Console** (F12)
   - Look for 404 errors
   - Note which files are missing

2. **Verify _expo Folder Exists**
   ```powershell
   Test-Path web-build/_expo
   ```
   - Should return `True`
   - If `False`, copy command failed

3. **Check index.html Path**
   ```powershell
   Get-Content web-build/index.html | Select-String "_expo"
   ```
   - Should show `./_expo/` (relative)
   - If shows `/_expo/`, path fixing failed

4. **Verify .nojekyll Exists**
   ```powershell
   Test-Path web-build/.nojekyll
   ```
   - Should return `True`

### Deployment Failed on GitHub

1. **Check GitHub Actions**
   - Visit: https://github.com/prashantakashe/pilotappra/actions
   - Click failed workflow
   - Review error logs

2. **Common Issues**
   - Workflow file syntax error
   - Missing permissions
   - Repository settings

### Changes Not Showing

1. **Clear Browser Cache**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Wait 1-2 Minutes**
   - GitHub Pages needs time to deploy
   - Check Actions page for completion

3. **Verify Latest Commit**
   ```powershell
   git log -1 --oneline
   ```
   - Should show your latest commit

## 📁 Files Involved

- **`deploy-web.ps1`**: Automated deployment script
- **`.github/workflows/deploy.yml`**: GitHub Actions workflow
- **`web-build/`**: Deployment folder (committed to git)
- **`dist/`**: Build output from Expo (not committed)
- **`web-build/index.html`**: Entry point (paths must be relative)
- **`web-build/.nojekyll`**: Prevents Jekyll processing
- **`web-build/_expo/`**: JavaScript bundles (CRITICAL folder)

## 🎯 Best Practices

1. **Always Use deploy-web.ps1 Script**
   - Handles all path fixes automatically
   - Prevents common errors
   - Consistent deployment process

2. **Test Locally First**
   - Run `npx expo start` and test
   - Verify all features work
   - Check console for errors

3. **Commit Before Deploying**
   - Stage source code changes first
   - Deployment script handles build files
   - Easier to track changes

4. **Monitor GitHub Actions**
   - Always check if deployment succeeded
   - Green checkmark = success
   - Red X = failed (check logs)

5. **Clear Cache After Deployment**
   - Browser caches aggressively
   - Hard refresh shows latest version
   - Test in incognito if needed

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| **Deploy (Automated)** | `.\deploy-web.ps1` |
| **Build Only** | `npx expo export --platform web` |
| **Check Status** | `.\check-deployment-status.ps1` |
| **View Logs** | [GitHub Actions](https://github.com/prashantakashe/pilotappra/actions) |
| **Live Site** | [pilotappra](https://prashantakashe.github.io/pilotappra/) |

---

**Last Updated**: December 5, 2025  
**Version**: 2.0 (Fixed _expo path issues)
