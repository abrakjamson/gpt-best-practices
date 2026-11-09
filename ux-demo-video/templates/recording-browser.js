const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const context = await chromium.launchPersistentContext(path.resolve(__dirname, '..', 'edge-profile'), {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    args: ['--remote-debugging-port=9333', '--window-size=1920,1080', '--force-device-scale-factor=1'],
  });
  console.log('Isolated recording browser ready on port 9333.');
  await new Promise(resolve => context.once('close', resolve));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
