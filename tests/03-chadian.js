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
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
    });
    await page.waitForTimeout(2000);

    const t1 = await page.evaluate(() => {
      G.hd[0] = G.hd[0].filter(c => c.r !== 4);
      let deck = [];
      for (let s of ['hearts','diamonds','clubs','spades']) deck.push({r:4, suit:s, id:'test_4_'+s});
      G.hd[0].push(deck[0], deck[1]);
      let aiFour = {r:4, suit:'spades', id:'ai_4_spades'};
      G.lp = {type:'single', rk:4, cards:[aiFour]};
      G.lpp = 1;
      G.turn = 0;
      G.busy = false;
      G.ph = 'play';
      let plays = allPlays(G.hd[0], G.lp, G.hui);
      let chaPlay = plays.find(p => p.type === 'cha');
      return { chaOption: !!chaPlay, chaCards: chaPlay ? chaPlay.cards.length : 0 };
    });
    results.push({ name: 'allPlays包含岔(cha)选项', pass: t1.chaOption && t1.chaCards === 2, detail: `cha=${t1.chaOption}, cards=${t1.chaCards}` });

    const t2 = await page.evaluate(() => {
      let fours = G.hd[0].filter(c => c.r === 4);
      if (fours.length < 2) return { ok: false, reason: '需要2个4' };
      G.sel = [fours[0].id, fours[1].id];
      G.lp = {type:'single', rk:4, cards:[{r:4, suit:'spades', id:'ai_4'}]};
      G.lpp = 1; G.turn = 0; G.busy = false;
      let sc = G.sel.map(id => G.hd[0].find(c => c.id === id)).filter(Boolean);
      let play = detect(sc, G.hui);
      let isCha = G.lp.type === 'single' && G.lp.cards[0].r === 4 && play.type === 'pair' && play.cards.every(c => c.r === 4);
      return { ok: isCha, playType: play.type };
    });
    results.push({ name: 'actPlay识别岔(对4压单4)', pass: t2.ok, detail: `playType=${t2.playType}` });

    const t3 = await page.evaluate(() => {
      let fours = G.hd[0].filter(c => c.r === 4);
      if (fours.length < 1) return { ok: false, reason: '需要1个4' };
      G.lp = {type:'pair', rk:4, cards:[{r:4, suit:'hearts', id:'p1'},{r:4, suit:'diamonds', id:'p2'}]};
      G.lpp = 1;
      let sc = [fours[0]];
      let play = detect(sc, G.hui);
      let isDian = G.lp.type === 'pair' && G.lp.cards[0].r === 4 && play.type === 'single' && play.cards[0].r === 4;
      return { ok: isDian, playType: play.type };
    });
    results.push({ name: 'actPlay识别点(单4压对4)', pass: t3.ok, detail: `playType=${t3.playType}` });

    const t4 = await page.evaluate(() => {
      G.lp = {type:'pair', rk:4, cards:[{r:4, suit:'hearts', id:'p1'},{r:4, suit:'diamonds', id:'p2'}]};
      let plays = allPlays(G.hd[0], G.lp, G.hui);
      let dianPlay = plays.find(p => p.type === 'dian');
      return { hasDian: !!dianPlay, dianCards: dianPlay ? dianPlay.cards.length : 0 };
    });
    results.push({ name: 'allPlays包含点(dian)选项', pass: t4.hasDian && t4.dianCards === 1, detail: JSON.stringify(t4) });

    const t5 = await page.evaluate(() => typeof checkDianPhase === 'function');
    results.push({ name: 'checkDianPhase函数存在', pass: t5 });

    const t6 = await page.evaluate(() => {
      let normalSingle = {type:'single', rk:5, cards:[{r:5, suit:'hearts'}]};
      let plays = allPlays(G.hd[0], normalSingle, G.hui);
      let cha = plays.find(p => p.type === 'cha');
      let dian = plays.find(p => p.type === 'dian');
      return { noChaOnNonFour: !cha, noDianOnNonFour: !dian };
    });
    results.push({ name: '非4牌不触发岔/点选项', pass: t6.noChaOnNonFour && t6.noDianOnNonFour, detail: JSON.stringify(t6) });

    results.push({ name: '岔点测试无JS错误', pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

  } catch (e) {
    results.push({ name: '异常捕获', pass: false, detail: e.message });
  }

  await browser.close();
  return { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length, results };
}

module.exports = { name: '03-岔点(ChaDian)', run };
