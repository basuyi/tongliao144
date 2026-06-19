#!/usr/bin/env python3
import os, paramiko

base = os.path.dirname(os.path.abspath(__file__))
HOST = open(os.path.join(base, '.server_ip')).read().strip()
PASS = open(os.path.join(base, '.ssh_pass')).read().strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username='root', password=PASS, timeout=10)

print("Copying game to nginx default root...")
stdin, stdout, stderr = ssh.exec_command('cp /var/www/game/index.html /usr/share/nginx/html/index.html')
stdout.channel.recv_exit_status()
err = stderr.read().decode().strip()
if err:
    print(f"Error: {err}")
else:
    print("Copied!")

stdin, stdout, stderr = ssh.exec_command('wc -c /usr/share/nginx/html/index.html')
print(f"File size: {stdout.read().decode().strip()}")

ssh.close()
print(f"Visit: http://{HOST}")
