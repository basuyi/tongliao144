#!/usr/bin/env python3
"""Fix bucket ACL and object ACL for public access."""
import sys
import oss2

def fix_acl(ak_id, ak_secret, endpoint, bucket_name):
    auth = oss2.Auth(ak_id, ak_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    # Try to set object ACL to public-read
    print("[..] Setting object ACL to public-read...")
    try:
        bucket.put_object_acl('index.html', oss2.OBJECT_ACL_PUBLIC_READ)
        print("[OK] Object ACL set to public-read")
    except Exception as e:
        print(f"[WARN] Object ACL: {e}")

    # Try bucket policy instead of ACL
    print("[..] Setting bucket policy for public read...")
    try:
        import json
        policy = {
            "Version": "1",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["oss:GetObject"],
                    "Principal": ["*"],
                    "Resource": [f"acs:oss:*:*:{bucket_name}/*"]
                }
            ]
        }
        bucket.put_bucket_policy(json.dumps(policy))
        print("[OK] Bucket policy set")
    except Exception as e:
        print(f"[WARN] Bucket policy: {e}")

    print("\n[OK] ACL fix completed")

if __name__ == '__main__':
    fix_acl(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
