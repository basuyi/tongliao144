@echo off
chcp 65001 >nul
setlocal

echo ==================================================
echo   创建阿里云轻量应用服务器
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

echo [..] Creating lightweight server...
echo.

"%PYTHON%" create_lightweight.py "%AK_ID%" "%AK_SECRET%"

echo.
pause
