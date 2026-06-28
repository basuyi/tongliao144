#!/usr/bin/env python3
import os, paramiko
from deploy_config import get_config
cfg = get_config()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=10)

print("Reloading nginx...")
stdin, stdout, stderr = ssh.exec_command('nginx -s reload')
stdout.channel.recv_exit_status()
err = stderr.read().decode().strip()
if err:
    print(f"Warn: {err}")
else:
    print("Nginx reloaded!")

stdin, stdout, stderr = ssh.exec_command(f'wc -c {cfg["remote_public"]}/index.html')
print(f"File size: {stdout.read().decode().strip()}")

ssh.close()
print(f"Visit: http://{cfg['server_ip']}")
