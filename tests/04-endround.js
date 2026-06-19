const { chromium } = require('playwright');

const URL = 'http://39.96.47.193';

async function run() {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { hideOv(); newGame(); });
    await page.waitForTimeout(2000);

    const t1 = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1,2,3], [], [4,5]];
      G.stg = [true, false, true, false]; G.lv = [5, 5, 5, 5];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv], upgraded: res.upgraded, starter: res.starter };
    });
    results.push({ name: '双抓: 5升2级到7', pass: t1.lv[0] === 7 && t1.lv[2] === 7, detail: `lv=${JSON.stringify(t1.lv)}` });

    const t2 = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1], [], [2]];
      G.stg = [true, false, true, false]; G.lv = [3, 3, 3, 3];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv], upgraded: res.upgraded };
    });
    results.push({ name: '双抓打3: 不升级', pass: t2.lv[0] === 3, detail: `lv=${JSON.stringify(t2.lv)}` });

    const t2b = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1], [], [2]];
      G.stg = [true, false, true, false]; G.lv = [11, 11, 11, 11];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv] };
    });
    results.push({ name: '双抓打J: 不升级', pass: t2b.lv[0] === 11, detail: `lv=${JSON.stringify(t2b.lv)}` });

    const t2c = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1], [], [2]];
      G.stg = [true, false, true, false]; G.lv = [14, 14, 14, 14];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv] };
    });
    results.push({ name: '双抓打A: 不升级', pass: t2c.lv[0] === 14, detail: `lv=${JSON.stringify(t2c.lv)}` });

    const t2d = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1], [], [2]];
      G.stg = [false, true, false, true]; G.lv = [5, 11, 5, 11];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv], dem: res.dem, noTr: G.noTr };
    });
    results.push({ name: '双抓降级: J(11)降到3', pass: t2d.lv[1] === 3 && t2d.dem && t2d.noTr, detail: `lv=${JSON.stringify(t2d.lv)}, dem=${t2d.dem}, noTr=${t2d.noTr}` });

    const t2e = await page.evaluate(() => {
      G.ord = [0, 2]; G.dn = [true, false, true, false];
      G.hd = [[], [1], [], [2]];
      G.stg = [false, true, false, true]; G.lv = [5, 14, 5, 14];
      let res = doDbl(0, [...G.stg]);
      return { lv: [...G.lv], dem: res.dem };
    });
    results.push({ name: '双抓降级: A(14)降到J(11)', pass: t2e.lv[1] === 11 && t2e.dem, detail: `lv=${JSON.stringify(t2e.lv)}, dem=${t2e.dem}` });

    const t3 = await page.evaluate(() => {
      G.ord = [0, 1, 3, 2]; G.stg = [true, false, true, false];
      G.lv = [5, 5, 5, 5]; G.noTr = false;
      let res = doSglSame(0, [...G.stg]);
      return { lv: [...G.lv], noTr: G.noTr, starter: res.starter, sameTeam: res.sameTeam, upgraded: res.upgraded };
    });
    results.push({ name: '1/4同队: 不升级', pass: t3.lv[0] === 5 && !t3.upgraded, detail: `lv=${JSON.stringify(t3.lv)}` });
    results.push({ name: '1/4同队: 免上供', pass: t3.noTr });
    results.push({ name: '1/4同队: 第一名先出', pass: t3.starter === 0 });

    const t4 = await page.evaluate(() => {
      G.ord = [0, 1, 2, 3]; G.stg = [true, false, true, false];
      G.lv = [5, 5, 5, 5]; G.noTr = true;
      let res = doSglDiff(0, 3, 0, [...G.stg]);
      return { lv: [...G.lv], noTr: G.noTr, starter: res.starter, upgraded: res.upgraded };
    });
    results.push({ name: '1/4不同队(台上): 升1级', pass: t4.lv[0] === 6 && t4.upgraded, detail: `lv=${JSON.stringify(t4.lv)}` });
    results.push({ name: '1/4不同队(台上): 需上供', pass: !t4.noTr });
    results.push({ name: '1/4不同队(台上): 第四名先出', pass: t4.starter === 3 });

    const t5 = await page.evaluate(() => {
      G.ord = [1, 0, 3, 2]; G.stg = [true, false, true, false];
      G.lv = [5, 7, 5, 7];
      let res = doSglDiff(1, 2, 1, [...G.stg]);
      return { lv: [...G.lv], starter: res.starter, upgraded: res.upgraded, up: res.up };
    });
    results.push({ name: '1/4不同队(台下): 不升级只上台', pass: t5.lv[1] === 7 && !t5.upgraded, detail: `lv=${JSON.stringify(t5.lv)}, up=${t5.up}` });
    results.push({ name: '1/4不同队(台下): 第四名先出', pass: t5.starter === 2 });

    const t6 = await page.evaluate(() => {
      G.ord = [0, 1, 2, 3]; G.stg = [true, false, true, false];
      G.lv = [11, 7, 11, 7];
      let res = doSglDiff(0, 3, 0, [...G.stg]);
      return { lv: [...G.lv], upgraded: res.upgraded };
    });
    results.push({ name: '单抓打J: 不升级', pass: t6.lv[0] === 11 && !t6.upgraded });

    const t7 = await page.evaluate(() => {
      G.ord = [0, 1, 2, 3]; G.stg = [true, false, true, false];
      G.lv = [14, 7, 14, 7];
      let res = doSglDiff(0, 3, 0, [...G.stg]);
      return { lv: [...G.lv], upgraded: res.upgraded };
    });
    results.push({ name: '单抓打A: 不升级', pass: t7.lv[0] === 14 && !t7.upgraded });

    const t8 = await page.evaluate(() => {
      G.ord = [0, 1, 2, 3]; G.stg = [true, false, true, false];
      G.lv = [3, 7, 3, 7];
      let res = doSglDiff(0, 3, 0, [...G.stg]);
      return { lv: [...G.lv], upgraded: res.upgraded };
    });
    results.push({ name: '单抓打3: 不升级', pass: t8.lv[0] === 3 && !t8.upgraded });

    const t9a = await page.evaluate(() => {
      G.ord = [0, 2];
      return shouldEndRound();
    });
    results.push({ name: 'shouldEndRound: 双抓(1/2同队)结束', pass: t9a === true });

    const t9b = await page.evaluate(() => {
      G.ord = [0, 1];
      return shouldEndRound();
    });
    results.push({ name: 'shouldEndRound: 1/2不同队继续', pass: t9b === false });

    const t9c = await page.evaluate(() => {
      G.ord = [0, 1, 2, 3];
      return shouldEndRound();
    });
    results.push({ name: 'shouldEndRound: 4人全出完结束', pass: t9c === true });

    results.push({ name: '结束逻辑测试无JS错误', pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

  } catch (e) {
    results.push({ name: '异常捕获', pass: false, detail: e.message });
  }

  await browser.close();
  return { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length, results };
}

module.exports = { name: '04-牌局结束逻辑', run };
