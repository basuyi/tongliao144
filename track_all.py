import re

with open(r'C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
game_script = scripts[1]

lines = game_script.split('\n')
brace_depth = 0
max_depth = 0
max_depth_line = 0

# Track depth at end of each line
for i, line in enumerate(lines):
    prev_depth = brace_depth
    for c in line:
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth -= 1
    if brace_depth > max_depth:
        max_depth = brace_depth
        max_depth_line = i + 1
    # Show lines where depth increases to 2 or more
    if brace_depth >= 2 and prev_depth < brace_depth:
        print(f"Line {i+1}: depth went to {brace_depth} (from {prev_depth})")
        print(f"  {line[:100]}")

print(f"\nMax depth: {max_depth} at line {max_depth_line}")
print(f"Final depth: {brace_depth}")

# Find where depth never returns to 0
print("\nLines where depth is >= 2 at end:")
brace_depth = 0
for i, line in enumerate(lines):
    for c in line:
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth -= 1
    if brace_depth >= 2:
        print(f"  Line {i+1}: depth={brace_depth}, {line[:80]}")
