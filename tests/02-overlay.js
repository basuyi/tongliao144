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

    const ovOutside = await page.evaluate(() => {
      const ov = document.getElementById('ov');
      const wrap = document.getElementById('wrap');
      if (!ov) return 'ov不存在';
      if (!wrap) return 'wrap不存在';
      return wrap.contains(ov) ? 'INSIDE' : 'OUTSIDE';
    });
    results.push({ name: '#ov在#wrap内(position:absolute避免transform问题)', pass: ovOutside === 'INSIDE', detail: ovOutside });

    const ovVis = await page.evaluate(() => {
      const ov = document.getElementById('ov');
      return ov && !ov.classList.contains('h');
    });
    results.push({ name: '大厅overlay可见', pass: !!ovVis });

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.includes('单机模式')) { b.click(); break; }
    });
    await page.waitForTimeout(2000);

    const toastRes = await page.evaluate(() => {
      toast('测试toast', 2000);
      const t = document.getElementById('toast');
      return t ? { text: t.textContent, cls: t.className } : null;
    });
    results.push({ name: 'toast()动态创建并显示', pass: toastRes && toastRes.text === '测试toast', detail: JSON.stringify(toastRes) });

    const ovTransform = await page.evaluate(() => {
      showOv('<div class="m"><h2>测试</h2></div>');
      const ov = document.getElementById('ov');
      const wrap = document.getElementById('wrap');
      return {
        ovPosition: ov.style.position,
        wrapStyleTransform: wrap.style.transform,
        ovVisible: !ov.classList.contains('h'),
      };
    });
    results.push({ name: 'showOv()使用position:absolute在#wrap内', pass: ovTransform.ovVisible && ovTransform.ovPosition === 'absolute', detail: `ov.position=${ovTransform.ovPosition || '(none)'}, wrap.transform=${ovTransform.wrapStyleTransform || '(none)'}` });

    await page.evaluate(() => hideOv());
    await page.waitForTimeout(300);
    const ovHidden = await page.evaluate(() => {
      const ov = document.getElementById('ov');
      return ov.classList.contains('h');
    });
    results.push({ name: 'hideOv()隐藏overlay', pass: ovHidden });

    const dynamicCreate = await page.evaluate(() => {
      const existingOv = document.getElementById('ov');
      if (existingOv) existingOv.remove();
      const existingToast = document.getElementById('toast');
      if (existingToast) existingToast.remove();
      showOv('<div class="m">重新创建</div>');
      const newOv = document.getElementById('ov');
      toast('重新创建toast');
      const newToast = document.getElementById('toast');
      return { ovCreated: !!newOv, toastCreated: !!newToast, ovContent: newOv ? newOv.textContent : '' };
    });
    results.push({ name: 'showOv/toast动态创建DOM元素', pass: dynamicCreate.ovCreated && dynamicCreate.toastCreated, detail: JSON.stringify(dynamicCreate) });

    results.push({ name: 'overlay测试无JS错误', pass: errors.length === 0, detail: errors.length ? errors.join('; ') : '' });

  } catch (e) {
    results.push({ name: '异常捕获', pass: false, detail: e.message });
  }

  await browser.close();
  return { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length, results };
}

module.exports = { name: '02-Overlay与Toast', run };
