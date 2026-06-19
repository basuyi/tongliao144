const { chromium } = require('playwright');

const URL = 'http://39.96.47.193';

async function run() {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    results.push({ name: '页面无JS错误(加载时)', pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

    const funcs = await page.evaluate(() => ({
      allPlays: typeof allPlays,
      aiPick: typeof aiPick,
      render: typeof render,
      newGame: typeof newGame,
      beats: typeof beats,
      showOv: typeof showOv,
      hideOv: typeof hideOv,
      toast: typeof toast,
      checkChaDian: typeof checkChaDian,
      checkDianPhase: typeof checkDianPhase,
      actPlay: typeof actPlay,
      actPass: typeof actPass,
      doDbl: typeof doDbl,
      doSglSame: typeof doSglSame,
      doSglDiff: typeof doSglDiff,
      shouldEndRound: typeof shouldEndRound,
    }));
    const missing = Object.entries(funcs).filter(([k, v]) => v !== 'function').map(([k]) => k);
    results.push({ name: '关键函数均存在', pass: missing.length === 0, detail: missing.length ? '缺失: ' + missing.join(', ') : `${Object.keys(funcs).length}个函数全部就绪` });

    const lobby = await page.evaluate(() => {
      const ov = document.getElementById('ov');
      return ov && !ov.classList.contains('h') && ov.innerHTML.includes('单机模式');
    });
    results.push({ name: '大厅界面正常显示', pass: !!lobby });

    const landscape = await page.evaluate(() => {
      const wrap = document.getElementById('wrap');
      if (!wrap) return { ok: false, reason: 'no wrap' };
      const cs = getComputedStyle(wrap);
      const hasMatrix = cs.transform && (cs.transform.includes('matrix') || cs.transform.includes('rotate'));
      const wrapW = wrap.offsetWidth, wrapH = wrap.offsetHeight;
      return { ok: hasMatrix && wrapW > wrapH, transform: cs.transform, wrapW, wrapH };
    });
    results.push({ name: '强制横屏生效', pass: landscape.ok, detail: `wrapTf=${landscape.transform} wrap=${landscape.wrapW}x${landscape.wrapH}` });

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
    });
    await page.waitForTimeout(2500);

    results.push({ name: '点击单机模式后无JS错误', pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

    const game = await page.evaluate(() => ({
      phase: G.ph,
      hands: G.hd.map(h => h.length),
      hasCards: G.hd[0].length > 0,
    }));
    results.push({ name: '游戏初始化(发牌)', pass: game.hasCards && game.phase === 'play', detail: `phase=${game.phase}, hands=${JSON.stringify(game.hands)}` });

    const uiCards = await page.evaluate(() => document.querySelectorAll('#hand .c').length);
    results.push({ name: '手牌UI渲染', pass: uiCards > 0, detail: `${uiCards}张牌` });

  } catch (e) {
    results.push({ name: '异常捕获', pass: false, detail: e.message });
  }

  await browser.close();
  return { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length, results };
}

module.exports = { name: '01-页面加载与初始化', run };
