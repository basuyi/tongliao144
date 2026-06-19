#!/usr/bin/env python3
"""Wrapper to create lightweight server with embedded credentials from project config."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Credentials from project's auto-deploy.bat configuration
AK_ID = os.environ.get('AK_ID', '')
AK_SECRET = os.environ.get('AK_SECRET', '')

if not AK_ID:
    # Read from project config file
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ak_config')
    if os.path.exists(config_path):
        with open(config_path) as f:
            lines = f.read().strip().split('\n')
            AK_ID = lines[0].strip()
            AK_SECRET = lines[1].strip() if len(lines) > 1 else ''

if not AK_ID or not AK_SECRET:
    print("[ERROR] No credentials found. Please create .ak_config file with:")
    print("  Line 1: AccessKey ID")
    print("  Line 2: AccessKey Secret")
    sys.exit(1)

from create_lightweight import create_lightweight_server
result = create_lightweight_server(AK_ID, AK_SECRET)
if result:
    # Save the public IP for deployment
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.server_ip'), 'w') as f:
        f.write(result.get('public_ip', ''))
    print(f"\n[OK] Server IP saved to .server_ip")
