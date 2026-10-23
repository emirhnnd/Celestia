// Gerçek zamanlı senaryolar: her biri temiz sayfada çalışır, sonucu ve sayfa hatalarını yazar.
// Hız için ışık bükülmesi ve pulsar hüzmeleri gizlenir (yazılımsal WebGL'de çok yavaşlar).
// real-time scenario suite; each scenario on a fresh page state
const R=[];
/* mesafe ölçeği: DS=1 (Kompakt), 2.5 (Geniş, varsayılan), 6 (Gerçekçiye yakın) */
const DSV=process.env.DS||'2.5';
async function fresh(page){await page.evaluate((ds)=>{try{localStorage.clear();localStorage.setItem('gsg-coach','1');localStorage.setItem('se_ds',ds);}catch(e){}},DSV);await page.reload();await page.waitForFunction(()=>window.__E,null,{timeout:60000});await page.waitForTimeout(2500);}
async function waitFor(E,cond,sec){for(let i=0;i<sec*2;i++){const r=await E(cond);if(r===true)return true;await new Promise(r=>setTimeout(r,500));}return false;}
module.exports=async(page,E,shot)=>{
  console.log('Mesafe ölçeği:',DSV);
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  const T=async(name,fn)=>{const e0=errs.length;let res;try{res=await fn();}catch(e){res='EXC '+e.message;}console.log('##',name,'=>',JSON.stringify(res),errs.length>e0?' ERRORS: '+errs.slice(e0).join(' | '):'');};
  const merge=async(name,setup,timeout=90)=>T(name,async()=>{await fresh(page);await E("$('side').classList.add('collapsed');LENS.on=false;setInterval(function(){BODIES.forEach(function(b){if(b.exo&&b.exo.beams)b.exo.beams.visible=false;if(b.exo&&b.exo.neb)b.exo.neb.visible=false;});},40)");await E(setup);
    const t0=Date.now();const ok=await waitFor(E,"!BODIES.some(function(b){return b.dart})",timeout);await page.waitForTimeout(2500);
    const st=await E("[sunType, BODIES.filter(function(b){return b.def.star&&b!==sunBody&&!isGone(b)}).map(function(b){return b.def.name+':'+b.starType}).join(','), sunBody.pivot.position.length().toFixed(1), (focus&&focus.def.name), $('toast').textContent.slice(0,70)]");
    await shot('t-'+name);return {done:ok,sec:((Date.now()-t0)/1000).toFixed(0),st:st};});
  await merge('yildiz-gunes',"addStar({name:'Y',type:0,size:.8,a:160},false);launchPair(focus,sunBody)");
  await merge('ns-ns',"addStar({name:'N1',type:5,size:.8,a:200,m:1.4},false);window.__a=focus;addStar({name:'N2',type:5,size:.8,a:260,m:1.4},false);launchPair(window.__a,focus)");
  await merge('bh-yildiz',"addStar({name:'K',type:6,size:1,a:260,m:30},false);window.__k=focus;addStar({name:'Y',type:0,size:.8,a:200},false);launchPair(focus,window.__k)");
  await merge('mars-bh',"addStar({name:'K',type:6,size:1,a:260,m:30},false);launchPair(byId.mars,focus)");
  await merge('gunes-jupiter',"launchPair(sunBody,byId.jupiter)");
  await merge('bh-bh',"addStar({name:'K1',type:6,size:1,a:220,m:20},false);window.__a=focus;addStar({name:'K2',type:6,size:1,a:300,m:20},false);launchPair(window.__a,focus)");
  await merge('bh-gunes',"addStar({name:'K',type:6,size:1,a:220,m:50},false);launchPair(focus,sunBody)");
  await merge('gunesBH-yildiz',"setStar(6);addStar({name:'Y',type:0,size:.8,a:200},false);launchPair(focus,sunBody)");
  await T('geri-sarma',async()=>{await fresh(page);await E("addStar({name:'Y',type:0,size:.8,a:160},false);launchPair(focus,sunBody)");await page.waitForTimeout(4000);
    await E("reverse=true;$('rev').setAttribute('aria-pressed','true')");await page.waitForTimeout(8000);
    return await E("[!!byId[customs[0]&&customs[0].id], BODIES.some(function(b){return b.dart}), sunBody.pivot.position.length().toFixed(1), customs.length]");});
  await T('sifirla',async()=>{await E("reverse=false;addStar({name:'K',type:6,size:1,a:220,m:50},false);setStar(5)");await page.waitForTimeout(1000);
    await E("var b=$('vReset');b.click();b.click()");await page.waitForTimeout(3000);
    return await E("[sunType,customs.length,sunBody.pivot.position.length(),TDL.length,ENVS.length,!!EXO.sn]");});
  await T('paylas',async()=>{await fresh(page);await E("addStar({name:'K',type:6,size:1,a:220,m:40},false);addCustom({name:'Z',type:'gas',color:'#d8a460',size:7,a:5,ring:true,moons:2})");await page.waitForTimeout(1000);
    const code=await E("encodeState()");await fresh(page);await E(`applyState(JSON.parse(decodeURIComponent(escape(atob('${JSON.parse(JSON.stringify(code))}')))))`);await page.waitForTimeout(2000);
    return await E("BODIES.filter(function(b){return b.def.custom&&!b.parent}).map(function(b){return b.def.name+':'+(b.starType!=null?b.starType:'')+':'+(b.massAbs||'')})");});
  await T('meteor',async()=>{await fresh(page);await E("nextShowerJump()");await page.waitForTimeout(6000);
    return await E("[mode, MET.list.length, SURF&&SURF.pitch.toFixed(2), $('date').textContent]");});
  await T('firtina',async()=>{await fresh(page);await E("focusBody('earth')");await page.waitForTimeout(1500);await E("gotoStorm()");await page.waitForTimeout(4000);
    return await E("[WX.follow, (WX.storms||[]).length, SPEEDS[speedIdx].t]");});
  await T('ekle-limit',async()=>{await fresh(page);await E("openSide();showTab('lab');showLabTab('ekle')");
    for(let i=0;i<3;i++){await E("addPick('s:6');$('addGo').click()");await page.waitForTimeout(700);}
    for(let i=0;i<11;i++){await E("addPick('p:rocky');$('addGo').click()");await page.waitForTimeout(400);}
    return await E("[addCounts(), $('addGo').disabled, $('addCount').textContent]");});
  await T('lab-baglam',async()=>{await fresh(page);const out=[];
    for(const id of ["'sun'","'earth'","'moon'","'iss'","'halley'"]){await E(`focusBody(${id});openSide();showTab('lab')`);await page.waitForTimeout(300);
      out.push(await E("[focus.def.name, ['sSpin','sOrbit','sSize','sTilt'].map(function(i){var r=rowOf(i);return r&&!r.hidden?1:0}).join('')]"));}
    return out;});
  console.log('TOTAL ERRORS',errs.length);
};
