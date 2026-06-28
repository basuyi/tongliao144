#!/usr/bin/env python3
"""Server deployment configuration - single source of truth for all deploy scripts."""
import os

def get_config():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return {
        'server_ip': os.getenv('SERVER_IP', _read_file(os.path.join(base_dir, '.server_ip'))),
        'ssh_user': 'root',
        'ssh_pass': os.getenv('SERVER_PASSWORD', _read_file(os.path.join(base_dir, '.ssh_pass'))),
        'remote_base': '/var/www/game',
        'remote_public': '/var/www/game/public',
        'remote_server': '/var/www/game/server',
        'remote_shared': '/var/www/game/shared',
        'local_html': os.path.join(base_dir, 'outputs', 'card-game.html'),
        'local_js': os.path.join(base_dir, 'outputs', 'game-logic.js'),
    }

def _read_file(path):
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        return ''
