import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click the chat button to open the chat window
  try {
    await page.waitForSelector('button', { timeout: 5000 });
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const classNames = await page.evaluate(el => el.className, btn);
        if (classNames && classNames.includes('bottom-6') && classNames.includes('right-6')) {
             await btn.click();
             await new Promise(r => setTimeout(r, 1000));
             break;
        }
    }
  } catch(e) {
    console.log("Chat button not found");
  }

  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
