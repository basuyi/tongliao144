import re

with open(r'C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
game_script = scripts[1]

lines = game_script.split('\n')
brace_depth = 0

print("Lines 47-59 (detect function):")
for i in range(46, min(59, len(lines))):
    line = lines[i]
    prev_depth = brace_depth
    open_count = 0
    close_count = 0
    for c in line:
        if c == '{':
            brace_depth += 1
            open_count += 1
        elif c == '}':
            brace_depth -= 1
            close_count += 1
    print(f"  Line {i+1}: start={prev_depth}, end={brace_depth}, open={open_count}, close={close_count}")
    if i == 46:  # detect function definition
        print(f"    -> {line[:80]}")
    if brace_depth < 0:
        print(f"    ERROR: Negative depth!")
