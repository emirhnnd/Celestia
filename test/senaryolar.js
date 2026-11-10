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
  console.log('SAYFA HATASI',errs.length,'· KALAN SENARYO',fails);
  return fails+(errs.length?1:0);
};
