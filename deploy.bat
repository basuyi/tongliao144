@echo off
chcp 65001 >nul
echo ============================================
echo   通辽144 - 阿里云OSS部署工具
echo ============================================
echo.

set /p AK_ID="请输入 AccessKey ID: "
set /p AK_SECRET="请输入 AccessKey Secret: "
set /p ENDPOINT="请输入 Endpoint (如 oss-cn-hangzhou.aliyuncs.com): "
set /p BUCKET="请输入 Bucket 名称 (如 tongliao-144): "

echo.
echo 开始部署...
python deploy_oss.py %AK_ID% %AK_SECRET% %ENDPOINT% %BUCKET% vercel-deploy/index.html

echo.
pause
