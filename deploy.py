#!/usr/bin/env python3
"""
Firebase Hosting Direct Upload Script
Uses the Firebase Hosting API to upload files without CLI
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def get_token_from_file():
    """Try to read token from local firebase config"""
    home = Path.home()
    firebase_config = home / '.config' / 'firebase' / 'tokens.json'
    
    if firebase_config.exists():
        try:
            with open(firebase_config) as f:
                data = json.load(f)
                if 'app-pilot-60ce3' in data:
                    return data['app-pilot-60ce3']
                # Get first available token
                for project, token in data.items():
                    return token
        except:
            pass
    return None

def deploy_with_cli(token):
    """Deploy using Firebase CLI with token"""
    print("🚀 Deploying to Firebase Hosting...")
    
    cmd = [
        'firebase',
        'deploy',
        '--only', 'hosting',
        '--token', token,
        '--non-interactive'
    ]
    
    result = subprocess.run(cmd, cwd='E:\\APP_PILOT PROJECT', capture_output=True, text=True)
    
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    return result.returncode == 0

def main():
    print("""
╔═══════════════════════════════════════════════════════╗
║  Firebase Hosting Deployment Script                  ║
╚═══════════════════════════════════════════════════════╝
    """)
    
    # Check if token provided as argument
    token = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Try to read from local config
    if not token:
        token = get_token_from_file()
        if token:
            print("✅ Found token in local Firebase config")
    
    if not token:
        print("""
❌ No token found!

Please provide token as argument:
  python deploy.py YOUR_TOKEN_HERE
        """)
        return 1
    
    print(f"Using token: {token[:20]}...")
    
    if deploy_with_cli(token):
        print("""
✅ DEPLOYMENT SUCCESSFUL!

Your app is live at:
  https://app-pilot-60ce3.web.app
        """)
        return 0
    else:
        print("❌ Deployment failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
