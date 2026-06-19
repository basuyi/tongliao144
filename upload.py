#!/usr/bin/env python3
import os, paramiko

base = os.path.dirname(os.path.abspath(__file__))
HOST = open(os.path.join(base, '.server_ip')).read().strip()
PASS = open(os.path.join(base, '.ssh_pass')).read().strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username='root', password=PASS, timeout=15, allow_agent=False, look_for_keys=False)
print("Connected")

ssh.exec_command('mkdir -p /var/www/game')

sftp = ssh.open_sftp()
sftp.put(os.path.join(base, 'outputs', 'card-game.html'), '/var/www/game/index.html')
sftp.close()
print("Uploaded")

ssh.close()
print(f"Visit: http://{HOST}")
