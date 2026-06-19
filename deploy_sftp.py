#!/usr/bin/env python3
"""Deploy game to server via SFTP."""
import os
import sys
import paramiko

SERVER_IP = os.getenv('SERVER_IP', '')
REMOTE_PATH = '/var/www/game/index.html'
LOCAL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs', 'card-game.html')

SSH_PASS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ssh_pass')

if not os.path.exists(SSH_PASS_FILE):
    ssh_pass = os.getenv('SERVER_PASSWORD', '')
else:
    with open(SSH_PASS_FILE) as f:
        ssh_pass = f.read().strip()

print(f"Connecting to {SERVER_IP}...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username='root', password=ssh_pass, timeout=10)
    
    ssh.exec_command('mkdir -p /var/www/game')
    
    sftp = ssh.open_sftp()
    print(f"Uploading {LOCAL_FILE} -> {REMOTE_PATH}")
    sftp.put(LOCAL_FILE, REMOTE_PATH)
    sftp.close()
    ssh.close()
    
    print()
    print("=" * 50)
    print("  部署成功!")
    print(f"  访问: http://{SERVER_IP}")
    print("=" * 50)
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
