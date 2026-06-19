#!/usr/bin/env python3
"""Reset lightweight server password via Alibaba Cloud API."""
import sys
import os
import json
import time
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ak_config')
with open(config_path) as f:
    lines = f.read().strip().split('\n')
    AK_ID = lines[0].strip()
    AK_SECRET = lines[1].strip()

SERVER_IP = os.getenv('SERVER_IP', '')
NEW_PASSWORD = os.getenv('SERVER_PASSWORD', '')
region_id = 'cn-beijing'

client = AcsClient(AK_ID, AK_SECRET, region_id)

# Step 1: Find instance ID by listing instances
print("Querying instances...")
request = CommonRequest()
request.set_accept_format('json')
request.set_domain('swas.cn-beijing.aliyuncs.com')
request.set_method('POST')
request.set_protocol_type('https')
request.set_version('2020-06-01')
request.set_action_name('ListInstances')
request.add_query_param('RegionId', region_id)

try:
    response = client.do_action_with_exception(request)
    data = json.loads(response)
except Exception as e:
    print(f"[ERROR] Query failed: {e}")
    sys.exit(1)

instance_id = None
if 'Instances' in data and data['Instances']:
    for inst in data['Instances']:
        ip = inst.get('PublicIpAddress', '')
        iid = inst.get('InstanceId', '')
        status = inst.get('Status', '')
        print(f"  Found: {iid} | IP: {ip} | Status: {status}")
        if ip == SERVER_IP:
            instance_id = iid

if not instance_id:
    print("[ERROR] Instance not found for IP " + SERVER_IP)
    sys.exit(1)

print(f"\nTarget instance: {instance_id}")

# Step 2: Reset password
print(f"Resetting password...")
reset_request = CommonRequest()
reset_request.set_accept_format('json')
reset_request.set_domain('swas.cn-beijing.aliyuncs.com')
reset_request.set_method('POST')
reset_request.set_protocol_type('https')
reset_request.set_version('2020-06-01')
reset_request.set_action_name('ResetInstancePassword')
reset_request.add_query_param('RegionId', region_id)
reset_request.add_query_param('InstanceId', instance_id)
reset_request.add_query_param('Password', NEW_PASSWORD)

try:
    response = client.do_action_with_exception(reset_request)
    data = json.loads(response)
    print(f"[OK] Password reset response: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"[ERROR] Reset password failed: {e}")
    sys.exit(1)

# Step 3: Reboot instance
print("\nRebooting instance...")
reboot_request = CommonRequest()
reboot_request.set_accept_format('json')
reboot_request.set_domain('swas.cn-beijing.aliyuncs.com')
reboot_request.set_method('POST')
reboot_request.set_protocol_type('https')
reboot_request.set_version('2020-06-01')
reboot_request.set_action_name('RebootInstance')
reboot_request.add_query_param('RegionId', region_id)
reboot_request.add_query_param('InstanceId', instance_id)

try:
    response = client.do_action_with_exception(reboot_request)
    data = json.loads(response)
    print(f"[OK] Reboot response: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"[WARN] Reboot may have failed: {e}")

print("\nWaiting 30s for server to restart...")
time.sleep(30)
print("Done! Try deploying again.")
