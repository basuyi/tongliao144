#!/usr/bin/env python3
"""Query existing lightweight server instances."""
import sys
import os
import json
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

# Read credentials from config
config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ak_config')
if not os.path.exists(config_path):
    print("[ERROR] No .ak_config file found")
    sys.exit(1)

with open(config_path) as f:
    lines = f.read().strip().split('\n')
    AK_ID = lines[0].strip()
    AK_SECRET = lines[1].strip()

region_id = 'cn-beijing'
client = AcsClient(AK_ID, AK_SECRET, region_id)

print("Querying lightweight server instances...")
print()

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
    
    if 'Instances' in data and data['Instances']:
        print(f"Found {len(data['Instances'])} instance(s):")
        print()
        for inst in data['Instances']:
            print(f"  Instance ID: {inst.get('InstanceId', 'N/A')}")
            print(f"  Status: {inst.get('Status', 'N/A')}")
            print(f"  Public IP: {inst.get('PublicIpAddress', 'N/A')}")
            print(f"  Region: {inst.get('RegionId', 'N/A')}")
            print(f"  Created: {inst.get('CreationTime', 'N/A')}")
            print()
            
            # Save the IP
            public_ip = inst.get('PublicIpAddress', '')
            if public_ip:
                with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.server_ip'), 'w') as f:
                    f.write(public_ip)
                print(f"  [OK] IP saved to .server_ip")
    else:
        print("No instances found in Beijing region")
        
except Exception as e:
    print(f"[ERROR] {e}")
