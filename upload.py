#!/usr/bin/env python3
import os, paramiko
from deploy_config import get_config
cfg = get_config()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=15, allow_agent=False, look_for_keys=False)
print("Connected")

ssh.exec_command(f'mkdir -p {cfg["remote_public"]}')

sftp = ssh.open_sftp()
sftp.put(cfg['local_html'], f"{cfg['remote_public']}/index.html")
sftp.close()
print("Uploaded")

ssh.close()
print(f"Visit: http://{cfg['server_ip']}")
