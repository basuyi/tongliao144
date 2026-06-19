@echo off
chcp 65001 >nul
echo ============================================
echo   创建阿里云轻量应用服务器
echo ============================================
echo.
echo 配置:
echo   地域: 北京 (cn-beijing)
echo   规格: 2核2G
echo   系统: CentOS 7.9
echo   硬盘: 60GB ESSD
echo   带宽: 3Mbps
echo   费用: 9.9元/月 (包月)
echo.
echo 即将创建，请确认账户余额充足...
echo.
pause

if "%ALIBABA_CLOUD_ACCESS_KEY_ID%"=="" (
    echo [ERROR] 请先设置环境变量:
    echo   set ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyID
    echo   set ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
    pause
    exit /b 1
)

"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" create_lightweight.py "%ALIBABA_CLOUD_ACCESS_KEY_ID%" "%ALIBABA_CLOUD_ACCESS_KEY_SECRET%"

echo.
echo ============================================
echo   操作完成
echo ============================================
echo.
pause
