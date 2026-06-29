#!/usr/bin/env python3
"""Server deployment configuration - single source of truth for all deploy scripts."""
import os

def get_config():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env = _load_env(os.path.join(base_dir, '.env'))
    return {
        'server_ip': env.get('SERVER_IP', ''),
        'ssh_user': 'root',
        'ssh_pass': env.get('SERVER_PASSWORD', ''),
        'remote_base': '/var/www/game',
        'remote_public': '/var/www/game/public',
        'remote_server': '/var/www/game/server',
        'remote_shared': '/var/www/game/shared',
        'local_html': os.path.join(base_dir, 'outputs', 'card-game.html'),
        'local_js': os.path.join(base_dir, 'outputs', 'game-logic.js'),
    }

def _load_env(path):
    env = {}
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, value = line.partition('=')
                    env[key.strip()] = value.strip()
    except FileNotFoundError:
        pass
    return env
