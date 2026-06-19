const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:390, height:844}});
  
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  
  const filePath = 'file:///' + path.resolve(__dirname, 'outputs/card-game.html').replace(/\\/g, '/');
  console.log('Loading:', filePath);
  await page.goto(filePath, {waitUntil:'networkidle', timeout:15000}).catch(e=>console.log('goto error:', e.message));
  await page.waitForTimeout(2000);
  
  const info = await page.evaluate(() => {
    const w = document.getElementById('wrap');
    if(!w) return {error:'no wrap element'};
    const cs = getComputedStyle(w);
    const children = [];
    for(let i=0; i<Math.min(w.children.length, 6); i++){
      const c = w.children[i];
      const cc = getComputedStyle(c);
      children.push({tag:c.tagName, id:c.id, cls:c.className.substring(0,30), display:cc.display, vis:cc.visibility, op:cc.opacity, w:c.offsetWidth, h:c.offsetHeight, pos:cc.position});
    }
    return {
      wrapW: w.offsetWidth, wrapH: w.offsetHeight,
      style_transform: w.style.transform,
      computed_transform: cs.transform,
      position: cs.position, display: cs.display,
      visibility: cs.visibility, opacity: cs.opacity,
      zIndex: cs.zIndex, overflow: cs.overflow,
      bgColor: cs.backgroundColor,
      childCount: w.children.length,
      children: children,
      ovExists: !!document.getElementById('ov'),
      ovDisplay: document.getElementById('ov') ? getComputedStyle(document.getElementById('ov')).display : 'N/A',
      ovHasContent: document.getElementById('ov') ? document.getElementById('ov').innerHTML.length > 0 : false,
      vw: window.innerWidth, vh: window.innerHeight,
    };
  });
  console.log('Wrap info:', JSON.stringify(info, null, 2));
  if(errors.length) console.log('JS Errors:', JSON.stringify(errors));
  
  await page.screenshot({path: path.resolve(__dirname, 'debug-screenshot.png')});
  console.log('Screenshot saved to debug-screenshot.png');
  
  await browser.close();
})();
