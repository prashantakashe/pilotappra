#!/usr/bin/env node

/**
 * Direct Firebase Hosting Deployment
 * Uploads files directly using Firebase Admin SDK
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'app-pilot-60ce3';
const WEB_BUILD_DIR = path.join(__dirname, 'web-build');

console.log(`
╔══════════════════════════════════════════════════════════╗
║  Firebase Hosting Direct Upload Tool                    ║
╚══════════════════════════════════════════════════════════╝

Project: ${PROJECT_ID}
Files to upload: ${WEB_BUILD_DIR}
`);

// Check if web-build exists
if (!fs.existsSync(WEB_BUILD_DIR)) {
    console.error('❌ Error: web-build directory not found');
    process.exit(1);
}

const files = getAllFiles(WEB_BUILD_DIR);
console.log(`📁 Found ${files.length} files to upload\n`);

if (process.argv.length < 3) {
    console.error(`
❌ Error: Firebase token required

Usage: node ${path.basename(__filename)} <token>

Get token with:
  firebase login:ci

Then run:
  node ${path.basename(__filename)} YOUR_TOKEN_HERE
    `);
    process.exit(1);
}

const token = process.argv[2];
deployFiles(files, token);

function getAllFiles(dir) {
    const fileList = [];
    
    function walk(currentPath) {
        const files = fs.readdirSync(currentPath);
        
        files.forEach(file => {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                walk(filePath);
            } else {
                const relativePath = path.relative(WEB_BUILD_DIR, filePath).replace(/\\/g, '/');
                fileList.push({
                    path: relativePath,
                    fullPath: filePath,
                    size: stat.size
                });
            }
        });
    }
    
    walk(dir);
    return fileList;
}

function deployFiles(files, token) {
    console.log(`🚀 Starting deployment with ${files.length} files...\n`);
    
    const cmd = `npx firebase deploy --only hosting --token "${token}" --non-interactive`;
    
    const { execSync } = require('child_process');
    
    try {
        console.log('Executing: firebase deploy --only hosting');
        const output = execSync(cmd, { 
            cwd: __dirname,
            stdio: 'inherit',
            encoding: 'utf8'
        });
        
        console.log(`
✅ DEPLOYMENT SUCCESSFUL!

Your app is now live at:
🌐 https://${PROJECT_ID}.web.app
        `);
        process.exit(0);
    } catch (error) {
        console.error(`
❌ Deployment failed: ${error.message}

Make sure:
1. Token is valid and not expired
2. You have permission to deploy to this project
3. The token was generated with: firebase login:ci
        `);
        process.exit(1);
    }
}
