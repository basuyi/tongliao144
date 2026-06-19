#!/usr/bin/env python3
"""Deploy server-side code: install Node.js, upload files, configure nginx + systemd."""
import os, paramiko, time

HOST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.server_ip')
PASS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ssh_pass')

with open(HOST_FILE) as f:
    HOST = f.read().strip()
if os.path.exists(PASS_FILE):
    with open(PASS_FILE) as f:
        PASS = f.read().strip()
else:
    PASS = os.getenv('SERVER_PASSWORD', '')

USER = 'root'
BASE = os.path.dirname(os.path.abspath(__file__))

def run_cmd(ssh, cmd, timeout=60):
    print(f"  > {cmd[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"    {out[:200]}")
    if err and exit_code != 0: print(f"    ERR: {err[:200]}")
    return exit_code, out, err

print(f"Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15, allow_agent=False, look_for_keys=False)
print("Connected!")

# 1. Install Node.js
print("\n=== Step 1: Install Node.js 16 (CentOS 7 compatible) ===")
run_cmd(ssh, 'rm -rf /usr/local/node-v18.20.4-linux-x64 /usr/local/node-v18.20.0-linux-x64')
code, out, _ = run_cmd(ssh, '/usr/local/node-v16.20.2-linux-x64/bin/node --version 2>/dev/null || echo NOT_INSTALLED')
if 'NOT_INSTALLED' in out or code != 0:
    run_cmd(ssh, 'cd /usr/local && curl -sO https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.xz', 120)
    run_cmd(ssh, 'cd /usr/local && tar xf node-v16.20.2-linux-x64.tar.xz', 60)
run_cmd(ssh, 'ln -sf /usr/local/node-v16.20.2-linux-x64/bin/node /usr/local/bin/node')
run_cmd(ssh, 'ln -sf /usr/local/node-v16.20.2-linux-x64/bin/npm /usr/local/bin/npm')
run_cmd(ssh, 'ln -sf /usr/local/node-v16.20.2-linux-x64/bin/npx /usr/local/bin/npx')
run_cmd(ssh, 'node --version')

# 2. Create directories
print("\n=== Step 2: Create directories ===")
run_cmd(ssh, 'mkdir -p /var/www/game/server /var/www/game/shared /var/www/game/public')

# 3. Upload files
print("\n=== Step 3: Upload files ===")
sftp = ssh.open_sftp()
server_dir = os.path.join(BASE, 'server')
shared_dir = os.path.join(BASE, 'shared')
public_dir = os.path.join(BASE, 'public')
outputs_dir = os.path.join(BASE, 'outputs')

for f in os.listdir(server_dir):
    local = os.path.join(server_dir, f)
    if os.path.isfile(local):
        print(f"  Upload server/{f}")
        sftp.put(local, f'/var/www/game/server/{f}')

for f in os.listdir(shared_dir):
    local = os.path.join(shared_dir, f)
    if os.path.isfile(local):
        print(f"  Upload shared/{f}")
        sftp.put(local, f'/var/www/game/shared/{f}')

if os.path.exists(public_dir):
    for f in os.listdir(public_dir):
        local = os.path.join(public_dir, f)
        if os.path.isfile(local):
            print(f"  Upload public/{f}")
            sftp.put(local, f'/var/www/game/public/{f}')

html_src = os.path.join(outputs_dir, 'card-game.html')
if os.path.exists(html_src):
    print("  Upload index.html")
    sftp.put(html_src, '/var/www/game/public/index.html')
gl_src = os.path.join(outputs_dir, 'game-logic.js')
if os.path.exists(gl_src):
    print("  Upload public/game-logic.js")
    sftp.put(gl_src, '/var/www/game/public/game-logic.js')

sftp.close()

# 4. Install npm dependencies
print("\n=== Step 4: npm install ===")
run_cmd(ssh, 'cd /var/www/game/server && npm install --production 2>&1', 120)

# 5. Create systemd service
print("\n=== Step 5: Systemd service ===")
service_content = """[Unit]
Description=Tongliao 144 Card Game Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/game/server
ExecStart=/usr/local/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
"""
run_cmd(ssh, f"cat > /etc/systemd/system/tongliao144.service << 'SVCEOF'\n{service_content}SVCEOF")
run_cmd(ssh, 'systemctl daemon-reload')
run_cmd(ssh, 'systemctl enable tongliao144')
run_cmd(ssh, 'systemctl restart tongliao144')
time.sleep(2)
run_cmd(ssh, 'systemctl status tongliao144 --no-pager')

# 6. Configure nginx
print("\n=== Step 6: Nginx config ===")
nginx_conf = """server {
    listen 80;
    server_name _;

    root /var/www/game/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location /shared/ {
        alias /var/www/game/shared/;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
    }
}
"""
run_cmd(ssh, f"cat > /etc/nginx/conf.d/game.conf << 'CONFEOF'\n{nginx_conf}CONFEOF")
run_cmd(ssh, 'nginx -t')
run_cmd(ssh, 'systemctl reload nginx')

# 7. Verify
print("\n=== Step 7: Verify ===")
run_cmd(ssh, 'curl -s http://127.0.0.1:3001/api/health')
run_cmd(ssh, f'curl -s http://{HOST}/api/health')

ssh.close()
print(f"\nDone! Server: http://{HOST}")
print(f"Health: http://{HOST}/api/health")
print(f"WebSocket: ws://{HOST}/ws")
