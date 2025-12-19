const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`PAGE_CONSOLE ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error('PAGE_ERROR', err.message));

  const url = process.env.URL || 'http://localhost:8080/index.html';
  console.log('Navigating to', url);

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Response status', resp ? resp.status() : 'no response');

    // Inspect body computed style and presence
    const bodyInfo = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return {
        display: style.display,
        visibility: style.visibility,
        clientHeight: document.body.clientHeight,
        clientWidth: document.body.clientWidth,
        hasHiddenAttr: document.body.hasAttribute('hidden')
      };
    });
    console.log('Body computed style:', bodyInfo);

    const bodySnapshot = await page.evaluate(() => ({
      className: document.body.className,
      inlineStyle: document.body.getAttribute('style') || null,
      outerStart: document.body.outerHTML.slice(0, 800)
    }));
    console.log('Body snapshot:', bodySnapshot);

    try {
      await page.waitForSelector('body', { timeout: 5000 });
      if (bodyInfo.display === 'none' || bodyInfo.visibility === 'hidden') {
        console.error('Body is present but hidden via CSS.');
      } else {
        console.log('Body element is present and visible.');
      }
    } catch (e) {
      console.error('Body not found within timeout:', e.message);
    }

    // Capture a screenshot for inspection
    await page.screenshot({ path: 'playwright-screenshot.png', fullPage: true });
    console.log('Screenshot saved: playwright-screenshot.png');
  } catch (e) {
    console.error('Navigation error:', e.message);
  } finally {
    await browser.close();
  }

  process.exit(0);
})();
