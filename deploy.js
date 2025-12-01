#!/usr/bin/env node

/**
 * Firebase Deployment Script
 * Usage: node deploy.js <token>
 * 
 * This script deploys the web-build to Firebase Hosting using a CI token
 */

const { spawn } = require('child_process');
const path = require('path');

const projectPath = __dirname;
const token = process.argv[2];

if (!token) {
  console.error('❌ Error: Token not provided');
  console.log('\nUsage: node deploy.js <firebase-token>');
  console.log('\nTo get your token, run:');
  console.log('  firebase login:ci');
  console.log('\nThen use the token like:');
  console.log('  node deploy.js YOUR_TOKEN_HERE');
  process.exit(1);
}

console.log('🚀 Starting Firebase deployment...');
console.log(`📁 Project: ${projectPath}`);
console.log(`🔧 Using token: ${token.substring(0, 20)}...`);

// Run firebase deploy with token
const deploy = spawn('npx', [
  'firebase',
  'deploy',
  '--only', 'hosting',
  '--token', token
], {
  cwd: projectPath,
  stdio: 'inherit'
});

deploy.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Deployment successful!');
    console.log('\n📍 Your app is now live at:');
    console.log('   https://app-pilot-60ce3.web.app');
  } else {
    console.log(`\n❌ Deployment failed with exit code ${code}`);
    process.exit(code);
  }
});

deploy.on('error', (error) => {
  console.error('❌ Deployment error:', error.message);
  process.exit(1);
});
