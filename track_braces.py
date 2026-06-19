import re

with open(r'C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
game_script = scripts[1]

lines = game_script.split('\n')
brace_depth = 0

for i, line in enumerate(lines, 1):
    prev_depth = brace_depth
    for c in line:
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth -= 1
    if brace_depth != prev_depth:
        depth_change = brace_depth - prev_depth
        # Show lines where depth changes significantly
        if abs(depth_change) > 2 or brace_depth < 0:
            print(f"Line {i}: depth {prev_depth} -> {brace_depth} (change: {depth_change:+d})")
            print(f"  {line[:120]}...")

print(f"\nFinal depth: {brace_depth}")
print(f"\nDepth at each function definition:")
brace_depth = 0
for i, line in enumerate(lines, 1):
    for c in line:
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth -= 1
    if 'function ' in line and brace_depth <= 1:
        func_name = re.search(r'function\s+(\w+)', line)
        if func_name:
            print(f"  Line {i}: {func_name.group(1)} (depth after line: {brace_depth})")
