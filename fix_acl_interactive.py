#!/usr/bin/env python3
"""Interactive ACL fix script - user provides credentials at runtime."""
import sys
import oss2
import json

def fix_acl():
    print("=" * 60)
    print("  修复 OSS 公开访问权限")
    print("=" * 60)
    print()
    
    ak_id = input("AccessKey ID: ").strip()
    ak_secret = input("AccessKey Secret: ").strip()
    endpoint = input("Endpoint [oss-cn-beijing.aliyuncs.com]: ").strip() or "oss-cn-beijing.aliyuncs.com"
    bucket_name = input("Bucket名称 [tongliao144]: ").strip() or "tongliao144"
    
    print()
    print(f"正在修复 {bucket_name} 的访问权限...")
    print()
    
    auth = oss2.Auth(ak_id, ak_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    # Set object ACL
    try:
        bucket.put_object_acl('index.html', oss2.OBJECT_ACL_PUBLIC_READ)
        print('[OK] Object ACL set to public-read')
    except Exception as e:
        print(f'[WARN] Object ACL: {e}')

    # Set bucket policy
    try:
        policy = {
            'Version': '1',
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['oss:GetObject'],
                'Principal': ['*'],
                'Resource': [f'acs:oss:*:*:{bucket_name}/*']
            }]
        }
        bucket.put_bucket_policy(json.dumps(policy))
        print('[OK] Bucket policy set')
    except Exception as e:
        print(f'[WARN] Bucket policy: {e}')

    print()
    print("=" * 60)
    print("  修复完成！")
    print("=" * 60)
    print()
    print(f"游戏地址: http://{bucket_name}.{endpoint}/index.html")
    print(f"在线模式: http://{bucket_name}.{endpoint}/index.html?mode=online")
    print()

if __name__ == '__main__':
    fix_acl()
