/* Celestia · Yüzeyden bakış, şehirlerden gökyüzü, meteor yağmurları, gelgit kilidi ve ölçek yolculuğu.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ================= YÜZEYDEN BAKIŞ ================= */
var SURF=null,surfFov0=50;
var SKYCOL={earth:[110,170,255,1],mars:[214,170,120,.75],venus:[230,190,110,.97],titan:[225,150,70,.9],jupiter:[200,180,150,.6],saturn:[220,200,150,.55],uranus:[150,220,230,.6],neptune:[90,130,240,.6]};
function surfTargetBody(b){return b.parent||sunBody;}
function enterSurface(b){
  if(!b||b.def.star||b.def.craft||b.def.comet||isGone(b))return;
  if(mode==='free')setMode('orbit');
  var tb=surfTargetBody(b);scene.updateMatrixWorld(true);
  var c=new THREE.Vector3();b.mesh.getWorldPosition(c);var tw=new THREE.Vector3();tb.pivot.getWorldPosition(tw);
  var dw=tw.clone().sub(c).normalize(),inv=new THREE.Matrix4().copy(b.mesh.matrixWorld).invert(),dl=dw.clone().transformDirection(inv);
  var u=dl.clone().applyAxisAngle(new THREE.Vector3(0,1,0).cross(dl).normalize().lengthSq()>.1?new THREE.Vector3(0,1,0).cross(dl).normalize():new THREE.Vector3(1,0,0),-.55).normalize();
  SURF={b:b,u:u,yaw:0,pitch:.3,init:true};$('surfCity').hidden=b.def.id!=='earth';$('surfLP').hidden=b.def.id!=='earth';if(b.def.id==='earth'){$('surfCity').value=cityIdx;setCity(cityIdx);if(SPEEDS[speedIdx].d>1/24){speedIdx=1;speed.value=1;setSpeed();}}
  if(b.atmoMesh){SURF.atmoVis=b.atmoMesh.visible;b.atmoMesh.visible=false;}
  if(b.pwx)b.pwx.visible=false;
  surfFov0=camera.fov;mode='surface';trans=null;
  document.body.classList.add('surfmode');BODIES.forEach(function(x){if(x.line){x.lineVis0=x.line.visible;x.line.visible=false;}if(x.def.craft){x.craftVis0=x.pivot.visible;x.pivot.visible=false;}});BELTS.forEach(function(o){if(o.pts.parent===scene)o.pts.visible=false;});
  $('surfBar').hidden=false;$('surfName').textContent=b.def.name+' yüzeyinden'+(b.parent?' · '+b.parent.def.name+' gökyüzünde':'');
  $('side').classList.add('collapsed');
  toast(b.def.id==='earth'?'Şehirden gökyüzü: üstteki listeden şehir seç. Gerçek yıldızlar, gezegenler ve Ay o şehirden o an nasıl görünüyorsa öyle. Meteor yağmuru tarihlerinde gece kayan yıldızlar çoğalır.':'Yüzeydesin: sürükleyerek etrafa bak, tekerlek veya çimdikle yakınlaştır. Gezegen döndükçe gün doğar ve batar.',7000);
}
function exitSurface(silent){
  if(!SURF)return;var b=SURF.b;
  if(b.atmoMesh&&SURF.atmoVis!=null)b.atmoMesh.visible=SURF.atmoVis;if(b.pwx)b.pwx.visible=true;
  clearMeteors();cityClear();document.body.classList.remove('surfmode');BODIES.forEach(function(x){if(x.line&&x.lineVis0!=null){x.line.visible=x.lineVis0&&!isGone(x);x.lineVis0=null;}if(x.craftVis0!=null){x.pivot.visible=x.craftVis0;x.craftVis0=null;}});surfApparentOff();BELTS.forEach(function(o){if(o.pts.parent===scene)o.pts.visible=true;});SURF=null;camera.fov=surfFov0;camera.updateProjectionMatrix();camera.up.set(0,1,0);
  $('surfBar').hidden=true;$('skyTint').style.opacity=0;mode='free';setMode('orbit');
  if(!silent)focusBody(b.def.id);
}
var sV1=new THREE.Vector3(),sV2=new THREE.Vector3(),sV3=new THREE.Vector3(),sV4=new THREE.Vector3();
/* yüzeyden bakınca gök cisimleri gerçek açısal boyutlarında: Ay ve Güneş yarım derece, gezegenler yıldız gibi nokta.
   (Uzay görünümünde gezegenler görünsün diye büyütülmüştü; yerden bakınca bu büyütme Ay'ı dev gösteriyordu.) */
var NAKED={sun:1,moon:1,mercury:1,venus:1,mars:1,jupiter:1,saturn:1};
function surfApparent(ob){
  var pxA=camera.fov*D2R/Math.max(200,H),tmin=pxA*1.1;
  /* gerçek açısal boyut (yarım derece) geniş görüşte ekranda birkaç piksel kalıyor; göz bunu böyle algılamaz (Ay yanılsaması).
     Geniş açıda Güneş ve Ay büyütülür, yakınlaştırdıkça (görüş açısı ~20°'ye inince) gerçek boyutlarına döner */
  var MG=clamp(camera.fov/17,1,3);
  BODIES.forEach(function(x){if(x===ob||isGone(x)||(x.parent&&x.parent!==ob))return;if(x.parent===ob&&x.def.id!=='moon')return;
    var d=camera.position.distanceTo(x.pos),R=effVr(x);if(!(R>0)||!(d>0))return;
    var th=x===sunBody&&!SYS?.00465*MG/Math.max(.05,(ob.parent?ob.parent.def.a:ob.def.a)||1):x.def.id==='moon'&&ob.def.id==='earth'?.00452*MG:0;
    var s=Math.min(1,d*Math.tan(Math.max(th,tmin*(x.def.id==='venus'?1.4:x.def.id==='jupiter'?1.25:1)))/R);x.pivot.scale.setScalar(s);x.surfK=s;});
}
function surfApparentOff(){BODIES.forEach(function(x){if(x.surfK!=null){x.pivot.scale.set(1,1,1);x.surfK=null;}});}
function updateSurfaceCam(){
  var b=SURF.b;if(isGone(b)){exitSurface(true);return;}
  var c=sV1;b.mesh.getWorldPosition(c);
  var p=SURF.u.clone().multiplyScalar(b.def.vr*1.004);b.mesh.localToWorld(p);
  var up=sV2.copy(p).sub(c).normalize();
  var nAx=new THREE.Vector3(0,1,0).transformDirection(b.mesh.matrixWorld);
  var east=sV3.crossVectors(nAx,up);if(east.lengthSq()<1e-6)east.set(1,0,0);east.normalize();
  var north=sV4.crossVectors(up,east).normalize();
  if(SURF.init){var tb=surfTargetBody(b),tw=new THREE.Vector3();tb.pivot.getWorldPosition(tw);var td=SURF.aim?SURF.aim.clone():tw.sub(p).normalize();
    /* meteor yağmurunda kamera çıkış noktasına döner; çıkış noktası ekranın üst kısmında kalır ki ondan dağılan izler görünsün */
    SURF.yaw=Math.atan2(td.dot(east),td.dot(north));SURF.pitch=SURF.aim?clamp(Math.asin(clamp(td.dot(up),-1,1))-.22,.42,1.1):clamp(Math.asin(clamp(td.dot(up),-1,1)),.05,1.2);SURF.init=false;SURF.aim=null;}
  var cp=Math.cos(SURF.pitch),fw=north.clone().multiplyScalar(cp*Math.cos(SURF.yaw)).addScaledVector(east,cp*Math.sin(SURF.yaw)).addScaledVector(up,Math.sin(SURF.pitch));
  /* tepeye bakarken bakış yönü 'yukarı' ile çakışıp kamera dönüyordu: kameranın üst yönünü bakış yönüne dik hesaplıyoruz */
  var rgt=east.clone().multiplyScalar(Math.cos(SURF.yaw)).addScaledVector(north,-Math.sin(SURF.yaw)),cu=new THREE.Vector3().crossVectors(rgt,fw).normalize();
  camera.position.copy(p);camera.up.copy(cu);camera.lookAt(p.clone().add(fw));
  if(b.def.id==='earth'&&SURF.city!=null){var sdv=new THREE.Vector3().copy(sunBody.pos).sub(p).normalize(),dark=1-ss(-.18,.02,sdv.dot(up));if(sunType>=5)dark=1;
    updateMeteors(Math.min(.05,FRAME_DT),up.clone(),dark);cityDraw(p,up.clone(),north.clone(),east.clone(),dark);
    var lpk=SURF.lp?(SURF.sky&&SURF.sky.kind==='mega'?1:.75):0;if(SKYG.starMat){SKYG.starMat.uniforms.lim.value=lpk*.62*dark;SKYG.starMat.uniforms.vis.value=Math.pow(dark,1.5);}if(SKYG.mw)SKYG.mw.material.opacity=(1-lpk*.95)*dark*.45;if(SKYG.faint)SKYG.faint.material.uniforms.op.value=(1-lpk)*Math.pow(dark,1.5)*.3;SURF.lblT=(SURF.lblT||0)-1;if(SURF.lblT<=0){SURF.lblT=20;surfCityLabel(dark);}}
  /* Ay'ın sahnedeki uzaklığı gerçeğin ~20'de biri; yüzeyden bakınca bu dev bir paralaks yaratıp Ay'ı günde birkaç saatlik
     kısa bir yaya sıkıştırıyordu. Ay'ı, yönü Dünya'nın merkezinden görülen (gerçek) yön olacak şekilde gözlemciye göre yerleştiriyoruz. */
  if(b.def.id==='earth')BODIES.forEach(function(x){if(x.parent!==b||x.def.craft||isGone(x)||!x.pivot.parent)return;var gd=x.pos.clone().sub(c).normalize(),dd=x.pos.distanceTo(p),Wp=p.clone().addScaledVector(gd,dd);
    x.pivot.position.copy(x.pivot.parent.worldToLocal(Wp.clone()));x.pivot.updateMatrixWorld(true);x.pos.copy(Wp);});
  surfApparent(b);
  // gökyüzü rengi
  var sc=SKYCOL[b.def.id],h=b.hab,dens=h?({none:0,thin:.45,earth:1,thick:1,co2:1,h2:.8})[h.atm]:(sc?1:0);
  if((h&&h.atm==='none')||isEngulfed(b))dens=0;
  var col=sc||(h&&h.atm!=='none'?[150,170,210,.6]:null),el=$('skyTint');
  if(col&&dens>0){
    var sd=sV3.copy(sunBody.pos).sub(p).normalize(),selev=sd.dot(up),day=ss(-.12,.25,selev)*(sunType===6?.05:1);
    /* ufkun ekrandaki yeri doğrudan bakış açısından: tepeye bakarken ufuk noktası kameranın arkasına düşüp gökyüzü rengi kesiliyordu */
    var hy=clamp(50+50*Math.tan(Math.min(1.5,SURF.pitch))/Math.tan(camera.fov*D2R/2),-50,150);
    var warm=1-ss(.05,.35,selev),r=Math.round(col[0]*(1-warm*.2)+255*warm*.25),g=Math.round(col[1]*(1-warm*.45)),bl=Math.round(col[2]*(1-warm*.65));
    var et=SURF.pitch+camera.fov*D2R/2;if(et>Math.PI/2)et=Math.PI-et;var kt=clamp(et/1.05,0,1);
    el.style.background='linear-gradient(to bottom,rgba('+Math.round(r*(1-.45*kt))+','+Math.round(g*(1-.4*kt))+','+Math.round(bl*(1-.2*kt))+',1) 0%,rgba('+r+','+g+','+bl+',1) '+Math.max(0,hy-2)+'%,rgba('+r+','+g+','+bl+',0) '+(hy+1)+'%)';
    el.style.opacity=(col[3]*dens*day).toFixed(3);
  }else el.style.opacity=0;
}
$('surfExit').addEventListener('click',function(){exitSurface(false);});
/* ---------- şehirlerden gökyüzü ve meteor yağmurları ---------- */
var CITIES=[['Samsun',41.29,36.33,3,'city'],['Zonguldak',41.45,31.79,3,'city'],['İstanbul',41.01,28.98,3,'mega'],['Ankara',39.93,32.86,3,'city'],['Erzurum',39.9,41.27,3,'town'],['Tokyo',35.68,139.69,9,'mega'],['New York',40.71,-74.01,-5,'mega'],['Londra',51.51,-0.13,0,'mega'],['Reykjavik (kutup ışıkları)',64.15,-21.94,0,'town'],['Sidney',-33.87,151.21,10,'mega'],['Atacama Çölü (Şili)',-24.63,-70.4,-4,'dark'],['Kuzey Kutbu',89.9,0,0,'ice']];
var cityIdx=0;try{var ci0=+localStorage.getItem('se_city');if(ci0>=0&&ci0<CITIES.length)cityIdx=ci0;}catch(e){}
(function(){var sel=$('surfCity');CITIES.forEach(function(c,i){var o=document.createElement('option');o.value=i;o.textContent=c[0];sel.appendChild(o);});sel.value=cityIdx;
  sel.addEventListener('change',function(){cityIdx=+this.value;try{localStorage.setItem('se_city',cityIdx);}catch(e){}if(SURF&&SURF.b.def.id==='earth')setCity(cityIdx);});})();
function setCity(i){var c0=CITIES[i];SURF.lp=c0[4]!=='dark'&&c0[4]!=='ice';SURF.sky=genSkyline(i);lpBtn();var c=CITIES[i],la=c[1]*D2R,ph=(c[2]+180)/360*TAU;SURF.u=new THREE.Vector3(-Math.cos(ph)*Math.cos(la),Math.sin(la),Math.sin(ph)*Math.cos(la)).normalize();SURF.city=i;SURF.init=false;SURF.yaw=c[1]>=0?Math.PI:0;SURF.pitch=.13;SURF.lblT=0;
  var sh=showerNow();if(sh&&sh.g>.3){SURF.aim=skyDir(sh.s[4],sh.s[5]);SURF.init=true;}}
/* [ad, zirve günü, genişlik, ZHR, çıkış noktası RA, Dec, kaynak, hız km/s, tipik renk]. Hızlı yağmurlar (Leonidler, Eta Akuaridler) soluk mavi-beyaz ve iz bırakıcı,
   yavaş olan Geminidler sarı-turuncu görünür. */
var SHOWERS=[['Kadrantidler',3.5,.6,110,230,49,'2003 EH1 asteroidi',41,[.8,.9,1]],['Liridler',112,1.2,18,271,34,'Thatcher kuyruklu yıldızı',49,[.9,.95,1]],['Eta Akuaridler',126,4,50,338,-1,'Halley kuyruklu yıldızı',66,[.93,.97,1]],['Perseidler',224.5,3,100,48,58,'Swift-Tuttle kuyruklu yıldızı',59,[1,.97,.88]],['Orionidler',294,4,20,95,16,'Halley kuyruklu yıldızı',66,[.92,1,.82]],['Leonidler',321,1.2,15,152,22,'Tempel-Tuttle kuyruklu yıldızı',71,[.82,.95,1]],['Geminidler',348,1.5,150,112,33,'Phaethon asteroidi',35,[1,.88,.6]]];
var MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function showerNow(){var dt=new Date(J2000+simDays*864e5),Y=dt.getUTCFullYear(),doy=(dt-Date.UTC(Y,0,1))/864e5,best=null;
  SHOWERS.forEach(function(sh){var d=doy-sh[1];if(d>182)d-=365.25;if(d<-182)d+=365.25;var g=Math.exp(-Math.pow(d/sh[2],2));if(!best||g*sh[3]>best.k)best={s:sh,g:g,k:g*sh[3],d:d,pk:new Date(Date.UTC(Y,0,1)+(sh[1]+(d>150?365.25:d<-150?-365.25:0))*864e5)};});return best;}
var MET={list:[],nx:.4,bt:rnd(3,8),bd:0},metA=new THREE.Vector3(),metB=new THREE.Vector3(),metC=new THREE.Vector3(),metD=new THREE.Vector3(),metS=new THREE.Vector3();
/* meteorların ~%60'ı kameranın baktığı yöne düşer (yaklaşık 36° içi); geri kalanı ve son denemeler gökyüzünün her yerinden gelir.
   Çıkış noktasının çevresine geniş yayıldıkları için aksi halde çoğu kadraj dışında kalıyordu. */
var metFw=new THREE.Vector3();
function metInView(a,b){return metC.copy(a).add(b).normalize().dot(metFw)>.81;}
function metSpawn(up,sh){
  var s=null,e=null,want=Math.random()<.6;camera.getWorldDirection(metFw);
  for(var k=0;k<10&&!s;k++){
    if(sh){var rd=skyDir(sh.s[4],sh.s[5]),ax=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).cross(rd).normalize(),a0=rnd(.25,1.15),
        /* çıkış noktasına yakın izler perspektiften dolayı kısa görünür, uzaklaştıkça uzar */
        a1=a0+rnd(.1,.27)*(.4+.6*Math.sin(a0));
      var s1=rd.clone().applyAxisAngle(ax,a0),e1=rd.clone().applyAxisAngle(ax,a1);if(s1.dot(up)>.08&&e1.dot(up)>.03&&(!want||k>=8||metInView(s1,e1))){s=s1;e=e1;}}
    else{var r=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();if(r.dot(up)<.15)continue;var ax2=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).cross(r).normalize(),e2=r.clone().applyAxisAngle(ax2,rnd(.06,.18));if(e2.dot(up)>.03&&(!want||k>=8||metInView(r,e2))){s=r;e=e2;}}
  }
  if(!s)return;
  /* parlaklık dağılımı: çoğu meteor sönük, azı parlak; ~%3,5'i ateş topu */
  var v=sh?sh.s[7]:35,fb=Math.random()<.035,br=fb?rnd(1.6,2.2):.35+Math.pow(Math.random(),2.2)*1.05;
  /* renk: yağmurun tipik rengi; bir kısmı metal çizgisi rengine kayar (magnezyum yeşil, sodyum turuncu, ara sıra kızıl) */
  var rc=Math.random(),base=sh?sh.s[8]:[1,.96,.9],tint=rc<.16?[.7,1,.78]:rc<.3?[1,.82,.55]:rc<.34?[.96,.6,.5]:base;
  /* iz: hızlı yağmurlarda ve parlak meteorlarda gökyüzünde saniyelerce kalan soluk bir parıltı; ateş topları hep bırakır */
  var trT=(fb||(br>1&&Math.random()<.35+.5*clamp((v-40)/30,0,1)))?rnd(1.4,3.2)*(fb?1.8:1)*(.7+.3*br):0,T=rnd(.35,.9)*clamp(55/v,.7,1.3)*(fb?1.5:1);
  var ln=new THREE.Mesh(metGeo(),metMat());ln.frustumCulled=false;ln.renderOrder=2;ln.material.uniforms.sd.value=Math.random()*6.28;
  var hd=new THREE.Sprite(new THREE.SpriteMaterial({map:metTex(),color:new THREE.Color(.55+.45*tint[0],.55+.45*tint[1],.55+.45*tint[2]),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));hd.renderOrder=3;
  var bl=null;
  if(fb){bl=new THREE.Sprite(new THREE.SpriteMaterial({map:metBloomTex(),color:new THREE.Color(tint[0],tint[1],tint[2]),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));bl.renderOrder=1;SKYG.add(bl);}
  SKYG.add(ln);SKYG.add(hd);
  MET.list.push({ln:ln,hd:hd,bl:bl,s:s,e:e,t:0,T:T,trT:trT,br:br,c:tint,fb:fb,fr:rnd(.45,.72),sp:0,ph:Math.random()*6.28,w:s.angleTo(e)/T});
}
/* meteor izi: kameraya dönük bir şerit. Streak evresinde kuyruğa doğru incelir ve söner; baş beyaz-sıcak, gövde yağmurun rengi, uç kızıllaşır.
   Meteor kaybolunca parlak olanlar için aynı şerit tüm yol boyunca yayılıp genişleyen, yeşilimsi, yer yer yoğun bir dumana (train) dönüşür. */
var MET_MAT=null,MET_TEX=null,MET_BLOOM=null;
function metMat(){if(!MET_MAT)MET_MAT=new THREE.ShaderMaterial({uniforms:{k:{value:0},g:{value:0},ph:{value:0},tm:{value:0},sd:{value:0},c:{value:new THREE.Color()}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float k;uniform float g;uniform float ph;uniform float tm;uniform float sd;uniform vec3 c;varying vec2 vU;void main(){float x=vU.x;float y=vU.y*2.0-1.0;vec3 col;'
   +'if(ph<.5){float tp=mix(.16,1.0,pow(x,.55));float yy=y/tp;float core=exp(-yy*yy*16.0);float glow=exp(-yy*yy*2.4);float a=pow(x,1.8);float fl=.92+.08*sin(x*40.0-tm*28.0+sd);'
   +'vec3 body=mix(c*vec3(1.0,.58,.34),c,smoothstep(.0,.65,x));vec3 hot=mix(body,vec3(1.0),smoothstep(.5,1.0,x)*.85);col=(hot*core*1.3+body*glow*.5)*a*fl*k;}'
   +'else{float e=pow(sin(3.14159*x),.7);float pt=.62+.38*sin(x*21.0+sd*3.0)*sin(x*8.7+sd);float pr=exp(-y*y*3.4);col=mix(c,vec3(.55,1.0,.72),.55)*e*pt*pr*g;}'
   +'gl_FragColor=vec4(col,1.0);}'});
  var m=MET_MAT.clone();m.uniforms.c.value=new THREE.Color();return m;}
function metTex(){if(!MET_TEX)MET_TEX=glowTex([[0,'rgba(255,255,255,1)'],[.1,'rgba(255,255,255,.85)'],[.28,'rgba(255,255,255,.28)'],[.6,'rgba(255,255,255,.06)'],[1,'rgba(255,255,255,0)']]);return MET_TEX;}
function metBloomTex(){if(!MET_BLOOM)MET_BLOOM=glowTex([[0,'rgba(255,255,255,.9)'],[.12,'rgba(255,255,255,.45)'],[.3,'rgba(255,255,255,.14)'],[.55,'rgba(255,255,255,.04)'],[1,'rgba(255,255,255,0)']]);return MET_BLOOM;}
function metGeo(){var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,0,1,1,0,1,1]),2));g.setIndex([0,2,1,1,2,3]);return g;}
function metKill(i){var m=MET.list[i];SKYG.remove(m.ln);SKYG.remove(m.hd);m.ln.geometry.dispose();m.ln.material.dispose();m.hd.material.dispose();if(m.bl){SKYG.remove(m.bl);m.bl.material.dispose();}MET.list.splice(i,1);}
/* ateş topunun parçalanma kıvılcımları: tek bir Points nesnesinde halka tampon (96 parça) */
var SPK=null,spA=new THREE.Vector3(),spB=new THREE.Vector3(),spC=new THREE.Vector3();
function sparkInit(){
  var n=96,g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  var pt=new THREE.Points(g,new THREE.PointsMaterial({size:4.5,sizeAttenuation:false,vertexColors:true,map:dotTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  pt.frustumCulled=false;pt.renderOrder=3;SKYG.add(pt);
  SPK={n:n,i:0,g:g,p:p,c:c,pt:pt,u:new Float32Array(n*3),v:new Float32Array(n*3),c0:new Float32Array(n*3),life:new Float32Array(n),L:new Float32Array(n)};
}
function metSparks(hu,m){
  if(!SPK)sparkInit();
  var tg=spA.copy(m.e).sub(m.s);tg.addScaledVector(hu,-tg.dot(hu)).normalize();var lat=spB.crossVectors(hu,tg).normalize(),n=Math.round(rnd(8,14));
  for(var q=0;q<n;q++){var j=SPK.i;SPK.i=(j+1)%SPK.n;
    hu.toArray(SPK.u,j*3);spC.copy(tg).multiplyScalar(m.w*(rnd(.45,.95)+rnd(-.2,.2))).addScaledVector(lat,rnd(-1,1)*m.w*.45).toArray(SPK.v,j*3);
    SPK.L[j]=SPK.life[j]=rnd(.6,1.3);var w=Math.random();SPK.c0[j*3]=1;SPK.c0[j*3+1]=.72+.2*w;SPK.c0[j*3+2]=.42+.3*w;}
}
function sparkUpdate(dt,R,k){
  if(!SPK)return;SPK.pt.material.size=4.5*curDpr;
  for(var j=0;j<SPK.n;j++){var o=j*3,l=SPK.life[j];
    if(l<=0){SPK.c[o]=SPK.c[o+1]=SPK.c[o+2]=0;continue;}
    SPK.life[j]=l-dt;var d=1-1.1*dt,ux=SPK.u[o]+SPK.v[o]*dt,uy=SPK.u[o+1]+SPK.v[o+1]*dt,uz=SPK.u[o+2]+SPK.v[o+2]*dt,il=1/Math.hypot(ux,uy,uz);
    SPK.u[o]=ux*il;SPK.u[o+1]=uy*il;SPK.u[o+2]=uz*il;SPK.v[o]*=d;SPK.v[o+1]*=d;SPK.v[o+2]*=d;
    SPK.p[o]=SPK.u[o]*R;SPK.p[o+1]=SPK.u[o+1]*R;SPK.p[o+2]=SPK.u[o+2]*R;
    var fa=Math.pow(Math.max(0,l/SPK.L[j]),1.5)*Math.min(1,(SPK.L[j]-l)*14+.25)*k;SPK.c[o]=SPK.c0[o]*fa*2.2;SPK.c[o+1]=SPK.c0[o+1]*fa*2.2;SPK.c[o+2]=SPK.c0[o+2]*fa*2.2;}
  SPK.g.attributes.position.needsUpdate=true;SPK.g.attributes.color.needsUpdate=true;
}
function updateMeteors(dt,up,dark){
  var R=3000,pxW=camera.fov*D2R/Math.max(300,H)*R,lp=SURF&&SURF.lp?1:0;
  sparkUpdate(dt,R,dark*(lp?.7:1));
  for(var i=MET.list.length-1;i>=0;i--){var m=MET.list[i];m.t+=dt;var f=m.t/m.T,U=m.ln.material.uniforms,P=m.ln.geometry.attributes.position.array;
    if(f>=1&&(!m.trT||m.t>=m.T+m.trT)){metKill(i);continue;}
    /* ışık kirliliği sönük meteorları siler, parlaklar yine görünür */
    var vis=lp?.3+.7*ss(.35,.95,m.br):1;U.tm.value=m.t;U.c.value.setRGB(m.c[0],m.c[1],m.c[2]);
    if(f<1){
      var hu=metA.copy(m.s).lerp(m.e,f).normalize(),tl=metB.copy(m.s).lerp(m.e,Math.max(0,f-.5)).normalize();
      /* ufka yakın meteorlar kalın atmosferde sönükleşir */
      var ext=.3+.7*ss(0,.4,hu.dot(up)),flare=m.fb?Math.exp(-Math.pow((f-m.fr)/.06,2)):0;
      /* ateş topunun parçalanma anı: ani parlama ve savrulan kıvılcımlar */
      if(m.fb&&!m.sp&&f>=m.fr){m.sp=1;metSparks(hu,m);}
      var k=m.br*(1-Math.pow(f,3))*Math.min(1,f*7)*(1+1.1*flare)*dark*vis*ext;
      hu.multiplyScalar(R);tl.multiplyScalar(R);
      var wd=pxW*(1.3+m.br*1.7)*(1+.8*flare);metS.crossVectors(metD.copy(hu).sub(tl),hu).normalize().multiplyScalar(wd);
      P[0]=tl.x-metS.x;P[1]=tl.y-metS.y;P[2]=tl.z-metS.z;P[3]=tl.x+metS.x;P[4]=tl.y+metS.y;P[5]=tl.z+metS.z;
      P[6]=hu.x-metS.x;P[7]=hu.y-metS.y;P[8]=hu.z-metS.z;P[9]=hu.x+metS.x;P[10]=hu.y+metS.y;P[11]=hu.z+metS.z;
      U.ph.value=0;U.g.value=0;U.k.value=k*1.3;
      m.hd.visible=true;m.hd.position.copy(hu);m.hd.scale.setScalar(pxW*(8+m.br*9)*(1+.7*flare));m.hd.material.opacity=Math.min(1,k*(1+.1*Math.sin(m.t*60+m.ph)));
      if(m.bl){m.bl.position.copy(hu);m.bl.scale.setScalar(pxW*(70+60*flare)*m.br);m.bl.material.opacity=Math.min(.55,(.1+.45*flare)*k*.6);}
    }else{
      /* iz: meteor sönünce yolu boyunca kalan, yavaşça genişleyip sönen yeşilimsi duman */
      var tp=(m.t-m.T)/m.trT,a=metA.copy(m.s).multiplyScalar(R),b=metB.copy(m.e).multiplyScalar(R),mid=metC.copy(m.s).add(m.e).normalize();
      var g=Math.pow(1-tp,2)*ss(0,.05,tp)*vis*dark*(.3+.7*ss(0,.4,mid.dot(up)))*(.55+.25*m.br);
      metS.crossVectors(metD.copy(b).sub(a),mid).normalize().multiplyScalar(pxW*(2.2+m.br*1.6)*(1+tp*3));
      P[0]=a.x-metS.x;P[1]=a.y-metS.y;P[2]=a.z-metS.z;P[3]=a.x+metS.x;P[4]=a.y+metS.y;P[5]=a.z+metS.z;
      P[6]=b.x-metS.x;P[7]=b.y-metS.y;P[8]=b.z-metS.z;P[9]=b.x+metS.x;P[10]=b.y+metS.y;P[11]=b.z+metS.z;
      U.ph.value=1;U.k.value=0;U.g.value=g;m.hd.visible=false;if(m.bl)m.bl.visible=false;}
    m.ln.geometry.attributes.position.needsUpdate=true;}
  if(dark<.2||!playing)return;
  /* varışlar Poisson süreci: aralıklar rastgele, bazen iki meteor art arda düşer */
  var sh=showerNow(),act=sh&&sh.g>.03?sh:null,rate=(.06+(act?act.k/100*1.4:0))*dark;
  /* zirveye yakın yağmurlarda ara sıra birkaç saniyelik meteor fırtınası: oran 3-7 kat artar, çiftler çoğalır */
  if(act&&act.g>.35){MET.bt-=dt;if(MET.bt<=0){MET.bt=rnd(8,18);MET.bd=rnd(2.5,5);MET.nx=Math.min(MET.nx,.1);}}
  if(MET.bd>0){MET.bd-=dt;rate*=3+4*clamp(act?act.k/100:0,0,1);}
  MET.nx-=dt;
  while(MET.nx<=0){MET.nx+=Math.max(.02,-Math.log(1-Math.random())/rate);
    if(MET.list.length<40){var pk=act&&Math.random()<.85?act:null;metSpawn(up,pk);if(Math.random()<(MET.bd>0?.3:act?.14:.04))metSpawn(up,pk);}}
}
/* şehir silüeti ve ışık kirliliği: üç derinlik katmanı (uzak tepeler + ev ışıkları, orta, yakın), kıyı şehirlerinde deniz,
   Türk şehirlerinde cami kubbe ve minareleri. Pencereler yerel saate göre yanıp söner. */
var CITYPROF={'Samsun':{sea:[0,1.2],mosque:.1,hills:3.4},'Zonguldak':{sea:[.05,1],mosque:.08,hills:5},'İstanbul':{sea:[3.4,.7],mosque:.14,hills:1.6},
  'Ankara':{mosque:.07,hills:2.2},'Erzurum':{mosque:.08,hills:1,mtn:4.5},'Tokyo':{sea:[2.7,.55],tower:1},'New York':{sea:[3.4,.5],spire:.1},
  'Londra':{spire:.04,low:1},'Reykjavik (kutup ışıkları)':{sea:[5.3,1.2],pitch:1,mtn:3.2},'Sidney':{sea:[.25,.55]}};
function genSkyline(ci){
  var C=CITIES[ci],kind=C[4],P=CITYPROF[C[0]]||{},sd=(ci*2654435761+12345)>>>0;function rr(){sd=(sd+0x6D2B79F5)>>>0;var t=sd;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
  var N=1440,city=kind==='city'||kind==='mega'||kind==='town';
  function seaW(a){if(!P.sea)return 0;var d=Math.abs(Math.atan2(Math.sin(a-P.sea[0]),Math.cos(a-P.sea[0])));return clamp((P.sea[1]-d)/.1+.5,0,1);}
  function nz(a,f,ph){return Math.sin(a*f+ph+ci)*.5+Math.sin(a*f*2.3+ph*1.7+ci*2)*.3+Math.sin(a*f*5.1+ph*.3+ci*3)*.2;}
  var L=[],sea=!!P.sea;
  for(var l=0;l<3;l++){var H=new Float32Array(N);
    for(var i=0;i<N;i++){var a=i/N*TAU,s=seaW(a),h;
      if(kind==='ice')h=l===0?.25+.1*nz(a,4,1):l===1?.12:.05;
      else if(kind==='dark')h=l===0?Math.max(.3,2.6+2.4*nz(a,3,0)):l===1?Math.max(.15,.9+.8*nz(a,6,2)):Math.max(.05,.25+.25*nz(a,11,4));
      else if(l===0){var mt=P.mtn||0,hl=P.hills||.5;h=Math.max(.12,hl*(.75+.55*nz(a,3,0))+(mt?Math.max(0,mt*(.5+.9*nz(a,2,5))):0));}
      else h=l===1?.15:.05;
      H[i]=s>0?h*(1-s)+(l===0?-.04:l===1?-40:-6.5)*s:h;}
    L.push({H:H,B:[]});}
  var dots=[],ships=[],lamps=[];
  if(city){
    var den=kind==='mega'?1:kind==='city'?.8:.5;
    [[0,.35,.9,.16,0],[1,.45,1.6,.45,-.5],[2,1.1,3.6,1.5,-3.2]].forEach(function(cf){var l=cf[0],Ly=L[l],a0=rr()*TAU,end=a0+TAU;
      while(a0<end){var w=(cf[1]+rr()*(cf[2]-cf[1]))*D2R*(kind==='town'?1.2:1),gap=rr()<(l===2?.35:.12)/den?(.3+rr()*(l===2?5:1.5))*D2R:0;a0+=gap;if(a0>=end)break;
        var am=a0+w/2,ia=Math.floor((((am%TAU)+TAU)%TAU)/TAU*N);if(seaW(am)>.25){a0+=w;continue;}
        var base=(kind==='mega'?1.4:kind==='city'?.85:.45)*(P.low?.7:1),h=(base+Math.pow(rr(),2.6)*(kind==='mega'?(P.low?4:8.5):kind==='city'?4.5:1.6))*cf[3]*(l===0?1:1.1);
        if(rr()<.04&&kind!=='town')h*=1.7;
        var b={a0:a0,a1:a0+w,h:h-cf[4],b0:l===0?Math.max(0,L[0].H[ia]-.05):cf[4],ty:'box',win:[],top:rr()<.3&&h>3,sd:rr()};
        var q=rr();
        if(P.mosque&&q<P.mosque&&l>0){b.ty='mosque';b.h=Math.min(h,1.1*cf[3]+.4);b.nm=1+Math.floor(rr()*(kind==='mega'?4:2.6));}
        else if(P.pitch||kind==='town'){b.ty=rr()<.8?'pitch':'box';b.h=Math.min(h,1.4*cf[3]+.3);}
        else if(P.spire&&q<P.spire+(P.mosque||0)&&h>3)b.ty='spire';
        else if(q<.3&&h>2)b.ty='step';else if(q<.42&&h>2.5)b.ty='ant';
        if(l>0){var dx=l===2?2.4:3.4,nx=Math.max(1,Math.round(w/D2R*dx)),ny=Math.max(1,Math.round(b.h*dx*.8));if(b.ty==='mosque')ny=Math.min(ny,2);
          for(var x=0;x<nx;x++)for(var y=0;y<ny;y++){if(b.win.length>90)break;if(rr()<.72)b.win.push([(x+.5)/nx,(y+.55)/ny*.9,rr(),rr()]);}}
        Ly.B.push(b);a0+=w;}});
    if(P.tower){var ta=2.4+rr()*.5;L[1].B.push({a0:ta,a1:ta+.9*D2R,h:14,b0:0,ty:'tower',win:[],top:true,sd:.5});}
    var nd=kind==='mega'?2200:kind==='city'?1700:600;
    for(var k=0;k<nd;k++){var a=rr()*TAU;if(seaW(a)>.1)continue;var ia2=Math.floor(a/TAU*N),hh=L[0].H[ia2];dots.push([a,Math.pow(rr(),.8)*Math.max(.05,hh-.08),rr(),rr()]);}
    if(sea){for(var s2=0;s2<(kind==='mega'?9:5);s2++){var sa=P.sea[0]+(rr()*2-1)*P.sea[1]*.8;ships.push([sa,-.03-rr()*.12,rr()]);}
      for(var la=P.sea[0]-P.sea[1]+.15;la<P.sea[0]+P.sea[1]-.15;la+=(3.2+rr()*1.5)*D2R)lamps.push(la);}
  }
  var trees=[];if(city){var nt=kind==='town'?200:kind==='city'?140:100;for(var tq=0;tq<nt;tq++){var tA=rr()*TAU;if(seaW(tA)>.05)continue;var tE=-(3.4+Math.pow(rr(),2)*8);trees.push([tA,tE,.5+rr()*.5]);}trees.sort(function(x,y){return y[1]-x[1];});}
  return {L:L,dots:dots,ships:ships,lamps:lamps,trees:trees,kind:kind,sea:sea,P:P};
}
function lpBtn(){var b=$('surfLP');if(!b||!SURF)return;b.textContent=(innerWidth<=760?'Şehir ışığı: ':'Işık kirliliği: ')+(SURF.lp?'açık':'kapalı');b.classList.toggle('on',!!SURF.lp);}
var CV1=new THREE.Vector3(),CV2=new THREE.Vector3();
function bShape(b){var t=b.ty,h=b.h;
  if(t==='step')return [[0,0],[0,h*.72],[.18,h*.72],[.18,h*.9],[.3,h*.9],[.3,h],[.72,h],[.72,h*.82],[1,h*.82],[1,0]];
  if(t==='spire')return [[0,0],[0,h],[.3,h],[.42,h*1.18],[.5,h*1.42],[.58,h*1.18],[.7,h],[1,h],[1,0]];
  if(t==='ant')return [[0,0],[0,h],[.47,h],[.47,h*1.32],[.53,h*1.32],[.53,h],[1,h],[1,0]];
  if(t==='pitch')return [[0,0],[0,h],[.5,h*1.45],[1,h],[1,0]];
  if(t==='tower')return [[.42,0],[.46,h*.78],[.3,h*.8],[.3,h*.84],[.47,h*.86],[.49,h],[.51,h],[.53,h*.86],[.7,h*.84],[.7,h*.8],[.54,h*.78],[.58,0]];
  if(t==='mosque'){var w=(b.a1-b.a0)/D2R,dh=w*.42,pts=[[0,0],[0,h],[.12,h]];for(var k=0;k<=10;k++){var u=k/10;pts.push([.12+.76*u,h+dh*Math.sin(Math.PI*u)*(1-.15*Math.pow(2*u-1,2))]);}
    pts.push([.88,h],[1,h],[1,0]);return pts;}
  return [[0,0],[0,h],[1,h],[1,0]];}
function cityDraw(p,up,north,east,dark){
  var cv=$('cityCv'),dpr=Math.min(devicePixelRatio||1,1.5),Wc=Math.round(innerWidth*dpr),Hc=Math.round(innerHeight*dpr);
  if(cv.width!==Wc||cv.height!==Hc){cv.width=Wc;cv.height=Hc;}cv.style.display='block';var g=cv.getContext('2d');g.clearRect(0,0,Wc,Hc);
  var S=SURF.sky;if(!S||!S.L)return;
  function proj(az,el,out){CV1.copy(north).multiplyScalar(Math.cos(az)).addScaledVector(east,Math.sin(az)).addScaledVector(up,Math.tan(el)).multiplyScalar(1000).add(p);CV1.project(camera);out.x=(CV1.x*.5+.5)*Wc;out.y=(-CV1.y*.5+.5)*Hc;out.z=CV1.z;return out;}
  /* ufuk ve binalar görüş alanının çok altında kaldıysa (tepeye bakılıyor) silüet çizilmez; aksi halde ekran dışındaki noktalar çokgenleri bozuyordu */
  if(SURF.pitch-camera.fov*D2R/2>.45)return;
  var asp=Wc/Hc,hf=Math.min(Math.PI,(Math.atan(Math.tan(camera.fov*D2R/2)*asp)+.12)/Math.max(.3,Math.cos(SURF.pitch))),yaw=SURF.yaw,st=Math.max(.002,hf*2/600),pt={x:0,y:0,z:0},q2={x:0,y:0,z:0},hzY=0,nh=0;
  for(var az=yaw-hf;az<=yaw+hf;az+=hf/8){proj(az,0,pt);if(pt.z<1){hzY+=pt.y;nh++;}}hzY=nh?hzY/nh:Hc;
  var ppd=Hc/camera.fov,day=Math.pow(1-dark,1.6),now=performance.now()*.001,lp=!!SURF.lp;
  var c0=CITIES[SURF.city],hr=((new Date(J2000+simDays*864e5+c0[3]*36e5)).getUTCHours()+(new Date(J2000+simDays*864e5)).getUTCMinutes()/60);
  var lit=(hr>=18&&hr<23?.62:hr>=23||hr<1?.42:hr<5?.16:hr<7?.3:.45)*(lp?1:.18),slot=Math.floor(simDays*96);
  var k=dark*(S.kind==='mega'?1:S.kind==='city'?.75:S.kind==='town'?.45:0)*(lp?1:.15);
  /* gökyüzü parıltısı: şehrin turuncu sodyum ışıkları atmosferden geri saçılıyor */
  if(k>.02){var gl=g.createLinearGradient(0,hzY,0,hzY-Hc*.5);gl.addColorStop(0,'rgba(255,150,80,'+(.36*k)+')');gl.addColorStop(.3,'rgba(205,120,110,'+(.15*k)+')');gl.addColorStop(1,'rgba(60,60,90,0)');g.fillStyle=gl;g.fillRect(0,0,Wc,hzY);
    g.fillStyle='rgba(28,32,52,'+(.2*k)+')';g.fillRect(0,0,Wc,hzY);}
  function mix(n,d){return [Math.round(n[0]*(1-day)+d[0]*day),Math.round(n[1]*(1-day)+d[1]*day),Math.round(n[2]*(1-day)+d[2]*day)];}
  function rgb(c,a){return a==null?'rgb('+c[0]+','+c[1]+','+c[2]+')':'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
  var LC=S.kind==='ice'?[mix([40,48,64],[205,215,232]),mix([28,34,48],[190,200,220]),mix([18,22,32],[175,185,205])]:
         S.kind==='dark'?[mix([26,22,30],[150,120,105]),mix([16,13,16],[120,88,70]),mix([8,7,8],[95,68,52])]:
         [mix([34+40*k,30+20*k,46+6*k],[132,148,170]),mix([16+12*k,16+7*k,26+3*k],[86,96,112]),mix([7,8,13],[52,57,68])];
  /* deniz: ufukta gökyüzünü yansıtır, aşağı doğru koyulaşır; ışık yansımaları dalgalarla titrer */
  if(S.sea){var sg=g.createLinearGradient(0,hzY,0,Hc),top=mix([14+40*k,16+22*k,30+10*k],[120,155,190]),bot=mix([3,5,10],[30,62,96]);sg.addColorStop(0,rgb(top));sg.addColorStop(.25,rgb(mix([8+16*k,10+10*k,20+5*k],[64,102,140])));sg.addColorStop(1,rgb(bot));g.fillStyle=sg;g.fillRect(0,hzY-1,Wc,Hc-hzY+1);
    var P=S.P;function hsh(n){var v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);}for(var sw=0;sw<160;sw++){var sa=P.sea[0]+(hsh(sw)*2-1)*P.sea[1],da=Math.atan2(Math.sin(sa-yaw),Math.cos(sa-yaw));if(Math.abs(da)>hf)continue;
      var el=-(.12+Math.pow(hsh(sw+500),1.8)*6)*D2R;proj(sa,el,pt);if(pt.z>=1)continue;var fl=.5+.5*Math.sin(now*(1.3+sw%5*.4)+sw*2.1),len=(4+(sw%7)*3)*dpr*(1+ -el*8);
      g.fillStyle=dark>.4?'rgba(255,190,120,'+(.25*fl*k+.04*fl)+')':'rgba(255,255,255,'+(.18*fl*day)+')';g.fillRect(pt.x-len/2,pt.y,len,Math.max(1,dpr));}
    if(dark>.3)S.ships.forEach(function(s){proj(s[0],s[1]*D2R,pt);if(pt.z>=1)return;g.fillStyle=s[2]<.2?'rgba(255,90,80,.9)':s[2]<.35?'rgba(120,255,140,.9)':'rgba(255,240,215,.95)';g.fillRect(pt.x-1.2*dpr,pt.y-1.2*dpr,2.4*dpr,2.4*dpr);
      g.fillStyle='rgba(255,220,170,.18)';g.fillRect(pt.x-.6*dpr,pt.y+2*dpr,1.2*dpr,(10+s[2]*14)*dpr);});}
  /* Güneş parıltısı: atmosferde saçılan ışık diskin çevresinde geniş bir hale yapar; alçaldıkça turuncuya döner. Binalar üstüne çizilir, onu örter */
  var sdv=CV2.copy(sunBody.pos).sub(p).normalize(),sel=sdv.dot(up);
  if(sunType<5&&sel>-.03&&day>.02){CV1.copy(p).addScaledVector(sdv,1000).project(camera);
    if(CV1.z<1){var sx=(CV1.x*.5+.5)*Wc,sy=(-CV1.y*.5+.5)*Hc,lo=1-ss(.02,.3,sel),R1=ppd*(2.2+2*lo),R2=ppd*(16+10*lo),ga=Math.min(1,day*1.4)*(1-.5*ss(-.03,.02,-sel));
      var hg=g.createRadialGradient(sx,sy,0,sx,sy,R2);hg.addColorStop(0,'rgba(255,'+Math.round(244-60*lo)+','+Math.round(214-120*lo)+','+(.55*ga)+')');hg.addColorStop(.12,'rgba(255,'+Math.round(230-70*lo)+','+Math.round(180-110*lo)+','+(.22*ga)+')');hg.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=hg;g.fillRect(sx-R2,sy-R2,R2*2,R2*2);
      var cg=g.createRadialGradient(sx,sy,0,sx,sy,R1);cg.addColorStop(0,'rgba(255,255,250,'+(.95*ga)+')');cg.addColorStop(.35,'rgba(255,'+Math.round(246-50*lo)+','+Math.round(220-110*lo)+','+(.6*ga)+')');cg.addColorStop(1,'rgba(255,220,160,0)');g.fillStyle=cg;g.fillRect(sx-R1,sy-R1,R1*2,R1*2);}}
  /* Ay: gündüz gökyüzü renginin altında soluk kalmasın diye çevresinde hafif bir hale (gece daha belirgin) */
  var mo=byId.moon;if(mo&&!isGone(mo)&&mo.pr>0){var mdv=CV2.copy(mo.pos).sub(sV1).normalize();if(mdv.dot(up)>-.02){CV1.copy(p).addScaledVector(mdv,1000).project(camera);if(CV1.z<1){var mx=(CV1.x*.5+.5)*Wc,my=(-CV1.y*.5+.5)*Hc,mr=mo.pr*dpr,ma=.14+.14*dark;
    var mg=g.createRadialGradient(mx,my,mr*.9,mx,my,mr*4);mg.addColorStop(0,'rgba(235,240,255,'+ma+')');mg.addColorStop(1,'rgba(235,240,255,0)');g.fillStyle=mg;g.fillRect(mx-mr*4,my-mr*4,mr*8,mr*8);}}}
  var sdv=CV2.copy(sunBody.pos).sub(p).normalize(),sel=sdv.dot(up);
  /* zemin: ufukta havanın pusuna karışan, öne doğru koyulaşan toprak/kent dokusu (eskiden düz gri bir dolguydu) */
  var warmS=1-ss(.03,.3,sel),lk=.5+.5*ss(-.02,.45,sel),GB=S.kind==='ice'?[214,222,236]:S.kind==='dark'?[150,108,78]:S.kind==='town'?[86,96,66]:[96,94,88];
  var gTop=mix([22+36*k,20+20*k,28+8*k],[Math.round(GB[0]*.45+172*.55+40*warmS),Math.round(GB[1]*.45+184*.55+10*warmS),Math.round(GB[2]*.45+204*.55-30*warmS)]),
      gMid=mix([12+14*k,12+8*k,17+3*k],[Math.round(GB[0]*lk*(1+.1*warmS)),Math.round(GB[1]*lk*(1-.08*warmS)),Math.round(GB[2]*lk*(1-.25*warmS))]),
      gBot=mix([5,6,9],[Math.round(GB[0]*.5*lk),Math.round(GB[1]*.5*lk),Math.round(GB[2]*.52*lk)]);
  function groundFill(y0){var gg=g.createLinearGradient(0,y0,0,Hc);gg.addColorStop(0,rgb(gTop));gg.addColorStop(Math.min(.9,Math.max(.04,ppd*1.5/Math.max(1,Hc-y0))),rgb(gMid));gg.addColorStop(1,rgb(gBot));return gg;}
  var wpx=Math.max(1.2,.2*ppd);
  S.L.forEach(function(Ly,li){
    var pts=[],hz=[];for(var az=yaw-hf;az<=yaw+hf;az+=st){var ia=((Math.floor(((az%TAU)+TAU)%TAU/TAU*Ly.H.length))%Ly.H.length);proj(az,Ly.H[ia]*D2R,pt);if(pt.z<1){pts.push([pt.x,pt.y]);if(li===0){proj(az,0,q2);hz.push([q2.x,q2.y]);}}}
    if(pts.length<2)return;var col=LC[li];g.fillStyle=li===2?groundFill(Math.max(0,Math.min(hzY,Hc-1))):rgb(col);
    /* uzak katman yalnızca ufkun üstünde (altı denizi ya da yakın katmanlar örter) */
    g.beginPath();if(li===0){g.moveTo(hz[0][0],hz[0][1]);pts.forEach(function(q){g.lineTo(q[0],q[1]);});for(var z=hz.length-1;z>=0;z--)g.lineTo(hz[z][0],hz[z][1]+1);}
    else{g.moveTo(pts[0][0],Hc+10);pts.forEach(function(q){g.lineTo(q[0],Math.min(q[1],Hc+10));});g.lineTo(pts[pts.length-1][0],Hc+10);}g.closePath();g.fill();
    /* uzak tepelerdeki evlerin ışıkları */
    if(li===0&&dark>.2&&S.dots.length){g.globalAlpha=Math.min(1,(dark-.2)*2);S.dots.forEach(function(d){var da=Math.atan2(Math.sin(d[0]-yaw),Math.cos(d[0]-yaw));if(Math.abs(da)>hf)return;
      var on=((Math.sin((d[2]*917.3+Math.floor(slot/4+d[3]*9))*12.9898)*43758.5453)%1+1)%1<lit*1.25;if(!on)return;proj(d[0],d[1]*D2R,pt);if(pt.z>=1)return;var sz=Math.max(1,.7*dpr);g.fillStyle=d[3]<.15?'rgba(200,220,255,.75)':'rgba(255,196,120,.8)';g.fillRect(pt.x-sz/2,pt.y-sz/2,sz,sz);});g.globalAlpha=1;}
    var bcol=rgb(col),wl=[],wc=[],wt=[];
    Ly.B.forEach(function(b){var da=Math.atan2(Math.sin((b.a0+b.a1)/2-yaw),Math.cos((b.a0+b.a1)/2-yaw));if(Math.abs(da)>hf+.05)return;
      var sh=bShape(b);g.beginPath();for(var v=0;v<sh.length;v++){proj(b.a0+(b.a1-b.a0)*sh[v][0],(b.b0+sh[v][1])*D2R,q2);if(v===0)g.moveTo(q2.x,q2.y);else g.lineTo(q2.x,q2.y);}g.closePath();
      if(day>.15&&b.ty==='pitch'&&S.P.pitch){var hue=Math.floor(b.sd*360);g.fillStyle='hsl('+hue+',35%,'+Math.round(18+30*day)+'%)';}else{var f=.84+.32*b.sd*day+(b.ty==='mosque'?.12*day:0);g.fillStyle=rgb([Math.min(255,Math.round(col[0]*f)),Math.min(255,Math.round(col[1]*f)),Math.min(255,Math.round(col[2]*f*(1+.04*day)))]);}g.fill();
      if(day>.35&&li>0&&b.win.length&&b.ty!=='mosque'){g.fillStyle='rgba(170,200,235,'+(.16+.14*b.sd)*day+')';var ws=li===2?1.3:.8,ww0=Math.max(1,wpx*ws),wh0=Math.max(1,wpx*ws*1.3);for(var w3=0;w3<b.win.length;w3++){var W0=b.win[w3];proj(b.a0+(b.a1-b.a0)*W0[0],(b.b0+b.h*W0[1])*D2R,q2);if(q2.z<1)g.fillRect(q2.x-ww0/2,q2.y-wh0/2,ww0,wh0);}}
      if(b.ty==='mosque'&&li>0){var w=(b.a1-b.a0),mh=b.h*2.6+(b.a1-b.a0)/D2R*.6,mw=Math.max(.06*D2R,w*.045);
        for(var m=0;m<b.nm;m++){var ma=m%2===0?b.a0-mw*1.6-(m>>1)*mw*3:b.a1+mw*.6+(m>>1)*mw*3;
          g.beginPath();proj(ma,0,q2);g.moveTo(q2.x,q2.y);proj(ma,(b.b0+mh)*D2R,q2);g.lineTo(q2.x,q2.y);proj(ma+mw/2,(b.b0+mh*1.16)*D2R,q2);g.lineTo(q2.x,q2.y);proj(ma+mw,(b.b0+mh)*D2R,q2);g.lineTo(q2.x,q2.y);proj(ma+mw,0,q2);g.lineTo(q2.x,q2.y);g.closePath();g.fill();
          if(dark>.4&&lp){proj(ma+mw/2,(b.b0+mh*.78)*D2R,q2);wt.push(q2.x,q2.y);}}}
      if(dark>.25&&b.win.length){for(var w2=0;w2<b.win.length;w2++){var W=b.win[w2],hs=((Math.sin((W[2]*917.3+Math.floor(slot+W[3]*7))*12.9898)*43758.5453)%1+1)%1;if(hs>lit)continue;
          proj(b.a0+(b.a1-b.a0)*W[0],(b.b0+b.h*W[1])*D2R,q2);if(q2.z>=1)continue;(W[3]<.1?wc:wl).push(q2.x,q2.y,W[3]);}}
      if(b.top&&dark>.3){proj((b.a0+b.a1)/2,(b.b0+b.h*(b.ty==='spire'?1.42:b.ty==='ant'?1.32:1))*D2R,q2);if(q2.z<1&&Math.sin(now*3+b.a0*50)>.2){g.fillStyle='rgba(255,60,50,.95)';g.fillRect(q2.x-wpx*.6,q2.y-wpx*1.2,wpx*1.2,wpx*1.2);}}});
    if(wl.length||wc.length){var sc=li===2?1.35:.85,ww=Math.max(1,wpx*sc),wh=Math.max(1,wpx*sc*1.3);g.globalAlpha=Math.min(1,(dark-.25)*2);
      for(var i=0;i<wl.length;i+=3){var t=wl[i+2];g.fillStyle=t<.55?'rgba(255,206,128,.92)':t<.8?'rgba(255,228,170,.9)':'rgba(255,175,95,.9)';g.fillRect(wl[i]-ww/2,wl[i+1]-wh/2,ww,wh);}
      for(i=0;i<wc.length;i+=3){var tv=wc[i+2]<.05;g.fillStyle=tv?'rgba(150,180,255,'+(.5+.4*Math.sin(now*9+wc[i]))+')':'rgba(200,222,255,.88)';g.fillRect(wc[i]-ww/2,wc[i+1]-wh/2,ww,wh);}g.globalAlpha=1;}
    for(var j=0;j<wt.length;j+=2){g.fillStyle='rgba(180,255,190,.85)';g.fillRect(wt[j]-wpx*.4,wt[j+1]-wpx*.4,wpx*.8,wpx*.8);}
  });
  /* önde ağaç kümeleri: yakın zemine derinlik verir (aşağıdakiler daha yakın, daha büyük) */
  if(S.trees&&S.trees.length){var tc=rgb(mix([6+7*k,8+4*k,9+2*k],[Math.round(30*lk),Math.round(42*lk),Math.round(34*lk)])),tc2=rgb(mix([8+8*k,10+5*k,11+2*k],[Math.round(40*lk),Math.round(54*lk),Math.round(42*lk)]));
    S.trees.forEach(function(t){var da=Math.atan2(Math.sin(t[0]-yaw),Math.cos(t[0]-yaw));if(Math.abs(da)>hf+.1)return;proj(t[0],t[1]*D2R,pt);if(pt.z>=1||pt.y>Hc+40)return;
      var r=Math.max(1.2,t[2]*ppd*(-t[1])/5.5);g.fillStyle=tc;g.beginPath();g.arc(pt.x,pt.y-r*.9,r,0,TAU);g.arc(pt.x-r*.75,pt.y-r*.45,r*.75,0,TAU);g.arc(pt.x+r*.8,pt.y-r*.5,r*.8,0,TAU);g.fill();
      if(day>.3){g.fillStyle=tc2;g.beginPath();g.arc(pt.x-r*.3,pt.y-r*1.2,r*.42,0,TAU);g.fill();}});}
  /* sahil yolu lambaları ve denizdeki yansımaları */
  if(S.sea&&S.lamps&&S.lamps.length){S.lamps.forEach(function(la){var da=Math.atan2(Math.sin(la-yaw),Math.cos(la-yaw));if(Math.abs(da)>hf)return;
    proj(la,-6.5*D2R,pt);proj(la,-3.6*D2R,q2);if(pt.z>=1||q2.z>=1)return;g.strokeStyle=rgb(LC[2]);g.lineWidth=Math.max(1,1.2*dpr);g.beginPath();g.moveTo(pt.x,pt.y);g.lineTo(q2.x,q2.y);g.stroke();
    if(dark>.3){var r0=Math.max(2,.5*ppd),gr=g.createRadialGradient(q2.x,q2.y,0,q2.x,q2.y,r0*3);gr.addColorStop(0,'rgba(255,214,150,.95)');gr.addColorStop(.25,'rgba(255,170,90,.35)');gr.addColorStop(1,'rgba(255,150,70,0)');g.fillStyle=gr;g.fillRect(q2.x-r0*3,q2.y-r0*3,r0*6,r0*6);}});}
  /* yakındaki sokak lambaları ufkun hemen altında turuncu bir parıltı bırakır */
  if(k>.05&&S.L[2].B.length){var sl=g.createLinearGradient(0,hzY,0,Hc);sl.addColorStop(0,'rgba(255,150,70,'+(.0)+')');sl.addColorStop(.06,'rgba(255,150,70,'+(.1*k)+')');sl.addColorStop(.35,'rgba(255,140,60,0)');g.fillStyle=sl;g.fillRect(0,hzY,Wc,Hc-hzY);}
}
function cityClear(){var cv=$('cityCv');if(cv){cv.style.display='none';}if(SKYG&&SKYG.starMat){SKYG.starMat.uniforms.lim.value=0;SKYG.starMat.uniforms.vis.value=1;}if(SKYG&&SKYG.mw)SKYG.mw.material.opacity=1;if(SKYG&&SKYG.faint)SKYG.faint.material.uniforms.op.value=1;}
$('surfLP').addEventListener('click',function(){if(!SURF)return;SURF.lp=!SURF.lp;lpBtn();toast(SURF.lp?'Işık kirliliği açık: şehrin ışıkları gökyüzünü aydınlatıyor, yalnızca en parlak yıldızlar ve gezegenler görünüyor.':'Işık kirliliği kapalı: şehir karanlıkta. Samanyolu ve binlerce sönük yıldız ortaya çıktı; şehirlerin çoğunda insanlar bu manzarayı hiç görmüyor.',6000);});
function clearMeteors(){while(MET.list.length)metKill(MET.list.length-1);MET.nx=.4;MET.bt=rnd(3,8);MET.bd=0;if(SPK){SPK.life.fill(0);SPK.c.fill(0);SPK.g.attributes.color.needsUpdate=true;}}
function surfCityLabel(dark){
  var c=CITIES[SURF.city],dt=new Date(J2000+simDays*864e5+c[3]*36e5),hh=('0'+dt.getUTCHours()).slice(-2),mm=('0'+dt.getUTCMinutes()).slice(-2);
  var sh=showerNow(),t=c[0].replace(/ \(.*\)/,'')+' · yerel saat '+hh+':'+mm+(dark>.5?' · gece':dark>.1?' · alacakaranlık':' · gündüz');
  if(sh&&sh.g>.03)t+=' · '+sh.s[0]+' meteor yağmuru (zirve '+sh.pk.getUTCDate()+' '+MONTHS[sh.pk.getUTCMonth()]+', kaynağı '+sh.s[6]+')';
  $('surfName').textContent=t;
}
$('goSurf').addEventListener('click',function(){enterSurface(focus);});

/* ================= GELGİT KİLİDİ ================= */
var lkInv=new THREE.Matrix4(),lkV=new THREE.Vector3(),lkC=new THREE.Vector3();
function applyLock(b){
  var c=lkC;b.tilt.getWorldPosition(c);var tb=b.parent||sunBody;lkV.copy(tb.pos).sub(c).normalize();
  lkInv.copy(b.tilt.matrixWorld).invert();lkV.transformDirection(lkInv);
  b.mesh.rotation.y=Math.atan2(-lkV.z,lkV.x);b.spinRot=b.mesh.rotation.y;
}
var LOCKF={none:1,thin:.85,earth:.55,thick:.25,co2:.06,h2:.1};
function lockTemps(b){var c=b.cl,h=b.hab;if(!c||!h)return null;var f=LOCKF[h.atm];if(f==null)f=.5;return {d:c.Ts*(1+.33*f),n:Math.max(40,c.Ts*(1-.8*f))};}
$('sLock').addEventListener('change',function(){var b=focus;if(!b)return;b.mod.lock=this.checked;
  toast(this.checked?b.def.name+' gelgit kilidinde: bir yüzü hep yıldıza bakıyor. Gündüz tarafı kavrulur, gece tarafı donar; yaşam olsa ancak aradaki alacakaranlık kuşağında olabilir.':b.def.name+' yeniden dönüyor',7000);});

/* ================= ÖLÇEK YOLCULUĞU ================= */
var TRIP=null;
var NEARSTARS=[['Proxima Centauri',217.4,-62.7,4.24,0xff8a60],['Alfa Centauri A/B',219.9,-60.8,4.37,0xfff0c0],['Barnard Yıldızı',269.5,4.7,5.96,0xff9a70],['Wolf 359',164.1,7,7.86,0xff7a50],['Lalande 21185',165.8,35.97,8.31,0xffa070],['Sirius',101.3,-16.7,8.6,0xcfe0ff],['Luyten 726-8',24.8,-17.95,8.73,0xff8060],['Ross 154',282.5,-23.8,9.7,0xff8060],['Epsilon Eridani',53.2,-9.5,10.5,0xffc890],['Procyon',114.8,5.2,11.46,0xfff6e0],['61 Cygni',316.7,38.7,11.4,0xffb070],['Tau Ceti',26,-15.9,11.9,0xfff0c0]];
var TRIP_STEPS=[
  {k:'3d',body:'earth',d:function(){return effVr(byId.earth)*4;},t:'Dünya',s:'Çap 12.742 km. Işık Dünya\'nın çevresini saniyede 7,5 kez dolaşır.'},
  {k:'3d',body:'earth',d:function(){return byId.moon?byId.moon.def.orbit*4:30;},t:'Dünya ve Ay',s:'Aradaki uzaklık 384.400 km; ışık bunu 1,3 saniyede geçer. Arasına tüm gezegenler sığar.'},
  {k:'3d',body:'sun',d:function(){return OVD()*.45;},t:'İç gezegenler',s:'Dünya Güneş\'ten 150 milyon km uzakta; Güneş ışığı bize 8 dakika 20 saniyede ulaşır.'},
  {k:'3d',body:'sun',d:function(){return OVD();},t:'Güneş Sistemi',s:'Neptün 4,5 milyar km uzakta: ışıkla 4 saat. Bu modelde uzaklıklar sıkıştırılmıştır.'},
  {k:'3d',body:'sun',d:function(){return OVD()*2.6;},t:'Kuiper Kuşağı ve Voyager 1',s:'Voyager 1 yaklaşık 170 AU uzakta, ışıkla bir günden az. Oort Bulutu ise neredeyse 1 ışık yılına kadar uzanır.'},
  {k:'2d',draw:'stars',t:'En yakın yıldızlar',s:'1 ışık yılı = 9,46 trilyon km. En yakın yıldız Proxima Centauri 4,24 ışık yılı uzakta; bugünkü en hızlı uzay aracıyla bile binlerce yıl sürer.'},
  {k:'2d',draw:'galaxy',t:'Samanyolu',s:'100.000 ışık yılı çapında, 100–400 milyar yıldızlı çubuklu sarmal galaksi. Güneş merkezden 26.000 ışık yılı uzakta, Orion kolunda; bir turu 230 milyon yıl sürer.'},
  {k:'2d',draw:'local',t:'Yerel Grup',s:'Samanyolu, Andromeda (2,5 milyon ışık yılı) ve Üçgen galaksisi ile 80\'den fazla cüce galaksi. Andromeda ile yaklaşık 4,5 milyar yıl sonra çarpışacağız.'},
  {k:'2d',draw:'universe',t:'Gözlemlenebilir evren',s:'Yaklaşık 93 milyar ışık yılı çapında, 2 trilyon kadar galaksi. Galaksiler ince iplikler ve boşluklardan oluşan kozmik bir ağ boyunca dizilir.'}
];
function startTrip(){vm.hidden=true;exitSurface(true);TRIP={i:-1,t:0,auto:true};$('trip').hidden=false;tripGo(0);}
function endTrip(){if(!TRIP)return;TRIP=null;$('trip').hidden=true;$('tripCv').style.opacity=0;focusBody('earth');}
function tripGo(i){
  if(!TRIP)return;i=clamp(i,0,TRIP_STEPS.length-1);TRIP.i=i;TRIP.t=0;var S=TRIP_STEPS[i];
  $('tripT').textContent=S.t;$('tripS').textContent=S.s;$('tripN').textContent=(i+1)+' / '+TRIP_STEPS.length;
  $('tripPrev').disabled=i===0;$('tripNext').textContent=i===TRIP_STEPS.length-1?'Bitir':'İleri';
  if(S.k==='3d'){$('tripCv').style.opacity=0;focusBody(S.body,{dist:S.d()});}
  else{$('tripCv').style.opacity=1;}
}
var TRIPSEED=null;
function tripDraw(dt){
  if(!TRIP)return;TRIP.t+=dt;var S=TRIP_STEPS[TRIP.i];
  if(TRIP.auto&&TRIP.t>9&&TRIP.i<TRIP_STEPS.length-1)tripGo(TRIP.i+1);
  if(S.k!=='2d')return;
  var cv2=$('tripCv'),dpr=Math.min(devicePixelRatio||1,2),Wc=cv2.clientWidth,Hc=cv2.clientHeight;
  if(cv2.width!==Math.round(Wc*dpr)){cv2.width=Math.round(Wc*dpr);cv2.height=Math.round(Hc*dpr);}
  var g=cv2.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#02030a';g.fillRect(0,0,Wc,Hc);
  var z=1+2.2*Math.exp(-TRIP.t*1.6),cx=Wc/2,cy=Hc*.46,R=Math.min(Wc,Hc)*.36*(1/z)*1.0,a=clamp(TRIP.t*1.5,0,1);g.globalAlpha=a;
  if(!TRIPSEED){TRIPSEED=[];for(var i=0;i<4000;i++)TRIPSEED.push([Math.random(),Math.random(),Math.random(),Math.random()]);}
  g.font='500 11px '+getComputedStyle(document.body).fontFamily;g.textAlign='center';
  function dot(x,y,r,c,glow){if(glow){var gr=g.createRadialGradient(x,y,0,x,y,r*glow);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*glow,0,TAU);g.fill();}g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
  function lbl(t,x,y,c){g.fillStyle=c||'rgba(220,230,255,.85)';g.fillText(t,x,y);}
  if(S.draw==='stars'){
    for(var i=0;i<600;i++){var s=TRIPSEED[i];dot(s[0]*Wc,s[1]*Hc,.6+s[2]*.6,'rgba(200,210,255,'+(.15+s[3]*.3)+')');}
    g.strokeStyle='rgba(140,170,230,.18)';g.lineWidth=1;[4,8,12].forEach(function(ly){g.beginPath();g.arc(cx,cy,R*ly/12.5,0,TAU);g.stroke();lbl(ly+' ışık yılı',cx,cy-R*ly/12.5-4,'rgba(150,180,240,.55)');});
    dot(cx,cy,3.5,'#ffe9a0',4);lbl('Güneş',cx,cy+16,'#ffe9a0');
    NEARSTARS.forEach(function(st){var an=st[1]*D2R,rr=R*st[3]/12.5*Math.cos(st[2]*D2R*.5),x=cx+Math.cos(an)*rr,y=cy-Math.sin(an)*rr*.75;var c='#'+('00000'+st[4].toString(16)).slice(-6);dot(x,y,2.6,c,4);lbl(st[0]+' · '+st[3].toString().replace('.',','),x,y-9);});
  }else if(S.draw==='galaxy'){
    var rot=TRIP.t*.02;
    for(var i=0;i<4000;i++){var s=TRIPSEED[i],arm=Math.floor(s[0]*4),t=s[1],r=Math.pow(t,.9)*R,th=arm*Math.PI/2+Math.log(1+r/R*6)*2.4+rot+(s[2]-.5)*.55*(1-t*.4);
      if(s[3]<.22){r=Math.pow(s[1],2)*R*.28;th=s[2]*TAU;}
      var x=cx+Math.cos(th)*r,y=cy+Math.sin(th)*r*.62,br=r<R*.25?'255,225,170':(s[3]>.8?'255,170,200':'190,205,255');
      g.fillStyle='rgba('+br+','+(.25+.5*(1-t))+')';g.fillRect(x,y,1.3,1.3);}
    var gr=g.createRadialGradient(cx,cy,0,cx,cy,R*.3);gr.addColorStop(0,'rgba(255,230,180,.75)');gr.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy,R*.3,R*.2,0,0,TAU);g.fill();
    var sa=2.1+rot,sr=R*.52,sx=cx+Math.cos(sa)*sr,sy=cy+Math.sin(sa)*sr*.62;g.strokeStyle='#8fd0ff';g.lineWidth=1.5;g.beginPath();g.arc(sx,sy,7,0,TAU);g.stroke();lbl('Buradasınız',sx,sy-12,'#8fd0ff');
    lbl('100.000 ışık yılı',cx,cy+R*.75,'rgba(150,180,240,.7)');g.strokeStyle='rgba(150,180,240,.4)';g.beginPath();g.moveTo(cx-R,cy+R*.68);g.lineTo(cx+R,cy+R*.68);g.stroke();
  }else if(S.draw==='local'){
    function gal(x,y,rx,ry,ang,c,name){g.save();g.translate(x,y);g.rotate(ang);var gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.scale(1,ry/rx);g.beginPath();g.arc(0,0,rx,0,TAU);g.fill();g.restore();if(name)lbl(name,x,y+ry+14);}
    for(var i=0;i<300;i++){var s=TRIPSEED[i];dot(s[0]*Wc,s[1]*Hc,.5,'rgba(200,210,255,.2)');}
    var mw=[cx-R*.55,cy+R*.1],an=[cx+R*.55,cy-R*.15];
    gal(mw[0],mw[1],22,10,.3,'rgba(220,215,255,.9)','Samanyolu');gal(an[0],an[1],34,12,-.5,'rgba(230,220,255,.9)','Andromeda');gal(cx+R*.8,cy+R*.3,14,9,.8,'rgba(210,210,255,.7)','Üçgen');
    gal(mw[0]+14,mw[1]+12,5,4,0,'rgba(230,230,255,.7)','');gal(mw[0]+9,mw[1]+17,3,3,0,'rgba(230,230,255,.6)','');lbl('Macellan Bulutları',mw[0]+12,mw[1]+34,'rgba(200,210,240,.6)');
    for(var i=300;i<360;i++){var s=TRIPSEED[i];dot(cx+(s[0]-.5)*R*2.2,cy+(s[1]-.5)*R*1.4,1,'rgba(220,220,255,.45)');}
    g.setLineDash([4,5]);g.strokeStyle='rgba(150,180,240,.45)';g.beginPath();g.moveTo(mw[0],mw[1]);g.lineTo(an[0],an[1]);g.stroke();g.setLineDash([]);lbl('2,5 milyon ışık yılı',(mw[0]+an[0])/2,(mw[1]+an[1])/2-8,'rgba(150,180,240,.8)');
  }else{
    for(var i=0;i<4000;i++){var s=TRIPSEED[i],fx=s[0],fy=s[1];var fil=Math.abs(Math.sin(fx*13.0+Math.sin(fy*9)*2)+Math.sin(fy*11+Math.cos(fx*7)*2));
      if(fil>.5&&s[3]>.25)continue;var x=cx+(fx-.5)*R*2.6,y=cy+(fy-.5)*R*2.2;var dd=Math.hypot(x-cx,y-cy);if(dd>R*1.2)continue;
      g.fillStyle='rgba('+(s[2]>.5?'255,200,170':'180,200,255')+','+(.25+s[2]*.45)+')';g.fillRect(x,y,1.2,1.2);}
    g.strokeStyle='rgba(150,180,240,.35)';g.beginPath();g.arc(cx,cy,R*1.2,0,TAU);g.stroke();dot(cx,cy,2,'#8fd0ff');lbl('Buradayız',cx,cy-8,'#8fd0ff');
  }
  g.globalAlpha=1;
}
$('tripPrev').addEventListener('click',function(){if(TRIP){TRIP.auto=false;tripGo(TRIP.i-1);}});
$('tripNext').addEventListener('click',function(){if(!TRIP)return;TRIP.auto=false;if(TRIP.i>=TRIP_STEPS.length-1)endTrip();else tripGo(TRIP.i+1);});
$('tripClose').addEventListener('click',endTrip);
$('vTrip').addEventListener('click',startTrip);
