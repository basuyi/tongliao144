const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\杨大宝\\.qoderwork\\workspace\\mq2epl8bo56qv19k\\outputs\\card-game.html', 'utf8');
// Find the inline script (second <script> tag, without src)
const allScripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const inlineScript = allScripts.find(s => !s[1].includes('src'));
if (!inlineScript) { console.log('No inline script found'); process.exit(1); }
const js = inlineScript[2];
try {
  new Function(js);
  console.log('JS syntax OK');
} catch(err) {
  console.log('JS syntax error:', err.message);
}
console.log('Total HTML lines:', html.split('\n').length);
console.log('JS length:', js.length, 'chars');
