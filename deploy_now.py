#!/usr/bin/env python3
"""Create remote dir and deploy game - reads creds from files."""
import os, paramiko

HOST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.server_ip')
PASS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ssh_pass')

with open(HOST_FILE) as f:
    HOST = f.read().strip()
if os.path.exists(PASS_FILE):
    with open(PASS_FILE) as f:
        PASS = f.read().strip()
else:
    PASS = os.getenv('SERVER_PASSWORD', '')

USER = 'root'
LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs', 'card-game.html')
REMOTE_DIR = '/var/www/game'
REMOTE_FILE = REMOTE_DIR + '/index.html'

print(f"Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15, allow_agent=False, look_for_keys=False)
print("Connected!")

print(f"Creating directory {REMOTE_DIR}...")
stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {REMOTE_DIR}')
stdout.channel.recv_exit_status()

print(f"Uploading...")
LOCAL_GL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs', 'game-logic.js')
sftp = ssh.open_sftp()
sftp.put(LOCAL, REMOTE_FILE)
sftp.put(LOCAL_GL, REMOTE_DIR + '/game-logic.js')
sftp.close()

print("Setting up nginx...")
cmds = [
    f'mkdir -p {REMOTE_DIR}',
    'which nginx || yum install -y nginx',
    f'cat > /etc/nginx/conf.d/game.conf << CONFEOF\nserver {{\n    listen 80;\n    server_name _;\n    root {REMOTE_DIR};\n    index index.html;\n    location / {{\n        try_files $uri $uri/ /index.html;\n    }}\n}}\nCONFEOF',
    'systemctl start nginx',
    'systemctl enable nginx',
    'firewall-cmd --permanent --add-service=http 2>/dev/null; firewall-cmd --reload 2>/dev/null; true'
]
for cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    if out:
        print(f"  {out}")

ssh.close()
print(f"\nDone! Visit: http://{HOST}")
