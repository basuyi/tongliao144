@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: deploy_to_server.bat ^<PUBLIC_IP^>
    echo Example: deploy_to_server.bat 47.93.xxx.xxx
    exit /b 1
)

set PUBLIC_IP=%1
set SSH_USER=root
if "%SERVER_PASSWORD%"=="" (
    echo [ERROR] 请先设置环境变量: set SERVER_PASSWORD=你的服务器密码
    exit /b 1
)
set SSH_PASS=%SERVER_PASSWORD%
set GAME_DIR=/var/www/game

echo ==================================================
echo   Deploying to Alibaba Cloud Lightweight Server
echo ==================================================
echo.
echo Server: %PUBLIC_IP%
echo.

echo [..] Testing SSH connection...
ssh -o StrictHostKeyChecking=no %SSH_USER%@%PUBLIC_IP% "echo Connected" 2>nul
if errorlevel 1 (
    echo [ERROR] SSH connection failed
    echo.
    echo Please ensure:
    echo   1. The server is running
    echo   2. Port 22 is open in firewall
    echo   3. Password is correct: %SSH_PASS%
    exit /b 1
)

echo [OK] Connected
echo.

echo [..] Installing nginx...
ssh %SSH_USER%@%PUBLIC_IP% "yum install -y nginx"
if errorlevel 1 (
    echo [ERROR] Failed to install nginx
    exit /b 1
)
echo [OK] nginx installed
echo.

echo [..] Creating game directory...
ssh %SSH_USER%@%PUBLIC_IP% "mkdir -p %GAME_DIR%"

echo [..] Uploading game files...
scp outputs\card-game.html %SSH_USER%@%PUBLIC_IP%:%GAME_DIR%/index.html
scp game-server.py %SSH_USER%@%PUBLIC_IP%:%GAME_DIR%/
echo [OK] Files uploaded
echo.

echo [..] Configuring nginx...
ssh %SSH_USER%@%PUBLIC_IP% "cat > /etc/nginx/conf.d/game.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root %GAME_DIR%;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF"

echo [..] Starting nginx...
ssh %SSH_USER%@%PUBLIC_IP% "systemctl start nginx && systemctl enable nginx"
echo [OK] nginx started
echo.

echo [..] Configuring firewall...
ssh %SSH_USER%@%PUBLIC_IP% "firewall-cmd --permanent --add-service=http && firewall-cmd --reload" 2>nul
echo.

echo ==================================================
echo   Deployment Complete!
echo ==================================================
echo.
echo   Game URL: http://%PUBLIC_IP%
echo.
echo   SSH Access:
echo     ssh %SSH_USER%@%PUBLIC_IP%
echo     Password: %SSH_PASS%
echo.
echo ==================================================
pause
