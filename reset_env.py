#!/usr/bin/env python3
"""Reset instance password using env vars."""
import sys, os, json
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

AK_ID = os.environ.get('AK_ID')
AK_SECRET = os.environ.get('AK_SECRET')
if not AK_ID or not AK_SECRET:
    print("Set AK_ID and AK_SECRET env vars")
    sys.exit(1)

client = AcsClient(AK_ID, AK_SECRET, 'cn-beijing')

request = CommonRequest()
request.set_accept_format('json')
request.set_domain('swas.cn-beijing.aliyuncs.com')
request.set_method('POST')
request.set_protocol_type('https')
request.set_version('2020-06-01')
request.set_action_name('ResetInstancePassword')
request.add_query_param('RegionId', 'cn-beijing')
request.add_query_param('InstanceId', '666e988482d14da6a7d310dcce4b7427')
request.add_query_param('Password', os.getenv('SERVER_PASSWORD', ''))

try:
    response = client.do_action_with_exception(request)
    print("OK:", json.loads(response))
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
