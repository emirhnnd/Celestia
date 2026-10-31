// Savunma ve kabuk testleri: doctype, paylaşma kodu güvenliği, ölçek değişiminde durum koruma, WebGL/CDN hata ekranı.
// Kullanım: cd test && npm i && node savunma.js   (CHROMIUM=... ile tarayıcı yolu verilebilir)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = process.env.REPO || path.resolve(__dirname, '..'), NM = path.join(__dirname, 'node_modules');
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? ' => ' + JSON.stringify(extra) : '')); if (!cond) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function open(b, { noThree = false, noGL = false, ds = '2.5', keepStorage = false } = {}) {
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.includes('three.min.js')) return noThree ? r.abort() : r.fulfill({ body: fs.readFileSync(NM + '/three/build/three.min.js'), contentType: 'text/javascript' });
    if (u.includes('astronomy')) return r.fulfill({ body: fs.readFileSync(NM + '/astronomy-engine/astronomy.browser.min.js'), contentType: 'text/javascript' });
    if (u.startsWith('http://app/')) {
      const p = decodeURIComponent(u.slice(11).split('?')[0]) || 'index.html', f = path.join(REPO, p);
      if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      let body = fs.readFileSync(f);
      if (p === 'index.html') body = body.toString().replace("'use strict';", "'use strict';window.__E=function(s){return eval(s)};");
      const ct = p.endsWith('.html') ? 'text/html' : p.endsWith('.png') ? 'image/png' : p.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream';
      return r.fulfill({ body, contentType: ct });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(([ds, noGL, keep]) => {
    try { if (!keep || !localStorage.getItem('gsg-coach')) { localStorage.setItem('gsg-coach', '1'); localStorage.setItem('se_ds', ds); } } catch (e) { }
    if (noGL) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; }
  }, [ds, noGL, keepStorage]);
  await page.goto('http://app/index.html');
  return { page, errs, E: s => page.evaluate(s => { try { const v = window.__E(s); return typeof v === 'object' ? JSON.stringify(v) : v; } catch (e) { return 'ERR ' + e.message; } }, s) };
}
const ready = async t => { await t.page.waitForFunction(() => window.__E && document.getElementById('boot').classList.contains('gone'), null, { timeout: 90000 }); await wait(1500); };

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  /* 1) kabuk */
  let t = await open(b); await ready(t);
  ok('standart mod (doctype)', await t.page.evaluate(() => document.compatMode) === 'CSS1Compat');
  ok('html lang=tr', await t.page.evaluate(() => document.documentElement.lang) === 'tr');
  ok('meta etiketleri', await t.page.evaluate(() => ['meta[name=description]', 'meta[property="og:image"]', 'meta[name=theme-color]', 'link[rel=icon]'].every(q => document.querySelector(q))));
  ok('başlık Celestia', (await t.page.title()).startsWith('Celestia'));
  const box = await t.page.evaluate(() => { const c = document.getElementById('stage').getBoundingClientRect(); return [Math.round(c.width), Math.round(c.height), document.documentElement.scrollHeight <= innerHeight, document.documentElement.scrollWidth <= innerWidth]; });
  ok('tuval ekranı kaplıyor, kaydırma çubuğu yok', box[0] === 1280 && box[1] === 800 && box[2] && box[3], box);
  await t.page.screenshot({ path: path.join(__dirname, 'shots', 'savunma-kabuk.png') }).catch(() => { fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true }); return t.page.screenshot({ path: path.join(__dirname, 'shots', 'savunma-kabuk.png') }); });

  /* 2a) yalnızca 'm' anahtarlarıyla kirletme denemesi: paylaşma kodunun çözülmüş hâli doğrudan applyState'e verilir */
  await t.E(`(function(){try{applyState({v:1,c:[],s:0,a:4.57,g:1,m:JSON.parse('{"__proto__":[2,2,2,2],"constructor":[2,2,2,2]}')});}catch(e){}})()`); await wait(500);
  ok('applyState: __proto__ anahtarı Object.prototype\'ı kirletmedi', await t.page.evaluate(() => ({}).mod === undefined && ({}).spin === undefined));

  /* 2) paylaşma kodu: prototype kirlenmesi */
  const evil = { v: 1, c: [{ type: '__proto__', name: 'x' }], s: 0, a: 4.57, g: 1, m: { '__proto__': [1, 1, 1, 1], 'constructor': [1, 1, 1, 1], 'earth': [1, 1, 1.5, 23] } };
  const code = Buffer.from(unescape(encodeURIComponent(JSON.stringify(evil)))).toString('base64'); // btoa(unescape(encodeURIComponent()))
  await t.E(`$('shIn').value=${JSON.stringify(code)};$('shLoad').click()`); await wait(1500);
  ok('Object.prototype kirlenmedi', await t.page.evaluate(() => ({}).mod === undefined && ({}).constructor === Object));
  ok('byId prototipsiz', await t.E("Object.getPrototypeOf(byId)===null"));
  ok('geçerli kayıt yine uygulandı (Dünya boyutu 1,5×)', await t.E("byId.earth.mod.size") === 1.5);
  ok('sahte tür gezegen eklemedi', await t.E("BODIES.filter(function(b){return b.def.custom}).length") === 0);
  ok('sayfa hatası yok (paylaşma)', t.errs.length === 0, t.errs);

  if (process.env.ONLY === 'proto') { await b.close(); console.log(fails ? 'başarısız' : 'Hepsi geçti'); process.exit(fails ? 1 : 0); }

  /* 3) bağlam kaybı ve geri gelme */
  await t.E("renderer.getContext().getExtension('WEBGL_lose_context').loseContext()"); await wait(800);
  ok('bağlam kaybında hata ekranı hemen çıkmıyor', !(await t.page.evaluate(() => document.getElementById('boot').classList.contains('err'))));
  await t.E("renderer.getContext().getExtension('WEBGL_lose_context').restoreContext()"); await wait(3000);
  ok('geri gelince hata ekranı yok ve sahne çiziyor', !(await t.page.evaluate(() => document.getElementById('boot').classList.contains('err'))) && (await t.E("renderer.info.render.calls")) > 0);
  await t.page.close();

  /* 4) bağlam hiç gelmezse */
  t = await open(b); await ready(t);
  await t.E("renderer.getContext().getExtension('WEBGL_lose_context').loseContext()"); await wait(7500);
  ok('bağlam gelmezse hata ekranı + yenile düğmesi', await t.page.evaluate(() => { const x = document.getElementById('boot'); return x.classList.contains('err') && !!x.querySelector('button'); }));
  await t.page.close();

  /* 5) three.js yüklenemezse */
  t = await open(b, { noThree: true }); await wait(2500);
  ok('three.js yoksa hata ekranı', await t.page.evaluate(() => { const x = document.getElementById('boot'); return x.classList.contains('err') && /kütüphanesi/.test(x.textContent); }));
  await t.page.close();

  /* 6) WebGL yoksa */
  t = await open(b, { noGL: true }); await wait(3000);
  ok('WebGL yoksa hata ekranı', await t.page.evaluate(() => { const x = document.getElementById('boot'); return x.classList.contains('err') && /WebGL/.test(x.textContent); }));
  await t.page.close();

  /* 7) ölçek değişiminde durum koruma */
  t = await open(b, { keepStorage: true }); await ready(t);
  await t.E("setStar(1,false);starAge=9;$('sAge').value=9;gSpin=3;$('gSpin').value=3;byId.mars.mod.size=1.7;applySize(byId.mars)");
  await t.E("addCustom({name:'Kopya',type:'rocky',color:'#aa5533',size:1.2,a:2,ring:false,moons:0,seed:3,L0:0,tilt:10,rotH:20},true)");
  await t.E("var __d=40*365.25;updateBodies(__d);simDays+=__d;focusBody('jupiter')");
  const before = await t.E("[sunType, starAge, gSpin, byId.mars.mod.size, Math.round(simDays), focus.id, customs.length]");
  const nav = t.page.waitForNavigation({ timeout: 30000 });
  await t.E("document.querySelector('.dsb[data-ds=\"R\"]').click()"); await nav;
  await t.page.waitForFunction(() => window.__E && document.getElementById('boot').classList.contains('gone'), null, { timeout: 90000 }); await wait(2500);
  const after = await t.E("[sunType, starAge, gSpin, byId.mars.mod.size, Math.round(simDays), focus.id, customs.length]");
  const B = JSON.parse(before), A = JSON.parse(after);
  /* simülasyon saniyede 1 gün aktığı için yükleme süresince tarih biraz ileri kayar: 0 ile 30 gün arası kabul */
  ok('ölçek değişince ayarlar, odak ve özel gezegen korundu', JSON.stringify([B[0], B[1], B[2], B[3], B[5], B[6]]) === JSON.stringify([A[0], A[1], A[2], A[3], A[5], A[6]]), { before, after });
  ok('tarih korundu (başa dönmedi, en fazla ~30 gün kaydı)', A[4] >= B[4] && A[4] - B[4] <= 30, { before: B[4], after: A[4] });
  ok('gerçek ölçek açık', await t.E("REAL") === true);
  ok('taşıma anahtarı tüketildi', await t.page.evaluate(() => sessionStorage.getItem('se_carry')) === null);
  ok('sayfa hatası yok (ölçek)', t.errs.length === 0, t.errs);
  await t.page.close();

  await b.close();
  console.log(fails ? `\n${fails} test başarısız` : '\nHepsi geçti');
  process.exit(fails ? 1 : 0);
})();
