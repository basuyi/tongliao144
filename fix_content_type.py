#!/usr/bin/env python3
"""Fix Content-Type metadata for uploaded HTML file."""
import sys
import oss2

def fix_content_type(ak_id, ak_secret, endpoint, bucket_name):
    auth = oss2.Auth(ak_id, ak_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    print(f"[..] Fixing Content-Type for index.html...")
    
    # Copy the object to itself with new metadata
    try:
        bucket.copy_object(
            bucket_name, 
            'index.html', 
            'index.html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            }
        )
        print("[OK] Content-Type set to text/html; charset=utf-8")
    except Exception as e:
        print(f"[ERROR] Failed to fix Content-Type: {e}")
        return False

    print(f"\n{'='*60}")
    print(f"  修复完成！现在可以正常访问了")
    print(f"{'='*60}")
    print(f"\n  游戏地址: http://{bucket_name}.{endpoint}/index.html")
    print(f"  在线模式: http://{bucket_name}.{endpoint}/index.html?mode=online")
    print(f"\n  提示：如果浏览器有缓存，请按 Ctrl+F5 强制刷新")
    
    return True

if __name__ == '__main__':
    fix_content_type(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
