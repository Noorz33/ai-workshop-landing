// Builds public/syllabus.pdf (print layout) and public/og.jpg (hero) from a running `npm run preview`.
const puppeteer = require('puppeteer-core');
const out = process.argv[2] || 'public';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4173/?flat', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMediaType('print');
  await page.pdf({ path: `${out}/syllabus.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMediaType('screen');
  // OG image: the hero in spatial mode
  const og = await browser.newPage();
  await og.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await og.goto('http://localhost:4173/', { waitUntil: 'load' });
  await og.waitForFunction(() => document.documentElement.classList.contains('is-ready'), { timeout: 30000 });
  await og.addStyleTag({ content: '.hdr-end,.cue,.nav{display:none!important}' });
  await sleep(3500);
  await og.screenshot({ path: `${out}/og.jpg`, type: 'jpeg', quality: 88 });
  browser.process()?.kill('SIGKILL'); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
