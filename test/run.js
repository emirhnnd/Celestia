// Kullanım: cd test && npm i && node run.js senaryolar.js
// Sayfayı başsız Chromium'da açar, three.js ve astronomy-engine'i node_modules'ten verir.
// E("ifade") sayfanın kapalı kapsamında (closure) değerlendirilir: iç değişkenlere erişilebilir.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');
const NM = path.join(__dirname, 'node_modules');
const EXE = process.env.CHROMIUM || undefined;
(async () => {
  const steps = require(path.resolve(process.argv[2]));
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const w = +(process.env.W || 1280), h = +(process.env.H || 800);
  const page = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.includes('three.min.js')) return r.fulfill({ body: fs.readFileSync(NM + '/three/build/three.min.js'), contentType: 'text/javascript' });
    if (u.includes('astronomy')) return r.fulfill({ body: fs.readFileSync(NM + '/astronomy-engine/astronomy.browser.min.js'), contentType: 'text/javascript' });
    if (u.startsWith('http://app/')) {
      let p = decodeURIComponent(u.slice('http://app/'.length).split('?')[0]) || 'index.html';
      const f = path.join(REPO, p);
      if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      let body = fs.readFileSync(f);
      if (p === 'index.html') body = body.toString().replace("'use strict';", "'use strict';window.__E=function(s){return eval(s)};");
      const ct = p.endsWith('.html') ? 'text/html' : p.endsWith('.png') ? 'image/png' : p.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream';
      return r.fulfill({ body, contentType: ct });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(() => { try { localStorage.setItem('gsg-coach', '1'); } catch (e) { } });
  await page.goto('http://app/index.html');
  await page.waitForFunction(() => window.__E, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  const E = s => page.evaluate(s => { try { const v = window.__E(s); return typeof v === 'object' ? JSON.stringify(v) : v; } catch (e) { return 'ERR ' + e.message; } }, s);
  let n = 0;
  const shot = async (name) => { const f = path.join(__dirname, 'shots', name + '.png'); fs.mkdirSync(path.dirname(f), { recursive: true }); await page.screenshot({ path: f }); console.log('shot', f); };
  try { await steps(page, E, shot); } catch (e) { console.log('STEP ERR', e.message); }
  console.log(errs.slice(0, 30).join('\n'));
  await b.close();
})();
