// Gerçek zamanlı senaryolar: her biri temiz sayfada çalışır; sonucu beklenen değerle karşılaştırıp GEÇTİ/KALDI yazar.
// Bir senaryo şu durumlarda kalır: beklenen sonuç çıkmadı, sayfa hatası oluştu ya da kare döngüsünde hata yakalandı (frameErrN).
// Hız için ışık bükülmesi ve pulsar hüzmeleri gizlenir (yazılımsal WebGL'de çok yavaşlar).
// real-time scenario suite; each scenario on a fresh page state
const P=v=>{try{return typeof v==='string'?JSON.parse(v):v;}catch(e){return v;}};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/* mesafe ölçeği: DS=1 (Kompakt), 2.5 (Geniş, varsayılan), 6 (Gerçekçiye yakın) */
const DSV=process.env.DS||'2.5';
/* önce aynı kökendeki boş sayfaya geçilir: eski sayfa hâlâ açıkken temizlenirse çalışan zamanlayıcıları kaydı geri yazabiliyor, bir sonraki senaryoya cisim sızıyordu */
async function fresh(page){await page.goto('http://app/__bos.html');await page.evaluate((ds)=>{try{localStorage.clear();sessionStorage.clear();localStorage.setItem('gsg-coach','1');localStorage.setItem('se_ds',ds);}catch(e){}},DSV);await page.goto('http://app/index.html');await page.waitForFunction(()=>window.__E,null,{timeout:60000});await page.waitForTimeout(2500);}
async function waitFor(E,cond,sec){for(let i=0;i<sec*2;i++){const r=await E(cond);if(r===true)return true;await new Promise(r=>setTimeout(r,500));}return false;}
module.exports=async(page,E,shot)=>{
  console.log('Mesafe ölçeği:',DSV);
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  let fails=0;
  /* ONLY=ad1,ad2 ile yalnızca seçilen senaryolar çalışır */
  const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
  const T=async(name,fn,check)=>{if(ONLY.length&&!ONLY.includes(name))return;const e0=errs.length;let res;try{res=await fn();}catch(e){res='EXC '+e.message;}
    const why=[];
    if(typeof res==='string'&&/^(EXC|ERR) /.test(res))why.push('senaryo çalışmadı');
    else if(check){try{const c=check(P(res));if(c!==true)why.push(typeof c==='string'?c:'beklenen sonuç çıkmadı');}catch(e){why.push('kontrol çalışmadı: '+e.message);}}
    if(errs.length>e0)why.push('sayfa hatası: '+errs.slice(e0).join(' | '));
    const fe=await E("frameErrN");if(fe!==0)why.push('kare döngüsünde yakalanan hata: '+fe);
    if(why.length)fails++;
    console.log(why.length?'KALDI':'GEÇTİ',name,'=>',JSON.stringify(res),why.length?' ['+why.join('; ')+']':'');};
  const merge=async(name,setup,chk,timeout=90)=>T(name,async()=>{await fresh(page);await E("$('side').classList.add('collapsed');LENS.on=false;setInterval(function(){BODIES.forEach(function(b){if(b.exo&&b.exo.beams)b.exo.beams.visible=false;if(b.exo&&b.exo.neb)b.exo.neb.visible=false;});},40)");await E(setup);
    const t0=Date.now();const ok=await waitFor(E,"!BODIES.some(function(b){return b.dart})",timeout);await page.waitForTimeout(2500);
    const st=await E("[sunType, BODIES.filter(function(b){return b.def.star&&b!==sunBody&&!isGone(b)}).map(function(b){return b.def.name+':'+b.starType}).join(','), sunBody.pivot.position.length().toFixed(1), (focus&&focus.def.name), $('toast').textContent.slice(0,70)]");
    await shot('t-'+name);return {done:ok,sec:((Date.now()-t0)/1000).toFixed(0),st:st};},r=>{if(!r.done)return 'birleşme süresi içinde bitmedi';return chk(P(r.st));});
  await merge('yildiz-gunes',"addStar({name:'Y',type:0,size:.8,a:160},false);launchPair(focus,sunBody)",s=>s[1]==='');
  await merge('ns-ns',"addStar({name:'N1',type:5,size:.8,a:200,m:1.4},false);window.__a=focus;addStar({name:'N2',type:5,size:.8,a:260,m:1.4},false);launchPair(window.__a,focus)",s=>/^N[12]:[56]$/.test(s[1]));
  await merge('bh-yildiz',"addStar({name:'K',type:6,size:1,a:260,m:30},false);window.__k=focus;addStar({name:'Y',type:0,size:.8,a:200},false);launchPair(focus,window.__k)",s=>s[1]==='K:6');
  await merge('mars-bh',"addStar({name:'K',type:6,size:1,a:260,m:30},false);launchPair(byId.mars,focus)",s=>s[1]==='K:6');
  await merge('gunes-jupiter',"launchPair(sunBody,byId.jupiter)",s=>s[0]===0&&s[1]==='');
  await merge('bh-bh',"addStar({name:'K1',type:6,size:1,a:220,m:20},false);window.__a=focus;addStar({name:'K2',type:6,size:1,a:300,m:20},false);launchPair(window.__a,focus)",s=>/^K[12]:6$/.test(s[1]));
  await merge('bh-gunes',"addStar({name:'K',type:6,size:1,a:220,m:50},false);launchPair(focus,sunBody)",s=>s[0]===6&&s[1]==='');
  await merge('gunesBH-yildiz',"setStar(6);addStar({name:'Y',type:0,size:.8,a:200},false);launchPair(focus,sunBody)",s=>s[0]===6&&s[1]==='');
  await T('geri-sarma',async()=>{await fresh(page);await E("addStar({name:'Y',type:0,size:.8,a:160},false);launchPair(focus,sunBody)");await page.waitForTimeout(4000);
    await E("reverse=true;$('rev').setAttribute('aria-pressed','true')");await page.waitForTimeout(8000);
    return await E("[!!byId[customs[0]&&customs[0].id], BODIES.some(function(b){return b.dart}), sunBody.pivot.position.length().toFixed(1), customs.length]");},r=>same(r,[false,false,'0.0',0]));
  await T('sifirla',async()=>{await E("reverse=false;addStar({name:'K',type:6,size:1,a:220,m:50},false);setStar(5)");await page.waitForTimeout(1000);
    await E("var b=$('vReset');b.click();b.click()");await page.waitForTimeout(3000);
    return await E("[sunType,customs.length,sunBody.pivot.position.length(),TDL.length,ENVS.length,!!EXO.sn]");},r=>same(r,[0,0,0,0,0,false]));
  await T('paylas',async()=>{await fresh(page);await E("addStar({name:'K',type:6,size:1,a:220,m:40},false);addCustom({name:'Z',type:'gas',color:'#d8a460',size:7,a:5,ring:true,moons:2})");await page.waitForTimeout(1000);
    const code=await E("encodeState()");await fresh(page);await E(`applyState(JSON.parse(decodeURIComponent(escape(atob('${JSON.parse(JSON.stringify(code))}')))))`);await page.waitForTimeout(2000);
    return await E("BODIES.filter(function(b){return b.def.custom&&!b.parent}).map(function(b){return b.def.name+':'+(b.starType!=null?b.starType:'')+':'+(b.massAbs||'')})");},r=>r.length===2&&r[0]==='K:6:40'&&/^Z:/.test(r[1]));
  await T('meteor',async()=>{await fresh(page);await E("nextShowerJump()");await page.waitForTimeout(6000);
    return await E("[mode, MET.list.length, SURF&&SURF.pitch.toFixed(2), $('date').textContent]");},r=>r[0]==='surface');
  await T('firtina',async()=>{await fresh(page);await E("focusBody('earth')");await page.waitForTimeout(1500);await E("gotoStorm()");await page.waitForTimeout(4000);
    return await E("[WX.follow, (WX.storms||[]).length, SPEEDS[speedIdx].t]");},r=>!!r[0]&&r[1]>=1&&r[2]==='1 saat/sn');
  await T('ekle-limit',async()=>{await fresh(page);await E("openSide();showTab('lab');showLabTab('ekle')");
    for(let i=0;i<3;i++){await E("addPick('s:6');$('xDist').value=500;$('addGo').click()");await page.waitForTimeout(700);}
    for(let i=0;i<11;i++){await E("addPick('p:rocky');$('addGo').click()");await page.waitForTimeout(400);}
    return await E("[addCounts(), $('addGo').disabled, $('addCount').textContent]");},r=>r[0].p===10&&r[0].s===2&&r[1]===true);
  await T('lab-baglam',async()=>{await fresh(page);const out=[];
    for(const id of ["'sun'","'earth'","'moon'","'iss'","'halley'"]){await E(`focusBody(${id});openSide();showTab('lab')`);await page.waitForTimeout(300);
      out.push(await E("[focus.def.name, ['sSpin','sOrbit','sSize','sTilt'].map(function(i){var r=rowOf(i);return r&&!r.hidden?1:0}).join('')]"));}
    return out;},r=>same(r.map(P),[['Güneş','1010'],['Dünya','1111'],['Ay','1111'],['Uluslararası Uzay İstasyonu','0000'],['Halley','1110']]));
  await T('ayni-yorunge',async()=>{await fresh(page);/* arayüzdeki gibi ayrı ayrı eklenir: yeni cisim bir sonraki karede yörüngesine yerleşir, boş nokta araması ondan sonra doğru çalışır */
    await E("addStar({name:'A',type:0,size:.8,a:220},false)");await page.waitForTimeout(600);await E("addStar({name:'B',type:0,size:.8,a:220},false)");await page.waitForTimeout(1500);
    return await E("(function(){var L=BODIES.filter(function(b){return b.def.star&&b!==sunBody});return [L.length,L[0].pos.distanceTo(L[1].pos).toFixed(0),(mergeR(L[0])+mergeR(L[1])).toFixed(0)]})()");},r=>r[0]===2&&+r[1]>+r[2]);
  await T('kutle-ns',async()=>{await fresh(page);await E("addStar({name:'N',type:5,size:.8,a:220,m:1.4},false)");await page.waitForTimeout(1500);
    await E("focusBody(focus.id);openSide();showTab('lab');showLabTab('cisim');$('sBM').value=.9;$('sBM').dispatchEvent(new Event('input'));$('sBM').dispatchEvent(new Event('change'))");
    await waitFor(E,"BODIES.some(function(b){return b.def.star&&b!==sunBody&&b.starType===6})",60);
    return await E("[$('oBM').textContent, BODIES.filter(function(b){return b.def.star&&b!==sunBody}).map(function(b){return b.def.name+':'+b.starType})]");},r=>same(r[1],['N:6']));
  await T('barimerkez',async()=>{await fresh(page);await E("addStar({name:'K',type:6,size:1,a:220,m:50},false)");await page.waitForTimeout(3000);
    return await E("[sunBody.pivot.position.length().toFixed(1), sysCOM(new THREE.Vector3()).length().toFixed(2), byId.earth.pos.distanceTo(sunBody.pos).toFixed(1)]");},r=>+r[0]>0&&+r[1]<+r[0]*.05);
  await T('enkaz',async()=>{await fresh(page);await E("LENS.on=false;launchPair(byId.mars,byId.earth)");await waitFor(E,"isGone(byId.mars)",120);await page.waitForTimeout(3000);
    return await E("[DEB.N, DEB.hits]");},r=>r[0]>0);
  await T('dunya-benzeri',async()=>{await fresh(page);await E("openSide();showTab('lab');showLabTab('ekle');addPick('p:earth');$('addGo').click()");await page.waitForTimeout(2000);
    return await E("[focus.def.kind, focus.def.a, $('addZone').textContent.slice(0,60), Math.round(habScore(focus))]");},r=>/Dünya benzeri/.test(r[0])&&/✓/.test(r[2])&&r[3]>50);
  /* iklim: eğiklik mevsim farkını artırır, varsayılan Dünya değişmez, CO₂ ikiye katlanınca ~+3 K, termostat tektonikle çalışır, Milankovitch bugüne göre sıfırlı */
  await T('iklim-mevsim',async()=>{await fresh(page);await E("focusBody('earth')");await page.waitForTimeout(1500);
    const sw=async(t)=>E("(function(){var e=byId.earth;e.mod.tilt="+t+";setTiltRot(e,"+t+");computeClimate(e);return +e.cl.sw.toFixed(1)})()");
    const loop="for(var i=0;i<400;i++){e.cl.sd=simDays-5;e.cl.rt-=500;computeClimate(e);}";
    const s0=await sw(0),s23=await sw(23.44),s90=await sw(90);await sw(23.44);
    const def=await E("(function(){var e=byId.earth;computeClimate(e);return [Math.round(habScore(e)),Math.round(e.cl.Ts-273.15),e.cl.mil]})()");
    const dco2=await E("(function(){var e=byId.earth,h=e.hab;h.co2=0;"+loop+"var a=e.cl.Ts;h.co2=1;"+loop+"var b=e.cl.Ts;h.co2=0;return +(b-a).toFixed(1)})()");
    const thermo=async(tect)=>E("(function(){var e=byId.earth,h=e.hab;h.co2=-3;h.tect="+tect+";h.cs=0;for(var k=0;k<4;k++){for(var i=0;i<400;i++){e.cl.sd=simDays-2e5;e.cl.rt-=5e6;computeClimate(e);}}var r=+(e.cl.Ts-273.15).toFixed(1);h.co2=0;h.tect=1;h.cs=0;return r})()");
    const withT=await thermo(1),noT=await thermo(0);
    return {mevsimFarki:[s0,s23,s90],artiyor:s0<s23&&s23<s90,varsayilanHabTsMil:def,iki_katCO2_K:dco2,termostatC:{tektonikli:withT,tektoniksiz:noT},termostatSaglikli:withT>noT+1};},r=>{const d=P(r.varsayilanHabTsMil);return r.artiyor&&r.termostatSaglikli&&r.iki_katCO2_K>=2&&r.iki_katCO2_K<=4.5&&d[0]>=90&&d[1]>=13&&d[1]<=18;});
  /* gerçek ölçekte nötron yıldızı 10 km, 10 Güneş kütleli kara deliğin gölgesi 76,7 km (2,95 × 10 × 2,6), Io Jüpiter'e 421.700 km;
     diğer ölçeklerde nötron yıldızı ve kara delik görünsün diye büyütülmüş kalır */
  await T('kompakt-boyut',async()=>{await fresh(page);await E("addStar({name:'N',type:5,size:1,a:300,m:1.4},false)");await page.waitForTimeout(800);await E("addStar({name:'K',type:6,size:1,a:400,m:10},false)");await page.waitForTimeout(2000);
    return await E("(function(){var f=function(n){return BODIES.filter(function(b){return b.def.name===n})[0]},n=f('N'),k=f('K');return [REAL,+(effVr(n)*KM_U).toFixed(1),+(k.exo.sh*KM_U).toFixed(1),+(byId.io.pos.distanceTo(byId.jupiter.pos)*KM_U).toFixed(0)]})()");},
    r=>r[0]?(Math.abs(r[1]-10)<.2&&Math.abs(r[2]-76.7)<1&&Math.abs(r[3]-421700)<4300):(r[1]>1000&&r[2]>1000));
  /* canlı grafik: Dünya'ya odaklanınca örnek toplanır; uzaklık ~1 AU, hız ~30 km/s çıkmalı. Güneş'te grafik gizlenir */
  await T('grafik',async()=>{await fresh(page);await E("focusBody('earth');grSetOpen(true)");await page.waitForTimeout(5000);
    const r=await E("(function(){var d=GR.v.dist||[],s=(GR.v.spd||[]).filter(function(x){return x!=null});return [GR.t.length,d[d.length-1],s[s.length-1],document.getElementById('gr').hidden,document.getElementById('grNow').textContent]})()");
    await E("focusBody('sun')");await page.waitForTimeout(900);return [r,await E("document.getElementById('gr').hidden")];},
    r=>{const a=P(r[0]);return a[0]>=3&&a[1]>.97&&a[1]<1.03&&a[2]>28.5&&a[2]<31&&a[3]===false&&/AU/.test(a[4])&&r[1]===true;});
  /* eklenen yıldızın yılı Kepler'e uyar: P = a^1,5 / √(toplam kütle); a, sahnedeki uzaklığın karşılık geldiği AU. Uzaklık AU olarak yazılır */
  await T('yildiz-kepler',async()=>{await fresh(page);await E("addStar({name:'Y',type:0,size:1,a:171,m:1},false)");await page.waitForTimeout(1200);
    return await E("(function(){var b=focus,a=invOrbit(b.def.r);return [+(starP(b)/365.25).toFixed(3),+(Math.pow(a,1.5)/Math.SQRT2).toFixed(3),+a.toFixed(2),b.def.stats.map(function(x){return x[1]}).join('|')]})()");},
    r=>Math.abs(r[0]-r[1])<r[1]*.01&&r[2]>1&&/ AU/.test(r[3])&&!/birim/.test(r[3]));
  /* hazır deneyler: arama kutusunda listelenir; "sera etkisi" CO₂'yi 8 katına çıkarıp sıcaklık grafiğini açar, sıcaklık yükselir;
     "Dünya, Mars'ın yerinde" 1,5 AU'ya Dünya benzeri gezegen koyar (donar) */
  await T('hazir-deney',async()=>{await fresh(page);await E("openCmd()");await page.waitForTimeout(300);
    const g=await E("document.querySelector('#cmdList .cmdg').textContent");await E("closeCmd();PRESETS[1][4]()");await page.waitForTimeout(6000);
    const a=await E("(function(){var v=GR.v.temp||[];return [focus.def.id,focus.hab.co2,GR.open,GR.key,v.length,v[v.length-1]-v[0]]})()");
    await fresh(page);await E("PRESETS[2][4]()");await page.waitForTimeout(3500);
    return [g,a,await E("[focus.def.name,focus.def.a,customs.length,focus.cl.Ts-273.15<-20]")];},
    r=>{const a=P(r[1]),b=P(r[2]);return r[0]==='Hazır deneyler'&&a[0]==='earth'&&a[1]===3&&a[2]===true&&a[3]==='temp'&&a[4]>=3&&a[5]>1&&same(b,['Dünya 2',1.5,1,true]);});
  /* kuyruklu yıldız Kepler'e uyar: gerçek ölçekte Halley'in konumdan ölçülen hızı, yörünge enerjisinden beklenen hıza (vis-viva) eşit olmalı.
     Sıkıştırılmış ölçeklerde elips sahne biriminde çizildiği için yalnızca uzaklığın günberi-günöte aralığında kaldığına bakılır */
  await T('kuyruklu-hiz',async()=>{await fresh(page);await E("focusBody('halley')");await page.waitForTimeout(4000);
    return await E("(function(){var b=focus,cm=b.def.cm,r=invOrbit(b.pos.distanceTo(sunBody.pos));return [REAL,+r.toFixed(2),GR.spd==null?null:+GR.spd.toFixed(3),+(29.78*Math.sqrt(Math.max(0,2/r-2/(cm.q+cm.Q)))).toFixed(3),cm.q,cm.Q]})()");},
    r=>r[1]>=r[4]*.98&&r[1]<=r[5]*1.02&&(!r[0]||(r[2]!=null&&Math.abs(r[2]-r[3])<r[3]*.05)));
  /* gerçek ölçekte Ay'ın uzaklığı gerçek: ay içinde yerberi (~357 bin km) ile yeröte (~406 bin km) arasında değişir; diğer ölçeklerde sabittir */
  await T('ay-uzaklik',async()=>{await fresh(page);await E("window.__md=[];window.__iv=setInterval(function(){window.__md.push(byId.moon.pos.distanceTo(byId.earth.pos)*KM_U)},100)");await page.waitForTimeout(9000);
    return await E("(function(){clearInterval(window.__iv);var a=window.__md;return [REAL,a.length,Math.round(Math.min.apply(null,a)),Math.round(Math.max.apply(null,a))]})()");},
    r=>r[1]>=10&&(r[0]?(r[2]>354000&&r[2]<372000&&r[3]>398000&&r[3]<409000):(r[3]-r[2]<=1)));
  /* gerçek ölçekte kırmızı dev ~200 Güneş yarıçapı: Merkür ve Venüs'ü yutar, Dünya dışarıda kalır; beyaz cüce ~6.000 km yarıçap.
     Boyut geçişi kare hızına bağlı olduğu için oturana kadar beklenir */
  await T('dev-cuce',async()=>{await fresh(page);const real=await E("REAL");
    const until=async(expr,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await E(expr))return true;await page.waitForTimeout(1000);}return false;};
    await E("setStar(3)");const a=real?await until("Math.abs(effVr(sunBody)*KM_U/696000-200)<8&&byId.venus.engulfed",60000):(await page.waitForTimeout(3000),true);
    const g=await E("[+(effVr(sunBody)*KM_U/696000).toFixed(0),!!byId.mercury.engulfed,!!byId.venus.engulfed,!!byId.earth.engulfed]");
    await E("setStar(4)");const b=real?await until("Math.abs(effVr(sunBody)*KM_U-6000)<300",60000):(await page.waitForTimeout(3000),true);
    return [real,a,g,b,await E("Math.round(effVr(sunBody)*KM_U)")];},
    r=>{if(!r[0])return true;const g=P(r[2]);return r[1]===true&&g[1]===true&&g[2]===true&&g[3]===false&&r[3]===true;});
  /* grafik eklemeleri: sabitlenen cisim (Merkür) başka cisme (Venüs) geçilince de kaydedilir ve ikisi birlikte çizilir;
     "başlangıç → şimdi" satırı yazılır; CSV başlık satırı ve iki cismin verisini içerir */
  await T('grafik-ek',async()=>{await fresh(page);await E("focusBody('mercury');grSetOpen(true)");await page.waitForTimeout(3500);await E("grPinToggle()");await page.waitForTimeout(400);
    await E("focusBody('venus')");await page.waitForTimeout(5000);
    return await E("(function(){var c=grCsvText().split('\\r\\n');return [GR.id,GR.pin&&GR.pin.id,GR.pin.t.length>GR.t.length,document.getElementById('grLeg').textContent,document.getElementById('grDelta').textContent.slice(0,9),c[0],c.some(function(l){return l.indexOf('Merkür;')===0}),c.some(function(l){return l.indexOf('Venüs;')===0})]})()");},
    r=>r[0]==='venus'&&r[1]==='mercury'&&r[2]===true&&/Venüs/.test(r[3])&&/Merkür/.test(r[3])&&r[4]==='Başlangıç'&&/^Cisim;Tarih;Gün;Uzaklık \(AU\)/.test(r[5])&&r[6]===true&&r[7]===true);
  /* korunum göstergesi: kütleçekim modunda toplam enerji ve açısal momentum sapması yüzde birin yüzde birinden küçük kalmalı;
     ek yıldız eklenince ölçüm durur ve nedeni yazılır */
  await T('korunum',async()=>{await fresh(page);await E("clk('gravBtn')");await page.waitForTimeout(7000);
    const a=await E("[gravityOn,document.getElementById('cons').hidden,CONS.dE,CONS.dL]");
    await E("addStar({name:'Y',type:0,size:1,a:300,m:1},false)");await page.waitForTimeout(1500);
    return [a,await E("[CONS.dE,CONS.why.length>0,document.getElementById('consE').textContent]")];},
    r=>{const a=P(r[0]),b=P(r[1]);return a[0]===true&&a[1]===false&&typeof a[2]==='number'&&Math.abs(a[2])<.01&&Math.abs(a[3])<.01&&b[0]===null&&b[1]===true&&b[2]==='–';});
  /* yeni hazır deneyler: "Güneş kütlesinin yarısını kaybederse" kütleçekimini açar, kütleyi 0,45'e indirir; Dünya uzaklaşır */
  await T('hazir-deney-2',async()=>{await fresh(page);const n=await E("PRESETS.length");await E("PRESETS[5][4]()");await page.waitForTimeout(9000);
    return [n,await E("(function(){var v=(GR.v.dist||[]).filter(function(x){return x!=null});return [focus.def.id,gravityOn,+sunMass.toFixed(2),GR.key,v[v.length-1]-v[0]]})()")];},
    r=>{const a=P(r[1]);return r[0]===7&&a[0]==='earth'&&a[1]===true&&a[2]===.45&&a[3]==='dist'&&a[4]>.03;});
  /* yıldız haritası: 28 yıldız gerçek yön ve uzaklıkla (Proxima–Alfa Centauri arası 0,21 ışık yılı çıkmalı); haritadan TRAPPIST-1'e
     yolculuk sistemi yükler ve haritayı kapatır; yeniden açınca "buradasın" orayı gösterir; Esc kapatır */
  await T('yildiz-haritasi',async()=>{await fresh(page);await E("smapOpen()");await page.waitForTimeout(400);
    const a=await E("(function(){var v=function(n){var s=SMAP_STARS.filter(function(x){return x[0]===n})[0],a=s[1]*15*Math.PI/180,d=s[2]*Math.PI/180;return [Math.cos(d)*Math.cos(a)*s[3],Math.cos(d)*Math.sin(a)*s[3],Math.sin(d)*s[3]]},p=v('Proxima Centauri'),c=v('Alfa Centauri A ve B');return [SMAP.open,SMAP.stars.length,SMAP.pts.length,SMAP.stars[SMAP.sel].name,+Math.hypot(p[0]-c[0],p[1]-c[1],p[2]-c[2]).toFixed(2),document.getElementById('smapList').children.length]})()");
    await E("smapSelect(SMAP.stars.filter(function(s){return s.sys==='trappist'})[0].i)");await page.click('#smapGo');
    const t0=Date.now();let ok=false;while(Date.now()-t0<30000){await page.waitForTimeout(700);if(await E("!!(SYS&&SYS.id==='trappist')&&!SMAP.open&&!document.getElementById('fade').classList.contains('on')")){ok=true;break;}}
    await E("smapOpen()");await page.waitForTimeout(300);const b=await E("[SMAP.stars[SMAP.sel].sys,/buradasın/.test(document.getElementById('smapInfo').textContent)]");
    await page.keyboard.press('Escape');await page.waitForTimeout(200);return [a,ok,b,await E("SMAP.open")];},
    r=>same(P(r[0]),[true,28,28,'Güneş',.21,6])&&r[1]===true&&same(P(r[2]),['trappist',true])&&r[3]===false);
  /* bulutsular: gezegenimsi bulutsu kabuğu genişler ve beyaz cüce ısındıkça iyonlaşır (ion 0 → 1); süpernova kalıntısı patlamadan sonra
     büyümeye devam eder. Gölgelendirici derleme hatası sayfa hatası vermediği için programlar ayrıca denetlenir */
  await T('bulutsu',async()=>{await fresh(page);const bad="renderer.info.programs.filter(function(p){return p.diagnostics&&!p.diagnostics.runnable}).length";
    const until=async(expr,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await E(expr))return true;await page.waitForTimeout(800);}return false;};
    await E("planetaryNebula()");await page.waitForTimeout(2500);const a=await E("[PNEB.length,PNEB[0].sp.material.uniforms.ion.value<.2,PNEB[0].sp.scale.x]");
    const ion=await until("PNEB.length&&PNEB[0].sp.material.uniforms.ion.value>=1",90000);const b=await E("[PNEB[0].sp.scale.x,sunType,"+bad+"]");
    await fresh(page);await E("supernova()");const neb=await until("!!EXO.neb&&EXO.nebT>1",120000);const s1=await E("EXO.neb.scale.x");await page.waitForTimeout(6000);
    return [a,ion,b,neb,s1,await E("[EXO.neb.scale.x,sunType,"+bad+"]")];},
    r=>{const a=P(r[0]),b=P(r[2]),c=P(r[5]);return a[0]===1&&a[1]===true&&r[1]===true&&b[0]>a[2]*1.5&&b[1]===4&&b[2]===0&&r[3]===true&&c[0]>r[4]&&c[1]===5&&c[2]===0;});
  console.log('SAYFA HATASI',errs.length,'· KALAN SENARYO',fails);
  return fails+(errs.length?1:0);
};
