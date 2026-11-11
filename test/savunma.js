// Savunma ve kabuk testleri: doctype, paylaşma kodu güvenliği, ölçek değişiminde durum koruma, WebGL/CDN hata ekranı,
// telefon ekranı, hata dayanıklılığı, bozuk kayıtla açılış, eksik veri dosyası, bellek sızıntısı.
// Kullanım: cd test && npm i && node savunma.js   (CHROMIUM=... ile tarayıcı yolu verilebilir)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = process.env.REPO || path.resolve(__dirname, '..'), NM = path.join(__dirname, 'node_modules');
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? ' => ' + JSON.stringify(extra) : '')); if (!cond) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* slowJs: her uygulama dosyası bu kadar ms gecikir; vp: ekran boyutu (telefon testi); noData: data/ dosyaları yüklenmez; seed: açılıştan önce localStorage'a yazılacak anahtarlar */
async function open(b, { noThree = false, noGL = false, ds = '2.5', keepStorage = false, vp = null, noData = false, seed = null, slowJs = 0 } = {}) {
  const page = await b.newPage(vp ? { viewport: { width: vp[0], height: vp[1] }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.includes('three.min.js')) return noThree ? r.abort() : r.fulfill({ body: fs.readFileSync(NM + '/three/build/three.min.js'), contentType: 'text/javascript' });
    if (u.includes('astronomy')) return r.fulfill({ body: fs.readFileSync(NM + '/astronomy-engine/astronomy.browser.min.js'), contentType: 'text/javascript' });
    if (u.startsWith('http://app/')) {
      const p = decodeURIComponent(u.slice(11).split('?')[0]) || 'index.html', f = path.join(REPO, p);
      if (noData && p.startsWith('data/')) return r.abort();
      /* yavaş ağ: uygulama dosyaları aralıklı gelir; tarayıcı iki dosya arasında zamanlayıcı ve olayları çalıştırır */
      if (slowJs && p.startsWith('js/')) await wait(slowJs);
      if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      let body = fs.readFileSync(f);
      /* test kancası: uygulamanın ilk dosyası yüklenirken eklenir (sayfanın hazır olduğunu da bu gösterir). Dolaylı eval genel kapsamda çalışır:
         uygulamanın üst düzey adlarının hepsi oradadır */
      if (p === 'js/01-temel.js') body = body.toString().replace("'use strict';", "'use strict';window.__E=function(s){return (0,eval)(s)};");
      const ct = p.endsWith('.html') ? 'text/html' : p.endsWith('.png') ? 'image/png' : p.endsWith('.jpg') ? 'image/jpeg' : p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream';
      return r.fulfill({ body, contentType: ct });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(([ds, noGL, keep, seed]) => {
    try { if (!keep || !localStorage.getItem('gsg-coach')) { localStorage.setItem('gsg-coach', '1'); localStorage.setItem('se_ds', ds); } } catch (e) { }
    try { if (seed) Object.keys(seed).forEach(k => localStorage.setItem(k, seed[k])); } catch (e) { }
    if (noGL) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; }
  }, [ds, noGL, keepStorage, seed]);
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
  ok('kare döngüsünde yakalanan hata yok (paylaşma)', (await t.E('frameErrN')) === 0);

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

  /* 6b) kuyruklu yıldızlar: kuyruk Güneş'e yakınken görünür, uzakken kaybolur; çekirdek uzaklaşınca küreye dönmez */
  t = await open(b); await ready(t);
  const jump = (id, dd) => t.E(`(function(){var C=cmSetup(byId.${id}.def);var x=C.tp+(${dd})-simDays;updateBodies(x);simDays+=x;playing=false;focusBody('${id}',{dist:30});})()`);
  await jump('halley', 20); await wait(2500);
  ok('Halley günberide: iyon ve toz kuyruğu görünür', await t.E("byId.halley.fx.ion.visible&&byId.halley.fx.dust.visible"));
  ok('Halley günberide: uzunluk uniform\'u sıfırdan büyük', await t.E("byId.halley.fx.ion.material.uniforms.uL.value")> 10);
  await t.E("focusBody('halley',{dist:600})"); await wait(3500);
  ok('çekirdek uzaklaşınca düzensiz kalıyor (LOD küreyle değiştirmiyor)', await t.E("byId.halley.mesh.geometry.type") === 'CometNucleus');
  await jump('halley', 27510 / 2); await wait(2500);
  ok('Halley günöte: kuyruk yok', await t.E("!byId.halley.fx.ion.visible&&!byId.halley.fx.dust.visible"));
  /* 6c) kuyruk yıldızın ışımasına bağlı; yıldızın içine giren kuyruklu yıldız gizlenir */
  await jump('halley', 20); await wait(2500);
  const uL0 = await t.E("byId.halley.fx.ion.material.uniforms.uL.value");
  await t.E("setStar(2,false)"); await jump('halley', 20); await wait(3500);
  const uLb = await t.E("byId.halley.fx.ion.material.uniforms.uL.value");
  ok('mavi devde Halley kuyruğu Güneş\'tekinden uzun', uLb > uL0 * 1.2, [uL0, uLb]);
  await t.E("setStar(4,false)"); await jump('halley', 20); await wait(3500);
  ok('beyaz cücede Halley kuyruğu yok', await t.E("!byId.halley.fx.ion.visible&&!byId.halley.fx.dust.visible"));
  await t.E("setStar(3,false);sunBody.mod.size=3;applySize(sunBody)"); await jump('halley', 20); await wait(3500);
  ok('kırmızı devin içindeki Halley yutulmuş ve gizli', await t.E("byId.halley.engulfed===true&&byId.halley.pivot.visible===false&&!byId.halley.fx.ion.visible"), await t.E("[byId.halley.pos.length(),swallowR(byId.halley),sunType,byId.halley.engulfed]"));
  await t.E("setStar(0,false);sunBody.mod.size=1;applySize(sunBody)"); await jump('halley', 20); await wait(3500);
  ok('normal Güneş\'te Halley yutulmuyor, geri görünür', await t.E("!byId.halley.engulfed&&byId.halley.pivot.visible&&byId.halley.fx.ion.visible"));
  const bb = JSON.parse(await t.E("(function(){var g=byId.cg67p.mesh.geometry;g.computeBoundingBox();var b=g.boundingBox;return [b.max.x-b.min.x,b.max.y-b.min.y]})()"));
  ok('67P iki loblu (uzun eksen kısa eksenden en az %35 uzun)', bb[0] / bb[1] > 1.35, bb);
  ok('kuyruklu yıldız: sayfa hatası yok', t.errs.length === 0, t.errs);
  ok('kuyruklu yıldız: kare döngüsünde yakalanan hata yok', (await t.E('frameErrN')) === 0);
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
  ok('kare döngüsünde yakalanan hata yok (ölçek)', (await t.E('frameErrN')) === 0);
  await t.page.close();

  /* 8) telefon ekranı (390×844, dokunmatik): kabuk taşmıyor, alt sayfa açılıyor, grafik çalışıyor */
  t = await open(b, { vp: [390, 844] }); await ready(t);
  const mb = await t.page.evaluate(() => { const c = document.getElementById('stage').getBoundingClientRect(); return [Math.round(c.width), Math.round(c.height), document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollHeight <= innerHeight]; });
  ok('telefon: tuval ekranı kaplıyor, yatay/dikey taşma yok', mb[0] === 390 && mb[1] === 844 && mb[2] && mb[3], mb);
  await t.E("focusBody('earth')"); await wait(1200);
  const tiny = await t.page.evaluate(() => [].filter.call(document.querySelectorAll('button'), e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent && (r.width < 30 || r.height < 30) && !e.closest('[hidden]') && !e.closest('.lb'); }).map(e => (e.id || e.textContent.trim().slice(0, 14)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  ok('telefon: görünen düğmeler en az 30 piksel', tiny.length === 0, tiny.slice(0, 8));
  /* sahnedeki ad etiketleri küçük yazıdır; dokunma alanı görünmez bir çerçeveyle büyütülür */
  const lbh = await t.page.evaluate(() => { const e = [].filter.call(document.querySelectorAll('.lb button'), x => x.getBoundingClientRect().height > 0)[0]; if (!e) return null; const a = getComputedStyle(e, '::after'); return [e.getBoundingClientRect().height, a.content, parseFloat(a.top), parseFloat(a.bottom)]; });
  ok('telefon: ad etiketinin dokunma alanı en az 30 piksel', !!lbh && lbh[1] !== 'none' && lbh[0] - lbh[2] - lbh[3] >= 30, lbh);
  await t.page.getByText('ayrıntı için dokun').tap(); await wait(1000);
  ok('telefon: bilgi sayfası açıldı', await t.page.evaluate(() => { const s = document.getElementById('side'), r = document.getElementById('iName').getBoundingClientRect(); return !s.classList.contains('collapsed') && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }));
  await t.page.tap('#grTog'); await wait(4500);
  const mg = await t.page.evaluate(() => { const c = document.getElementById('grCv').getBoundingClientRect(), p = document.getElementById('side').getBoundingClientRect(); return [document.getElementById('grTog').getAttribute('aria-expanded'), Math.round(c.width), c.right <= p.right + 1 && c.left >= p.left - 1, document.getElementById('grSpan').textContent, document.documentElement.scrollWidth <= innerWidth]; });
  ok('telefon: grafik açıldı, panelin içinde kaldı ve veri çizdi', mg[0] === 'true' && mg[1] > 200 && mg[2] && /son /.test(mg[3]) && mg[4], mg);
  await t.page.screenshot({ path: path.join(__dirname, 'shots', 'savunma-telefon.png') });
  ok('telefon: sayfa hatası yok', t.errs.length === 0, t.errs);
  ok('telefon: kare döngüsünde yakalanan hata yok', (await t.E('frameErrN')) === 0);
  await t.page.close();

  /* 9) hata dayanıklılığı: bir alt sistem her karede hata verse de simülasyon ve çizim sürer */
  t = await open(b); await ready(t);
  const d0 = await t.E("simDays"), f0 = await t.E("renderer.info.render.frame");
  await t.E("updateEclipse=function(){throw new Error('deneme hatası')}"); await wait(3000);
  const d1 = await t.E("simDays"), f1 = await t.E("renderer.info.render.frame"), fe = await t.E("frameErrN");
  ok('alt sistem hatasında zaman akmaya devam ediyor', d1 > d0, [d0, d1]);
  ok('alt sistem hatasında çizim sürüyor', f1 > f0, [f0, f1]);
  ok('hata yakalanıp sayıldı, sayfa hatasına dönüşmedi', fe > 0 && t.errs.length === 0, [fe, t.errs]);
  await t.page.close();

  /* 10) bozuk kayıtla açılış: kayıt okunamasa da ya da içinde geçersiz cisimler olsa da sayfa açılır */
  for (const [ad, kayit, beklenen] of [['kırık JSON', '{bozuk', 0], ['geçersiz cisimler', JSON.stringify([{ kind: 'x' }, null, 7, 'metin', [], { name: 'Sağlam', type: 'rocky', color: '#aa5533', size: 1.2, a: 2, ring: false, moons: 0, seed: 3, L0: 0, tilt: 10, rotH: 20, id: 'c1' }]), 1]]) {
    t = await open(b, { seed: { 'gsg-custom-v1': kayit } }); await ready(t);
    ok('bozuk kayıt (' + ad + '): sayfa açıldı, hata yok', t.errs.length === 0 && (await t.E('frameErrN')) === 0 && (await t.E("simDays>0")) === true, t.errs);
    ok('bozuk kayıt (' + ad + '): geçerli cisim sayısı ' + beklenen, (await t.E("BODIES.filter(function(b){return b.def.custom}).length")) === beklenen, await t.E("customs.length"));
    await t.page.close();
  }
  /* veri dosyaları yüklenemezse sonsuz yükleme yerine hata ekranı */
  t = await open(b, { noData: true }); await wait(4000);
  const nd = await t.page.evaluate(() => { const e = document.getElementById('boot'); return [e.classList.contains('gone'), e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)]; });
  ok('veri dosyaları eksikse hata ekranı çıkıyor', nd[0] === false && /Veri dosyaları yüklenemedi/.test(nd[1]), nd);
  await t.page.close();

  /* 11) bellek sızıntısı: gezegen ekleyip silmek grafik belleğini büyütmemeli */
  t = await open(b); await ready(t);
  const mem = "(function(){var m=renderer.info.memory;return [m.geometries,m.textures,scene.children.length,BODIES.length]})()";
  const cyc = "addCustom({name:'Geçici',type:'ocean',color:'#3b82d6',size:1.4,a:2.6,ring:true,moons:0,seed:5,L0:0,tilt:10,rotH:20},false)";
  /* ilk tur önbellekleri doldurur (paylaşılan dokular, gölgelendiriciler): ölçüm ondan sonra başlar */
  for (let i = 0; i < 2; i++) { await t.E(cyc); await wait(500); await t.E("$('labDel').click()"); await wait(500); }
  /* sayfa açıldıktan sonraki ilk saniyelerde sayılar kendiliğinden artar (geometri ve dokular ilk çizildiklerinde ekran kartına yüklenir);
     ölçüm, sayı üç saniye boyunca değişmeyene kadar bekleyip ondan sonra başlar. Yoksa bu artış ekle-sil sızıntısı gibi görünür */
  for (let prev = '', same = 0, n = 0; same < 6 && n < 80; n++) { const cur = await t.E(mem); same = cur === prev ? same + 1 : 0; prev = cur; await wait(500); }
  const m0 = JSON.parse(await t.E(mem));
  for (let i = 0; i < 12; i++) { await t.E(cyc); await wait(350); await t.E("$('labDel').click()"); await wait(350); }
  const m1 = JSON.parse(await t.E(mem));
  /* sahnede başka şeyler de doğup ölür (Güneş püskürmeleri, geç yüklenen dokular): eşik, tur başına bir sızıntıyı yakalayacak kadar dar */
  ok('12 ekle-sil sonrası geometri sayısı tur başına büyümüyor', m1[0] - m0[0] < 9, { once: m0, sonra: m1 });
  ok('12 ekle-sil sonrası doku sayısı tur başına büyümüyor', m1[1] - m0[1] < 9, { once: m0, sonra: m1 });
  /* kesin denetim: silinen cismin kendi geometrileri (paylaşılan ayrıntı düzeyi küreleri hariç) ve yörünge çizgisi gerçekten bırakılıyor */
  await t.E(cyc); await wait(900);
  const nG = await t.E("(function(){var b=focus,L=[];function w(g){if(g&&L.indexOf(g)<0)L.push(g);}b.pivot.traverse(function(o){if(o.isMesh||o.isLine||o.isPoints)w(o.geoHi||o.geometry);});if(b.line)w(b.line.geometry);window.__chk=L.map(function(g){var r={d:false,t:g.type};g.addEventListener('dispose',function(){r.d=true;});return r;});return L.length;})()");
  await t.E("$('labDel').click()"); await wait(600);
  const left = await t.E("window.__chk.filter(function(r){return !r.d}).map(function(r){return r.t})");
  ok('silinen cismin ' + nG + ' geometrisinin hepsi bırakıldı (yörünge çizgisi dahil)', nG >= 3 && left === '[]', left);
  ok('12 ekle-sil sonrası sahne ve cisim listesi büyümedi', m1[2] - m0[2] <= 1 && m1[3] === m0[3], { once: m0, sonra: m1 });
  ok('bellek testi: sayfa hatası yok', t.errs.length === 0 && (await t.E('frameErrN')) === 0, t.errs);
  await t.page.close();

  /* 12) yavaş ağ: uygulama 15 dosyadan yüklenir; dosyalar aralıklı gelse de (araya zamanlayıcı, tuş ve boyut olayları girse de)
        yükleme sırasında henüz gelmemiş bir dosyadaki ada dokunulmaz */
  t = await open(b, { slowJs: 120 });
  for (let i = 0; i < 8; i++) { await wait(180); await t.page.keyboard.press('Escape').catch(() => { }); await t.page.setViewportSize({ width: 1280 - (i % 2) * 40, height: 800 }).catch(() => { }); }
  await ready(t);
  ok('yavaş ağ: sayfa hatasız açıldı', t.errs.length === 0 && (await t.E('frameErrN')) === 0, t.errs);
  ok('yavaş ağ: ertelenen kurulum çalıştı (ekleme kataloğu dolu)', (await t.page.evaluate(() => document.getElementById('addCat').children.length)) > 3);
  ok('yavaş ağ: simülasyon çalışıyor', (await t.E("simDays>0&&BODIES.length>20")) === true);
  await t.page.close();

  await b.close();
  console.log(fails ? `\n${fails} test başarısız` : '\nHepsi geçti');
  process.exit(fails ? 1 : 0);
})();
