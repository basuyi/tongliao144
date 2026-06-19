#!/usr/bin/env python3
"""Use Cloud Assistant to change password on the server."""
import json, os
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ak_config')
with open(config_path) as f:
    lines = f.read().strip().split('\n')

c = AcsClient(lines[0].strip(), lines[1].strip(), 'cn-beijing')
instance_id = '666e988482d14da6a7d310dcce4b7427'

# Use Cloud Assistant to run command
r = CommonRequest()
r.set_accept_format('json')
r.set_domain('ecs.cn-beijing.aliyuncs.com')
r.set_method('POST')
r.set_protocol_type('https')
r.set_version('2014-05-26')
r.set_action_name('RunCommand')
r.add_query_param('RegionId', 'cn-beijing')
r.add_query_param('Type', 'RunShellScript')
import base64
_server_password = os.getenv('SERVER_PASSWORD', '')
_chpasswd_cmd = f"echo 'root:{_server_password}' | chpasswd"
r.add_query_param('CommandContent', base64.b64encode(_chpasswd_cmd.encode()).decode())
r.add_query_param('InstanceId.1', instance_id)
r.add_query_param('ContentEncoding', 'Base64')
r.add_query_param('Timeout', '60')

try:
    resp = c.do_action_with_exception(r)
    print("SUCCESS:", json.loads(resp))
except Exception as e:
    print(f"Error: {e}")
