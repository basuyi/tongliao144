#!/usr/bin/env python3
import os, paramiko
from deploy_config import get_config
cfg = get_config()
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=10)
stdin, stdout, stderr = ssh.exec_command('nginx -s reload')
print("nginx reloaded:", stdout.read().decode().strip())
stdin, stdout, stderr = ssh.exec_command(f'wc -c {cfg["remote_public"]}/index.html')
print("Size:", stdout.read().decode().strip())
ssh.close()
print("Synced!")
