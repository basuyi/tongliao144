@echo off
chcp 65001 >nul
echo ============================================
echo   检查部署环境
echo ============================================
echo.

REM 检查 Python
"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] Python 未安装或路径不正确
    pause
    exit /b 1
)
echo [OK] Python 已安装

REM 检查 oss2 库
"C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" -c "import oss2" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [警告] oss2 库未安装，正在安装...
    "C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe" -m pip install oss2
) else (
    echo [OK] oss2 库已安装
)

REM 检查 HTML 文件
if exist "vercel-deploy\index.html" (
    echo [OK] 游戏文件存在: vercel-deploy/index.html
) else (
    echo [错误] 游戏文件不存在: vercel-deploy/index.html
    pause
    exit /b 1
)

REM 检查环境变量
echo.
if "%OSS_ACCESS_KEY_ID%"=="" (
    echo [提示] 未设置环境变量 OSS_ACCESS_KEY_ID
    echo        将在部署时手动输入或使用默认值
) else (
    echo [OK] 环境变量已设置
    echo      AccessKey ID: %OSS_ACCESS_KEY_ID:~0,10%****
)

echo.
echo ============================================
echo   环境检查完成！
echo ============================================
echo.
echo 准备就绪，可以开始部署了。
echo.
echo 请选择部署方式:
echo   1. 运行 deploy.ps1 (PowerShell，推荐)
echo   2. 运行 auto-deploy.bat (批处理)
echo   3. 直接输入命令: python deploy_oss.py ^<参数^>
echo.
pause
