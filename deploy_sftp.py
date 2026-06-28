#!/usr/bin/env python3
"""Deploy game to server via SFTP."""
import os
import sys
import paramiko
from deploy_config import get_config

cfg = get_config()

print(f"Connecting to {cfg['server_ip']}...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=10)

    ssh.exec_command(f'mkdir -p {cfg["remote_public"]}')

    sftp = ssh.open_sftp()
    print(f"Uploading {cfg['local_html']} -> {cfg['remote_public']}/index.html")
    sftp.put(cfg['local_html'], f"{cfg['remote_public']}/index.html")
    sftp.close()
    ssh.close()

    print()
    print("=" * 50)
    print("  部署成功!")
    print(f"  访问: http://{cfg['server_ip']}")
    print("=" * 50)
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
