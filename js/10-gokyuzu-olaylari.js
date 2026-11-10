/* Celestia · Tutulmalar, Apophis, ses, gerçek konumlar (astronomy-engine) ve uzay araçları.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- tutulmalar + Apophis ---------- */
var ECL={sol:false,lun:false,prevT:null,cv:null};
function bPosAt(b,dt){var d=b.def,a=b.ang+dt*TAU/d.P*b.mod.orbit,r=d.r||d.orbit,inc=(d.incl||0)*D2R,sa=Math.sin(a);return new THREE.Vector3(Math.cos(a)*r,sa*r*Math.sin(inc),-sa*r*Math.cos(inc));}
function eclSep(E,m,lunar){var s=E.clone().negate().normalize(),md=m.clone().normalize();if(lunar)s.negate();return Math.acos(clamp(s.dot(md),-1,1))*57.2958;}
function findEclipse(lunar){
  var e=byId.earth,mo=byId.moon;if(!e||!mo)return null;
  var thr=lunar?.95:.53,prev=1e9,prev2=1e9,step=1/24;
  for(var t=step;t<366*4;t+=step){
    var sp=eclSep(bPosAt(e,t),bPosAt(mo,t),lunar);
    if(prev<prev2&&prev<sp&&prev<thr){
      var best=t-step,bs=prev;for(var u=t-2*step;u<=t;u+=1/1440){var q=eclSep(bPosAt(e,u),bPosAt(mo,u),lunar);if(q<bs){bs=q;best=u;}}
      return {dt:best,sep:bs};
    }
    prev2=prev;prev=sp;
  }
  return null;
}
function gotoEclipse(lunar){
  if(gravityOn){toast('Tutulma araması yer çekimi modunda çalışmaz');return;}
  if(isEngulfed(byId.earth)){toast('Dünya yok olmuş durumda');return;}
  var mo=byId.moon,RE=(mo&&!mo.mod.rr&&mo.mod.orbit===1)?realEclipse(lunar):null;
  if(RE){
    var jump0=RE.days-(lunar?1.6:1)/24-simDays;updateBodies(jump0);simDays+=jump0;
    speedIdx=1;speed.value=1;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
    if(lunar)focusBody('moon');else{focusBody('earth');var E0=byId.earth.pos.clone();theta=Math.atan2(-E0.z,-E0.x)+.25;phi=1.35;}
    var ds=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(RE.date);
    toast((lunar?'Ay tutulması':'Güneş tutulması')+' ('+(ECL_KIND[RE.kind]||RE.kind)+'): '+ds+(lunar?'':(RE.lat!=null?' · en iyi görüldüğü yer: '+Math.round(RE.lat)+'°, '+Math.round(RE.lon)+'°':''))+' · hız 1 dakika/sn',8000);
    return;
  }
  var r=findEclipse(lunar);if(!r){toast('Önümüzdeki 4 yılda tutulma bulunamadı (Ay yörüngesini değiştirmiş olabilirsin)');return;}
  var jump=r.dt-(lunar?1.6:1)/24;updateBodies(jump);simDays+=jump;
  speedIdx=1;speed.value=1;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
  var E=byId.earth.pos.clone();
  if(lunar){focusBody('moon');}else{focusBody('earth');theta=Math.atan2(-E.z,-E.x)+.35;phi=1.3;}
  var tot=lunar?r.sep<.42:r.sep<.03;
  toast((lunar?'Ay tutulmasına gidiliyor':'Güneş tutulmasına gidiliyor')+(tot?' (tam tutulma)':' (parçalı)')+' · hız 1 dakika/sn');
}
function eclOverlap(d,r1,r2){if(d>=r1+r2)return 0;if(d<=Math.abs(r1-r2))return Math.min(r1,r2)*Math.min(r1,r2)/(r1*r1);var a=r1*r1*Math.acos((d*d+r1*r1-r2*r2)/(2*d*r1))+r2*r2*Math.acos((d*d+r2*r2-r1*r1)/(2*d*r2))-.5*Math.sqrt((-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2));return a/(Math.PI*r1*r1);}
function updateEclipse(){
  var e=byId.earth,mo=byId.moon;
  if(ECL.prevT!=null&&APO_T&&(ECL.prevT-APO_T)*(simDays-APO_T)<0)note('13 Nisan 2029: Apophis asteroiti Dünya\'nın 32.000 km yakınından geçiyor');
  ECL.prevT=simDays;
  if(mo&&mo.shU)mo.shU.blood.value=1;
  var box=$('eclView');
  if(!e||!mo||isEngulfed(e)||!mo.pivot.visible){box.hidden=true;return;}
  var m=mo.pos.clone().sub(e.pos),E=e.pos.clone(),s=E.clone().negate().normalize(),sep=eclSep(E,m,false),lsep=eclSep(E,m,true);
  var sol=sep<.53,lun=lsep<.95;
  if(sol&&!ECL.sol)note('Güneş tutulması başladı: Ay\'ın gölgesi Dünya\'ya düşüyor');
  if(lun&&!ECL.lun)note('Ay tutulması başladı: Ay Dünya\'nın gölgesine giriyor ve kızıla dönüyor');
  ECL.sol=sol;ECL.lun=lun;
  var show=sep<1.1;box.hidden=!show;if(!show)return;
  var cv=$('eclCv'),g=cv.getContext('2d'),S=cv.width,c=S/2,pxd=S*.36/1.1;
  var up=Math.abs(s.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),u=new THREE.Vector3().crossVectors(s,up).normalize(),v=new THREE.Vector3().crossVectors(u,s);
  var md=m.clone().normalize(),w=md.clone().addScaledVector(s,-s.dot(md)),dx=w.dot(u)*57.2958,dy=w.dot(v)*57.2958;
  var rS=.2666/((e.au&&AE)?e.au.length():1),rM=(mo.moonKm&&AE)?.2725*384400/mo.moonKm:.2725,cov=eclOverlap(Math.hypot(dx,dy),rS,rM),tot=cov>.995;
  var sky=1-Math.pow(cov,4)*.97;
  g.fillStyle='rgb('+Math.round(70*sky+4)+','+Math.round(120*sky+6)+','+Math.round(190*sky+14)+')';g.fillRect(0,0,S,S);
  var R=rS*pxd;
  if(cov>.9){var cg=g.createRadialGradient(c,c,R*.9,c,c,R*3.2);cg.addColorStop(0,'rgba(255,250,235,'+(.9*(cov-.9)*10)+')');cg.addColorStop(.35,'rgba(220,230,255,'+(.35*(cov-.9)*10)+')');cg.addColorStop(1,'rgba(200,215,255,0)');g.fillStyle=cg;g.fillRect(0,0,S,S);}
  var sg=g.createRadialGradient(c,c,0,c,c,R);sg.addColorStop(0,'#fffbe8');sg.addColorStop(.8,'#ffe38a');sg.addColorStop(1,'#ffb84a');
  g.fillStyle=sg;g.beginPath();g.arc(c,c,R,0,TAU);g.fill();
  g.fillStyle=tot?'#05060a':'rgb('+Math.round(40*sky)+','+Math.round(60*sky)+','+Math.round(90*sky)+')';g.beginPath();g.arc(c+dx*pxd,c-dy*pxd,rM*pxd,0,TAU);g.fill();
  $('eclTxt').textContent=tot?'Tam tutulma':(cov>0?'Güneşin %'+Math.round(cov*100)+' kadarı kapalı':'Ay yaklaşıyor');
}

var REALTEX={mercury:'tex/mercury.jpg',moon:'tex/moon.jpg',venus:'tex/venus-atmo.jpg',mars:'tex/mars.jpg',jupiter:'tex/jupiter.jpg',saturn:'tex/saturn.jpg',uranus:'tex/uranus.jpg',neptune:'tex/neptune.jpg'};
function loadRealPlanets(){
  var L=new THREE.TextureLoader();
  Object.keys(REALTEX).forEach(function(id){var b=byId[id];if(!b||!b.mesh||!b.mesh.material.map)return;
    L.load(REALTEX[id],function(t){t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      var m=b.mesh.material;if(m.map)m.map.dispose();m.map=t;if(m.bumpMap){m.bumpMap=t;m.bumpScale=.35;}m.needsUpdate=true;
      b.realTex=true;b.realMap=t;if(b.shU){b.shU.crat.value=0;}},undefined,function(){});});
  var v=byId.venus;if(v)L.load('tex/venus-surface.jpg',function(t){t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());v.surfMap=t;},undefined,function(){});
  var s=byId.saturn;if(s&&s.ringMesh)L.load('tex/saturn-ring.png',function(t){t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    var m=s.ringMesh.material;if(m.map)m.map.dispose();m.map=t;m.needsUpdate=true;if(s.shU&&s.shU.ringT)s.shU.ringT.value=t;},undefined,function(){});
}
/* sönük yıldız tozu: Samanyolu fotoğrafındaki yıldızlar büyütülünce bulanık leke olur; onları dokudan sildik ve yerine
   her çözünürlükte keskin kalan noktalar koyuyoruz. Yoğunluk Samanyolu'nun parlaklığını izler (galaksi düzleminde daha çok yıldız). */
function buildFaintStars(img){
  if(!SKYG||SKYG.faint)return;
  var W=256,H=128,D=null;try{var c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');g.drawImage(img,0,0,W,H);D=g.getImageData(0,0,W,H).data;}catch(e){D=null;}
  var N=LOWQ?14000:36000,pos=new Float32Array(N*3),col=new Float32Array(N*3),sz=new Float32Array(N),R=4300,n=0,tries=0;
  var CL=[[.72,.82,1],[.9,.94,1],[1,1,1],[1,.95,.84],[1,.86,.7],[1,.74,.56]],CP=[.08,.22,.5,.75,.92,1];
  while(n<N&&tries<N*30){tries++;
    var z=Math.random()*2-1,ph=Math.random()*TAU,sq=Math.sqrt(1-z*z),x=sq*Math.cos(ph),y=z,zz=sq*Math.sin(ph),dens=.25;
    if(D){var u=Math.atan2(zz,-x)/TAU;if(u<0)u+=1;var px=Math.min(W-1,u*W|0),py=Math.min(H-1,Math.acos(clamp(y,-1,1))/Math.PI*H|0);dens=.07+Math.min(.93,D[(py*W+px)*4+1]/255*7);}
    if(Math.random()>dens)continue;
    var q=Math.random(),k=0;while(CP[k]<q)k++;var cc=CL[k],br=.16+.62*Math.pow(Math.random(),3.2);
    pos[n*3]=x*R;pos[n*3+1]=y*R;pos[n*3+2]=zz*R;col[n*3]=cc[0]*br;col[n*3+1]=cc[1]*br;col[n*3+2]=cc[2]*br;sz[n]=.9+Math.pow(Math.random(),5)*1.1;n++;}
  var gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos.subarray(0,n*3),3));gg.setAttribute('color',new THREE.BufferAttribute(col.subarray(0,n*3),3));gg.setAttribute('sz',new THREE.BufferAttribute(sz.subarray(0,n),1));
  var m=new THREE.ShaderMaterial({uniforms:{dpr:{value:Math.min(devicePixelRatio||1,2)},op:{value:1}},vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'attribute float sz;uniform float dpr;varying vec3 vC;void main(){vC=color;gl_PointSize=sz*dpr;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float op;varying vec3 vC;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*14.0);gl_FragColor=vec4(vC*a*op,1.0);}'});
  var pts=new THREE.Points(gg,m);pts.frustumCulled=false;pts.renderOrder=-9;SKYG.add(pts);SKYG.faint=pts;
}
function loadRealSky(){
  var L=new THREE.TextureLoader(),an=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  L.load('tex/sun.jpg',function(t){t.encoding=THREE.sRGBEncoding;t.anisotropy=an;REALSUN=t;BODIES.forEach(function(b){if(b.sunU&&b.sunU.sT){b.sunU.sT.value=t;b.sunU.sK.value=.55;}});},undefined,function(){});
  if(SKYG&&SKYG.mw)L.load('tex/milkyway.jpg',function(t){t.encoding=THREE.sRGBEncoding;t.anisotropy=an;var m=SKYG.mw.material;if(m.map)m.map.dispose();m.map=t;m.opacity=1;m.needsUpdate=true;buildFaintStars(t.image);},undefined,function(){});
  L.load('tex/earth-clouds.jpg',function(t){t.wrapS=THREE.RepeatWrapping;t.anisotropy=an;
    try{var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');g.drawImage(t.image,0,0,512,256);var d=g.getImageData(0,0,512,256).data,a=new Uint8Array(512*256);for(var i=0;i<a.length;i++)a[i]=d[i*4];WX.R=a;}catch(e){WX.R=null;}
    WX.RK=WX.R?.62:0;if(WX.u){WX.u.rT.value=t;WX.u.rK.value=.62;}},undefined,function(){});
}
function loadRealEarth(){
  var e=byId.earth;if(!e||!e.mesh||!e.mesh.material.uniforms)return;var u=e.mesh.material.uniforms,L=new THREE.TextureLoader(),got={};
  function done(){if(got.day&&got.water){u.dayT.value=got.day;u.waterT.value=got.water;u.useReal.value=1;}}
  function ld(f,k,cb){L.load('tex/'+f,function(t){t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());got[k]=t;cb(t);},undefined,function(){});}
  ld('earth-day.jpg','day',done);ld('earth-water.png','water',done);
  ld('earth-night.jpg','night',function(t){u.nightT.value=t;});
  ld('earth-topo.png','topo',function(t){u.topoT.value=t;u.bumpK.value=5;});
}
/* ---------- ses (isteğe bağlı, sentez) ---------- */
var AUD={ctx:null,on:false,prof:null,tick:null};
var SND={
  sun:{f:38,lp:260,nf:150,nt:'lowpass',ng:.55,ch:'thump',rate:.35},
  mercury:{f:62,lp:260,nf:200,nt:'lowpass',ng:.02,ch:null,rate:0},
  venus:{f:48,lp:380,nf:380,nt:'lowpass',ng:.4,ch:null,rate:0},
  earth:{f:65,lp:650,nf:900,nt:'bandpass',ng:.12,ch:'chorus',rate:1.1},
  moon:{f:60,lp:240,nf:200,nt:'lowpass',ng:.01,ch:null,rate:0},
  mars:{f:55,lp:480,nf:620,nt:'bandpass',ng:.22,ch:null,rate:0},
  jupiter:{f:36,lp:360,nf:320,nt:'bandpass',ng:.28,ch:'radio',rate:.9},
  saturn:{f:41,lp:480,nf:420,nt:'bandpass',ng:.14,ch:'saturn',rate:.45},
  uranus:{f:46,lp:560,nf:700,nt:'bandpass',ng:.18,ch:'whistle',rate:.3},
  neptune:{f:49,lp:600,nf:760,nt:'bandpass',ng:.24,ch:'whistle',rate:.4},
  comet:{f:72,lp:900,nf:2000,nt:'highpass',ng:.05,ch:'sparkle',rate:1.4},
  def:{f:52,lp:420,nf:400,nt:'lowpass',ng:.06,ch:null,rate:0}
};
function audNoise(ctx){var n=ctx.sampleRate*4,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0),last=0;for(var i=0;i<n;i++){var w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.5;}return b;}
function audStart(){
  if(AUD.ctx){AUD.ctx.resume();return;}
  var C=window.AudioContext||window.webkitAudioContext;if(!C){toast('Bu tarayıcı sesi desteklemiyor');return false;}
  var ctx=new C();AUD.ctx=ctx;
  var comp=ctx.createDynamicsCompressor();comp.connect(ctx.destination);
  var master=ctx.createGain();master.gain.value=0;master.connect(comp);AUD.master=master;
  var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=400;lp.Q.value=.7;lp.connect(master);AUD.lp=lp;
  var lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.07;lg.gain.value=120;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();
  AUD.osc=[];[[1,'sine',.22,0],[1.5,'triangle',.07,4],[2,'sine',.09,-6],[.5,'sine',.16,2]].forEach(function(a){var o=ctx.createOscillator(),g=ctx.createGain();o.type=a[1];o.detune.value=a[3];g.gain.value=a[2];o.connect(g);g.connect(lp);o.start();AUD.osc.push([o,a[0]]);});
  var ns=ctx.createBufferSource();ns.buffer=audNoise(ctx);ns.loop=true;var nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=300;var ng=ctx.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(master);ns.start();AUD.nf=nf;AUD.ng=ng;
  var nlfo=ctx.createOscillator(),nlg=ctx.createGain();nlfo.frequency.value=.13;nlg.gain.value=.05;nlfo.connect(nlg);nlg.connect(ng.gain);nlfo.start();
  AUD.tick=setInterval(audTick,250);
  return true;
}
function audProfile(){
  if(!focus)return SND.def;var d=focus.def;if(d.comet)return SND.comet;if(d.star)return SND.sun;return SND[d.id]||SND.def;
}
function audApply(){
  if(!AUD.ctx||!AUD.on)return;var p=audProfile(),t=AUD.ctx.currentTime;if(p===AUD.prof)return;AUD.prof=p;
  var T=SUN_TYPES[sunType]||SUN_TYPES[0];
  AUD.osc.forEach(function(o){o[0].frequency.setTargetAtTime(p.f*o[1],t,.8);});
  AUD.lp.frequency.setTargetAtTime(p.lp,t,.8);
  AUD.nf.type=p.nt;AUD.nf.frequency.setTargetAtTime(p.nf,t,.8);
  AUD.ng.gain.setTargetAtTime(p.ng*.6,t,.8);
}
function audEnv(node,t,a,peak,rel){var g=AUD.ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+rel);node.connect(g);g.connect(AUD.master);return g;}
function audChirp(kind){
  var ctx=AUD.ctx,t=ctx.currentTime+.02,o,b,f;
  if(kind==='chorus'){o=ctx.createOscillator();o.type='sine';var f0=500+Math.random()*700;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*(2+Math.random()*1.5),t+.18+Math.random()*.2);audEnv(o,t,.03,.035,.35);o.start(t);o.stop(t+.7);}
  else if(kind==='saturn'){o=ctx.createOscillator();o.type='sine';f=700+Math.random()*500;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.35,t+1.6);audEnv(o,t,.2,.03,1.6);o.start(t);o.stop(t+2.2);}
  else if(kind==='whistle'){o=ctx.createOscillator();o.type='sine';f=1200+Math.random()*900;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.55,t+.9);audEnv(o,t,.05,.02,1);o.start(t);o.stop(t+1.3);}
  else if(kind==='radio'||kind==='sparkle'||kind==='crackle'||kind==='whoosh'){
    b=ctx.createBufferSource();b.buffer=AUD.nb||(AUD.nb=audNoise(ctx));var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=kind==='sparkle'?8:2;
    var fq=kind==='radio'?300+Math.random()*900:kind==='sparkle'?3000+Math.random()*3000:kind==='crackle'?1800:200;
    bp.frequency.setValueAtTime(fq,t);bp.frequency.exponentialRampToValueAtTime(fq*(kind==='whoosh'?6:kind==='radio'?2.4:1.2),t+(kind==='whoosh'?2:.5));
    b.connect(bp);audEnv(bp,t,kind==='whoosh'?.8:.02,kind==='whoosh'?.5:kind==='crackle'?.25:kind==='radio'?.18:.05,kind==='whoosh'?1.8:kind==='crackle'?.08:.45);
    b.start(t,Math.random()*3);b.stop(t+3);
  }
  else if(kind==='gw'){o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(35,t);o.frequency.exponentialRampToValueAtTime(280,t+1.2);o.frequency.exponentialRampToValueAtTime(55,t+1.6);audEnv(o,t,.5,.22,1.8);o.start(t);o.stop(t+2.2);}
  else if(kind==='thump'){o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(30,t+.8);audEnv(o,t,.05,.18,1);o.start(t);o.stop(t+1.3);}
}
function audTick(){
  if(!AUD.on||!AUD.ctx||document.hidden)return;
  audApply();var p=AUD.prof||SND.def;
  if(p.ch&&Math.random()<p.rate*.25)audChirp(p.ch);
  if(focus&&(focus.def.id==='jupiter'||focus.def.id==='saturn')&&Math.random()<.06)audChirp('crackle');
  if(focus&&focus.def.id==='mars'&&typeof marsDust==='function'){var md=marsDust();AUD.ng.gain.setTargetAtTime(.13+(md.reg+md.glob)*.5,AUD.ctx.currentTime,1);}
}
function audWhoosh(){if(AUD.on&&AUD.ctx)audChirp('whoosh');}
function setSound(on){
  if(on){if(audStart()===false)return;AUD.on=true;AUD.prof=null;audApply();AUD.master.gain.setTargetAtTime(.5,AUD.ctx.currentTime,.6);}
  else{AUD.on=false;if(AUD.ctx)AUD.master.gain.setTargetAtTime(0,AUD.ctx.currentTime,.3);}
  $('tSnd').setAttribute('aria-pressed',String(on));$('tSnd').classList.toggle('on',on);
  toast(on?'Ses açık':'Ses kapalı',1400);
}
$('tSnd').addEventListener('click',function(){setSound(!AUD.on);});
document.addEventListener('visibilitychange',function(){if(!AUD.ctx)return;if(document.hidden)AUD.ctx.suspend();else if(AUD.on)AUD.ctx.resume();});

/* ---------- gerçek konumlar: astronomy-engine (VSOP87 / NOVAS) ---------- */
var AE=window.Astronomy||null;
var AE_BODY={mercury:'Mercury',venus:'Venus',earth:'Earth',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
var aeV=new THREE.Vector3();
function aeDate(days){return new Date(J2000+days*86400000);}
function aeEcl(id,days){
  if(id==='pluto'){var yr=2000+days/365.25;if(yr<60||yr>3940)return null;}
  try{var v=AE.HelioVector(AE.Body[AE_BODY[id]],aeDate(days)),e=AE.Ecliptic(v).vec;return aeV.set(e.x,e.y,e.z);}catch(err){return null;}
}
function aeMoon(days){try{var v=AE.GeoMoon(aeDate(days)),e=AE.Ecliptic(v).vec;return aeV.set(e.x,e.y,e.z);}catch(err){return null;}}
function realOk(b){return AE&&!b.def.custom&&(AE_BODY[b.def.id]||b.def.id==='moon')&&!(b.parent&&b.parent.def.custom);}
function toScene(e,out){var r=e.length(),R=orbitR(r)/r;return out.set(e.x*R,e.z*R,-e.y*R);}
function placeReal(b){
  var d=b.def;
  if(d.id==='moon'){
    var m=aeMoon(b.tday);if(!m)return false;var L=m.length(),R=moonVisR(b)/L;b.pivot.position.set(m.x*R,m.z*R,-m.y*R);b.ang=Math.atan2(m.y,m.x);b.moonKm=L*149597870.7;return true;
  }
  var e=aeEcl(d.id,b.tday);if(!e)return false;
  b.au=b.au||new THREE.Vector3();b.au.copy(e);toScene(e,b.pivot.position);b.ang=Math.atan2(e.y,e.x);return true;
}
function realOrbitLine(b){
  if(!realOk(b)||!b.line)return;
  var d=b.def,N=d.id==='pluto'||d.id==='neptune'?360:256,P=d.id==='moon'?27.32:d.P,pts=[],t0=simDays;
  for(var k=0;k<=N;k++){
    var e=d.id==='moon'?aeMoon(t0+k/N*P):aeEcl(d.id,t0+k/N*P);if(!e)return;
    if(d.id==='moon'){var L=e.length(),R=d.orbit/L;pts.push(new THREE.Vector3(e.x*R,e.z*R,-e.y*R));}
    else pts.push(toScene(e,new THREE.Vector3()));
  }
  b.line.geometry.dispose();b.line.geometry=new THREE.BufferGeometry().setFromPoints(pts);b.line.rotation.set(0,0,0);
}
function earthSidereal(days){try{return AE.SiderealTime(aeDate(days))/24*TAU;}catch(e){return null;}}
function setTiltRot(b,deg){if(b.def.id==='earth'){b.tilt.rotation.set(-deg*D2R,0,0);}else b.tilt.rotation.set(0,0,deg*D2R);}
function initReal(){
  if(!AE)return;
  BODIES.forEach(function(b){b.tday=simDays;if(realOk(b)){placeReal(b);realOrbitLine(b);}});
  var e=byId.earth;if(e)setTiltRot(e,e.mod.tilt);
}
function resyncReal(){BODIES.forEach(function(b){b.tday=simDays;});}
var ECL_KIND={total:'tam',annular:'halkalı',partial:'parçalı',hybrid:'hibrit',penumbral:'yarı gölge'};
function realEclipse(lunar){
  if(!AE)return null;
  try{var r=lunar?AE.SearchLunarEclipse(aeDate(simDays+.05)):AE.SearchGlobalSolarEclipse(aeDate(simDays+.05));
    return {days:(r.peak.date.getTime()-J2000)/86400000,kind:r.kind,lat:r.latitude,lon:r.longitude,date:r.peak.date};}catch(e){return null;}
}

/* ---------- uzay araçları ---------- */
function dJ(s){var p=s.split('-');return (Date.UTC(+p[0],+p[1]-1,+p[2])-J2000)/86400000;}
var CRAFT_DEFS=[
 {id:'voyager1',name:'Voyager 1',model:'voyager',col:'#ffd27a',wp:[['1977-09-05','earth'],['1979-03-05','jupiter'],['1980-11-12','saturn'],['2024-01-01',[259.5,35,162.4]]],v:3.57,tour:5,
  desc:'1977\'de fırlatıldı; Jüpiter ve Satürn\'ün yanından geçti. 2012\'de güneş rüzgârının etki alanından (heliosfer) çıkan ve yıldızlararası uzaya ulaşan ilk insan yapımı cisim oldu. Üzerinde Dünya\'nın seslerini taşıyan Altın Plak var.',
  stats:[['Fırlatma','5 Eylül 1977'],['Jüpiter','5 Mart 1979'],['Satürn','12 Kasım 1980'],['Yıldızlararası uzay','25 Ağustos 2012'],['Hız','~17 km/sn']]},
 {id:'voyager2',name:'Voyager 2',model:'voyager',col:'#ffc061',wp:[['1977-08-20','earth'],['1979-07-09','jupiter'],['1981-08-25','saturn'],['1986-01-24','uranus'],['1989-08-25','neptune'],['2024-01-01',[290.5,-35,135.8]]],v:3.25,tour:5,
  desc:'Dört dev gezegenin dördünü de ziyaret eden tek araç: "Büyük Tur". Uranüs ve Neptün\'ü yakından gören tek uzay aracıdır. 2018\'de yıldızlararası uzaya geçti.',
  stats:[['Fırlatma','20 Ağustos 1977'],['Jüpiter','9 Temmuz 1979'],['Satürn','25 Ağustos 1981'],['Uranüs','24 Ocak 1986'],['Neptün','25 Ağustos 1989']]},
 {id:'newhorizons',name:'New Horizons',model:'nh',col:'#d8e6ff',wp:[['2006-01-19','earth'],['2007-02-28','jupiter'],['2015-07-14','pluto'],['2024-01-01',[283.2,2,58.6]]],v:2.95,tour:5,
  desc:'Plüton\'u yakından gören ilk araç (2015): kalp biçimli Tombaugh bölgesini fotoğrafladı. 2019\'da Kuiper Kuşağı cismi Arrokoth\'un yanından geçti; bu, bugüne kadar ziyaret edilen en uzak cisim.',
  stats:[['Fırlatma','19 Ocak 2006'],['Jüpiter','28 Şubat 2007'],['Plüton','14 Temmuz 2015'],['Arrokoth','1 Ocak 2019']]},
 {id:'cassini',name:'Cassini',model:'cassini',col:'#ffe0a0',wp:[['1997-10-15','earth'],['1998-04-26','venus'],['1999-06-24','venus'],['1999-08-18','earth'],['2000-12-30','jupiter'],['2004-07-01','saturn',1]],end:'2017-09-15',tour:5,
  desc:'13 yıl boyunca Satürn\'ün yörüngesinde dolaştı. Huygens sondasını Titan\'a indirdi (2005), Enceladus\'tan fışkıran su gayzerlerini keşfetti. 2017\'de bilerek Satürn\'ün atmosferine dalarak görevini bitirdi.',
  stats:[['Fırlatma','15 Ekim 1997'],['Satürn yörüngesi','1 Temmuz 2004'],['Huygens Titan\'a iniş','14 Ocak 2005'],['Görev sonu','15 Eylül 2017']]},
 {id:'juno',name:'Juno',model:'juno',col:'#a8c8ff',wp:[['2011-08-05','earth'],['2012-08-30',{dlon:170,r:2.3}],['2013-10-09','earth'],['2016-07-04','jupiter',1]],tour:4,
  desc:'Güneş enerjisiyle çalışan, Jüpiter\'e kadar giden ilk araç. 2016\'dan beri Jüpiter\'in kutuplarının üzerinden geçen uzun yörüngelerde dolaşıyor; dev gezegenin iç yapısını ve kutup ışıklarını inceliyor.',
  stats:[['Fırlatma','5 Ağustos 2011'],['Dünya geçişi','9 Ekim 2013'],['Jüpiter yörüngesi','4 Temmuz 2016']]},
 {id:'parker',name:'Parker Güneş Sondası',model:'parker',col:'#fff1c8',special:'parker',start:'2018-08-12',tour:3,
  desc:'Güneş\'e en çok yaklaşan insan yapımı cisim: 24 Aralık 2024\'te yüzeyinin yaklaşık 6,1 milyon km yakınından, saatte 690.000 km hızla geçti. Isı kalkanı 1.000 °C\'ye dayanıyor. Bu modelde yörüngesinin yönü yaklaşıktır.',
  stats:[['Fırlatma','12 Ağustos 2018'],['En yakın geçiş','24 Aralık 2024'],['Uzaklık','0,046 AU'],['Hız','~192 km/sn']]},
 {id:'jwst',name:'James Webb Teleskobu',model:'jwst',col:'#ffd890',special:'l2',start:'2021-12-25',tour:3,
  desc:'Kızılötesinde gözlem yapan dev uzay teleskobu. Dünya\'dan 1,5 milyon km uzaktaki L2 noktasında, Dünya ile birlikte Güneş\'in çevresinde döner. Tenis kortu büyüklüğündeki güneş kalkanı aynayı −230 °C\'de tutar.',
  stats:[['Fırlatma','25 Aralık 2021'],['L2\'ye varış','24 Ocak 2022'],['Ayna','6,5 m, 18 altıgen'],['Dünya\'ya uzaklık','1,5 milyon km']]},
 {id:'iss',name:'Uluslararası Uzay İstasyonu',model:'iss',col:'#ffffff',special:'iss',start:'1998-11-20',tour:1,
  desc:'1998\'den beri inşa edilen ve 2000\'den beri kesintisiz insan yaşayan istasyon. 400 km yükseklikte, 92 dakikada bir Dünya\'nın çevresini dolaşır; geceleri çıplak gözle görülebilir. Bu modelde boyutu büyütülmüştür ve yörüngesi şematiktir: istasyonun o anki gerçek konumu gösterilmez.',
  stats:[['İlk modül','20 Kasım 1998'],['Yükseklik','~400 km'],['Tur süresi','92 dakika'],['Hız','27.600 km/sa']]}
];
var CRAFT=[];
function craftMat(c,m,r){return new THREE.MeshStandardMaterial({color:c,metalness:m||0,roughness:r==null?.6:r});}
function craftModel(kind){
  var g=new THREE.Group(),gold=craftMat(0xd8a84a,.85,.35),white=craftMat(0xe8e8e8,.1,.5),dark=craftMat(0x2b3550,.4,.5),panel=craftMat(0x1d3a7a,.5,.3);
  function box(w,h,d,m,x,y,z){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x||0,y||0,z||0);g.add(o);return o;}
  function cyl(r1,r2,h,m,seg,x,y,z,rx,rz){var o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg||20),m);o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,0,rz||0);g.add(o);return o;}
  if(kind==='voyager'||kind==='nh'||kind==='cassini'){
    cyl(kind==='nh'?.07:.11,kind==='nh'?.04:.06,.025,white,24,0,.05,0);
    box(.07,.04,.07,gold,0,0,0);
    if(kind!=='nh'){cyl(.004,.004,.32,dark,6,.16,0,0,0,Math.PI/2);cyl(.003,.003,.2,dark,6,-.1,0,.05,0,Math.PI/2.4);}
    else cyl(.012,.012,.08,dark,8,-.06,0,0,0,Math.PI/2);
    if(kind==='cassini'){cyl(.035,.035,.14,gold,14,0,-.07,0);}
  }else if(kind==='juno'){
    box(.05,.04,.05,white,0,0,0);
    for(var i=0;i<3;i++){var p=box(.26,.004,.045,panel);var a=i*TAU/3;p.position.set(Math.cos(a)*.15,0,Math.sin(a)*.15);p.rotation.y=-a;}
  }else if(kind==='parker'){
    cyl(.09,.09,.012,white,24,0,.06,0);box(.04,.08,.04,gold,0,0,0);box(.12,.003,.03,panel,0,-.02,0);
  }else if(kind==='jwst'){
    var sh=box(.26,.004,.15,craftMat(0xcbb6d8,.7,.3),0,-.03,0);
    var mir=cyl(.07,.07,.008,gold,6,0,.04,0,Math.PI/2.6,0);
  }else if(kind==='iss'){
    box(.34,.012,.012,white,0,0,0);box(.03,.03,.11,white,0,0,0);
    [-.15,-.1,.1,.15].forEach(function(x){box(.035,.002,.16,panel,x,0,0);});
  }
  return g;
}
function craftWP(c){
  var out=[],prev=null;
  c.wp.forEach(function(w){
    var t=dJ(w[0]),v;
    if(typeof w[1]==='string'){var e=aeEcl(w[1],t);v=e?e.clone():new THREE.Vector3(1,0,0);}
    else if(Array.isArray(w[1])){var L=w[1][0]*D2R,B=w[1][1]*D2R,R=w[1][2];v=new THREE.Vector3(R*Math.cos(B)*Math.cos(L),R*Math.cos(B)*Math.sin(L),R*Math.sin(B));}
    else{var pl=Math.atan2(prev.v.y,prev.v.x)+w[1].dlon*D2R;v=new THREE.Vector3(w[1].r*Math.cos(pl),w[1].r*Math.sin(pl),0);}
    var o={t:t,v:v,body:typeof w[1]==='string'?w[1]:null,orbit:!!w[2]};out.push(o);prev=o;
  });
  return out;
}
var cv1=new THREE.Vector3();
function craftAU(c,t){
  var W=c.W;if(!W||t<W[0].t)return null;
  for(var i=0;i<W.length-1;i++){
    var a=W[i],b=W[i+1];if(t>b.t)continue;
    var f=(t-a.t)/(b.t-a.t),ra=a.v.length(),rb=b.v.length(),la=Math.atan2(a.v.y,a.v.x),lb=Math.atan2(b.v.y,b.v.x),dl=lb-la;
    while(dl<0)dl+=TAU;if(b.orbit===false&&a.body&&b.body===a.body)dl+=TAU;
    var ba=Math.asin(a.v.z/ra),bb=Math.asin(b.v.z/rb),fe=f*f*(3-2*f);
    var r=ra+(rb-ra)*(.35*f+.65*fe),l=la+dl*f,B=ba+(bb-ba)*f;
    return cv1.set(r*Math.cos(B)*Math.cos(l),r*Math.cos(B)*Math.sin(l),r*Math.sin(B));
  }
  var L=W[W.length-1];if(L.orbit)return null;
  return cv1.copy(L.v).addScaledVector(L.v.clone().normalize(),c.v*(t-L.t)/365.25);
}
function parkerAU(t){
  var t0=dJ('2018-11-05'),tf=dJ('2024-12-24');if(t<dJ('2018-08-12'))return null;
  var q,P,Tp;
  if(t<t0){var f=(t-dJ('2018-08-12'))/(t0-dJ('2018-08-12'));var e=aeEcl('earth',dJ('2018-08-12'));var r=1-f*.83;var l=Math.atan2(e.y,e.x)+f*1.4;return cv1.set(r*Math.cos(l),r*Math.sin(l),0);}
  if(t<tf){var g=(t-t0)/(tf-t0);q=.166-(.166-.0459)*g;P=150-(150-88)*g;Tp=t0;}else{q=.0459;P=88;Tp=tf;}
  var Q=.73,a=(q+Q)/2,e2=(Q-q)/(Q+q),M=((t-Tp)/P%1)*TAU,E=M;for(var i=0;i<8;i++)E=M+e2*Math.sin(E);
  var x=a*(Math.cos(E)-e2),y=a*Math.sqrt(1-e2*e2)*Math.sin(E);return cv1.set(x,y,0);
}
function addCraft(){
  if(!AE)return;
  CRAFT_DEFS.forEach(function(c){
    var def={id:c.id,name:c.name,kind:'Uzay aracı',craft:true,minor:true,vr:.12,tex:'smallMoon',tw:64,rotH:1e6,tilt:0,dot:[c.col,'#555'],desc:c.desc,stats:c.stats.concat([['Ekranda','Görünsün diye çok büyütüldü (gerçekte metrelerle ölçülür)']])};
    if(c.special==='iss'){def.parent='earth';def.orbit=byId.earth.def.vr*1.07;def.P=92.7/1440;def.incl=51.6;def.kind='Uzay istasyonu · Dünya yörüngesi';}
    var b=buildBody(def);b.mesh.visible=false;b.craftC=c;if(b.atmoMesh)b.atmoMesh.visible=false;
    var m=craftModel(c.model);b.tilt.add(m);b.model=m;
    if(c.wp)c.W=craftWP(c);
    c.t0=c.wp?c.W[0].t:dJ(c.start);c.t1=c.end?dJ(c.end):Infinity;
    if(c.wp||c.special==='parker'){
      var pts=[],a=c.t0,z=Math.min(c.t1,simDays+365*3),lastT=c.wp?c.W[c.W.length-1]:null,stopT=(lastT&&lastT.orbit)?lastT.t:z,N=700;
      for(var k=0;k<=N;k++){var tt=a+(stopT-a)*k/N,v=c.special==='parker'?parkerAU(tt):craftAU(c,tt);if(v)pts.push(toScene(v,new THREE.Vector3()));}
      if(b.line&&b.line.parent)b.line.parent.remove(b.line);
      var ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:new THREE.Color(c.col),transparent:true,opacity:.4,depthWrite:false}));
      ln.frustumCulled=false;scene.add(ln);b.line=ln;
    }
    CRAFT.push(b);
  });
}
function placeCraft(b){
  var c=b.craftC,t=simDays,act=t>=c.t0&&t<=c.t1&&!b.sysHide;b.inactive=!act;b.pivot.visible=act&&mode!=='surface';
  if(b.model)b.model.visible=focus===b||camera.position.distanceTo(b.pos)<(c.special==='iss'?3:5);
  if(!act)return;
  if(c.special==='iss')return;
  if(c.special==='l2'){
    var e=byId.earth;if(!e)return;var ta=dJ('2022-01-24'),f=clamp((t-c.t0)/(ta-c.t0),0,1),dir=e.pivot.position.clone().normalize();
    b.pivot.position.copy(e.pivot.position).addScaledVector(dir,effVr(e)*(1.3+5*Math.sqrt(f)));return;
  }
  var v=c.special==='parker'?parkerAU(t):craftAU(c,t);
  if(v){b.au=b.au||new THREE.Vector3();b.au.copy(v);toScene(v,b.pivot.position);
    var mdl=b.model;if(mdl){var sp=b.pivot.position;mdl.lookAt(0,0,0);}
    return;}
  var L=c.W[c.W.length-1],pl=byId[L.body];if(!pl)return;
  var ang=(t-L.t)*TAU/(c.id==='juno'?53:20),R=effVr(pl)*(c.id==='juno'?3.2:4.5);
  b.pivot.position.copy(pl.pivot.position).add(new THREE.Vector3(Math.cos(ang)*R,Math.sin(ang*1.3)*R*.25,-Math.sin(ang)*R));
  b.au=null;
}
function craftStatus(b){
  var c=b.craftC,t=simDays,ds=function(x){return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(J2000+x*86400000));};
  if(t<c.t0)return 'Henüz fırlatılmadı ('+ds(c.t0)+')';
  if(t>c.t1)return 'Görev sona erdi ('+ds(c.t1)+')';
  if(c.wp){for(var i=1;i<c.W.length;i++){if(t<c.W[i].t){var nb=c.W[i].body&&byId[c.W[i].body];return nb?nb.def.name+' yolunda':'Yolda';}}var L=c.W[c.W.length-1];return L.orbit?(byId[L.body].def.name+' yörüngesinde'):'Güneş Sistemi\'nden uzaklaşıyor';}
  if(c.special==='l2')return t<dJ('2022-01-24')?'L2 noktasına gidiyor':'L2 noktasında gözlem yapıyor';
  if(c.special==='parker')return 'Güneş\'in çevresinde, giderek yaklaşan yörüngede';
  return 'Dünya yörüngesinde';
}
function startTour(){
  var b=focus;if(!b||!b.craftC)return;var c=b.craftC,t=c.t0-2,j=t-simDays;
  if(gravityOn)setGravity(false);
  updateBodies(j);simDays+=j;wxT=simDays;BODIES.forEach(function(x){x.tday=simDays;});updateBodies(0);
  speedIdx=c.tour;speed.value=c.tour;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
  focusBody(b.def.id,{dist:c.special==='iss'?2:(c.special==='l2'?12:60*DS)});
  toast(b.def.name+' görev turu: tarih fırlatışa ('+new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(J2000+c.t0*864e5))+') alındı, hız '+SPEEDS[c.tour].t+'. Bugüne dönmek için “Şimdiye dön”.',7000);
}
$('craftTour').addEventListener('click',startTour);
