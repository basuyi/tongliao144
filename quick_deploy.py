import paramiko, os
from deploy_config import get_config
cfg = get_config()
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['server_ip'], username=cfg['ssh_user'], password=cfg['ssh_pass'], timeout=15, allow_agent=False, look_for_keys=False)
sftp = ssh.open_sftp()
sftp.put(cfg['local_html'], f"{cfg['remote_public']}/index.html")
sftp.close()
stdin, stdout, stderr = ssh.exec_command('nginx -s reload')
print('reload:', stdout.read().decode(), stderr.read().decode())
ssh.close()
print('Done!')
