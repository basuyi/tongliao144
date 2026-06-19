@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==================================================
echo   阿里云轻量服务器 - 一键创建并部署游戏
echo ==================================================
echo.

set PYTHON=C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)
set AK_ID=%ALIBABA_CLOUD_ACCESS_KEY_ID%
set AK_SECRET=%ALIBABA_CLOUD_ACCESS_KEY_SECRET%

echo [步骤 1/2] 创建轻量应用服务器...
echo.

"%PYTHON%" create_lightweight.py "%AK_ID%" "%AK_SECRET%"

if errorlevel 1 (
    echo.
    echo [ERROR] 创建服务器失败
    echo.
    echo 请检查:
    echo   1. 阿里云账户余额是否充足
    echo   2. 访问控制台手动创建: https://swas.console.aliyun.com/
    echo.
    pause
    exit /b 1
)

echo.
echo ==================================================
echo   服务器创建完成！
echo ==================================================
echo.
echo 请从上方输出中复制公网IP地址，然后运行:
echo.
echo   deploy_to_server.bat ^<公网IP^>
echo.
echo 例如:
echo   deploy_to_server.bat 47.93.123.456
echo.
echo ==================================================
pause
