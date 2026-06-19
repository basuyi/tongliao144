const { chromium } = require('playwright');

const URL = 'http://39.96.47.193';

const scenarios = [
  {
    name: '华为手机 (zoomed viewport vw=980)',
    viewport: { width: 980, height: 1048 },
    screenOverride: { width: 1219, height: 2691 },
    dpr: 3.25,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; HWI-AL00) AppleWebKit/537.36'
  },
  {
    name: '普通安卓手机 (Pixel 6)',
    viewport: { width: 412, height: 915 },
    screenOverride: { width: 1082, height: 2402 },
    dpr: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36'
  },
  {
    name: 'iPhone 14',
    viewport: { width: 390, height: 844 },
    screenOverride: { width: 1170, height: 2532 },
    dpr: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  },
  {
    name: '小屏手机 (iPhone SE)',
    viewport: { width: 375, height: 667 },
    screenOverride: { width: 750, height: 1334 },
    dpr: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
  },
  {
    name: '华为手机 + online模式空room',
    viewport: { width: 980, height: 1048 },
    screenOverride: { width: 1219, height: 2691 },
    dpr: 3.25,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; HWI-AL00) AppleWebKit/537.36',
    urlSuffix: '?mode=online&room='
  }
];

async function testScenario(scenario) {
  const results = [];
  const browser = await chromium.launch({ headless: true });

  const ctxOpts = {
    viewport: scenario.viewport,
    userAgent: scenario.userAgent,
    deviceScaleFactor: scenario.dpr || 1,
  };

  const context = await browser.newContext(ctxOpts);

  if (scenario.screenOverride) {
    await context.addInitScript(({ sw, sh }) => {
      Object.defineProperty(screen, 'width', { get: () => sw });
      Object.defineProperty(screen, 'height', { get: () => sh });
    }, { sw: scenario.screenOverride.width, sh: scenario.screenOverride.height });
  }

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  const testUrl = URL + (scenario.urlSuffix || '');

  try {
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    results.push({
      name: '加载无JS错误',
      pass: errors.length === 0,
      detail: errors.length ? errors.join('; ').slice(0, 200) : 'OK'
    });

    const dbg = await page.evaluate(() => ({
      vw: window._flDbg?.vw,
      vh: window._flDbg?.vh,
      rw: window._flDbg?.rw,
      rh: window._flDbg?.rh,
      flW: window._flW,
      flH: window._flH,
      flZoomed: window._flZoomed,
    }));
    results.push({
      name: '缓存尺寸',
      pass: dbg.flW > 0 && dbg.flH > 0,
      detail: `flW=${dbg.flW} flH=${dbg.flH} zm=${dbg.flZoomed} vw=${dbg.vw} vh=${dbg.vh} rw=${dbg.rw}`
    });

    const wrapInfo = await page.evaluate(() => {
      const wrap = document.getElementById('wrap');
      if (!wrap) return null;
      const cs = getComputedStyle(wrap);
      const r = wrap.getBoundingClientRect();
      return {
        w: wrap.offsetWidth, h: wrap.offsetHeight,
        tf: cs.transform, ori: cs.transformOrigin, pos: cs.position,
        rx: Math.round(r.x), ry: Math.round(r.y), rw: Math.round(r.width), rh: Math.round(r.height)
      };
    });

    if (wrapInfo) {
      results.push({
        name: 'wrap横屏',
        pass: wrapInfo.w > wrapInfo.h,
        detail: `${wrapInfo.w}x${wrapInfo.h}`
      });

      const hasTf = wrapInfo.tf && wrapInfo.tf !== 'none' && !wrapInfo.tf.includes('1, 0, 0, 1, 0, 0');
      results.push({
        name: 'transform已应用',
        pass: hasTf,
        detail: wrapInfo.tf
      });

      const vp = scenario.viewport;
      const coversW = wrapInfo.rx <= 0 && (wrapInfo.rx + wrapInfo.rw) >= vp.width;
      results.push({
        name: '宽度覆盖',
        pass: coversW,
        detail: `rect=${wrapInfo.rw}x${wrapInfo.rh}@(${wrapInfo.rx},${wrapInfo.ry}) vp=${vp.width}x${vp.height}`
      });
    }

    // Content visibility
    const visibility = await page.evaluate(() => {
      const ov = document.getElementById('ov');
      return {
        ovVisible: !!(ov && !ov.classList.contains('h')),
        hasLobby: !!(ov && ov.innerHTML.includes('单机模式')),
        btns: document.querySelectorAll('button').length,
      };
    });

    if (!scenario.urlSuffix) {
      results.push({
        name: '大厅显示',
        pass: visibility.hasLobby,
        detail: `ov=${visibility.ovVisible} lobby=${visibility.hasLobby} btns=${visibility.btns}`
      });

      // Start game
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
      });
      await page.waitForTimeout(3000);

      const game = await page.evaluate(() => {
        if (typeof G === 'undefined') return null;
        return { phase: G.ph, hands: G.hd ? G.hd.map(h => h.length) : [] };
      });
      results.push({
        name: '游戏启动',
        pass: game && game.phase === 'play',
        detail: game ? `phase=${game.phase} hands=${JSON.stringify(game.hands)}` : 'G undefined'
      });

      const uiCards = await page.evaluate(() => document.querySelectorAll('#hand .c').length);
      results.push({
        name: '手牌渲染',
        pass: uiCards > 0,
        detail: `${uiCards}张牌`
      });

      const postErrors = errors.length;
      results.push({
        name: '游戏过程无JS错误',
        pass: errors.length === 0,
        detail: errors.length ? errors.join('; ').slice(0, 200) : 'OK'
      });
    } else {
      results.push({
        name: 'online模式不崩溃',
        pass: errors.length === 0,
        detail: errors.length ? errors.join('; ').slice(0, 200) : '页面加载无崩溃'
      });
    }

  } catch (e) {
    results.push({ name: '异常', pass: false, detail: e.message });
  }

  await browser.close();
  return results;
}

(async () => {
  let totalPass = 0, totalFail = 0, totalTests = 0;

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📱 ${scenario.name}`);
    console.log(`${'='.repeat(60)}`);

    const results = await testScenario(scenario);
    let pass = 0, fail = 0;
    for (const r of results) {
      const icon = r.pass ? '✅' : '❌';
      console.log(`  ${icon} ${r.name}: ${r.detail || ''}`);
      if (r.pass) pass++; else fail++;
    }
    console.log(`\n  结果: ${pass}/${results.length} 通过`);
    totalPass += pass;
    totalFail += fail;
    totalTests += results.length;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 总计: ${totalPass}/${totalTests} 通过, ${totalFail} 失败`);
  console.log(`${'='.repeat(60)}`);
})();
