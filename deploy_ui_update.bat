@echo off
chcp 65001 >nul
echo ==================================================
echo   部署美化后的游戏到服务器
echo ==================================================
echo.
echo 正在上传 card-game.html ...
echo.

if "%SERVER_IP%"=="" (
    echo [ERROR] 请先设置环境变量: set SERVER_IP=你的服务器IP
    echo   以及: set SERVER_PASSWORD=你的服务器密码
    pause
    exit /b 1
)
if "%SERVER_PASSWORD%"=="" (
    echo [ERROR] 请先设置环境变量: set SERVER_PASSWORD=你的服务器密码
    pause
    exit /b 1
)

scp -o StrictHostKeyChecking=no "C:\Users\杨大宝\.qoderwork\workspace\mq2epl8bo56qv19k\outputs\card-game.html" root@%SERVER_IP%:/var/www/game/index.html

if errorlevel 1 (
    echo.
    echo [ERROR] 上传失败
    echo 请手动运行:
    echo   scp outputs\card-game.html root@%SERVER_IP%:/var/www/game/index.html
) else (
    echo.
    echo ==================================================
    echo   部署成功!
    echo   访问: http://%SERVER_IP%
    echo ==================================================
)
echo.
pause
