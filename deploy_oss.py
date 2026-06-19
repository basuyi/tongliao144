#!/usr/bin/env python3
"""Deploy card-game.html to Alibaba Cloud OSS static hosting."""
import sys
import oss2

def deploy(ak_id, ak_secret, endpoint, bucket_name, html_path):
    auth = oss2.Auth(ak_id, ak_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    # 1. Create bucket if not exists (public-read for static hosting)
    try:
        bucket.get_bucket_info()
        print(f"[OK] Bucket '{bucket_name}' already exists")
    except oss2.exceptions.NoSuchBucket:
        print(f"[..] Creating bucket '{bucket_name}'...")
        bucket.create_bucket(
            permission=oss2.BUCKET_ACL_PUBLIC_READ,
            input=oss2.models.BucketCreateConfig(
                oss2.BUCKET_STORAGE_CLASS_STANDARD
            )
        )
        print(f"[OK] Bucket '{bucket_name}' created")
    except oss2.exceptions.AccessDenied:
        print(f"[OK] Bucket '{bucket_name}' exists (access check skipped)")

    # 2. Set bucket ACL to public-read
    try:
        bucket.put_bucket_acl(oss2.BUCKET_ACL_PUBLIC_READ)
        print("[OK] Bucket ACL set to public-read")
    except Exception as e:
        print(f"[WARN] ACL setting: {e}")

    # 3. Enable static website hosting
    website_config = oss2.models.BucketWebsite('index.html', 'error.html')
    bucket.put_bucket_website(website_config)
    print("[OK] Static website hosting enabled (index.html)")

    # 4. Set CORS for Supabase SDK (needed for online mode)
    cors_rule = oss2.models.CorsRule(
        allowed_origins=['*'],
        allowed_methods=['GET', 'HEAD'],
        allowed_headers=['*'],
        max_age_seconds=3600
    )
    try:
        bucket.put_bucket_cors(oss2.models.BucketCors([cors_rule]))
        print("[OK] CORS configured")
    except Exception as e:
        print(f"[WARN] CORS: {e}")

    # 5. Upload the HTML file
    print(f"[..] Uploading {html_path}...")
    with open(html_path, 'rb') as f:
        content = f.read()
    
    headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
    }
    bucket.put_object('index.html', content, headers=headers)
    print(f"[OK] Uploaded as index.html ({len(content)} bytes)")

    # 6. Generate URL
    # Extract region from endpoint
    region = endpoint.replace('https://', '').replace('http://', '')
    url = f"http://{bucket_name}.{region}/index.html"
    online_url = f"{url}?mode=online"
    
    print(f"\n{'='*50}")
    print(f"  Game URL:  {url}")
    print(f"  Online:    {online_url}")
    print(f"{'='*50}")
    print(f"\nTip: On phone, open {url} to play!")
    print(f"Share {online_url}&room=XXXXX for online multiplayer")
    
    return url

if __name__ == '__main__':
    import os
    
    # Try to get credentials from environment variables first
    ak_id = os.getenv('OSS_ACCESS_KEY_ID', '')
    ak_secret = os.getenv('OSS_ACCESS_KEY_SECRET', '')
    endpoint = os.getenv('OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com')
    bucket_name = os.getenv('OSS_BUCKET_NAME', 'tongliao-144')
    
    # Override with command line arguments if provided
    if len(sys.argv) >= 5:
        ak_id = sys.argv[1]
        ak_secret = sys.argv[2]
        endpoint = sys.argv[3]
        bucket_name = sys.argv[4]
    
    html_path = sys.argv[5] if len(sys.argv) > 5 else 'vercel-deploy/index.html'
    
    # Check if credentials are available
    if not ak_id or not ak_secret:
        print("\n" + "="*60)
        print("  通辽144 - 阿里云OSS部署")
        print("="*60)
        print("\n请先配置阿里云 AccessKey:")
        print("  1. 访问 https://ram.console.aliyun.com/manage/ak")
        print("  2. 创建或获取 AccessKey ID 和 Secret")
        print("\n然后选择以下方式之一:")
        print("  A. 设置环境变量 (推荐):")
        print("     set OSS_ACCESS_KEY_ID=your_access_key_id")
        print("     set OSS_ACCESS_KEY_SECRET=your_access_key_secret")
        print("     set OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com")
        print("     set OSS_BUCKET_NAME=tongliao-144")
        print("\n  B. 命令行参数:")
        print(f"     python {sys.argv[0]} <AK_ID> <AK_SECRET> <endpoint> <bucket>")
        print("\n" + "="*60)
        sys.exit(1)
    
    print(f"\n部署配置:")
    print(f"  Bucket: {bucket_name}")
    print(f"  Endpoint: {endpoint}")
    print(f"  文件: {html_path}")
    print()
    
    deploy(ak_id, ak_secret, endpoint, bucket_name, html_path)
