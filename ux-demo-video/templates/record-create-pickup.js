const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pickup-create');
const CURSOR = `(() => {
  const c = document.createElement('div');
  c.id = '__pickup_cursor';
  c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none';
  c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.documentElement.appendChild(c);
  addEventListener('mousemove', e => {
    c.style.transform = 'translate(' + (e.clientX-3) + 'px,' + (e.clientY-2) + 'px)';
  }, true);
  addEventListener('mousedown', e => {
    const r = document.createElement('div');
    r.style.cssText = 'position:fixed;left:' + (e.clientX-18) + 'px;top:' + (e.clientY-18) + 'px;width:36px;height:36px;border-radius:50%;border:3px solid #7B61FF;z-index:2147483646;pointer-events:none;transition:all .45s ease-out;opacity:.9';
    document.documentElement.appendChild(r);
    requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
    setTimeout(() => r.remove(), 500);
  }, true);
})()`;

(async () => {
  if (fs.existsSync(OUT)) throw new Error('Pickup folder already exists; preserve the previous recording.');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
  const page = browser.contexts()[0].pages().find(p => p.url().includes('/agents/new'));
  if (!page) throw new Error('New-agent page was not found.');
  if (await page.locator('#user-account-avatar').getAttribute('aria-label') !== 'Sam WorkBench') {
    throw new Error('Wrong demo account.');
  }
  const buttons = page.getByRole('button', { name: 'Create', exact: true });
  const matches = [];
  for (let i = 0; i < await buttons.count(); i++) {
    const rect = await buttons.nth(i).boundingBox();
    if (rect && rect.x > 1500 && rect.y < 100) matches.push({ locator: buttons.nth(i), rect });
  }
  if (matches.length !== 1) throw new Error(`Expected one top-right Create button; found ${matches.length}.`);
  const { locator, rect } = matches[0];
  if (!await locator.isEnabled()) throw new Error('Create button is disabled.');

  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(CURSOR);
  await page.mouse.move(1510, 330);
  const frames = [], events = [], startedAt = Date.now();
  const now = () => (Date.now() - startedAt) / 1000;
  const mark = (name, data = {}) => {
    const event = { t: now(), name, ...data };
    events.push(event);
    console.log(JSON.stringify(event));
  };
  let captureError = null;
  cdp.on('Page.screencastFrame', frame => {
    const i = frames.length;
    fs.writeFileSync(path.join(OUT, 'frames', `${String(i).padStart(6, '0')}.jpg`), Buffer.from(frame.data, 'base64'));
    frames.push({ i, t: now() });
    cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId })
      .catch(error => { captureError = error; });
  });
  try {
    await cdp.send('Page.startScreencast', {
      format: 'jpeg', quality: 95, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1,
    });
    mark('start', { target: { role: 'button', name: 'Create', rect } });
    await page.waitForTimeout(2500);
    const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
    for (let i = 1; i <= 30; i++) {
      const u = i / 30, eased = u * u * (3 - 2 * u);
      await page.mouse.move(1510 + (x - 1510) * eased, 330 + (y - 330) * eased);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'before-click.png') });
    mark('click:create-top-right', { x, y, role: 'button', label: 'Create' });
    await page.mouse.click(x, y);
    await page.getByText('Creating your agent', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    mark('creating');
    await page.screenshot({ path: path.join(OUT, 'creating.png') });
    await page.getByText('Your agent was created successfully!', { exact: true })
      .waitFor({ state: 'visible', timeout: 90000 });
    mark('created');
    await page.mouse.move(1510, 780, { steps: 24 });
    await page.screenshot({ path: path.join(OUT, 'created.png') });
    await page.waitForTimeout(4500);
    mark('end');
    if (captureError) throw captureError;
  } finally {
    await cdp.send('Page.stopScreencast');
    await page.waitForTimeout(250);
    fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify(frames));
    fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(events, null, 2));
  }
  console.log(`Recorded ${frames.length} real UI frames.`);
  process.exit(0);
})().catch(error => { console.error(error.message); process.exit(1); });
