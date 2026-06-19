import re

with open(r'C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
game_script = scripts[1]

lines = game_script.split('\n')
brace_depth = 0

print("Lines 1-65 of game script:")
for i in range(min(65, len(lines))):
    line = lines[i]
    prev_depth = brace_depth
    for c in line:
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth -= 1
    if brace_depth != prev_depth or i < 25:
        print(f"  Line {i+1}: {prev_depth}→{brace_depth} | {line[:90]}")
