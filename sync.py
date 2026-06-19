#!/usr/bin/env python3
import os, paramiko
base = os.path.dirname(os.path.abspath(__file__))
HOST = open(os.path.join(base, '.server_ip')).read().strip()
PASS = open(os.path.join(base, '.ssh_pass')).read().strip()
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username='root', password=PASS, timeout=10)
ssh.exec_command('cp /var/www/game/index.html /usr/share/nginx/html/index.html')
stdin, stdout, stderr = ssh.exec_command('wc -c /usr/share/nginx/html/index.html')
print("Size:", stdout.read().decode().strip())
ssh.close()
print("Synced!")
