#!/usr/bin/env python3
"""Create remote dir and deploy game - reads creds from config."""
import os, paramiko
from deploy_config import get_config
cfg = get_config()

print(f"Connecting to {cfg['server_ip']}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=15, allow_agent=False, look_for_keys=False)
print("Connected!")

print(f"Creating directory {cfg['remote_public']}...")
stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {cfg["remote_public"]}')
stdout.channel.recv_exit_status()

print(f"Uploading...")
sftp = ssh.open_sftp()
sftp.put(cfg['local_html'], f"{cfg['remote_public']}/index.html")
sftp.put(cfg['local_js'], f"{cfg['remote_public']}/game-logic.js")
sftp.close()

print("Setting up nginx...")
cmds = [
    f'mkdir -p {cfg["remote_public"]}',
    'which nginx || yum install -y nginx',
    f'cat > /etc/nginx/conf.d/game.conf << CONFEOF\nserver {{\n    listen 80;\n    server_name _;\n    root {cfg["remote_public"]};\n    index index.html;\n    location / {{\n        try_files $uri $uri/ /index.html;\n    }}\n}}\nCONFEOF',
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
print(f"\nDone! Visit: http://{cfg['server_ip']}")
