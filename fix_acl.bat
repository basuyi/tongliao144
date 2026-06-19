@echo off
chcp 65001 >nul
echo ============================================
echo   修复 OSS 公开访问权限
echo ============================================
echo.

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)
set AK_ID=%ALIBABA_CLOUD_ACCESS_KEY_ID%
set AK_SECRET=%ALIBABA_CLOUD_ACCESS_KEY_SECRET%
set ENDPOINT=oss-cn-beijing.aliyuncs.com
set BUCKET=tongliao144

echo 正在修复权限...
"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" fix_acl.py %AK_ID% %AK_SECRET% %ENDPOINT% %BUCKET%

echo.
echo ============================================
echo   完成！
echo ============================================
echo.
echo 游戏地址: http://tongliao144.oss-cn-beijing.aliyuncs.com/index.html
echo 在线模式: http://tongliao144.oss-cn-beijing.aliyuncs.com/index.html?mode=online
echo.
pause
