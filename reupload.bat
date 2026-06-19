@echo off
chcp 65001 >nul
echo ============================================
echo   重新上传并设置正确的 Content-Type
echo ============================================
echo.
echo 正在重新上传 index.html...
echo.

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)

"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" reupload.py "%ALIBABA_CLOUD_ACCESS_KEY_ID%" "%ALIBABA_CLOUD_ACCESS_KEY_SECRET%" oss-cn-beijing.aliyuncs.com tongliao144 vercel-deploy/index.html

echo.
pause
