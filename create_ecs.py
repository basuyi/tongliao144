#!/usr/bin/env python3
"""Create ECS instance in Beijing region."""
import sys
import json
import time
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest

def create_ecs(ak_id, ak_secret, region_id='cn-beijing'):
    client = AcsClient(ak_id, ak_secret, region_id)
    
    print("=" * 60)
    print("  创建阿里云 ECS 实例")
    print("=" * 60)
    print()
    
    # 1. Create security group
    print("[..] Creating security group...")
    sg_request = CommonRequest()
    sg_request.set_accept_format('json')
    sg_request.set_domain('ecs.aliyuncs.com')
    sg_request.set_method('POST')
    sg_request.set_protocol_type('https')
    sg_request.set_version('2014-05-26')
    sg_request.set_action_name('CreateSecurityGroup')
    sg_request.add_query_param('RegionId', region_id)
    sg_request.add_query_param('SecurityGroupName', 'tongliao-game-sg')
    sg_request.add_query_param('Description', 'Security group for Tongliao 144 game')
    
    try:
        sg_response = client.do_action_with_exception(sg_request)
        sg_data = json.loads(sg_response)
        security_group_id = sg_data['SecurityGroupId']
        print(f"[OK] Security group created: {security_group_id}")
    except Exception as e:
        print(f"[ERROR] Failed to create security group: {e}")
        return None
    
    # 2. Add security group rules (allow HTTP/HTTPS/SSH)
    print("[..] Configuring security group rules...")
    for port, protocol in [(80, 'tcp'), (443, 'tcp'), (22, 'tcp')]:
        rule_request = CommonRequest()
        rule_request.set_accept_format('json')
        rule_request.set_domain('ecs.aliyuncs.com')
        rule_request.set_method('POST')
        rule_request.set_protocol_type('https')
        rule_request.set_version('2014-05-26')
        rule_request.set_action_name('AuthorizeSecurityGroup')
        rule_request.add_query_param('RegionId', region_id)
        rule_request.add_query_param('SecurityGroupId', security_group_id)
        rule_request.add_query_param('IpProtocol', protocol.upper())
        rule_request.add_query_param('PortRange', f'{port}/{port}')
        rule_request.add_query_param('SourceCidrIp', '0.0.0.0/0')
        rule_request.add_query_param('Policy', 'Accept')
        rule_request.add_query_param('Description', f'Allow {protocol.upper()} port {port}')
        
        try:
            client.do_action_with_exception(rule_request)
            print(f"  [OK] Allowed {protocol.upper()} port {port}")
        except Exception as e:
            print(f"  [WARN] Rule for port {port}: {e}")
    
    # 3. Create ECS instance
    print("[..] Creating ECS instance...")
    print("  Configuration:")
    print("    Region: cn-beijing")
    print("    Instance Type: ecs.t6-c1m1.large (1vCPU 1GB)")
    print("    Image: Ubuntu 22.04 64bit")
    print("    System Disk: 40GB ESSD")
    print("    Bandwidth: 5Mbps (pay by traffic)")
    print()
    
    ecs_request = CommonRequest()
    ecs_request.set_accept_format('json')
    ecs_request.set_domain('ecs.aliyuncs.com')
    ecs_request.set_method('POST')
    ecs_request.set_protocol_type('https')
    ecs_request.set_version('2014-05-26')
    ecs_request.set_action_name('CreateInstance')
    ecs_request.add_query_param('RegionId', region_id)
    ecs_request.add_query_param('ImageId', 'ubuntu_22_04_x64_20G_alibase_20240101.vhd')
    ecs_request.add_query_param('InstanceType', 'ecs.t6-c1m1.large')
    ecs_request.add_query_param('SecurityGroupId', security_group_id)
    ecs_request.add_query_param('InstanceName', 'tongliao-144-game')
    ecs_request.add_query_param('HostName', 'tongliao-game')
    ecs_request.add_query_param('Password', os.getenv('SERVER_PASSWORD', ''))
    ecs_request.add_query_param('SystemDisk.Category', 'cloud_essd')
    ecs_request.add_query_param('SystemDisk.Size', '40')
    ecs_request.add_query_param('InternetMaxBandwidthOut', '5')
    ecs_request.add_query_param('InternetChargeType', 'PayByTraffic')
    ecs_request.add_query_param('InstanceChargeType', 'PostPaid')
    ecs_request.add_query_param('ZoneId', 'cn-beijing-h')
    
    try:
        ecs_response = client.do_action_with_exception(ecs_request)
        ecs_data = json.loads(ecs_response)
        instance_id = ecs_data['InstanceId']
        print(f"[OK] ECS instance created: {instance_id}")
    except Exception as e:
        print(f"[ERROR] Failed to create ECS: {e}")
        return None
    
    # 4. Allocate public IP
    print("[..] Allocating public IP...")
    ip_request = CommonRequest()
    ip_request.set_accept_format('json')
    ip_request.set_domain('ecs.aliyuncs.com')
    ip_request.set_method('POST')
    ip_request.set_protocol_type('https')
    ip_request.set_version('2014-05-26')
    ip_request.set_action_name('AllocatePublicIpAddress')
    ip_request.add_query_param('InstanceId', instance_id)
    
    try:
        ip_response = client.do_action_with_exception(ip_request)
        ip_data = json.loads(ip_response)
        public_ip = ip_data['IpAddress']
        print(f"[OK] Public IP allocated: {public_ip}")
    except Exception as e:
        print(f"[ERROR] Failed to allocate public IP: {e}")
        return None
    
    # 5. Start instance
    print("[..] Starting instance...")
    start_request = CommonRequest()
    start_request.set_accept_format('json')
    start_request.set_domain('ecs.aliyuncs.com')
    start_request.set_method('POST')
    start_request.set_protocol_type('https')
    start_request.set_version('2014-05-26')
    start_request.set_action_name('StartInstance')
    start_request.add_query_param('InstanceId', instance_id)
    
    try:
        client.do_action_with_exception(start_request)
        print(f"[OK] Instance starting...")
    except Exception as e:
        print(f"[WARN] Start instance: {e}")
    
    # 6. Wait for instance to be running
    print("[..] Waiting for instance to be ready...")
    for i in range(30):
        time.sleep(5)
        status_request = CommonRequest()
        status_request.set_accept_format('json')
        status_request.set_domain('ecs.aliyuncs.com')
        status_request.set_method('POST')
        status_request.set_protocol_type('https')
        status_request.set_version('2014-05-26')
        status_request.set_action_name('DescribeInstanceStatus')
        status_request.add_query_param('RegionId', region_id)
        status_request.add_query_param('InstanceId.1', instance_id)
        
        try:
            status_response = client.do_action_with_exception(status_request)
            status_data = json.loads(status_response)
            if status_data.get('InstanceStatuses', {}).get('InstanceStatus'):
                status = status_data['InstanceStatuses']['InstanceStatus'][0]['Status']
                print(f"  Status: {status}")
                if status == 'Running':
                    break
        except:
            pass
    
    print()
    print("=" * 60)
    print("  ECS 创建完成！")
    print("=" * 60)
    print()
    print(f"  实例 ID: {instance_id}")
    print(f"  公网 IP: {public_ip}")
    print(f"  安全组: {security_group_id}")
    print()
    print(f"  SSH 登录:")
    print(f"    ssh root@{public_ip}")
    print(f"    密码: {os.getenv('SERVER_PASSWORD', '(从环境变量 SERVER_PASSWORD 读取)')}")
    print()
    print(f"  游戏地址: http://{public_ip}")
    print()
    
    return {
        'instance_id': instance_id,
        'public_ip': public_ip,
        'security_group_id': security_group_id
    }

if __name__ == '__main__':
    create_ecs(sys.argv[1], sys.argv[2])
