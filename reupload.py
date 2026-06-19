#!/usr/bin/env python3
"""Re-upload HTML file with correct Content-Type."""
import sys
import oss2

def reupload(ak_id, ak_secret, endpoint, bucket_name, html_path):
    auth = oss2.Auth(ak_id, ak_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    print(f"[..] Re-uploading {html_path} with correct Content-Type...")
    
    with open(html_path, 'rb') as f:
        content = f.read()
    
    headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': 'inline'
    }
    
    try:
        bucket.put_object('index.html', content, headers=headers)
        print(f"[OK] Uploaded {len(content)} bytes with Content-Type: text/html")
    except Exception as e:
        print(f"[ERROR] Upload failed: {e}")
        return False

    print(f"\n{'='*60}")
    print(f"  重新上传完成！")
    print(f"{'='*60}")
    print(f"\n  游戏地址: http://{bucket_name}.{endpoint}/index.html")
    print(f"  在线模式: http://{bucket_name}.{endpoint}/index.html?mode=online")
    print(f"\n  提示：请按 Ctrl+Shift+R 强制刷新浏览器")
    
    return True

if __name__ == '__main__':
    reupload(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
