#!/usr/bin/env python3
import os, paramiko
from deploy_config import get_config
cfg = get_config()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=10)

cmds = [
    'cat /etc/nginx/conf.d/game.conf 2>/dev/null || echo "no game.conf"',
    'cat /etc/nginx/nginx.conf | grep -A5 "root\\|location"',
    f'ls -la {cfg["remote_base"]}/',
    f'wc -c {cfg["remote_public"]}/index.html',
]
for cmd in cmds:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode().strip())
    err = stderr.read().decode().strip()
    if err:
        print(f"STDERR: {err}")

ssh.close()
