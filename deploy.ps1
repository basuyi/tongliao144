# 通辽144 - OSS 部署脚本 (PowerShell)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  通辽144 - 阿里云OSS部署工具" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Python路径
$python = "C:\Users\杨大宝\AppData\Local\Programs\Python\Python312\python.exe"

# 检查环境变量或提示输入
if (-not $env:OSS_ACCESS_KEY_ID) {
    Write-Host "[提示] 请输入阿里云 AccessKey 信息`n" -ForegroundColor Yellow

    $ak_id = Read-Host "AccessKey ID (留空使用默认值)"
    if (-not $ak_id) { $ak_id = "YOUR_ACCESS_KEY" }

    $ak_secret = Read-Host "AccessKey Secret (留空使用默认值)" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::GetSecureStringBSTR($ak_secret)
    $ak_secret_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    if (-not $ak_secret_plain) {
        Write-Host "[ERROR] 未提供 AccessKey Secret，请先设置环境变量:" -ForegroundColor Red
        Write-Host "  `$env:OSS_ACCESS_KEY_SECRET = '你的密钥'" -ForegroundColor Yellow
        exit 1
    }

    $endpoint = Read-Host "Endpoint (留空使用 oss-cn-hangzhou.aliyuncs.com)"
    if (-not $endpoint) { $endpoint = "oss-cn-hangzhou.aliyuncs.com" }

    $bucket = Read-Host "Bucket名称 (留空使用 tongliao-144)"
    if (-not $bucket) { $bucket = "tongliao-144" }
} else {
    Write-Host "[OK] 使用环境变量配置`n" -ForegroundColor Green
    $ak_id = $env:OSS_ACCESS_KEY_ID
    $ak_secret = $env:OSS_ACCESS_KEY_SECRET
    $endpoint = $env:OSS_ENDPOINT
    $bucket = $env:OSS_BUCKET_NAME
}

Write-Host "`n部署配置:" -ForegroundColor White
Write-Host "  Bucket: $bucket" -ForegroundColor Gray
Write-Host "  Endpoint: $endpoint" -ForegroundColor Gray
Write-Host "  文件: vercel-deploy/index.html`n" -ForegroundColor Gray

# 执行部署
& $python deploy_oss.py $ak_id $ak_secret $endpoint $bucket vercel-deploy/index.html

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "  部署成功！" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Green
} else {
    Write-Host "`n============================================" -ForegroundColor Red
    Write-Host "  部署失败，请检查错误信息" -ForegroundColor Red
    Write-Host "============================================`n" -ForegroundColor Red
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
