@echo off
chcp 65001 >nul
echo ============================================
echo   通辽144 - 阿里云OSS自动部署
echo ============================================
echo.

REM 检查是否已设置环境变量
if "%OSS_ACCESS_KEY_ID%"=="" (
    echo [提示] 未检测到环境变量
    echo.
    echo 请提供以下信息（或按回车使用默认值）:
    echo.

    set /p AK_ID="AccessKey ID [YOUR_ACCESS_KEY]: "
    if "!AK_ID!"=="" set AK_ID=YOUR_ACCESS_KEY

    set /p AK_SECRET="AccessKey Secret (请设置 OSS_ACCESS_KEY_SECRET 环境变量): "
    if "!AK_SECRET!"=="" (
        echo [ERROR] 未提供 AccessKey Secret，请先设置环境变量:
        echo   set OSS_ACCESS_KEY_SECRET=你的密钥
        pause
        exit /b 1
    )

    set /p ENDPOINT="Endpoint [oss-cn-hangzhou.aliyuncs.com]: "
    if "!ENDPOINT!"=="" set ENDPOINT=oss-cn-hangzhou.aliyuncs.com

    set /p BUCKET="Bucket名称 [tongliao-144]: "
    if "!BUCKET!"=="" set BUCKET=tongliao-144
) else (
    echo [OK] 使用环境变量配置
    set AK_ID=%OSS_ACCESS_KEY_ID%
    set AK_SECRET=%OSS_ACCESS_KEY_SECRET%
    set ENDPOINT=%OSS_ENDPOINT%
    set BUCKET=%OSS_BUCKET_NAME%
)

echo.
echo 开始部署...
echo   Bucket: %BUCKET%
echo   Endpoint: %ENDPOINT%
echo   文件: vercel-deploy/index.html
echo.

"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" deploy_oss.py %AK_ID% %AK_SECRET% %ENDPOINT% %BUCKET% vercel-deploy/index.html

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo   部署成功！
    echo ============================================
) else (
    echo ============================================
    echo   部署失败，请检查错误信息
    echo ============================================
)

echo.
pause
