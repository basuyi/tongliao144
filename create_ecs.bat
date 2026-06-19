@echo off
chcp 65001 >nul
echo ============================================
echo   创建阿里云 ECS 实例（北京地域）
echo ============================================
echo.
echo 配置信息:
echo   地域: 北京 (cn-beijing)
echo   规格: 1核1G (ecs.t6-c1m1.large)
echo   系统: Ubuntu 22.04 64bit
echo   硬盘: 40GB ESSD
echo   带宽: 5Mbps (按流量计费)
echo   费用: 约 ¥0.5/小时 (按量付费)
echo.
echo 即将创建 ECS，请确认...
echo.
pause

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)

"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" create_ecs.py "%ALIBABA_CLOUD_ACCESS_KEY_ID%" "%ALIBABA_CLOUD_ACCESS_KEY_SECRET%"

echo.
echo ============================================
echo   创建完成！
echo ============================================
echo.
pause
