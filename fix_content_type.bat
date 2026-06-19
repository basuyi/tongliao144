@echo off
chcp 65001 >nul
echo ============================================
echo   修复 Content-Type 元数据
echo ============================================
echo.
echo 正在修复 index.html 的 Content-Type...
echo.

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)

"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" fix_content_type.py "%ALIBABA_CLOUD_ACCESS_KEY_ID%" "%ALIBABA_CLOUD_ACCESS_KEY_SECRET%" oss-cn-beijing.aliyuncs.com tongliao144

echo.
pause
