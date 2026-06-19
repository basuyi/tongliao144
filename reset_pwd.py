#!/usr/bin/env python3
"""Reset instance password."""
import sys, os, json
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ak_config')
with open(config_path) as f:
    lines = f.read().strip().split('\n')
    AK_ID, AK_SECRET = lines[0].strip(), lines[1].strip()

client = AcsClient(AK_ID, AK_SECRET, 'cn-beijing')
INSTANCE_ID = '666e988482d14da6a7d310dcce4b7427'

request = CommonRequest()
request.set_accept_format('json')
request.set_domain('swas.cn-beijing.aliyuncs.com')
request.set_method('POST')
request.set_protocol_type('https')
request.set_version('2020-06-01')
request.set_action_name('ResetInstancePassword')
request.add_query_param('RegionId', 'cn-beijing')
request.add_query_param('InstanceId', INSTANCE_ID)
request.add_query_param('Password', os.getenv('SERVER_PASSWORD', ''))

try:
    response = client.do_action_with_exception(request)
    print("OK:", json.loads(response))
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
