const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'take3'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT + '/frames', { recursive: true });
const events = []; let t0 = 0; const now = () => (Date.now() - t0) / 1000;
const mark = (name, extra = {}) => { events.push({ t: now(), name, ...extra }); console.log(now().toFixed(1), name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CURSOR = `(() => { if (document.getElementById('__cur')) return; const c = document.createElement('div'); c.id='__cur';
  c.style.cssText='position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transition:transform 0.08s linear;';
  c.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.documentElement.appendChild(c);
  addEventListener('mousemove', e => { c.style.transform = 'translate(' + (e.clientX-3) + 'px,' + (e.clientY-2) + 'px)'; }, true);
  addEventListener('mousedown', e => { const r=document.createElement('div'); r.style.cssText='position:fixed;left:'+(e.clientX-18)+'px;top:'+(e.clientY-18)+'px;width:36px;height:36px;border-radius:50%;border:3px solid #7B61FF;z-index:2147483646;pointer-events:none;transition:all .45s ease-out;opacity:.9'; document.documentElement.appendChild(r); requestAnimationFrame(()=>{r.style.transform='scale(1.8)';r.style.opacity='0'}); setTimeout(()=>r.remove(),500); }, true); })()`;
let mx = 960, my = 540;
async function moveTo(p, x, y) { await p.mouse.move(x, y, { steps: 28 }); mx = x; my = y; }
async function clickEl(p, loc, name) { await loc.scrollIntoViewIfNeeded().catch(()=>{}); const b = await loc.boundingBox(); await moveTo(p, b.x + b.width / 2, b.y + b.height / 2); await sleep(250); mark('click:' + name, { x: b.x + b.width/2, y: b.y + b.height/2 }); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
async function typeIn(p, loc, text, name) { await clickEl(p, loc, name); mark('type-start:' + name); await p.keyboard.type(text, { delay: 28 }); mark('type-end:' + name); await sleep(500); await p.keyboard.press('Enter'); mark('send:' + name); }
const skillNames = p => p.$$eval('div,span', els => [...new Set(els.filter(e => e.children.length===0 && /^[a-z0-9]+(-[a-z0-9]+){1,}$/.test(e.textContent.trim()) && e.getBoundingClientRect().x > 900).map(e => e.textContent.trim()))]);
const reasonedCount = p => p.getByText(/Reasoned for \d+/).count();
async function waitBuilder(p, before, label, timeout = 180000) { const st = Date.now(); while (Date.now() - st < timeout) { if ((await reasonedCount(p)) > before) { await sleep(1500); mark('done:' + label); return; } await sleep(1000); } mark('timeout:' + label); }
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
  const p = b.contexts()[0].pages().find(p => p.url().includes('cloud.microsoft'));
  const cdp = await p.context().newCDPSession(p);
  p.on('dialog', d => d.accept().catch(()=>{})); await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await p.goto('https://copilot.cloud.microsoft/agents/new', { waitUntil: 'domcontentloaded' });
  await p.locator('#m365-chat-editor-target-element').waitFor({ timeout: 60000 }); await sleep(3000);
  await p.evaluate(CURSOR); await p.mouse.move(mx, my);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => { const i = frames.length; fs.writeFileSync(`${OUT}/frames/${String(i).padStart(6,'0')}.jpg`, Buffer.from(f.data, 'base64')); frames.push({ i, t: now() }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(()=>{}); });
  t0 = Date.now();
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  mark('start'); await sleep(2500);
  // Beat 1: create the agent
  let rc = await reasonedCount(p);
  await typeIn(p, p.locator('#m365-chat-editor-target-element'), "Create an agent called Launch Desk that helps Contoso's marketing team launch new products, always in Contoso's brand voice: bold, warm, and jargon-free. Just the basics for now. I'll add skills next.", 'agent');
  await p.getByRole('button', { name: 'Get started' }).click({ timeout: 8000 }).then(()=>mark('dismiss-whatsnew')).catch(()=>{});
  await waitBuilder(p, rc, 'agent');
  if (!(await p.getByRole('heading', { name: 'Launch Desk' }).count()) && !(await p.getByText('Launch Desk', { exact: true }).count())) { rc = await reasonedCount(p); await typeIn(p, p.locator('#m365-chat-editor-target-element'), 'Keep it simple for now. Go ahead and draft it.', 'agent-confirm'); await waitBuilder(p, rc, 'agent-confirm'); }
  await sleep(2500);
  { const n0 = await skillNames(p); console.log('skills after beat1', n0); if (n0.length) { mark('ABORT-early-skill', { names: n0 }); throw new Error('skill created in beat 1'); } }
  // Beat 2: write the launch kit skill
  rc = await reasonedCount(p);
  await typeIn(p, p.locator('#m365-chat-editor-target-element'), 'Write a skill that turns any product spec into a launch kit: a punchy headline, three social posts, and a customer FAQ.', 'skill1');
  await waitBuilder(p, rc, 'skill1');
  await sleep(2000); const names1 = await skillNames(p); console.log('skills', names1);
  mark('skill1-card', { names: names1 }); await sleep(3000);
  // Peek inside the skill
  const card1 = p.getByText(names1[0], { exact: true }).last();
  await clickEl(p, card1, 'open-skill1'); await sleep(1200);
  if (!(await p.getByText('Back', { exact: true }).count())) { const bb = await card1.boundingBox(); await moveTo(p, 1517, bb.y + 10); mark('click:chevron'); await p.mouse.click(1517, bb.y + 10); }
  await sleep(2500); mark('skill1-detail');
  await moveTo(p, 1290, 520); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 120); await sleep(450); }
  await sleep(1500);
  await clickEl(p, p.getByText('Back', { exact: true }).first(), 'back'); await sleep(2000);
  // Beat 3: second skill
  rc = await reasonedCount(p);
  await typeIn(p, p.locator('#m365-chat-editor-target-element'), "Now write a skill that reviews any draft against Contoso's brand voice and rewrites anything that sounds like jargon.", 'skill2');
  await waitBuilder(p, rc, 'skill2');
  await sleep(1000); const skillsHdr = p.getByText('Skills', { exact: true }).last(); await skillsHdr.scrollIntoViewIfNeeded().catch(()=>{}); mark('skill2-card'); await sleep(3500);
  // Beat 4: Preview - launch kit
  await clickEl(p, p.getByText('Preview', { exact: true }).first(), 'preview'); await sleep(3000); mark('preview-open');
  let copies = await p.getByRole('button', { name: 'Copy' }).count();
  await typeIn(p, p.getByPlaceholder('Type your message').first(), 'Build a launch kit for Contoso Lumen, our new smart bike light: 1200 lumens, auto-brightens in tunnels and at dusk, brake-activated flash, 40-hour battery, IP67 waterproof, crash alerts via the Contoso Ride app. $79. Ships March 3.', 'test1');
  { const st = Date.now(); while (Date.now() - st < 150000 && (await p.getByRole('button', { name: 'Copy' }).count()) <= copies) await sleep(1000); }
  mark('done:test1'); await sleep(2000);
  // Beat 5: brand voice review on jargon
  copies = await p.getByRole('button', { name: 'Copy' }).count();
  await typeIn(p, p.getByPlaceholder('Type your message').first(), 'Review this draft: "Leveraging best-in-class photonic synergy, Lumen empowers cyclists to optimize visibility outcomes across low-lux paradigms."', 'test2');
  { const st = Date.now(); while (Date.now() - st < 150000 && (await p.getByRole('button', { name: 'Copy' }).count()) <= copies) await sleep(1000); }
  mark('done:test2'); await sleep(4000);
  // Beat 6: Create
  await clickEl(p, p.getByRole('button', { name: 'Create', exact: true }).first(), 'create');
  await sleep(12000); mark('after-create'); await p.screenshot({ path: OUT + '/after-create.png' });
  await cdp.send('Page.stopScreencast'); await sleep(500);
  fs.writeFileSync(OUT + '/frames.json', JSON.stringify(frames)); fs.writeFileSync(OUT + '/events.json', JSON.stringify(events, null, 1));
  console.log('frames', frames.length);
  process.exit(0);
})().catch(e => { console.error(e); fs.writeFileSync(OUT + '/events.json', JSON.stringify(events, null, 1)); process.exit(1); });


