/* Celestia · Kare döngüsü: cisimlerin hareketi, etiketler, işaret noktaları.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- döngü ---------- */
function nearestSurface(){
  var best=1e9;
  BODIES.forEach(function(b){var d=camera.position.distanceTo(b.pos)-effVr(b);if(d<best)best=d;});
  /* gerçek ölçekte 10 km'lik bir cisme yaklaşabilmek için alt sınır daha küçük */
  return clamp(best,REAL?.04:.4,1500*DS);
}
var tp={x:0,z:0};
/* ek yıldızın Güneş'e göre yörünge dönemi Kepler'e göre toplam kütleden: P = 2π√(r³ / G(M☉+m)). Ölçek, Dünya'nın 365 günlük yılından.
   (Önceden kütleden bağımsız 2500 gündü: 100 Güneş kütleli kara delik de Güneş benzeri bir yıldız gibi yavaşça dönüyordu.) */
/* Uzaklık, sahnedeki yarıçapın karşılık geldiği AU'dan alınır (invOrbit): sıkıştırılmış ölçeklerde gezegenler de böyle çizilir, yani Satürn'ün
   çizildiği uzaklığa konan Güneş kütleli yıldız Satürn'ün yılının 1/√2'si kadar sürede döner. Eskiden sahne yarıçaplarının oranı kullanılıyordu:
   aynı yıldız Satürn'den altı kat hızlı dönüyordu. Gerçek ölçekte iki hesap aynıdır. */
function starP(b){var a=Math.max(.05,invOrbit(b.def.r||orbitR(1)));return 365.25*Math.pow(a,1.5)/Math.sqrt(Math.max(.05,sunMass)+Math.max(.01,stMass(b)));}
/* ortak kütle merkezi (barimerkez): Güneş ve ek yıldızlar onun etrafında döner. Ek yıldızın yörüngesi Güneş'e göre hesaplanır (göreli yörünge),
   sonra herkes kütle merkezi sabit kalacak şekilde kaydırılır: Güneş −Σmᵢrᵢ/M kadar, yıldızlar da aynı miktarda. 50 Güneş kütleli bir kara delik
   eklenince Güneş (gezegenleriyle birlikte) onun çevresinde büyük bir yörüngede dolanır; Güneş benzeri ikinci yıldızda ikisi de ortadaki noktanın etrafında döner. */
var _bs=new THREE.Vector3();
function baryStep(){
  if(SYS||!sunBody)return;
  if(sunBody.dart||BODIES.some(function(b){return b.dart&&b.dart.t===sunBody;}))return;
  var M=Math.max(.05,sunMass);_bs.set(0,0,0);var L=[];
  var so=sunBody.pivot.position;
  BODIES.forEach(function(b){if(!b.def.star||b===sunBody||isGone(b)||b.sysHide||b.parent)return;var m=stMass(b);
    /* fırlatılmakta olan yıldızın konumu mutlak: Güneş'e göre konumu kullanılır ki kütle merkezi sıçramasın */
    if(b.dart){_bs.x+=(b.pivot.position.x-so.x)*m;_bs.y+=(b.pivot.position.y-so.y)*m;_bs.z+=(b.pivot.position.z-so.z)*m;}else{_bs.addScaledVector(b.pivot.position,m);L.push(b);}M+=m;});
  _bs.multiplyScalar(-1/M);
  sunBody.pivot.position.copy(_bs);L.forEach(function(b){b.pivot.position.add(_bs);});
}
function sysCOM(out){var M=Math.max(.05,sunMass);out.set(0,0,0);BODIES.forEach(function(b){if(!b.def.star||b===sunBody||isGone(b)||b.sysHide||b.dart)return;var m=stMass(b);out.addScaledVector(b.pos,m);M+=m;});return out.multiplyScalar(1/M);}
var _com=new THREE.Vector3();
function updateBodies(dDays){
  BODIES.forEach(function(b){
    var d=b.def;
    if(d.id!=='sun'){
      if(d.craft&&!d.parent){placeCraft(b);}
      else if(d.craft&&d.parent&&(placeCraft(b),false)){}
      else if(b.dart){}
      else if(d.comet){b.ang+=dDays*TAU/d.P*b.mod.orbit;cometPos(b.ang,tp,cmSetup(d));b.pivot.position.set(tp.x,0,tp.z);}
      else if(gravityOn&&b.grav){b.tday=(b.tday==null?simDays:b.tday)+dDays;}
      else if(realOk(b)&&b.mod.orbit===1&&!b.destroyed&&(b.tday=(b.tday==null?simDays:b.tday)+dDays,placeReal(b))){}
      else{
        if(realOk(b))b.tday=(b.tday==null?simDays:b.tday)+dDays*b.mod.orbit;
        var isM=b.parent&&d.orbit;b.ang+=dDays*TAU/((d.star?starP(b):d.P)*(isM?moonPScale(b):1))*b.mod.orbit;
        var r=isM?moonVisR(b):(d.r||d.orbit),inc=(d.incl||0)*D2R,sa=Math.sin(b.ang);
        b.pivot.position.set(Math.cos(b.ang)*r,sa*r*Math.sin(inc),-sa*r*Math.cos(inc));
      }
    }
    var lim=.07*Math.max(1,Math.abs(b.mod.spin*gSpin));
    var dr=clamp(dDays*24/d.rotH*TAU*b.mod.spin*gSpin,-lim,lim);
    /* Dünya gerçek yıldız zamanıyla döner. Uzaydan bakarken hızlı zamanda dönüş görsel olarak sınırlanır (titreşmesin diye);
       yüzeyden bakarken ise her hızda gerçek açıda tutulur, yoksa Güneş ve Ay gökyüzünde yanlış yerde doğup batıyordu */
    b.spinRot+=dr;if(d.id==='earth'&&AE&&b.mod.spin===1&&gSpin===1&&(SPEEDS[speedIdx].d<=1/24||(SURF&&SURF.b===b))){var gs=earthSidereal(simDays);if(gs!=null)b.spinRot=gs;}
    b.mesh.rotation.y=b.spinRot+(d.parent?b.ang:0);
    if(b.mod.lock&&!d.parent)applyLock(b);
    if(b.clouds)b.clouds.rotation.y=b.def.id==='earth'?b.mesh.rotation.y:b.spinRot*1.06;
  });
  baryStep();
  if(gravityOn)stepGravity(dDays);
  debStep(dDays);
  updateDebrisRings(dDays);
  updateBelts(dDays,SIMDT);
}
var tmpQ=new THREE.Quaternion();
function updateShadows(){
  BODIES.forEach(function(b){b.pivot.getWorldPosition(b.pos);});
  BODIES.forEach(function(b){
    var U=b.shU;if(!U)return;var arr=[];
    if(b.parent){arr.push(b.parent);BODIES.forEach(function(x){if(x.parent===b.parent&&x!==b)arr.push(x);});}
    else BODIES.forEach(function(x){if(x.parent===b)arr.push(x);});
    var n=Math.min(6,arr.length);
    var j=0;for(var i=0;i<n;i++){var x=arr[i],rr=effVr(x);
      /* Ay–Dünya gölgesi: sahnede boyutlar büyütüldüğü için gölge her dolunayda Ay'ı kızartıyordu. Gerçek tutulma geometrisine göre
         (gölge ekseninden açı, Dünya'nın tam gölgesi ≈ 0,75°, Ay ≈ 0,27°) gölgenin Ay'ı ne kadar örttüğünü hesaplayıp ona göre yerleştiriyoruz */
      if(b.def.id==='moon'&&x.def.id==='earth'){var m=_v1.copy(b.pos).sub(x.pos),sdir=_v2.copy(x.pos).sub(sunBody.pos).normalize(),ls=Math.acos(clamp(sdir.dot(_v3.copy(m).normalize()),-1,1))*57.2958,u=(1.0225-ls)/.545;
        if(u<=0)continue;var Dp=m.clone().addScaledVector(sdir,-m.dot(sdir)).length(),Rm=effVr(b)*(b.surfK||1);rr=Dp-Rm+2*Rm*Math.min(u,1)+Math.max(0,u-1)*Rm;}
      U.occ.value[j].set(x.pos.x,x.pos.y,x.pos.z,rr);j++;}
    U.occN.value=j;
    if(b.def.ring){
      b.tilt.getWorldQuaternion(tmpQ);var sz=b.mod.size;
      U.ringC.value.copy(b.pos);U.ringN.value.set(0,1,0).applyQuaternion(tmpQ);U.ringR.value.set(b.def.vr*1.3*sz,b.def.vr*2.35*sz);U.ringOn.value=1;
      var R=b.ringShU;R.occ.value[0].set(b.pos.x,b.pos.y,b.pos.z,effVr(b));R.occN.value=1;
    }
  });
  BODIES.forEach(function(b){
    if(b.parent||(!b.grav&&!(b.def&&b.def.comet))||b.destroyed||b.sysHide)return;var sr=sunType===6?effVr(sunBody)*bhMassK()*.98:swallowR(b);
    var en=b.pos.length()<sr;
    if(en!==!!b.engulfed){
      b.engulfed=en;b.pivot.visible=!en;if(b.trailLine&&en)b.trailLine.visible=false;if(b.dockBtn)b.dockBtn.hidden=en;if(b.treeBtn)b.treeBtn.hidden=en;
      if(en){toast(b.def.name+(b.def.comet?' yıldızın içinde buharlaştı':' yıldız tarafından yutuldu'));if(focus===b||focus.parent===b)focusBody('sun',{dist:OVD()*.45});}
    }
  });
  BODIES.forEach(computeClimate);
  var ea=byId.earth;if(ea&&ea.shU&&ea.hab&&ea.cl)ea.shU.civ.value=clamp(habScore(ea)/50,0,1);
}
function updateCamera(dt){
  if(mode==='surface'&&SURF){updateSurfaceCam();return;}
  if(mode==='orbit'){
    focus.pivot.getWorldPosition(tmpV);
    /* genel görünümde (Güneş'e uzaktan bakarken) kamera ortak kütle merkezine bakar: ağır bir kara delik eklenince Güneş'in onun
       etrafında dolandığı görülür. Yakından bakınca Güneş ortada kalır. */
    /* fırlatma/birleşme sürerken kamera iki cismi birlikte çerçeveler: ortalarına bakar, aradaki mesafeye göre uzaklaşıp yakınlaşır.
       Önceden kamera hedefe sabitlenip diğer cisim çoğu zaman ekran dışında kalıyordu. Sürükleyince/yakınlaştırınca kullanıcıya bırakılır. */
    var DC=dartCam();if(DC){tmpV.copy(DC.c);var dd=Math.max(DC.r*2.4,minDist()*1.2);if(!trans){dist+=(dd-dist)*Math.min(1,dt*2.5);}}
    else if(focus===sunBody&&!SYS){sysCOM(_com);var cl=_com.length(),kc=cl>1e-3?ss(Math.max(cl*.8,effVr(sunBody)*6),cl*3,dist):0;if(kc>0)tmpV.lerp(_com,kc);}
    if(trans){
      trans.t=Math.min(1,trans.t+dt/1.5);var e=trans.t<.5?4*trans.t*trans.t*trans.t:1-Math.pow(-2*trans.t+2,3)/2;
      target.copy(trans.s).lerp(tmpV,e);dist=trans.d0+(trans.d1-trans.d0)*e;if(trans.t>=1)trans=null;
    }else target.copy(tmpV);
    var md=minDist();if(dist<md){dist+=(md-dist)*Math.min(1,dt*10);if(dist<md*.92)dist=md*.92;}
    camera.position.set(target.x+dist*Math.sin(phi)*Math.cos(theta),target.y+dist*Math.cos(phi),target.z+dist*Math.sin(phi)*Math.sin(theta));
    camera.lookAt(target);applyShake(dt);
  }else{
    camera.rotation.set(pitch,yaw,0,'YXZ');
    var sp=nearestSurface()*.9*((keys.ShiftLeft||keys.ShiftRight)?4:1);
    var f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),u=(keys.KeyE?1:0)-(keys.KeyQ?1:0);
    if(f)camera.translateZ(-f*sp*dt);if(s)camera.translateX(s*sp*dt);if(u)camera.translateY(u*sp*dt);
    BODIES.forEach(function(b){if(isGone(b)||b.def.craft||!b.pivot.visible)return;var r=solidR(b)*1.08,d=camera.position.distanceTo(b.pos);if(d<r&&d>1e-6)camera.position.sub(b.pos).multiplyScalar(r/d).add(b.pos);});
  }
}
var v3=new THREE.Vector3();
/* ayrıntı düzeyi: ekranda küçük görünen küreler az üçgenli geometriyle, pikselin altına düşenler hiç çizilmez
   (gerçek ölçekte gezegenlerin çoğu pikselden küçüktür; yerlerini işaret noktası gösterir) */
/* gerçek ölçek işaretleri: her cisim için ayrı sprite yerine tek bir nokta bulutu (tek çizim çağrısı) */
var MARK={n:0,cap:0,pts:null};
function markAdd(b){
  if(MARK.n>=MARK.cap){var cap=Math.max(64,MARK.cap*2),P=new Float32Array(cap*3),C=new Float32Array(cap*3),S=new Float32Array(cap);
    if(MARK.pts){P.set(MARK.P);C.set(MARK.C);S.set(MARK.S);MARK.pts.geometry.dispose();}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setAttribute('sz',new THREE.BufferAttribute(S,1));
    MARK.P=P;MARK.C=C;MARK.S=S;MARK.cap=cap;
    if(!MARK.pts){MARK.mat=new THREE.ShaderMaterial({uniforms:{uH:{value:400},map:{value:dotTex()}},transparent:true,depthWrite:false,depthTest:false,
        vertexShader:'attribute float sz;attribute vec3 color;uniform float uH;varying vec3 vC;void main(){vC=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=sz*uH;}',
        fragmentShader:'uniform sampler2D map;varying vec3 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);if(t.a<.02)discard;gl_FragColor=vec4(vC*t.rgb,t.a);}'});
      MARK.pts=new THREE.Points(g,MARK.mat);MARK.pts.frustumCulled=false;MARK.pts.renderOrder=6;scene.add(MARK.pts);}
    else MARK.pts.geometry=g;}
  var i=MARK.n++,c=b.markC||(b.markC=new THREE.Color((b.def.dot&&b.def.dot[0])||'#ffffff'));
  MARK.P[i*3]=b.pos.x;MARK.P[i*3+1]=b.pos.y;MARK.P[i*3+2]=b.pos.z;MARK.C[i*3]=c.r;MARK.C[i*3+1]=c.g;MARK.C[i*3+2]=c.b;MARK.S[i]=b.parent?.007:.011;
}
function markFlush(){
  if(!MARK.pts)return;var g=MARK.pts.geometry;g.setDrawRange(0,MARK.n);MARK.pts.visible=MARK.n>0;if(!MARK.n)return;
  ['position','color','sz'].forEach(function(k){g.attributes[k].needsUpdate=true;});
  renderer.getDrawingBufferSize(_mkV);MARK.mat.uniforms.uH.value=_mkV.y*.5;
}
var _mkV=new THREE.Vector2();
var LODG={};
function lodGeo(r,lo){var k=r.toFixed(4)+':'+lo;return LODG[k]||(LODG[k]=new THREE.SphereGeometry(r,lo?28:14,lo?18:10));}
function bodyLod(b,pr){
  if(!b.tilt||!b.mesh)return;
  var hide=pr<.3&&!b.glow1;
  if(b.lodHide!==hide){b.lodHide=hide;b.tilt.visible=!hide;}
  if(hide)return;
  var lv=pr<6?2:pr<45?1:0;if(b.lodLv===lv)return;
  [b.mesh,b.clouds,b.atmoMesh].forEach(function(m){if(!m||m.geometry.type!=='SphereGeometry')return;
    if(!m.geoHi)m.geoHi=m.geometry;
    m.geometry=lv===0?m.geoHi:lodGeo(m.geoHi.parameters.radius,lv===1);});
  b.lodLv=lv;
}
function updateLabels(){
  var sys=systemOf(focus),tanH=Math.tan(camera.fov*D2R/2),cands=[];
  MARK.n=0;
  BODIES.forEach(function(b){
    b.pivot.getWorldPosition(b.pos);
    var d=camera.position.distanceTo(b.pos),ev=effVr(b);
    b.picker.scale.setScalar(Math.max(b.mod.size*(b.typeScale||1),d*.022/b.def.vr));
    var pr=ev*(b.surfK||1)/(d*tanH)*H/2;
    var vis=showLabels&&(!b.parent||b.parent===sys||b===sys);
    v3.copy(b.pos).project(camera);
    var hide=!vis||isEngulfed(b)||b.inactive||(SURF&&b===SURF.b)||(SURF&&!NAKED[b.def.id]&&!(b.def.id==='uranus'&&!SURF.lp))||(b.def.minor&&b!==focus&&camera.position.distanceTo(b.pos)>45*DS)||v3.z>1||(pr>H*.45&&b===focus)||Math.abs(v3.x)>1.1||Math.abs(v3.y)>1.1;
    b.sx=(v3.x*.5+.5)*W;b.sy=(-v3.y*.5+.5)*H;b.pr=pr;bodyLod(b,pr);
    /* gerçek ölçekte cisimler çoğu zaman pikselden küçüktür: yerini sabit boyutlu küçük bir nokta gösterir, yaklaşınca gerçek küre görünür */
    if(REAL&&!b.def.craft&&!hide&&pr<2.5&&!b.destroyed&&!b.sysHide&&b.pivot.visible&&!(SURF&&b!==SURF.b&&!NAKED[b.def.id]))markAdd(b);
    if(hide){b.label.style.display='none';}
    else cands.push(b);
    if(b.line)b.line.visible=!SURF&&!b.destroyed&&!b.sysHide&&showOrbits&&(!b.parent||b.parent===sys)&&!(gravityOn&&b.grav)&&(!b.def.minor||b===focus);
    if(b.trailLine)b.trailLine.visible=gravityOn&&showOrbits&&!SURF;
    if(b.line){b.line.material.opacity=(b===focus||b===sys)&&!b.parent?.55:(b.parent?.35:.26);}
  });
  markFlush();
  // çakışma önleme: odak, güneş, gezegenler, uydular
  cands.sort(function(a,c){var pa=a===focus?0:a.id==='sun'?1:a.parent?3:2,pc=c===focus?0:c.id==='sun'?1:c.parent?3:2;return pa-pc||(c.pr-a.pr);});
  var placed=[];
  cands.forEach(function(b){
    var o=Math.min(b.pr,H*.4)+6,w=b.lw,x0=b.sx-w/2,y0=b.sy+o,x1=x0+w,y1=y0+18,ok=true;
    for(var i=0;i<placed.length;i++){var p=placed[i];if(x0<p[2]&&x1>p[0]&&y0<p[3]&&y1>p[1]){ok=false;break;}}
    if(!ok&&b!==focus){b.label.style.display='none';return;}
    placed.push([x0,y0,x1,y1]);
    b.label.style.display='';
    b.label.style.transform='translate('+b.sx.toFixed(1)+'px,'+b.sy.toFixed(1)+'px)';
    b.label.style.setProperty('--o',o+'px');
  });
}
var dateEl=$('date');
var dfmt=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',year:'numeric'});
var tfmt=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}),sfmt=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
function updateDate(){
  var ms=J2000+simDays*86400000,dt=new Date(ms);
  if(isNaN(dt.getTime())){dateEl.textContent='—';return;}
  dateEl.textContent=dfmt.format(dt)+(SPEEDS[speedIdx].d<=1.01?' '+(SPEEDS[speedIdx].d<.01?sfmt:tfmt).format(dt):'');
}

/* mini harita */
var mini=$('miniCv'),mg=mini.getContext('2d'),miniScale=1,miniDpr=1;
function setupMini(){miniDpr=Math.min(devicePixelRatio||1,2);mini.width=150*miniDpr;mini.height=150*miniDpr;}
function miniMaxR(){var m=30;BODIES.forEach(function(b){if(!b.parent&&b.def.r)m=Math.max(m,b.def.r);});return m*1.1;}
function drawMini(){
  if(!showMini||!mini.offsetParent)return;
  var S=150*miniDpr,c=S/2,maxR=miniMaxR();miniScale=(c-8*miniDpr)/maxR;
  mg.clearRect(0,0,S,S);
  mg.lineWidth=1;mg.strokeStyle='rgba(160,180,230,.2)';
  BODIES.forEach(function(b){if(b.parent||!b.def.r||b.sysHide||b.def.minor)return;mg.beginPath();mg.arc(c,c,b.def.r*miniScale,0,TAU);mg.stroke();});
  var sys=systemOf(focus);
  BODIES.forEach(function(b){
    if(b.parent||b.destroyed||b.inactive||b.sysHide||(b.def.minor&&b!==sys))return;
    var x=c+b.pos.x*miniScale,y=c+b.pos.z*miniScale,r=b.id==='sun'?4*miniDpr:(b===sys?3*miniDpr:2.4*miniDpr),out=Math.hypot(b.pos.x,b.pos.z)*miniScale>c-4*miniDpr;
    if(out&&b.id!=='sun'){if(b!==sys)return;var an=Math.atan2(b.pos.z,b.pos.x),rr=c-7*miniDpr;x=c+Math.cos(an)*rr;y=c+Math.sin(an)*rr;
      mg.save();mg.translate(x,y);mg.rotate(an);mg.fillStyle='#8fd0ff';mg.beginPath();mg.moveTo(5*miniDpr,0);mg.lineTo(-3*miniDpr,4*miniDpr);mg.lineTo(-3*miniDpr,-4*miniDpr);mg.closePath();mg.fill();mg.restore();return;}
    mg.fillStyle=b.def.dot[0];mg.beginPath();mg.arc(x,y,r,0,TAU);mg.fill();
    if(b===sys){mg.strokeStyle='#8fd0ff';mg.lineWidth=1.4*miniDpr;mg.beginPath();mg.arc(x,y,r+3.5*miniDpr,0,TAU);mg.stroke();
      mg.font='600 '+(9*miniDpr)+'px sans-serif';mg.fillStyle='#cfe8ff';mg.textAlign=x>c?'right':'left';mg.fillText(b.def.name,x+(x>c?-8:8)*miniDpr,y-6*miniDpr);}
  });
  // kamera
  var cx=c+camera.position.x*miniScale,cy=c+camera.position.z*miniScale;
  camera.getWorldDirection(v3);var a=Math.atan2(v3.z,v3.x);
  if(Math.hypot(camera.position.x,camera.position.z)*miniScale<c*1.6){
    mg.save();mg.translate(clamp(cx,6,S-6),clamp(cy,6,S-6));mg.rotate(a);mg.fillStyle='rgba(255,255,255,.85)';
    mg.beginPath();mg.moveTo(5*miniDpr,0);mg.lineTo(-3*miniDpr,3*miniDpr);mg.lineTo(-3*miniDpr,-3*miniDpr);mg.closePath();mg.fill();mg.restore();
  }
}
mini.addEventListener('click',function(e){
  var r=mini.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*150,my=(e.clientY-r.top)/r.height*150,best=null,bd=16;
  BODIES.forEach(function(b){
    if(b.parent)return;
    var x=75+b.pos.x*miniScale/miniDpr,y=75+b.pos.z*miniScale/miniDpr,d=Math.hypot(x-mx,y-my);
    if(d<bd){bd=d;best=b;}
  });
  if(best)focusBody(best.id);
});

var last=performance.now(),dateT=0,miniT=0;
var FRAME_DT=.016,SIMDT=0,SDT=0,TIMERS=[];
/* zamanla ilerleyen her animasyon (çöküş, fırlatma, TDE, süpernova…) bu saati kullanır: zaman durunca onlar da durur */
function after(s,fn){TIMERS.push({t:s,fn:fn});}
function stepTimers(dt){if(!TIMERS.length||dt<=0)return;var due=[];TIMERS=TIMERS.filter(function(T){T.t-=dt;if(T.t<=0){due.push(T.fn);return false;}return true;});due.forEach(function(f){try{f();}catch(e){console.error(e);}});}
/* bir alt sistemdeki hata döngüyü durdurmasın: sonraki kare en başta istenir, simülasyon ve çizim ayrı ayrı korunur.
   Aynı hata her karede tekrarlanırsa konsol dolmasın diye yalnızca ilki ve sonra seyrek aralıklarla yazılır */
var frameErrN=0;
function frameErr(where,e){frameErrN++;if(frameErrN===1||frameErrN%600===0)console.error('Kare hatası ('+where+', '+frameErrN+'. kez):',e);}
function frame(now){
  requestAnimationFrame(frame);
  var rdt=(now-last)/1000,dt=Math.min(.1,rdt);last=now;FRAME_DT=dt;SIMDT=playing&&!reverse?dt:0;SDT=playing?(reverse?-dt:dt):0;
  try{
  if(rdt<.5){perfEma+=(rdt-perfEma)*.05;perfT+=rdt;
    if(perfT>2){perfT=0;
      if(perfEma>.026&&curDpr>.75){curDpr=Math.max(.75,curDpr-.25);renderer.setPixelRatio(curDpr);renderer.setSize(W,H,false);}
      else if(perfEma<.0155&&curDpr<maxDpr){curDpr=Math.min(maxDpr,curDpr+.25);renderer.setPixelRatio(curDpr);renderer.setSize(W,H,false);}}}
  /* ağır çekim yalnızca zaman akarken tükenir: çarpışma anında duraklatılınca kaybolmasın */
  if(playing&&SLOWMO>0)SLOWMO-=dt;
  var dDays=playing?dt*SPEEDS[speedIdx].d*(reverse?-1:1)*(SLOWMO>0?.12:1):0;if(gravityOn){dDays=clamp(dDays,-7,7);gSlow+=(gSlowNext-gSlow)*(gSlowNext<gSlow?.5:.05);dDays*=gSlow;if(gSlowNext<.3&&performance.now()-slowWarned>8000){slowWarned=performance.now();toast('Çarpışma yaklaşıyor: zaman yavaşlatıldı');}gSlowNext=1;}simDays+=dDays;
  if(!wxT)wxT=simDays;wxT+=clamp(dDays,-15*dt,15*dt);
  updateBodies(dDays);timeline(dDays);if(SKYG){SKYG.position.copy(camera.position);
    /* gökyüzü küresi saydam olduğu için opak cisimlerden sonra çizilir; gerçek ölçekte cisimler küreden uzakta kalınca onları örtüyordu. Küre görüş uzaklığının sınırına büyütülür */
    if(REAL)SKYG.scale.setScalar(camera.far*.85/5200);}scene.updateMatrixWorld(true);
  updateSolarFx(now,SIMDT);updateFxList(SIMDT);updateExotic(SIMDT);stepDarts(SIMDT);stepTimers(SIMDT);updateStarWinds(SIMDT);tripDraw(dt);drawTDE(SDT);updateWeather();updatePlanetWx();updateEclipse();updateSkyLabels();
  BODIES.forEach(function(b){
    if(!b.glow1)return;var T=SUN_TYPES[b.starType];if(b.sunU)b.sunU.time.value=now*.001;
    if(b.def.id==='sun'&&!EXO.col&&!b.morphing){var tg=starTarget(),kt=Math.min(1,dt*1.8),rt=tg/Math.max(b.typeScale,1e-12);
      /* gerçek ölçekte yıldız ile kalıntısı arasında on binlerce kat fark var: doğrusal geçiş hedefe çok geç varır, oransal (logaritmik) geçiş birkaç saniyede oturur */
      if(REAL&&rt>0)b.typeScale*=Math.pow(rt,kt);else b.typeScale+=(tg-b.typeScale)*kt;b.tilt.scale.setScalar(b.mod.size*b.typeScale*(sunType===6&&!SYS?bhMassK():1));b.vr=effVr(b);}
    var gs=7.33*effVr(b)*T.gm;
    b.glow1.scale.setScalar(gs*(1+Math.sin(now*.0011)*.03));b.glow2.scale.setScalar(gs*2.9*(1+Math.sin(now*.0007+1)*.04));
  });
  updateShadows();updateCometFx();
  }catch(e){frameErr('simülasyon',e);}
  try{
  updateCamera(dt);
  /* yakın kırpma düzlemi kameranın bu karedeki konumuna göre: eskiden bir önceki konuma göre hesaplanıyordu, hızlı geçişte yüzey bir kare kesiliyordu */
  var nr=clamp(nearestSurface()*.25,REAL?.01:.1,4);/* eşik orantılı: sabit 0,02 eşiği, gerçek ölçekte 0,01–0,03 aralığındaki değişiklikleri yok sayıp cismi kırpma düzleminin arkasında bırakıyordu */
  if(Math.abs(nr-camera.near)>Math.min(.02,nr*.1)){camera.near=nr;camera.updateProjectionMatrix();}
  updateLabels();
  grTrack();
  liveT-=dt;if(liveT<=0){updateLive();grSample();liveT=.3;}
  dateT-=dt;if(dateT<=0){updateDate();dateT=.08;}
  miniT-=dt;if(miniT<=0){drawMini();miniT=.1;}
  renderFrame();
  }catch(e){frameErr('çizim',e);}
}
