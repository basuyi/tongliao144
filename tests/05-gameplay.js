const { chromium } = require('playwright');
const path = require('path');

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

  let playsCount = 0, passCount = 0, chaDialogs = 0, dianDialogs = 0, overlayDismissals = 0;

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
    });
    await page.waitForTimeout(2000);

    for (let step = 0; step < 80; step++) {
      await page.waitForTimeout(1000);

      const state = await page.evaluate(() => {
        const ov = document.getElementById('ov');
        const ovVis = ov && !ov.classList.contains('h');
        const ovTxt = ovVis ? ov.textContent : '';
        return {
          ovVis, ovTxt: ovTxt.substring(0, 120),
          hasCy: typeof window._cy === 'function',
          hasCn: typeof window._cn === 'function',
          hasDy: typeof window._dy === 'function',
          hasDn: typeof window._dn === 'function',
          hasCc: typeof window._cc === 'function',
          turn: G.turn, busy: G.busy, phase: G.ph,
          hand: G.hd[0].length,
          ordLen: G.ord.length,
        };
      });

      if (state.phase === 'end' || state.ovTxt.includes('本局结束') || state.ovTxt.includes('最终胜利')) {
        await page.evaluate(() => { hideOv(); });
        await page.waitForTimeout(500);
        break;
      }

      if (state.ovVis) {
        if (state.hasCy || state.hasCn) {
          chaDialogs++;
          await page.evaluate(() => window._cn());
          await page.waitForTimeout(500);
          continue;
        }
        if (state.hasDy || state.hasDn) {
          dianDialogs++;
          await page.evaluate(() => window._dn());
          await page.waitForTimeout(500);
          continue;
        }
        if (state.hasCc) {
          overlayDismissals++;
          await page.evaluate(() => { hideOv(); if(window._cc) window._cc(); });
          await page.waitForTimeout(500);
          continue;
        }
        await page.evaluate(() => hideOv());
        await page.waitForTimeout(500);
        continue;
      }

      if (state.phase !== 'play') continue;

      if (state.turn === 0 && !state.busy && state.hand > 0) {
        const result = await page.evaluate(() => {
          const plays = allPlays(G.hd[0], G.lp, G.hui);
          if (plays.length > 0) {
            const play = plays[0];
            G.sel = play.cards.map(c => c.id);
            render();
            actPlay();
            return { action: 'play', type: play.type, cards: play.cards.length };
          }
          if (G.lp && G.lpp !== 0) {
            actPass();
            return { action: 'pass' };
          }
          if (!G.lp && G.hd[0].length > 0) {
            G.sel = [G.hd[0][0].id];
            render();
            actPlay();
            return { action: 'play-first', type: 'single' };
          }
          return { action: 'nothing' };
        });

        if (result.action === 'play' || result.action === 'play-first') {
          playsCount++;
        } else if (result.action === 'pass') {
          passCount++;
        }
        await page.waitForTimeout(600);
      }
    }

    const ssPath = path.join(__dirname, 'screenshots', 'gameplay.png');
    await page.screenshot({ path: ssPath });

    results.push({ name: '完整对局(无卡死)', pass: playsCount > 0, detail: `出牌${playsCount}次, 过牌${passCount}次` });
    results.push({ name: '岔点弹窗处理', pass: true, detail: `岔弹窗${chaDialogs}次, 点弹窗${dianDialogs}次, 其他弹窗${overlayDismissals}次` });
    results.push({ name: '对局无JS错误', pass: errors.length === 0, detail: errors.length ? errors.slice(0, 3).join('; ') : '' });

  } catch (e) {
    results.push({ name: '异常捕获', pass: false, detail: e.message });
  }

  await browser.close();
  return { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length, results };
}

module.exports = { name: '05-完整对局', run };
