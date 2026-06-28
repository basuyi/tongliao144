@echo off
chcp 65001 >nul
echo ============================================
echo   部署美化版到轻量应用服务器
echo ============================================
echo.

if "%SERVER_IP%"=="" (
    echo [ERROR] 请先设置环境变量: set SERVER_IP=你的服务器IP
    echo   以及: set SERVER_PASSWORD=你的服务器密码
    pause
    exit /b 1
)
set SSH_USER=root
set REMOTE_DIR=/var/www/game/public

echo 服务器: %SERVER_IP%
echo 文件: outputs\card-game.html
echo.

echo [..] 上传游戏文件...
scp -o StrictHostKeyChecking=no "outputs\card-game.html" %SSH_USER%@%SERVER_IP%:%REMOTE_DIR%/index.html
if errorlevel 1 (
    echo.
    echo [ERROR] 上传失败，请检查:
    echo   1. 服务器是否运行中
    echo   2. 端口22是否开放
    echo   3. 密码是否正确
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] 上传成功!
echo.
echo ============================================
echo   部署完成!
echo   访问: http://%SERVER_IP%
echo ============================================
echo.
pause
