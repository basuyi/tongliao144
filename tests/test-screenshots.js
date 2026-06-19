const { chromium } = require('playwright');
const path = require('path');

const URL = 'http://39.96.47.193';

async function screenshot(scenario, filename) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: scenario.viewport,
    userAgent: scenario.userAgent,
    deviceScaleFactor: scenario.dpr || 1,
  });

  if (scenario.screenOverride) {
    await context.addInitScript(({ sw, sh }) => {
      Object.defineProperty(screen, 'width', { get: () => sw });
      Object.defineProperty(screen, 'height', { get: () => sh });
    }, { sw: scenario.screenOverride.width, sh: scenario.screenOverride.height });
  }

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const ssDir = path.join(__dirname, 'screenshots');
  require('fs').mkdirSync(ssDir, { recursive: true });

  await page.screenshot({ path: path.join(ssDir, filename + '-lobby.png'), fullPage: false });

  // Click single player
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
  });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(ssDir, filename + '-game.png'), fullPage: false });

  await browser.close();
  console.log(`Saved: ${filename}-lobby.png, ${filename}-game.png`);
}

(async () => {
  // Huawei (zoomed)
  await screenshot({
    name: 'huawei',
    viewport: { width: 980, height: 1048 },
    screenOverride: { width: 1219, height: 2691 },
    dpr: 3.25,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; HWI-AL00) AppleWebKit/537.36'
  }, 'huawei');

  // Normal phone
  await screenshot({
    name: 'normal',
    viewport: { width: 412, height: 915 },
    screenOverride: { width: 1082, height: 2402 },
    dpr: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36'
  }, 'pixel6');

  // iPhone
  await screenshot({
    name: 'iphone',
    viewport: { width: 390, height: 844 },
    screenOverride: { width: 1170, height: 2532 },
    dpr: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  }, 'iphone14');

  console.log('\nAll screenshots saved to tests/screenshots/');
})();
