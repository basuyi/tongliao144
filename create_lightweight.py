#!/usr/bin/env python3
"""Create Lightweight Application Server in Beijing region with CentOS."""
import sys
import json
import time
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

def create_lightweight_server(ak_id, ak_secret, region_id='cn-beijing'):
    client = AcsClient(ak_id, ak_secret, region_id)
    
    print("=" * 60)
    print("  创建阿里云轻量应用服务器")
    print("=" * 60)
    print()
    
    # Configuration
    print("Configuration:")
    print("  Region: Beijing (cn-beijing)")
    print("  Spec: 2vCPU 2GB")
    print("  OS: CentOS 7.9")
    print("  Disk: 60GB ESSD")
    print("  Bandwidth: 3Mbps (peak)")
    print("  Traffic: 300GB/month")
    print("  Price: 9.9 CNY/month (prepaid)")
    print()
    
    # Create instance
    print("[..] Creating lightweight server instance...")
    
    request = CommonRequest()
    request.set_accept_format('json')
    request.set_domain('swas.cn-beijing.aliyuncs.com')
    request.set_method('POST')
    request.set_protocol_type('https')
    request.set_version('2020-06-01')
    request.set_action_name('CreateInstances')
    
    # Parameters
    request.add_query_param('RegionId', region_id)
    request.add_query_param('ImageId', 'centos_7_9_x64_20G_alibase_20240628.vhd')
    request.add_query_param('PlanId', 'swas.s2.c2.m20.b3.f60')  # 2核2G, 3Mbps, 60GB
    request.add_query_param('Period', '1')  # 1 month
    request.add_query_param('Amount', '1')
    request.add_query_param('ChargeType', 'PrePaid')
    request.add_query_param('Password', os.getenv('SERVER_PASSWORD', ''))
    
    try:
        response = client.do_action_with_exception(request)
        data = json.loads(response)
        
        if 'InstanceIds' in data:
            instance_ids = data['InstanceIds']
            print(f"[OK] Instance created: {instance_ids[0]}")
            instance_id = instance_ids[0]
        else:
            print(f"[OK] Response: {data}")
            instance_id = data.get('InstanceId', 'unknown')
            
    except Exception as e:
        print(f"[ERROR] Failed to create instance: {e}")
        print()
        print("可能原因:")
        print("  1. 账户余额不足")
        print("  2. 套餐 ID 不正确")
        print("  3. 镜像 ID 不正确")
        print()
        print("建议:")
        print("  请在阿里云控制台手动创建轻量应用服务器:")
        print("  https://swas.console.aliyun.com/")
        return None
    
    # Wait for instance to be ready
    print("[..] Waiting for instance to be ready...")
    time.sleep(10)
    
    # Get instance details
    print("[..] Getting instance details...")
    list_request = CommonRequest()
    list_request.set_accept_format('json')
    list_request.set_domain('swas.cn-beijing.aliyuncs.com')
    list_request.set_method('POST')
    list_request.set_protocol_type('https')
    list_request.set_version('2020-06-01')
    list_request.set_action_name('ListInstances')
    list_request.add_query_param('RegionId', region_id)
    
    try:
        list_response = client.do_action_with_exception(list_request)
        list_data = json.loads(list_response)
        
        if 'Instances' in list_data:
            for inst in list_data['Instances']:
                if inst.get('InstanceId') == instance_id:
                    public_ip = inst.get('PublicIpAddress', 'N/A')
                    status = inst.get('Status', 'N/A')
                    print(f"[OK] Instance details:")
                    print(f"  ID: {instance_id}")
                    print(f"  Public IP: {public_ip}")
                    print(f"  Status: {status}")
                    break
    except Exception as e:
        print(f"[WARN] Could not get instance details: {e}")
        public_ip = "Please check console"
    
    print()
    print("=" * 60)
    print("  轻量应用服务器创建完成！")
    print("=" * 60)
    print()
    print(f"  实例 ID: {instance_id}")
    print(f"  公网 IP: {public_ip}")
    print()
    print(f"  SSH 登录:")
    print(f"    ssh root@{public_ip}")
    print(f"    密码: {os.getenv('SERVER_PASSWORD', '(从环境变量 SERVER_PASSWORD 读取)')}")
    print()
    print(f"  游戏地址: http://{public_ip}")
    print()
    print(f"  管理控制台:")
    print(f"    https://swas.console.aliyun.com/")
    print()
    
    return {
        'instance_id': instance_id,
        'public_ip': public_ip
    }

if __name__ == '__main__':
    create_lightweight_server(sys.argv[1], sys.argv[2])
