const { chromium } = require('playwright');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '..', 'outputs', 'card-game.html');
const URL = 'file:///' + HTML_PATH.replace(/\\/g, '/');

async function testScenario(name, viewport, dpr, userAgent, screenOverride) {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor: dpr || 1,
  });
  const page = await context.newPage();

  if (screenOverride) {
    await page.addInitScript((so) => {
      Object.defineProperty(screen, 'width', { get: () => so.width, configurable: true });
      Object.defineProperty(screen, 'height', { get: () => so.height, configurable: true });
    }, screenOverride);
  }

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    results.push({ name: `[${name}] 无JS错误`, pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

    const info = await page.evaluate(() => {
      const wrap = document.getElementById('wrap');
      if (!wrap) return { hasWrap: false };
      const cs = getComputedStyle(wrap);
      return {
        hasWrap: true,
        wrapW: wrap.offsetWidth,
        wrapH: wrap.offsetHeight,
        transform: cs.transform,
        transformOrigin: cs.transformOrigin,
        position: cs.position,
        top: cs.top,
        vw: window.innerWidth,
        vh: window.innerHeight,
        sw: screen.width,
        sh: screen.height,
        flDbg: window._flDbg,
      };
    });

    if (!info.hasWrap) {
      results.push({ name: `[${name}] wrap存在`, pass: false, detail: 'no wrap' });
      await browser.close();
      return results;
    }

    const isLandscape = info.wrapW > info.wrapH;
    results.push({
      name: `[${name}] wrap横向(W>H)`,
      pass: isLandscape,
      detail: `${info.wrapW}x${info.wrapH}`
    });

    const hasMatrix = info.transform && info.transform.includes('matrix') && info.transform !== 'matrix(1, 0, 0, 1, 0, 0)';
    results.push({
      name: `[${name}] transform已应用`,
      pass: hasMatrix,
      detail: info.transform
    });

    if (hasMatrix) {
      const m = info.transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const vals = m[1].split(',').map(Number);
        const a = vals[0], b = vals[1], c = vals[2], d = vals[3], e = vals[4], f = vals[5];
        const isNeg90 = Math.abs(a) < 0.01 && b < 0 && c > 0 && Math.abs(d) < 0.01;
        results.push({
          name: `[${name}] 旋转-90°正确`,
          pass: isNeg90,
          detail: `a=${a.toFixed(3)} b=${b.toFixed(3)} c=${c.toFixed(3)} d=${d.toFixed(3)}`
        });

        const scale = Math.abs(c);
        const expectedW = info.wrapW;
        const expectedH = info.wrapH;
        const scaledW = scale * expectedW;
        const scaledH = scale * expectedH;
        const vpW = viewport.width, vpH = viewport.height;

        const fillsOneDim = (scaledW >= vpW * 0.95 || scaledH >= vpH * 0.95);
        results.push({
          name: `[${name}] 缩放填充至少一维`,
          pass: fillsOneDim,
          detail: `s=${scale.toFixed(3)} sW=${Math.round(scaledW)} sH=${Math.round(scaledH)} vp=${vpW}x${vpH}`
        });
      }
    }

    const gameOk = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
      return true;
    });
    await page.waitForTimeout(2500);

    const game = await page.evaluate(() => ({
      phase: G.ph,
      hasCards: G.hd[0] && G.hd[0].length > 0,
      uiCards: document.querySelectorAll('#hand .c').length,
    }));
    results.push({
      name: `[${name}] 游戏可启动并渲染`,
      pass: game.hasCards && game.uiCards > 0,
      detail: `phase=${game.phase} cards=${game.hasCards} uiCards=${game.uiCards}`
    });

    results.push({
      name: `[${name}] 启动无错误`,
      pass: errors.length === 0,
      detail: errors.join('; ')
    });

    await page.screenshot({ path: path.resolve(__dirname, `test-${name.toLowerCase().replace(/\s/g, '-')}.png`), fullPage: false });

    console.log(`\n--- ${name} ---`);
    console.log(`  viewport: ${viewport.width}x${viewport.height}, dpr: ${dpr}, screen: ${info.sw}x${info.sh}`);
    console.log(`  wrap: ${info.wrapW}x${info.wrapH}, tf: ${info.transform}`);
    console.log(`  origin: ${info.transformOrigin}, pos: ${info.position}, top: ${info.top}`);
    console.log(`  flDbg: ${JSON.stringify(info.flDbg)}`);

  } catch (e) {
    results.push({ name: `[${name}] 异常`, pass: false, detail: e.message });
  }

  await browser.close();
  return results;
}

async function main() {
  console.log('=== 强制横屏综合测试 ===\n');

  const scenarios = [
    {
      name: '华为手机',
      viewport: { width: 980, height: 1774 },
      dpr: 3.25,
      userAgent: 'Mozilla/5.0 (Linux; Android 12; ALN-AL00) AppleWebKit/537.36',
      screenOverride: { width: 375, height: 828 }
    },
    {
      name: '普通手机',
      viewport: { width: 375, height: 812 },
      dpr: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      screenOverride: null
    },
    {
      name: '小屏手机',
      viewport: { width: 320, height: 568 },
      dpr: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      screenOverride: null
    },
    {
      name: '平板竖屏',
      viewport: { width: 768, height: 1024 },
      dpr: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
      screenOverride: null
    }
  ];

  let totalPass = 0, totalFail = 0;
  for (const s of scenarios) {
    const results = await testScenario(s.name, s.viewport, s.dpr, s.userAgent, s.screenOverride);
    const pass = results.filter(r => r.pass).length;
    const fail = results.filter(r => !r.pass).length;
    totalPass += pass;
    totalFail += fail;
    console.log(`  结果: ${pass}通过, ${fail}失败`);
    if (fail > 0) {
      results.filter(r => !r.pass).forEach(r => console.log(`  FAIL: ${r.name}: ${r.detail}`));
    }
  }

  console.log(`\n=== 总计: ${totalPass}通过, ${totalFail}失败 ===`);
}

main().catch(e => console.error(e));
