// node edit\render.js stills 2.8 8 ... | node edit\render.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const { once } = require('events');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { createHash } = require('crypto');
const ffmpeg = require('ffmpeg-static');
const { PLAN, TOTAL, CUES, UI_START, UI_END } = require('./timeline');
const { makeSoundtrack } = require('./soundtrack');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const FPS = 30;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const sources = [...new Set(PLAN.map(s => s.source))];
  const frames = Object.fromEntries(sources.map(source => [
    source, JSON.parse(fs.readFileSync(path.join(ROOT, source, 'frames.json'), 'utf8')).map(f => f.t),
  ]));
  const browser = await chromium.launch({ channel: 'msedge', args: ['--allow-file-access-from-files'] });
  let ff;
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, 'compose.html')).href);
    await page.evaluate(() => document.fonts.ready);
    const total = await page.evaluate(f => window.init(f), frames);
    console.log(`Duration: ${total.toFixed(2)}s; scenes: ${PLAN.length}`);
    const assertPage = async () => {
      const issues = await page.evaluate(() => window.getDiagnostics());
      if (errors.length || issues.length) throw new Error(JSON.stringify({ errors, issues }, null, 2));
    };
    if (process.argv[2] === 'stills') {
      for (const arg of process.argv.slice(3)) {
        const time = Number(arg);
        if (!Number.isFinite(time) || time < 0 || time >= total) throw new Error(`Invalid still time ${arg}`);
        await page.evaluate(t => window.drawFrame(t), time);
        await page.screenshot({ path: path.join(OUT, `v5-still-${arg}.png`) });
      }
      await assertPage();
      console.log('Stills rendered.');
      return;
    }

    const soundtrack = path.join(OUT, 'soundtrack.wav');
    makeSoundtrack(soundtrack, TOTAL, { CUES, UI_START, UI_END });
    const file = path.join(OUT, 'launch-desk-skills.mp4');
    const partial = path.join(OUT, 'launch-desk-skills.partial.mp4');
    ff = spawn(ffmpeg, ['-hide_banner', '-y',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-i', soundtrack, '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', '48000',
      '-t', String(total), '-movflags', '+faststart', partial],
      { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '', pipeError = null;
    ff.stderr.on('data', data => { stderr = (stderr + data).slice(-12000); });
    ff.stdin.on('error', error => { pipeError = error; });
    const exited = new Promise((resolve, reject) => {
      ff.once('error', reject);
      ff.once('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}\n${stderr}`)));
    });
    exited.catch(() => {}); // Awaited below; handle early encoder failures during frame production.
    const count = Math.round(total * FPS);
    for (let i = 0; i < count; i++) {
      if (pipeError) throw pipeError;
      if (ff.exitCode !== null) throw new Error(`Encoder exited before frame ${i}\n${stderr}`);
      await page.evaluate(t => window.drawFrame(t), i / FPS);
      const frame = await page.screenshot({ type: 'jpeg', quality: 97 });
      if (!ff.stdin.write(frame)) await Promise.race([once(ff.stdin, 'drain'), exited.then(() => {
        throw new Error('Encoder closed before all frames were written');
      })]);
      if (i % 150 === 0) console.log(`Frame ${i}/${count}`);
    }
    ff.stdin.end();
    await exited;
    await assertPage();
    fs.renameSync(partial, file);
    await page.evaluate(() => window.drawFrame(1.9));
    await page.screenshot({ path: path.join(OUT, 'poster.png') });
    fs.writeFileSync(path.join(OUT, 'edit-manifest.json'), JSON.stringify({
      version: 5, duration: total, fps: FPS, frames: count, sources,
      ending: 'Real agent-created confirmation, then end card; no preview or chat usage footage',
      creation: {
        footage: 'pickup-create',
        action: 'Real mouse click on the header Create button at the top right',
        evidence: 'pickup-create/events.json',
      },
      overlays: 'Captions, callouts, blur and speed indicators are annotations over real product UI',
      music: 'Original locally synthesized soundtrack; no third-party recordings',
      whooshes: CUES.filter(c => c.type === 'whoosh').map(c => c.t),
      logo: {
        source: 'https://www.microsoft.com/content/dam/microsoft/bade/images/icons/en-us/m365-app-icons-fy26/Copilot-icon-filled-gradient-rgb.svg',
        treatment: 'Unmodified official Microsoft SVG, scaled proportionally',
        sha256: createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'assets', 'microsoft-copilot.svg'))).digest('hex'),
      },
      scenes: PLAN,
    }, null, 2));
    console.log(`Rendered ${file}`);
  } finally {
    if (ff && ff.exitCode === null) ff.kill();
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
