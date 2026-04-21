import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click the settings button by targeting lucide-settings icon
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const html = await page.evaluate(el => el.innerHTML, btn);
        if (html && html.includes('lucide-settings')) {
             await btn.click();
             await new Promise(r => setTimeout(r, 1000));
             break;
        }
    }
  } catch(e) {
    console.log("Settings button not found");
  }

  await page.screenshot({ path: 'screenshot_settings.png' });
  await browser.close();
})();
