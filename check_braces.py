import re

with open(r'C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
game_script = scripts[1]

# Simple brace count
braces = 0
for c in game_script:
    if c == '{':
        braces += 1
    elif c == '}':
        braces -= 1

print(f'Final brace count: {braces}')

# Find the last few functions
lines = game_script.split('\n')
print(f'\nTotal lines: {len(lines)}')
print('\nLast 5 lines:')
for i, line in enumerate(lines[-5:], len(lines)-4):
    print(f'{i}: {line[:100]}...' if len(line) > 100 else f'{i}: {line}')
