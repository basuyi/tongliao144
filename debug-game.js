const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 920, height: 420 },
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  
  await page.goto('http://39.96.47.193/?v=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Debug: check if functions exist and try calling them manually
  const debug = await page.evaluate(() => {
    const result = {};
    result.showLobbyExists = typeof showLobby === 'function';
    result.showOvExists = typeof showOv === 'function';
    result.hideOvExists = typeof hideOv === 'function';
    result.newGameExists = typeof newGame === 'function';
    result.GExists = typeof G !== 'undefined';
    result.GPhase = typeof G !== 'undefined' ? G.ph : 'N/A';
    
    // Check overlay state
    const ov = document.getElementById('ov');
    result.ovExists = !!ov;
    result.ovClasses = ov ? ov.className : 'N/A';
    result.ovHTML = ov ? ov.innerHTML.substring(0, 200) : 'N/A';
    
    // Try calling showLobby manually
    try {
      if (typeof showOv === 'function' && typeof showLobby === 'function') {
        showLobby();
        result.showLobbyCalled = true;
        result.ovAfterCall = ov ? ov.className : 'N/A';
        result.ovHTMLAfterCall = ov ? ov.innerHTML.substring(0, 200) : 'N/A';
      }
    } catch(e) {
      result.showLobbyError = e.message;
    }
    
    return result;
  });
  
  console.log('Debug:', JSON.stringify(debug, null, 2));
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log('  -', e));
  }
  
  await browser.close();
})();
