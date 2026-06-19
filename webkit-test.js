const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: {width: 375, height: 828},
    deviceScaleFactor: 3.25
  });
  const page = await ctx.newPage();
  await page.goto('file:///C:/Users/杨大宝/.qoderwork/workspace/mq2epl8bo56qv19k/outputs/card-game.html');
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => {
    const html = document.documentElement;
    const w = document.getElementById('wrap');
    const hcs = window.getComputedStyle(html);
    const wcs = w ? window.getComputedStyle(w) : null;
    const wr = w ? w.getBoundingClientRect() : null;
    return {
      screen: {w: screen.width, h: screen.height},
      dpr: window.devicePixelRatio,
      inner: {w: window.innerWidth, h: window.innerHeight},
      html_transform: hcs.transform,
      html_width: hcs.width, html_height: hcs.height,
      wrap_transform: wcs ? wcs.transform : null,
      wrap_width: wcs ? wcs.width : null,
      wrap_height: wcs ? wcs.height : null,
      wrap_rect: wr ? {top:wr.top,left:wr.left,width:wr.width,height:wr.height} : null,
      jsError: window.__jsErr || null
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({path: 'webkit-test.png'});
  await browser.close();
})();
