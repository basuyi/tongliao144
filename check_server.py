#!/usr/bin/env python3
import os, paramiko

base = os.path.dirname(os.path.abspath(__file__))
HOST = open(os.path.join(base, '.server_ip')).read().strip()
PASS = open(os.path.join(base, '.ssh_pass')).read().strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username='root', password=PASS, timeout=10)

cmds = [
    'cat /etc/nginx/conf.d/game.conf 2>/dev/null || echo "no game.conf"',
    'cat /etc/nginx/nginx.conf | grep -A5 "root\\|location"',
    'ls -la /var/www/game/',
    'wc -c /var/www/game/index.html',
    'ls -la /usr/share/nginx/html/ 2>/dev/null',
]
for cmd in cmds:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode().strip())
    err = stderr.read().decode().strip()
    if err:
        print(f"STDERR: {err}")

ssh.close()
