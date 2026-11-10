/* Celestia · Sahne kurulumu, gerçek gökyüzü, Güneş dokuları, kuyruklu yıldızlar ve cisim oluşturma.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- sahne ---------- */
var cv=$('stage');
var renderer;
try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});}
catch(err){if(window.THREE)window.__celestiaFail('Bu tarayıcıda WebGL çalışmıyor','Donanım hızlandırmayı açmayı ya da başka bir tarayıcıyı denemeyi dene.');throw err;}
var ctxTimer=0;
cv.addEventListener('webglcontextlost',function(e){
  e.preventDefault();clearTimeout(ctxTimer);toast('Grafik bağlamı kesildi, geri yükleniyor…',3000);
  ctxTimer=setTimeout(function(){window.__celestiaFail('Grafik bağlamı geri gelmedi','Tarayıcı grafik belleğini geri vermedi. Sayfayı yenile.');},6000);
},false);
cv.addEventListener('webglcontextrestored',function(){clearTimeout(ctxTimer);toast('Grafikler geri yüklendi',2000);},false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.setClearColor(0x04050a,1);
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(50,1,.1,9000*Math.max(1,DS));
var W=1,H=1,maxDpr=Math.min(devicePixelRatio||1,LOWQ?1.5:2),curDpr=maxDpr,perfEma=.016,perfT=0;
function resize(){
  W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;
  renderer.setPixelRatio(curDpr);
  renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
  var app=$('app'),dock=$('dock');
  app.style.setProperty('--dockh',(dock.offsetHeight+12)+'px');
  app.style.setProperty('--minih',($('mini').offsetParent?162:0)+'px');
}
addEventListener('resize',resize);

scene.add(new THREE.AmbientLight(0x4a5478,.07));
var sunLight=new THREE.PointLight(0xfff0dc,1.85,0);scene.add(sunLight);

// samanyolu gökyüzü
var SKYG=null;
var SKYDATA=window.CELESTIA_SKY;
/* ---------- gerçek gökyüzü: Yale/Hipparcos yıldızları, Samanyolu, takımyıldızlar ---------- */
var EPS=23.4393*D2R,CE=Math.cos(EPS),SE=Math.sin(EPS);
function skyDir(ra,de){ra*=D2R;de*=D2R;var x=Math.cos(de)*Math.cos(ra),y=Math.cos(de)*Math.sin(ra),z=Math.sin(de);var ye=y*CE+z*SE,ze=-y*SE+z*CE;return new THREE.Vector3(x,ze,-ye);}
var DSOS=[
  ['Andromeda Galaksisi',10.68,41.27,[3.2,1],0xd8d2ff,.55,'Çıplak gözle görülebilen en uzak cisim: 2,5 milyon ışık yılı uzaklıkta, yaklaşık 1 trilyon yıldızlı sarmal galaksi. Yaklaşık 4,5 milyar yıl sonra Samanyolu ile çarpışacak.'],
  ['Büyük Macellan Bulutu',80.89,-69.76,[2.6,2],0xe6e0ff,.45,'Samanyolu\'nun uydu galaksisi, 160.000 ışık yılı uzakta. Güney yarım küreden görülür.'],
  ['Küçük Macellan Bulutu',13.19,-72.83,[1.6,1.1],0xe6e0ff,.35,'Samanyolu\'nun ikinci uydu galaksisi, 200.000 ışık yılı uzakta.'],
  ['Orion Bulutsusu',83.82,-5.39,[1,1],0xff9ac8,.5,'Yeni yıldızların doğduğu dev bir gaz bulutu, 1.350 ışık yılı uzakta. Avcı\'nın kılıcında çıplak gözle bulanık bir leke olarak görünür.'],
  ['Ülker (Pleiades)',56.75,24.12,[1.2,1.2],0xa9c8ff,.5,'Yaklaşık 100 milyon yaşında genç, mavi bir yıldız kümesi, 440 ışık yılı uzakta. Gözle 6-7 yıldızı seçilebilir.'],
  ['Samanyolu merkezi',266.42,-29.01,[1.3,1.3],0xffe0b0,.25,'Galaksimizin merkezi, 26.000 ışık yılı uzakta. Orada Güneş\'in 4 milyon katı kütleli Yay A* kara deliği bulunur. Toz bulutları yüzünden doğrudan görülmez.'],
  ['Omega Centauri',201.7,-47.48,[.9,.9],0xfff0d0,.4,'Samanyolu\'nun en büyük küresel yıldız kümesi: yaklaşık 10 milyon yıldız, 17.000 ışık yılı uzakta.'],
  ['Karina Bulutsusu',161.27,-59.87,[1.4,1.1],0xff9ab0,.35,'Samanyolu\'nun en parlak bulutsularından biri. İçinde Güneş\'ten 100 kat büyük kararsız yıldız Eta Carinae var.'],
  ['Lagün Bulutsusu',270.9,-24.38,[.9,.6],0xffa0c0,.3,'Yay takımyıldızında, yıldız oluşum bölgesi, 4.100 ışık yılı uzakta.'],
  ['Herkül Kümesi (M13)',250.42,36.46,[.6,.6],0xfff4d8,.3,'Kuzey göğünün en parlak küresel kümesi: yaklaşık 300.000 yıldız, 22.000 ışık yılı uzakta.'],
  ['Arı Kovanı Kümesi',130.1,19.67,[1,1],0xfff4e0,.3,'Yengeç takımyıldızında açık yıldız kümesi, 600 ışık yılı uzakta.'],
  ['Üçgen Galaksisi',23.46,30.66,[1.1,.7],0xd8d2ff,.25,'Yerel Grup\'un üçüncü büyük galaksisi, 2,7 milyon ışık yılı uzakta. Çok karanlık gökyüzünde gözle sınırda görülür.']
];
var STARINFO={'Sirius':'Gece gökyüzünün en parlak yıldızı, 8,6 ışık yılı uzakta.','Alfa Centauri':'Güneş\'e en yakın yıldız sistemi, 4,4 ışık yılı. Sistemdeki Proxima Centauri 4,2 ışık yılı ile en yakın yıldızdır.','Betelgeuse':'Kırmızı süperdev; Güneş\'in yerinde olsa Jüpiter\'in yörüngesine uzanırdı. Bir gün süpernova olarak patlayacak.','Vega':'Lir takımyıldızının parlak yıldızı, 25 ışık yılı uzakta. Yaklaşık 12.000 yıl sonra Kutup Yıldızı olacak.','Kutup Yıldızı (Polaris)':'Dünya\'nın dönme ekseni neredeyse ona baktığı için gece boyunca yerinden oynamaz; kuzeyi gösterir.','Antares':'Akrep\'in kalbi, kırmızı süperdev.','Canopus':'Gökyüzünün en parlak ikinci yıldızı.','Rigel':'Avcı\'nın ayağındaki mavi süperdev.','Aldebaran':'Boğa\'nın gözü, turuncu dev yıldız.','Arcturus':'Kuzey göğünün en parlak yıldızı, turuncu dev.'};
var showSkyNames=false,skyLabels=[];
function bvColor(bv){var T=[[-.4,[155,176,255]],[0,[202,215,255]],[.3,[248,247,255]],[.6,[255,244,234]],[1,[255,214,170]],[1.5,[255,184,120]],[2,[255,150,90]]];if(bv<=T[0][0])return T[0][1];for(var i=1;i<T.length;i++){if(bv<=T[i][0]){var t=(bv-T[i-1][0])/(T[i][0]-T[i-1][0]);return mix(T[i-1][1],T[i][1],t);}}return T[T.length-1][1];}
function milkyWayTex(){
  var W=LOWQ?1024:2048,H=W/2,c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,W,H);g.globalCompositeOperation='lighter';
  var al=[.05,.055,.07,.09,.12];
  SKYDATA.mw.forEach(function(level,li){
    g.fillStyle='rgba(205,196,184,'+al[li]+')';
    level.forEach(function(poly){
      for(var off=-1;off<=1;off++){
        g.beginPath();
        poly.forEach(function(ring){
          var pu=null;
          for(var k=0;k<ring.length;k+=2){
            var d=skyDir(ring[k]/4,ring[k+1]/4),u=Math.atan2(d.z,-d.x)/TAU;if(u<0)u+=1;
            if(pu!=null){while(u-pu>.5)u-=1;while(u-pu<-.5)u+=1;}pu=u;
            var x=(u+off)*W,y=Math.acos(clamp(d.y,-1,1))/Math.PI*H;
            if(k===0)g.moveTo(x,y);else g.lineTo(x,y);
          }
          g.closePath();
        });
        g.fill('evenodd');
      }
    });
  });
  var c2=document.createElement('canvas');c2.width=W;c2.height=H;var g2=c2.getContext('2d');
  try{g2.filter='blur('+(W/400)+'px)';}catch(e){}
  g2.drawImage(c,0,0);g2.filter='none';
  var t=new THREE.CanvasTexture(c2);t.encoding=THREE.sRGBEncoding;return t;
}
function addSky(){
  SKYG=new THREE.Group();scene.add(SKYG);
  var m=new THREE.Mesh(new THREE.SphereGeometry(5200,64,40),new THREE.MeshBasicMaterial({map:milkyWayTex(),side:THREE.BackSide,depthWrite:false,fog:false,transparent:true,opacity:.9}));
  m.renderOrder=-10;SKYG.add(m);SKYG.mw=m;
  var S=SKYDATA.s,n=S.length/4,pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n),R=4200;
  for(var i=0;i<n;i++){
    var d=skyDir(S[i*4]/20,S[i*4+1]/20),mag=S[i*4+2]/10,c=bvColor(S[i*4+3]/100),b=clamp(.22+(6.2-mag)*.17,.2,1.35);
    pos[i*3]=d.x*R;pos[i*3+1]=d.y*R;pos[i*3+2]=d.z*R;
    col[i*3]=c[0]/255*b;col[i*3+1]=c[1]/255*b;col[i*3+2]=c[2]/255*b;sz[i]=clamp(1.1+(4.6-mag)*.55,1.1,4.6);
  }
  var gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));gg.setAttribute('color',new THREE.BufferAttribute(col,3));gg.setAttribute('sz',new THREE.BufferAttribute(sz,1));
  var sm=new THREE.ShaderMaterial({uniforms:{dpr:{value:Math.min(devicePixelRatio||1,2)},lim:{value:0},vis:{value:1}},vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'attribute float sz;varying vec3 vC;uniform float dpr;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=sz*dpr;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float lim;uniform float vis;varying vec3 vC;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.0;float a=exp(-r*r*5.0)+.25*exp(-r*r*1.2);float L=max(max(vC.r,vC.g),vC.b);float k=lim>0.0?clamp((L-lim)/(1.2-lim),0.0,1.0):1.0;gl_FragColor=vec4(vC*a*1.25*k*vis,1.0);}'});
  var pts=new THREE.Points(gg,sm);pts.frustumCulled=false;SKYG.add(pts);SKYG.starMat=sm;
  var lp=[];SKYDATA.l.forEach(function(ln){for(var k=0;k+3<ln.length;k+=2){var a=skyDir(ln[k]/20,ln[k+1]/20).multiplyScalar(4100),b=skyDir(ln[k+2]/20,ln[k+3]/20).multiplyScalar(4100);lp.push(a.x,a.y,a.z,b.x,b.y,b.z);}});
  var lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lp),3));
  SKYG.cons=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x7f9fd0,transparent:true,opacity:.28,depthWrite:false}));SKYG.cons.visible=false;SKYG.cons.frustumCulled=false;SKYG.add(SKYG.cons);
  var gt=glowTex([[0,'rgba(255,255,255,.8)'],[.4,'rgba(255,255,255,.25)'],[1,'rgba(255,255,255,0)']]);
  DSOS.forEach(function(o){var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:o[4],transparent:true,opacity:o[5],depthWrite:false,blending:THREE.AdditiveBlending}));sp.position.copy(skyDir(o[1],o[2]).multiplyScalar(4000));sp.scale.set(o[3][0]*40,o[3][1]*40,1);SKYG.add(sp);});
  var box=$('skyLabels');
  function addL(name,ra,de,cls,info){var el=document.createElement('button');el.className='skl '+cls;el.textContent=name;el.tabIndex=-1;if(info)el.addEventListener('click',function(){toast(name+': '+info,7000);});box.appendChild(el);skyLabels.push({el:el,d:skyDir(ra,de)});}
  SKYDATA.c.forEach(function(c){if(c[3]<=2)addL(c[2],c[0],c[1],'con');});
  SKYDATA.n.forEach(function(s){addL(s[2],s[0],s[1],'star',STARINFO[s[2]]||null);});
  DSOS.forEach(function(o){addL(o[0],o[1],o[2],'dso',o[6]);});
}
function updateSkyLabels(){
  var box=$('skyLabels');box.hidden=!showSkyNames;if(!showSkyNames)return;
  for(var i=0;i<skyLabels.length;i++){var L=skyLabels[i];tmpV.copy(L.d).multiplyScalar(3000).add(camera.position).project(camera);
    if(tmpV.z>1||Math.abs(tmpV.x)>1.05||Math.abs(tmpV.y)>1.05){L.el.style.display='none';continue;}
    L.el.style.display='';L.el.style.transform='translate('+((tmpV.x*.5+.5)*W)+'px,'+((-tmpV.y*.5+.5)*H)+'px) translate(-50%,-50%)';}
}

// asteroit kuşakları: her taş kendi Kepler yörüngesinde; patlama, kara delik, yıldız ve gezegenlerden etkilenir
var belt,kuiper,BELTS=[];
function beltSys(kind,n,gen,size,parent){
  var P=new Float32Array(n*3),C=new Float32Array(n*3),o={kind:kind,n:n,a:new Float32Array(n),ang:new Float32Array(n),y:new Float32Array(n),R:new Float32Array(n),st:new Uint8Array(n),v:new Float32Array(n*3),t:new Float32Array(n),c0:new Float32Array(n*3),off:new Float32Array(n),P:P,C:C};
  for(var i=0;i<n;i++){var q=gen(i);o.a[i]=q[0];o.ang[i]=q[1];o.y[i]=q[2];o.off[i]=q[4]||0;o.R[i]=orbitR(q[0]);o.c0[i*3]=q[3][0];o.c0[i*3+1]=q[3][1];o.c0[i*3+2]=q[3][2];C[i*3]=q[3][0];C[i*3+1]=q[3][1];C[i*3+2]=q[3][2];}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));
  o.pts=new THREE.Points(g,new THREE.PointsMaterial({vertexColors:true,size:size,sizeAttenuation:false,transparent:true,opacity:.55,depthWrite:false,map:dotTex(),alphaTest:.05}));o.pts.frustumCulled=false;
  (parent||scene).add(o.pts);BELTS.push(o);beltPlace(o,0);return o;
}
function rockCol(){var r=Math.random();return r<.55?[.72,.68,.62]:r<.8?[.78,.62,.5]:[.5,.5,.54];}
function addBelt(){
  BELTS=[];
  var GAPS=[[2.5,.035],[2.82,.025],[2.95,.02],[3.27,.03]];
  var m=beltSys('main',LOWQ?4500:6000,function(){var a;do{a=2.1+1.25*Math.pow(Math.random(),.9);}while(GAPS.some(function(g){return Math.abs(a-g[0])<g[1];}));return [a,Math.random()*TAU,(Math.random()-.5)*2.2*(.4+Math.random()),rockCol()];},LOWQ?1.3:1.5);
  belt=m.pts;
  beltSys('trojan',LOWQ?500:800,function(){var L=Math.random()<.5?1:-1;return [5.2*(1+(Math.random()-.5)*.08),0,(Math.random()-.5)*5*Math.random(),[.62,.55,.5],L*(Math.PI/3)+(Math.random()-.5)*.55];},LOWQ?1.2:1.35,belt);
  var k=beltSys('kuiper',LOWQ?3500:4500,function(){return [30+20*Math.pow(Math.random(),.8),Math.random()*TAU,(Math.random()-.5)*16*Math.random(),[.56,.64,.77]];},LOWQ?1.4:1.6);
  kuiper=k.pts;
}
function resetBelts(){BELTS.forEach(function(o){o.pts.parent&&o.pts.parent.remove(o.pts);o.pts.geometry.dispose();o.pts.material.dispose();});addBelt();BELTDIRTY=true;BELTCOPY=null;}
var BV=new THREE.Vector3();
/* kuşak durumu zaman çizelgesinde: değiştiğinde kopyası alınır, geri sarınca geri yüklenir */
var BELTDIRTY=true,BELTCOPY=null,BELTCOPIES=[];
function beltCopy(){
  if(!BELTDIRTY&&BELTCOPY)return BELTCOPY;
  BELTCOPY={L:BELTS.map(function(o){return {st:o.st.slice(),a:o.a.slice(),R:o.R.slice(),y:o.y.slice()};})};BELTDIRTY=false;
  BELTCOPIES.push(BELTCOPY);
  if(BELTCOPIES.length>120){var keep=[BELTCOPIES[0]],h=BELTCOPIES.length>>1;for(var k=1;k<BELTCOPIES.length;k++){var c=BELTCOPIES[k];if(k<h&&k%2===1){c.L=keep[keep.length-1].L;c.gone=true;}else keep.push(c);}BELTCOPIES=keep;}
  return BELTCOPY;
}
function beltRestore(c){
  if(!c||!c.L||(c===BELTCOPY&&!BELTDIRTY))return false;
  BELTS.forEach(function(o,k){var q=c.L[k];if(!q||q.st.length!==o.n)return;var C=o.C,P=o.P;
    for(var i=0;i<o.n;i++){var st=q.st[i];if(st===1)st=2;o.st[i]=st;o.a[i]=q.a[i];o.R[i]=q.R[i];o.y[i]=q.y[i];o.t[i]=0;o.v[i*3+1]=0;
      if(st===2)P[i*3+1]=1e7;else if(st===0){C[i*3]=o.c0[i*3];C[i*3+1]=o.c0[i*3+1];C[i*3+2]=o.c0[i*3+2];}}
    o.pts.geometry.attributes.color.needsUpdate=true;o.pts.geometry.attributes.position.needsUpdate=true;});
  BELTCOPY=c;BELTDIRTY=false;return true;
}
function beltPlace(o,dDays){
  var P=o.P,n=o.n,w0=TAU/365.25*Math.sqrt(Math.max(.01,sunMass)),jup=byId&&byId.jupiter,jOk=o.kind==='trojan'&&jup&&!isGone(jup),jA=jOk?jup.ang:0,jR=jOk?jup.pivot.position.length():0;
  for(var i=0;i<n;i++){var st=o.st[i];if(st===2)continue;
    if(st===1){P[i*3]+=o.v[i*3]*SIMDT;P[i*3+1]+=o.v[i*3+1]*SIMDT;P[i*3+2]+=o.v[i*3+2]*SIMDT;continue;}
    if(o.kind==='trojan'&&st===0&&jOk){var an=jA+o.off[i]+.06*Math.sin(simDays/150+i),rr=jR*o.a[i]/5.2;o.ang[i]=an;P[i*3]=Math.cos(an)*rr;P[i*3+1]=o.y[i];P[i*3+2]=-Math.sin(an)*rr;continue;}
    o.ang[i]+=w0/Math.pow(o.a[i],1.5)*dDays;var a=o.ang[i],R=o.R[i];P[i*3]=Math.cos(a)*R;P[i*3+1]=o.y[i];P[i*3+2]=-Math.sin(a)*R;}
}
function beltKill(o,i,vx,vy,vz,hot){o.st[i]=1;o.v[i*3]=vx;o.v[i*3+1]=vy;o.v[i*3+2]=vz;o.t[i]=0;if(hot){o.C[i*3]=1;o.C[i*3+1]=.75;o.C[i*3+2]=.45;}}
function updateBelts(dDays,dt){
  if(!BELTS.length)return;
  var S=EXO.sn,shR=S?S.t*OVD()*.35:0,bh=sunType===6&&!SYS,hz=bh?effVr(sunBody)*bhMassK():0,pullR=bh?hz*3.5:0,star=effVr(sunBody)*.95;
  var gp=gravityOn?BODIES.filter(function(b){return b.grav&&!b.parent&&!isGone(b);}):[];
  BELTS.forEach(function(o){
    if(o.kind==='trojan'&&!(byId.jupiter&&!isGone(byId.jupiter))){for(var q=0;q<o.n;q++)if(o.st[q]===0&&o.a[q]>4)o.R[q]=orbitR(o.a[q]);}
    beltPlace(o,dDays);
    var P=o.P,C=o.C,n=o.n,ch=false;
    for(var i=0;i<n;i++){var st=o.st[i];if(st===2)continue;var x=P[i*3],y=P[i*3+1],z=P[i*3+2];
      if(st===1){o.t[i]+=dt;var f=Math.max(0,1-o.t[i]/3.5);C[i*3]*=.985;C[i*3+1]*=.975;C[i*3+2]*=.965;if(f<=0){o.st[i]=2;P[i*3+1]=1e7;}ch=true;continue;}
      if(st===3){var r3=Math.sqrt(x*x+z*z);o.R[i]*=Math.exp(-dt*.35);o.ang[i]+=dt*2.5*Math.pow(hz/Math.max(r3,hz),1.5);o.y[i]*=Math.exp(-dt*.8);var hot=clamp(1-(o.R[i]-hz)/(pullR-hz),0,1);C[i*3]=.8+.2*hot;C[i*3+1]=.55+.3*hot*hot;C[i*3+2]=.35*hot;ch=true;
        if(o.R[i]<hz*1.3){o.st[i]=2;P[i*3+1]=1e7;feedBH(sunBody,.0015);}continue;}
      var Rr=o.R[i];
      if(S){BV.set(x,y,z).sub(S.c);var dd=BV.length();if(dd<shR){var near=S.cb!==sunBody||o.a[i]<14,sp=OVD()*(near?.18:.05)*(.6+Math.random()*.8);BV.normalize();
          if(near){beltKill(o,i,BV.x*sp,BV.y*sp,BV.z*sp,true);}else if(!o.v[i*3+1]){o.a[i]*=1+Math.random()*.2;o.R[i]=orbitR(o.a[i]);o.y[i]*=1.6;o.v[i*3+1]=1;}ch=true;continue;}}
      if(bh&&Rr<pullR){o.st[i]=3;ch=true;continue;}
      if(Rr<star){beltKill(o,i,0,0,0,true);ch=true;continue;}
      for(var k=0;k<gp.length;k++){var b=gp[k],ri=effVr(b)*7+2*DS,dx=x-b.gx,dz=z-b.gz;if(Math.abs(dx)>ri||Math.abs(dz)>ri)continue;var dy=y-b.gy,d2=dx*dx+dy*dy+dz*dz;
        if(d2<ri*ri){if(d2<effVr(b)*effVr(b)*1.2){beltKill(o,i,0,0,0,true);}else{o.a[i]=Math.max(.5,o.a[i]*(1+(Math.random()-.5)*.12));o.R[i]=orbitR(o.a[i]);o.y[i]+=(Math.random()-.5)*ri*.4;o.ang[i]+=(Math.random()-.5)*.05;C[i*3]=Math.min(1,C[i*3]+.08);C[i*3+1]=Math.min(1,C[i*3+1]+.06);}ch=true;break;}}
    }
    o.pts.geometry.attributes.position.needsUpdate=true;if(ch){o.pts.geometry.attributes.color.needsUpdate=true;BELTDIRTY=true;}
  });
}

function atmoMesh(R,color,scale){
  var m=new THREE.ShaderMaterial({
    uniforms:{c:{value:new THREE.Color(color)},k:{value:1}},
    vertexShader:'varying vec3 vN;varying vec3 vL;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vL=normalize((viewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 c;uniform float k;varying vec3 vN;varying vec3 vL;void main(){float i=pow(max(0.0,0.72-dot(vN,vec3(0.0,0.0,1.0))),3.0)*1.5;float ld=dot(normalize(vN),vL);float lit=smoothstep(-0.45,0.35,ld);float band=exp(-pow(ld/0.28,2.0));vec3 col=mix(c,c*vec3(1.5,0.75,0.5)+vec3(0.25,0.08,0.0),band*0.6);gl_FragColor=vec4(col,1.0)*i*k*(0.1+0.9*lit);}',
    side:THREE.BackSide,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  return new THREE.Mesh(new THREE.SphereGeometry(R*scale,64,40),m);
}
function earthMaterial(day,night,height,U){
  var uni={dayT:{value:day},nightT:{value:night},heightT:{value:height},waterT:{value:DUMMY},topoT:{value:DUMMY},useReal:{value:0},bumpK:{value:0}};Object.keys(U).forEach(function(k){uni[k]=U[k];});
  return new THREE.ShaderMaterial({
    uniforms:uni,
    vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vP;varying vec3 vWP;varying vec3 vObj;varying vec3 vT;varying vec3 vB;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec3 cE=cross(vec3(0.0,1.0,0.0),normal);if(length(cE)<1e-4)cE=vec3(1.0,0.0,0.0);vT=normalize(normalMatrix*normalize(cE));vB=normalize(cross(vN,vT));vWP=(modelMatrix*vec4(position,1.0)).xyz;vObj=normalize(position);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vWP;varying vec3 vObj;\n'+SH_PARS+[
      'uniform sampler2D waterT;uniform sampler2D topoT;uniform float useReal;uniform float bumpK;varying vec3 vT;varying vec3 vB;uniform sampler2D dayT;uniform sampler2D nightT;uniform sampler2D heightT;varying vec2 vUv;varying vec3 vN;varying vec3 vP;',
      'void main(){',
      ' vec3 n=normalize(vN);if(bumpK>0.0){float e=1.0/2048.0;float h0=texture2D(topoT,vUv).r;float hx=texture2D(topoT,vUv+vec2(e,0.0)).r-h0;float hy=texture2D(topoT,vUv+vec2(0.0,e)).r-h0;n=normalize(n-(hx*normalize(vT)+hy*normalize(vB))*bumpK);}vec3 sp=(viewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;vec3 L=normalize(sp-vP);float d=dot(n,L);',
      ' vec3 dayC=pow(texture2D(dayT,vUv).rgb,vec3(2.2));vec3 nightC=pow(texture2D(nightT,vUv).rgb,vec3(2.2));',
      ' float hgt=texture2D(heightT,vUv).r;',
      ' float water=mix(step(dayC.r*1.3,dayC.b)*step(dayC.g,dayC.b*1.2),texture2D(waterT,vUv).r,useReal);',
      ' float level=mix(0.30,0.55,clamp(clim.w,0.0,1.0));',
      ' float dry=step(hgt,0.55)*step(level,hgt)*water;',
      ' vec3 seabed=mix(vec3(.05,.03,.015),vec3(.2,.13,.07),vn3(vObj*6.0));',
      ' dayC=mix(dayC,seabed,max(dry,water*clim.y));',
      ' water=water*(1.0-max(dry,clim.y));',
      ' dayC=mix(dayC,vec3(.02,.012,.008)+dayC*.2,clim.y*.8);',
      ' float lat=abs(vUv.y*2.0-1.0);',
      ' float iceM=0.0;if(clim.x>.001)iceM=smoothstep(1.02-clim.x*1.1,1.12-clim.x*1.1,lat+(fbm3(vObj*5.0)-.5)*.18);',
      ' dayC=mix(dayC,vec3(.75,.85,1.0),iceM);water*=1.0-iceM;',
      ' {float la=asin(clamp(vObj.y,-1.0,1.0))*57.2958;float hs=seas*sign(la);float aa=abs(la);',
      '  float Tq=30.0-.5*aa+12.0*hs*(aa/50.0)-30.0*max(hgt-.55,0.0)+dTg+(fbm3(vObj*9.0)-.5)*9.0;',
      '  float snow=smoothstep(1.5,-3.5,Tq)*(1.0-water)*(1.0-clim.y);dayC=mix(dayC,vec3(.84,.88,.93)*(.92+.16*vn3(vObj*40.0)),snow*.93);}',
      ' vec3 lem=vec3(0.0);{float mlt=max(melt,smoothstep(.15,.45,clim.z));if(mlt>.001){vec3 lc=lavaSurf(vObj,clim.z,tm,lem);dayC=mix(dayC,lc,mlt);water*=1.0-mlt;}',
      '  if(melt>.5&&clim.z<.05&&clim.y<.05&&clim.w>.35){water=1.0-iceM;dayC=mix(dayC,vec3(.01,.045,.12),water);}}',
      ' if(lockP.x>0.0){float dn=vObj.x;float nt=smoothstep(.08,-.3,dn);float dy=smoothstep(.25,.95,dn);dayC=mix(dayC,vec3(.8,.86,.95),nt*lockP.z);water*=1.0-nt*lockP.z;dayC=mix(dayC,vec3(.16,.09,.05),dy*lockP.y);water*=1.0-dy*lockP.y;}',
      ' float shd=shadowOcc(vWP);',
      ' float lit=smoothstep(-0.08,0.22,d);float diff=(max(d,0.0)*1.85+0.012)*(1.0-0.92*shd)*lightK;',
      ' vec3 V=normalize(-vP);vec3 Hh=normalize(L+V);',
      ' float spec=pow(max(dot(n,Hh),0.0),70.0)*water*0.9*step(0.0,d)*(1.0-shd)*lightK;',
      ' dayC*=1.0+det*(fbm3(vObj*70.0)*.6+fbm3(vObj*170.0)*.4-.45)*.55*(1.0-water);',
 ' vec3 col=dayC*diff+vec3(spec);',
 ' float fr=pow(1.0-max(dot(n,V),0.0),3.0);col+=vec3(.22,.45,1.0)*fr*.55*smoothstep(-.25,.45,d)*lightK*(1.0-clim.y);',
      ' float tw=smoothstep(-0.14,0.0,d)*(1.0-smoothstep(0.0,0.22,d));col+=vec3(0.95,0.4,0.18)*tw*0.015*lightK;',
      ' col=mix(nightC*2.2*civ+dayC*0.005,col,lit);',
      ' if(aur>.01&&lit<.99){float al=abs(vObj.y);float ab=exp(-pow((al-.9)/.05,2.0));float cur=fbm3(vec3(vObj.x*10.0,vObj.y*5.0+tm*.12,vObj.z*10.0)+vec3(tm*.04));float au=ab*smoothstep(.3,.7,cur)*aur*(1.0-lit)*(1.0-clim.y);col+=mix(vec3(.1,1.,.5),vec3(.55,.2,.95),smoothstep(.88,.97,al)*.7)*au*1.5;}',
      ' col+=lem;',
      ' gl_FragColor=vec4(pow(col,vec3(1.0/2.2)),1.0);',
      '}'].join('\n')
  });
}

var BODIES=[],byId=Object.create(null);
var tmpV=new THREE.Vector3();
var sunBody=null;

function initialAngle(def){if(def.comet){var C=cmSetup(def);return C.tp!=null?TAU*(simDays-C.tp)/def.P:TAU*.86;}var L=def.L0!=null?def.L0:(def.id.length*47+(def.P||1)*13);return (L+360*simDays/def.P)*D2R;}

/* ---------- Güneş dokuları, gölgeler ---------- */
var SUN_GLSL='float h13(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float vn3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(h13(i),h13(i+vec3(1.,0.,0.)),f.x),mix(h13(i+vec3(0.,1.,0.)),h13(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h13(i+vec3(0.,0.,1.)),h13(i+vec3(1.,0.,1.)),f.x),mix(h13(i+vec3(0.,1.,1.)),h13(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}float fbm3(vec3 p){\n#ifdef LQ\nreturn .55*vn3(p)+.3*vn3(p*2.03)+.15*vn3(p*4.1);\n#else\nreturn .5*vn3(p)+.25*vn3(p*2.03)+.125*vn3(p*4.1)+.0625*vn3(p*8.3);\n#endif\n}';
var REALSUN=null;
function sunMaterial(i){
  var t=SUN_TYPES[i];
  return new THREE.ShaderMaterial({
    defines:LOWQ?{LQ:1}:{},
    uniforms:{lo:{value:new THREE.Color(t.lo)},hi:{value:new THREE.Color(t.hi)},time:{value:0},spots:{value:i===4?0:1},ha:{value:0},sT:{value:REALSUN||DUMMY},sK:{value:REALSUN?.55:0}},
    vertexShader:'varying vec3 vO;varying vec3 vN;varying vec3 vV;varying vec2 vUv;void main(){vUv=uv;vO=normalize(position);vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    extensions:{derivatives:true},
    fragmentShader:'uniform vec3 lo;uniform vec3 hi;uniform float time;uniform float spots;uniform float ha;uniform sampler2D sT;uniform float sK;varying vec3 vO;varying vec3 vN;varying vec3 vV;varying vec2 vUv;\n'+SUN_GLSL+
    'vec3 h33(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}'+
    'vec2 vor(vec3 x,float t){vec3 p=floor(x);vec3 f=fract(x);float d1=8.0;float d2=8.0;for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 b=vec3(float(i),float(j),float(k));vec3 o=h33(p+b);o=.5+.38*sin(t+6.2831*o);vec3 r=b+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}return vec2(sqrt(d1),sqrt(d2));}'+
    'void main(){vec3 q=vO;float t=time;'+
    'vec3 w=vec3(fbm3(q*3.0+t*.01),fbm3(q*3.0+7.0-t*.01),fbm3(q*3.0+13.0))-.5;'+
    'float big=fbm3(q*6.0+w*1.2+t*.015);'+
    'float mu=clamp(dot(normalize(vN),vV),0.0,1.0);'+
    'vec3 gp=q*230.0+w*4.0;float fw=length(fwidth(gp));float g=0.0;'+
    'if(fw<.9){vec2 v=vor(gp,t*.4);float lane=smoothstep(0.0,.35,v.y-v.x);g=(lane*(1.0-v.x*.4)-.55)*.16*(1.0-smoothstep(.3,.9,fw));}'+
    'float sg=(fbm3(q*28.0+w*2.0+t*.01)-.5)*.16+(fbm3(q*70.0+w*3.0-t*.02)-.5)*.10;'+
    'float sf=fbm3(q*4.2+vec3(3.0,1.0,5.0)+t*.002)*.7+fbm3(q*1.3+9.0)*.3;float pen=smoothstep(.705,.735,sf)*spots;float umb=smoothstep(.75,.77,sf)*spots;'+
    'vec3 cen=mix(hi,vec3(1.0,.97,.86),.45);'+
    'vec3 col=mix(cen,mix(lo,hi,.25),pow(1.0-mu,.9)*.85);'+
    'float fac=smoothstep(.6,.72,sf)*(1.0-pen)*pow(1.0-mu,1.5)*spots;'+
    'col*=1.0+g+sg+fac*.35+(big-.5)*.08;if(sK>0.0){vec3 st=texture2D(sT,vUv).rgb;float sm=dot(st,vec3(.3,.59,.11));col*=mix(1.0,.5+.75*sm,sK);}'+
    'float stri=.8+.2*sin(atan(q.y,q.x)*90.0+sf*40.0);'+
    'col=mix(col,col*.5*stri,pen);col=mix(col,vec3(.12,.05,.02),umb);'+
    'col*=.36+.64*pow(mu,.5);col*=1.16;'+
    'if(ha>0.0){vec3 qq=q+w*.25;'+
    'float a1=fbm3(qq*14.0);float a2=fbm3(vec3(qq.x*40.0+a1*6.0,qq.y*40.0-a1*6.0,qq.z*40.0));float fib=smoothstep(.35,.75,a2);'+
    'float mott=fbm3(qq*60.0+t*.01);'+
    'float plage=smoothstep(.62,.7,sf)*spots;'+
    'float fl=fbm3(q*2.2+17.0);float fil=(1.0-smoothstep(0.0,.012,abs(fl-.52)))*smoothstep(.45,.6,fbm3(q*3.1+4.0));'+
    'float bri=.55+.22*fib+.18*mott+.5*plage-.55*fil-.6*umb;'+
    'float lmb=.78+.3*pow(1.0-mu,3.0)+.7*pow(1.0-mu,8.0);'+
    'vec3 hc=mix(vec3(.55,.2,.02),vec3(1.0,.72,.25),clamp(bri,0.0,1.2))*lmb;'+
    'hc=mix(hc,vec3(1.0,.9,.55),plage*.5);'+
    'col=mix(col,hc*mix(vec3(1.0),hi/max(max(hi.r,hi.g),.01),.25)*1.15,ha);}'+
    'gl_FragColor=vec4(col,1.0);}'
  });
}
var SUNTEX=null;
function getSunTex(){if(!SUNTEX)SUNTEX=SUN_TYPES.map(function(t){return makeTex(512,256,sunFn(hex(t.lo),hex(t.hi)));});return SUNTEX;}
var DUMMY=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1,THREE.RGBAFormat);DUMMY.needsUpdate=true;
function newShU(){
  var o=[];for(var i=0;i<6;i++)o.push(new THREE.Vector4());
  return {occ:{value:o},occN:{value:0},ringT:{value:DUMMY},ringC:{value:new THREE.Vector3()},ringN:{value:new THREE.Vector3(0,1,0)},ringR:{value:new THREE.Vector2()},ringOn:{value:0},clim:{value:new THREE.Vector4()},lightK:{value:1},civ:{value:1},det:{value:1},crat:{value:0},cratD:{value:1},aur:{value:.16},tm:{value:0},seas:{value:0},dTg:{value:0},melt:{value:0},blood:{value:0},lockP:{value:new THREE.Vector3()}};
}
var SH_PARS='uniform vec4 occ[6];uniform int occN;uniform sampler2D ringT;uniform vec3 ringC;uniform vec3 ringN;uniform vec2 ringR;uniform float ringOn;uniform vec4 clim;uniform float lightK;uniform float civ;uniform float det;uniform float aur;uniform float tm;uniform float seas;uniform float dTg;uniform float melt;uniform float blood;uniform vec3 lockP;\n'+
'float h13(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n'+
'float vn3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(h13(i),h13(i+vec3(1.,0.,0.)),f.x),mix(h13(i+vec3(0.,1.,0.)),h13(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h13(i+vec3(0.,0.,1.)),h13(i+vec3(1.,0.,1.)),f.x),mix(h13(i+vec3(0.,1.,1.)),h13(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}\n'+
'float fbm3(vec3 p){return .5*vn3(p)+.25*vn3(p*2.03)+.125*vn3(p*4.1);}\n'+
'vec3 h3v(vec3 p){return vec3(h13(p),h13(p+31.7),h13(p+57.3));}\n'+
'uniform float crat;uniform float cratD;float gCrH=0.0;float gCrFw=0.0;varying vec3 vTv;varying vec3 vBv;\n'+
'float crH(vec3 P,float dens){vec3 c=floor(P);if(h13(c+.37)>dens*cratD)return 0.0;vec3 o=c+.3+.4*h3v(c);float r=.07+.12*h13(c+5.3);float d=length(P-o)/r;if(d>1.6)return 0.0;float v=.2*exp(-pow((d-1.0)/.2,2.0));if(d<1.0)v+=-.32*(1.0-d*d)+(d<.25?.1*(1.0-d/.25):0.0);return v*r;}\n'+
'float craterH(vec3 p,float fw){float h=0.0;float F=3.0;mat3 M=mat3(.8,.36,-.48,-.6,.48,-.64,0.0,.8,.6);vec3 q=p;for(int o=0;o<6;o++){float w=1.0-smoothstep(.2,.8,fw*F*3.0);if(w<=0.0)break;h+=w*crH(q*F+float(o)*17.3,.55)/F;q=M*q;F*=2.1;}return h;}\n'+
'vec3 perturbN(vec3 sp,vec3 sn,vec2 dH){vec3 sx=dFdx(sp);vec3 sy=dFdy(sp);vec3 R1=cross(sy,sn);vec3 R2=cross(sn,sx);float det=dot(sx,R1);vec3 g=sign(det)*(dH.x*R1+dH.y*R2);return normalize(abs(det)*sn-g);}\n'+
'vec2 vor3(vec3 x){vec3 p=floor(x);vec3 f=fract(x);float d1=8.0;float d2=8.0;for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 b=vec3(float(i),float(j),float(k));vec3 r=b+h3v(p+b)-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}return vec2(sqrt(d1),sqrt(d2));}\n'+
'vec3 lavaSurf(vec3 q,float g,float t,out vec3 em){vec3 qw=q+(vec3(fbm3(q*3.0),fbm3(q*3.0+5.0),fbm3(q*3.0+9.0))-.5)*.35;vec2 v=vor3(qw*8.0);vec2 v2=vor3(qw*21.0+3.0);float cr=1.0-smoothstep(0.0,.06+.12*g,v.y-v.x);float cr2=1.0-smoothstep(0.0,.05,v2.y-v2.x);float mf=smoothstep(.45,.95,g);float flow=fbm3(q*4.0+vec3(t*.02,0.0,-t*.015));vec3 crust=vec3(.055,.048,.046)*(.65+.7*fbm3(q*30.0));em=vec3(1.0,.33,.05)*((cr*.9+cr2*.35)*(.25+g*1.5)+mf*(.5+1.3*flow))*smoothstep(0.0,.15,g);return mix(crust,vec3(.28,.07,.02),mf);}\n'+
'float shadowOcc(vec3 P){vec3 L=normalize(-P);float s=0.0;for(int i=0;i<6;i++){if(i>=occN)break;vec3 oc=P-occ[i].xyz;float b=dot(oc,L);if(b<0.0){float perp=sqrt(max(dot(oc,oc)-b*b,0.0));float R=occ[i].w;s=max(s,1.0-smoothstep(R*0.55,R*1.05,perp));}}return s;}\n'+
'float ringShadow(vec3 P){if(ringOn<0.5)return 0.0;vec3 L=normalize(-P);float dn=dot(L,ringN);if(abs(dn)<0.02)return 0.0;float t=dot(ringC-P,ringN)/dn;if(t<=0.0||t>length(P))return 0.0;vec3 Q=P+L*t;float d=length(Q-ringC);if(d<ringR.x||d>ringR.y)return 0.0;return texture2D(ringT,vec2((d-ringR.x)/(ringR.y-ringR.x),0.5)).a*0.9;}\n';
var PLANET_CODE='{vec3 q=normalize(vObj);if(crat>0.0){gCrFw=length(fwidth(q));gCrH=craterH(q,gCrFw);diffuseColor.rgb*=clamp(1.0+gCrH*45.0,.6,1.35);}float luma=dot(diffuseColor.rgb,vec3(.3,.6,.1));diffuseColor.rgb=mix(vec3(luma),diffuseColor.rgb,1.0+(1.0-det)*.55)*(1.0-(1.0-det)*.1);if(det>.5){diffuseColor.rgb*=1.0+det*(fbm3(q*60.0)*.6+fbm3(q*150.0)*.4-.45)*.75;}luma=dot(diffuseColor.rgb,vec3(.3,.6,.1));float lat=abs(q.y);float thr=clim.w*.6+.25;if(clim.w>.001){float oc=(1.0-smoothstep(thr,thr+.05,fbm3(q*2.6+3.1)))*(1.0-clim.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.03,.16,.38)*(.6+.5*luma),oc*.92);}if(clim.x>.001){float iceM=smoothstep(1.02-clim.x*1.1,1.12-clim.x*1.1,lat+(fbm3(q*5.0)-.5)*.18);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.93,1.0)*(.75+.5*luma),iceM);}diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.09,.06)*(.5+luma),clim.y*.85);float mlt=max(melt,smoothstep(.15,.45,clim.z));if(mlt>.001){vec3 le;vec3 lc=lavaSurf(q,clim.z,tm,le);diffuseColor.rgb=mix(diffuseColor.rgb,lc,mlt);}if(lockP.x>0.0){float dn=q.x;float nt=smoothstep(.08,-.3,dn);float dy=smoothstep(.25,.95,dn);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.9,.97)*(.8+.3*fbm3(q*9.0)),nt*lockP.z);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.09,.05)*(.6+luma),dy*lockP.y);}diffuseColor.rgb*=lightK;}\n{float so=max(shadowOcc(vWP),ringShadow(vWP));diffuseColor.rgb=mix(diffuseColor.rgb*(1.0-0.88*so),diffuseColor.rgb*vec3(.62,.2,.09),blood*so*.9);}';
var PLANET_EM='if(aur>.02){vec3 qa=normalize(vObj);float ab=exp(-pow((abs(qa.y)-.9)/.05,2.0));totalEmissiveRadiance+=mix(vec3(.75,.35,1.0),vec3(.2,.95,.55),step(.5,det))*ab*aur*smoothstep(.3,.7,fbm3(qa*8.0+vec3(tm*.05)))*.9;}if(clim.z>.001){vec3 le;lavaSurf(normalize(vObj),clim.z,tm,le);totalEmissiveRadiance+=le;}';
function patchShadow(mat,U,key,code,em){
  mat.onBeforeCompile=function(sh){
    Object.keys(U).forEach(function(k){sh.uniforms[k]=U[k];});
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vObj;varying vec3 vTv;varying vec3 vBv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vObj=transformed;vec3 tO0=normalize(cross(vec3(0.0,1.0,0.0),normalize(transformed))+vec3(1e-5));vTv=normalize(normalMatrix*tO0);vBv=normalize(normalMatrix*cross(normalize(transformed),tO0));');
    var fs=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vObj;\n'+SH_PARS).replace('#include <map_fragment>','#include <map_fragment>\n'+code);
    if(em)fs=fs.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+em);
    fs=fs.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(crat>0.0){vec3 q0=normalize(vObj);vec3 tO=normalize(cross(vec3(0.0,1.0,0.0),q0)+vec3(1e-5));vec3 bO=cross(q0,tO);float ep=max(gCrFw*.7,.0008);float ht=craterH(normalize(q0+tO*ep),gCrFw);float hb=craterH(normalize(q0+bO*ep),gCrFw);vec2 g=vec2(ht-gCrH,hb-gCrH)/ep;normal=normalize(normal-(g.x*normalize(vTv)+g.y*normalize(vBv))*crat);}');
    sh.fragmentShader=fs;
  };
  mat.customProgramCacheKey=function(){return key;};
}

/* ---------- Halley kuyruklu yıldızı ---------- */
var APO_T=0;
function cmSetup(def){
  if(def.cmE)return def.cmE;var c=def.cm,rp=orbitR(c.q),ra=orbitR(c.Q),a=(rp+ra)/2,e=(ra-rp)/(ra+rp),E={rp:rp,ra:ra,a:a,e:e,b:a*Math.sqrt(1-e*e),ry:c.ry,rx:c.rx};
  if(c.tp)E.tp=(Date.UTC(c.tp[0],c.tp[1],c.tp[2])-J2000)/86400000;
  if(c.apophis){
    var tA=(Date.UTC(2029,3,13,21)-J2000)/86400000,ed=null;DEFS.forEach(function(d){if(d.id==='earth')ed=d;});
    var rE=ed.r,cE=clamp((1-rE/a)/e,-1,1),Es=Math.acos(cE),th=Math.atan2(E.b*Math.sin(Es),a*(Math.cos(Es)-e)),Ms=Es-e*Math.sin(Es);
    var angE=(ed.L0+360*tA/ed.P)*D2R;E.ry=th+angE-2.6/rE;E.tp=tA-Ms/TAU*def.P;APO_T=tA;
  }
  def.cmE=E;return E;
}
var COMET=null;
/* Kepler denklemi (M = E − e·sin E) Newton yöntemiyle çözülür. Eskiden 7 adımlık sabit nokta yinelemesi vardı: basıklık 1'e yakınken
   (Halley: 0,967) yakınsamıyor, kuyruklu yıldız yörüngesinde yanlış yerde duruyor ve yanlış hızla ilerliyordu (Halley günöte yakınında
   olması gerekenin yarısından yavaştı). Basık yörüngede başlangıç π alınır: Newton oradan her zaman yakınsar. */
function cometPos(M,out,C){C=C||COMET;var Mm=M%TAU;if(Mm<0)Mm+=TAU;var e=C.e,E=e<.8?Mm:Math.PI;
  for(var i=0;i<40;i++){var d=(E-e*Math.sin(E)-Mm)/(1-e*Math.cos(E));E-=d;if(Math.abs(d)<1e-12)break;}
  out.x=C.a*(Math.cos(E)-C.e);out.z=C.b*Math.sin(E);return E;}
function getCometPlane(def){var C=cmSetup(def);if(!C.plane){var g=new THREE.Group();g.rotation.order='YXZ';g.rotation.y=C.ry;g.rotation.x=C.rx;scene.add(g);C.plane=g;}return C.plane;}
/* Kuyruklu yıldız efekti: kuyruklar ve jetler tamamen GPU'da hesaplanır (CPU'da parçacık döngüsü yok).
   Her parçacık çekirdekten uzağa doğru akar: iyon kuyruğu hızlı, dalgalı ve mavi; toz kuyruğu yavaş, yörüngenin arkasına doğru kıvrık ve sarımsı. */
var COMET_VS=[
'uniform vec3 uP,uSun,uA,uB,uVel,uColA,uColB;',
'uniform float uMode,uT,uL,uSize,uScale,uMinPx,uAlpha,uFlow,uPow,uSpread,uCurve,uRipF,uRipS,uRipA,uFade,uGrow,uJR,uSpin,uR0,uWaveF,uWaveV,uWaveA,uSway;',
'attribute float aR;',
'varying vec3 vC;varying float vA;',
'void main(){',
'  float u=fract(position.x+uT*uFlow*(.65+.7*aR));',
'  vec3 lat=uA*position.y+uB*position.z;',
'  vec3 pos;float alpha;float size=uSize*(.55+.9*aR);',
'  if(uMode<.5){',
'    float d=pow(u,uPow)*uL;',
'    float rip=sin(d*uRipF-uT*uRipS+position.x*40.)*uRipA*d*smoothstep(0.,.25,u);',
'    pos=uP+uSun*d+lat*(uSpread*d*(.4+u))+uA*rip+uB*rip*.6;',
'    float sw=uSway*d*u;pos+=uA*sin(uT*.9+d*uWaveF*.12)*sw+uB*cos(uT*.7+d*uWaveF*.1)*sw*.6;',
'    alpha=pow(1.-u,uFade)*smoothstep(0.,.06,u)*(1.-uWaveA*(.5-.5*sin(uWaveF*(d-uWaveV*uT)+aR*.6)));',
'  }else if(uMode<1.5){',
'    float d=pow(u,uPow)*uL;float k=.45+.9*aR;',
'    pos=uP+uSun*d+lat*(uSpread*d)+uVel*(uCurve*k*d*d/uL);',
'    float sw=uSway*d*u;pos+=uA*sin(uT*.35+d*uWaveF*.15)*sw;',
'    alpha=pow(1.-u,uFade)*smoothstep(0.,.14,u)*(1.-uWaveA*(.5-.5*sin(uWaveF*(d-uWaveV*uT)+aR*.8)));',
'  }else{',
'    float j=floor(aR*3.);float ang=uSpin+j*2.1;float lit=cos(ang);',
'    vec3 dir=normalize(-uSun*lit+uA*sin(ang)+uB*.25*(j-1.));',
'    float dist=u*uJR;',
'    pos=uP+dir*(uR0+dist)+lat*(.07*dist)+uSun*(dist*dist/uJR*.9);',
'    alpha=pow(1.-u,2.)*smoothstep(0.,.05,u)*smoothstep(.15,.6,lit);',
'  }',
'  vec4 mv=modelViewMatrix*vec4(pos,1.);',
'  gl_Position=projectionMatrix*mv;',
'  float raw=size*(1.+uGrow*u)*uScale/max(-mv.z,.001);',
'  float ps=clamp(raw,uMinPx,96.);',
'  gl_PointSize=ps;',
'  vA=alpha*uAlpha*clamp(raw*raw/(ps*ps),.18,1.);',
'  vC=mix(uColA,uColB,u);',
'}'].join('\n');
var COMET_FS=[
'varying vec3 vC;varying float vA;',
'void main(){vec2 c=gl_PointCoord-.5;float r=dot(c,c)*4.;if(r>1.)discard;float a=1.-r;a*=a;gl_FragColor=vec4(vC,vA*a);}'].join('\n');
function cmPoints(n,mode,col,u){
  var g=new THREE.BufferGeometry(),pos=new Float32Array(n*3),ar=new Float32Array(n);
  for(var i=0;i<n;i++){pos[i*3]=Math.random();pos[i*3+1]=Math.random()*2-1;pos[i*3+2]=Math.random()*2-1;ar[i]=Math.random();}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aR',new THREE.BufferAttribute(ar,1));
  var un={uP:{value:new THREE.Vector3()},uSun:{value:new THREE.Vector3(1,0,0)},uA:{value:new THREE.Vector3(0,1,0)},uB:{value:new THREE.Vector3(0,0,1)},uVel:{value:new THREE.Vector3(0,0,-1)},
    uColA:{value:new THREE.Color(col[0])},uColB:{value:new THREE.Color(col[1])},uMode:{value:mode},uT:{value:0},uL:{value:1},uSize:{value:1},uScale:{value:400},uMinPx:{value:1.2},uAlpha:{value:0},
    uFlow:{value:u.flow},uPow:{value:u.pw},uSpread:{value:u.sp},uCurve:{value:0},uRipF:{value:1},uRipS:{value:2.2},uRipA:{value:u.rip||0},uFade:{value:u.fade},uGrow:{value:u.grow},uJR:{value:1},uSpin:{value:0},uR0:{value:0},uWaveF:{value:1},uWaveV:{value:0},uWaveA:{value:0},uSway:{value:0}};
  var m=new THREE.ShaderMaterial({uniforms:un,vertexShader:COMET_VS,fragmentShader:COMET_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  var o=new THREE.Points(g,m);o.frustumCulled=false;o.visible=false;scene.add(o);return o;
}
function buildCometFx(b){
  var mn=!!b.def.minor,k=(LOWQ?.5:1)*(mn?.45:1);
  var gt=glowTex([[0,'rgba(255,255,255,.9)'],[.25,'rgba(200,230,255,.45)'],[1,'rgba(160,210,255,0)']]);
  function spr(color){var o=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));o.scale.set(6,6,1);b.pivot.add(o);return o;}
  var coma=spr(0x9fe6d6),core=spr(0xffffff);
  b.fx={ion:cmPoints(Math.round(2400*k),0,[0xa9d2ff,0x4a7fe0],{flow:.28,pw:1.15,sp:.035,fade:1.3,grow:.6,rip:.012}),
        dust:cmPoints(Math.round(7000*k),1,[0xfff1d0,0xd9a070],{flow:.06,pw:1.35,sp:.16,fade:1.1,grow:.9}),
        jets:cmPoints(Math.round(2000*k),2,[0xfff6e0,0xe8d4b0],{flow:.35,pw:1,sp:1,fade:2,grow:.5}),
        coma:coma,core:core,d:new THREE.Vector3(),pa:new THREE.Vector3(),pb:new THREE.Vector3(),vel:new THREE.Vector3(),tmp:new THREE.Vector3()};
}
function updateCometFx(){BODIES.forEach(function(b){if(b.fx)updateOneComet(b);});}
function updateOneComet(b){
  var P=b.pos,rS=P.length(),F=b.fx,def=b.def,au=invOrbit(rS),sz=def.cm.size||1,mn=!!def.minor,vr=def.vr;
  /* kuyruk yıldızın ışımasına bağlı: buzun süblimleşmesi aldığı ışınıma bağlıdır (S ~ L/r²), yani "etkin uzaklık" = au/√L.
     Kırmızı cüce / beyaz cüce / kara delikte kuyruk söner, mavi ve kırmızı devde uzar. Yıldız türü değişince bir anda değil yumuşakça geçer. */
  var Ls=Math.max(0,starL()),ae=au/Math.sqrt(Math.max(Ls,1e-6)),actT=Math.pow(clamp((3.4-ae)/2.8,0,1),1.2),boost=clamp(1+.3*Math.log10(Math.max(1,Ls)),1,2.2);
  var tn=performance.now()*.001,dtk=F.lkT?Math.min(.25,tn-F.lkT):0;F.lkT=tn;
  if(F.actS===undefined||dtk===0&&F.actS===undefined)F.actS=actT;F.actS+=(actT-F.actS)*Math.min(1,dtk*3);
  var act=F.actS,L=act*boost*(70+40*DS)*sz;if(b.engulfed||(b.pivot&&!b.pivot.visible))L=0;
  var cd=camera.position.distanceTo(P),t=performance.now()*.001,near=clamp((cd-3)/20,.04,1);
  var cs=(3+L*.05)*Math.max(.4,sz)*(mn?.45:1),co=(.06+act*sz*.63)*near*(mn?.6:1)*(1+.04*Math.sin(t*1.7+vr*9));
  F.coma.scale.setScalar(cs*1.5);F.coma.material.opacity=co*.45;
  F.core.scale.setScalar(cs*.38);F.core.material.opacity=Math.min(1,co*1.1);
  var vis=L>1.5;F.ion.visible=F.dust.visible=vis;
  var jr=(vr*10+L*.015)*(mn?.8:1),jf=vis&&act>.15?clamp(1-cd/(jr*60),0,1):0;F.jets.visible=jf>.01;
  if(!vis)return;
  var fade=clamp((cd-5)/35,.2,1),mk=mn?.55:1,sc=renderer.domElement.height*.5;
  F.d.copy(P).normalize();
  F.pa.set(0,1,0).cross(F.d);if(F.pa.lengthSq()<1e-4)F.pa.set(1,0,0);F.pa.normalize();F.pb.copy(F.d).cross(F.pa);
  /* yörünge hızının tersi: toz kuyruğu yörüngenin gerisine doğru kıvrılır (duraklatılmış zamanda da aynı) */
  var C=cmSetup(def),E=cometPos(b.ang,F.tmp,C);F.vel.set(C.a*Math.sin(E),0,-C.b*Math.cos(E)).transformDirection(getCometPlane(def).matrixWorld);
  var curve=clamp(.1+.22/(au+.25),.1,.42);
  function setU(o,al,size){var u=o.material.uniforms;u.uP.value.copy(P);u.uSun.value.copy(F.d);u.uA.value.copy(F.pa);u.uB.value.copy(F.pb);u.uVel.value.copy(F.vel);u.uT.value=t;u.uL.value=L;u.uScale.value=sc;u.uAlpha.value=al;u.uSize.value=size;u.uCurve.value=curve;return u;}
  var ui=setU(F.ion,clamp(L/50,0,.85)*fade*mk*.38,L*.0065*(mn?.7:1));ui.uRipF.value=TAU*4/L;ui.uWaveF.value=TAU*5/L;ui.uWaveV.value=.42*L;ui.uWaveA.value=.75;ui.uSway.value=.04;
  var ud=setU(F.dust,clamp(L/50,0,.7)*fade*mk*.5,L*.0046*(mn?.7:1));ud.uL.value=L*.62;ud.uWaveF.value=TAU*3/(L*.62);ud.uWaveV.value=.06*L;ud.uWaveA.value=.45;ud.uSway.value=.03;
  if(F.jets.visible){var uj=setU(F.jets,jf*.7,vr*.07);uj.uL.value=jr;uj.uJR.value=jr;uj.uSpin.value=b.spinRot;uj.uR0.value=vr*.75;}
}
/* çekirdek: düzensiz, koyu. 67P iki lobludur (lastik ördek); ötekiler sıkışık gövdeli uzun patates. */
function weldNormals(g){
  var p=g.attributes.position,n=g.attributes.normal,map={},i;
  for(i=0;i<p.count;i++){var key=Math.round(p.getX(i)*1e4)+'_'+Math.round(p.getY(i)*1e4)+'_'+Math.round(p.getZ(i)*1e4);(map[key]=map[key]||[]).push(i);}
  Object.keys(map).forEach(function(k){var a=map[k];if(a.length<2)return;var x=0,y=0,z=0;a.forEach(function(j){x+=n.getX(j);y+=n.getY(j);z+=n.getZ(j);});var l=Math.hypot(x,y,z)||1;a.forEach(function(j){n.setXYZ(j,x/l,y/l,z/l);});});
  n.needsUpdate=true;
}
function cometNucleusGeo(def){
  var R=def.vr,g=new THREE.SphereGeometry(R,LOWQ?48:72,LOWQ?32:48),p=g.attributes.position,v=new THREE.Vector3(),sd=3,i;
  for(i=0;i<def.id.length;i++)sd+=def.id.charCodeAt(i)*(i+3);sd=(sd%97)*1.37+3;
  var duck=def.id==='cg67p';
  for(i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i).normalize();
    var r=1,x,y,z;
    if(duck){var L1=[.42,.72],L2=[-.5,.52],d1=L1[0]*v.x,d2=L2[0]*v.x;
      var r1=d1+Math.sqrt(Math.max(0,d1*d1-L1[0]*L1[0]+L1[1]*L1[1])),r2=d2+Math.sqrt(Math.max(0,d2*d2-L2[0]*L2[0]+L2[1]*L2[1]));
      r=Math.max(r1,r2)/1.14;}
    var n1=(fbm(v.x*1.6+sd,v.y*1.6+sd*.7,v.z*1.6+sd*1.3,4)-.47)*2.1,n2=(fbm(v.x*5+sd,v.y*5,v.z*5-sd,3)-.47)*2.1;
    r*=1+.2*n1+.05*n2;
    x=v.x*r;y=v.y*r;z=v.z*r;
    if(!duck){x*=1;y*=.62;z*=.66;var pin=1-.25*Math.exp(-Math.pow(x/.3,2));y*=pin;z*=pin;}
    p.setXYZ(i,x*R,y*R,z*R);
  }
  g.computeVertexNormals();weldNormals(g);g.type='CometNucleus';return g;
}

function buildBody(def){
  var isStar=def.id==='sun'||!!def.star;
  var b={def:def,id:def.id,vr:def.vr,pos:new THREE.Vector3(),ang:0,spinRot:0,parent:def.parent?byId[def.parent]:null,
    mod:{spin:1,orbit:1,size:1,tilt:def.tilt||0},lw:def.name.length*6.6+16,starType:def.starType||0,
    grav:!def.parent&&!def.comet&&!isStar&&def.a!=null};
  if(def.parent)def.rotH=def.P*24;
  var pivot=new THREE.Group();b.pivot=pivot;
  (b.parent?b.parent.pivot:(def.comet?getCometPlane(def):scene)).add(pivot);
  var tilt=new THREE.Group();tilt.rotation.z=(def.tilt||0)*D2R;pivot.add(tilt);b.tilt=tilt;
  b.typeScale=isStar?(def.id==='sun'?SUN_TYPES[0].sc:SUN_TYPES[b.starType].sc):PS;tilt.scale.setScalar(b.typeScale);
  var mesh,mat,U=null;
  if(!isStar&&!def.comet){U=newShU();b.shU=U;}
  if(isStar){mat=sunMaterial(b.starType);b.sunU=mat.uniforms;}
  else if(def.earthShader){mat=earthMaterial(makeTex(512,256,TEX.earth),makeTex(512,256,TEX.lights),makeTex(LOWQ?512:1024,LOWQ?256:512,TEX.height,true),U);}
  else{
    var TW=(def.tw||512)*(LOWQ?1:2),fn=def.texFn||TEX[def.tex],tex=makeTex(TW,TW/2,fn);
    mat=new THREE.MeshStandardMaterial({map:tex,roughness:.92,metalness:0});
    if(def.comet&&!def.asteroid){mat.color.setScalar(.34);mat.roughness=1;}
    if(def.bump&&!def.crat){mat.bumpMap=tex;mat.bumpScale=def.parent?.45:.8;}
    if(def.crat&&U){U.crat.value=def.crat*2.2;U.cratD.value=def.cratD||1;}
    if(def.emFn){mat.emissiveMap=makeTex(TW,TW/2,def.emFn);mat.emissive=new THREE.Color(0xffffff);mat.emissiveIntensity=1.1;}
    if(U)patchShadow(mat,U,'shp',PLANET_CODE,PLANET_EM);
  }
  mesh=new THREE.Mesh(def.comet&&!def.asteroid?cometNucleusGeo(def):new THREE.SphereGeometry(def.vr,def.parent||LOWQ?56:96,def.parent||LOWQ?40:64),mat);b.mesh=mesh;tilt.add(mesh);
  if(def.clouds){
    var ct=def.id==='earth'?null:makeTex(LOWQ?512:1024,LOWQ?256:512,TEX.clouds);
    b.clouds=new THREE.Mesh(new THREE.SphereGeometry(def.vr*1.012,LOWQ?56:96,LOWQ?40:64),def.id==='earth'?weatherMaterial():new THREE.MeshStandardMaterial({map:ct,transparent:true,roughness:1,depthWrite:false}));
    tilt.add(b.clouds);
  }
  if(def.atmo){b.atmoMesh=atmoMesh(def.vr,def.atmo[0],def.atmo[1]);b.atmoK=1;tilt.add(b.atmoMesh);}
  if(def.ring){
    var inner=def.vr*1.3,outer=def.vr*2.35,rg=new THREE.RingGeometry(inner,outer,160,1),p=rg.attributes.position,uv=rg.attributes.uv,v=new THREE.Vector3();
    for(var i=0;i<p.count;i++){v.fromBufferAttribute(p,i);uv.setXY(i,(v.length()-inner)/(outer-inner),.5);}
    var rt=ringTex();if(U)U.ringT.value=rt;
    var rmat=new THREE.MeshStandardMaterial({map:rt,transparent:true,side:THREE.DoubleSide,roughness:1,depthWrite:false});
    if(def.ringTint)rmat.color=new THREE.Color(def.ringTint);
    b.ringShU=newShU();patchShadow(rmat,b.ringShU,'shr','diffuseColor.rgb*=lightK*(1.0-0.9*shadowOcc(vWP));');
    var ring=new THREE.Mesh(rg,rmat);ring.rotation.x=-Math.PI/2;tilt.add(ring);b.ringMesh=ring;
  }
  if(isStar){
    var T=SUN_TYPES[b.starType];
    var gt=glowTex([[0,'rgba(255,255,255,.95)'],[.16,'rgba(255,255,255,.55)'],[.5,'rgba(255,255,255,.13)'],[1,'rgba(255,255,255,0)']]);
    b.glow1=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:T.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));
    b.glow2=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:T.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.22}));
    b.glow1.scale.set(66,66,1);b.glow2.scale.set(190,190,1);pivot.add(b.glow2);pivot.add(b.glow1);
    if(def.star){b.light=new THREE.PointLight(T.light,T.I*.7,0);pivot.add(b.light);}
    if(def.id==='sun')sunBody=b;
  }
  var pk=new THREE.Mesh(new THREE.SphereGeometry(def.vr,10,8),new THREE.MeshBasicMaterial());pk.visible=false;pk.userData.body=b;pivot.add(pk);b.picker=pk;

  var rr=def.r||def.orbit;
  if(def.comet){
    var CE=cmSetup(def),cp=[];for(var k2=0;k2<=256;k2++){var E=k2/256*TAU;cp.push(new THREE.Vector3(CE.a*(Math.cos(E)-CE.e),0,CE.b*Math.sin(E)));}
    var cl=new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp),new THREE.LineBasicMaterial({color:def.asteroid?0x9a9284:0x8ec8ff,transparent:true,opacity:def.minor?.07:.18,depthWrite:false}));
    getCometPlane(def).add(cl);b.line=cl;
  }else if(rr){
    var pts=[];for(var k=0;k<=256;k++){var a=k/256*TAU;pts.push(new THREE.Vector3(Math.cos(a)*rr,0,-Math.sin(a)*rr));}
    var line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:def.parent?0x6f86b8:0x8aa0d6,transparent:true,opacity:def.parent?.35:.28,depthWrite:false}));
    if(def.parent&&def.incl)line.rotation.x=def.incl*D2R;
    (b.parent?b.parent.pivot:scene).add(line);b.line=line;
  }
  if(def.id!=='sun')b.ang=initialAngle(def);
  if(b.parent){var idx=BODIES.indexOf(b.parent)+1;while(idx<BODIES.length&&BODIES[idx].parent===b.parent)idx++;BODIES.splice(idx,0,b);}
  else BODIES.push(b);
  byId[def.id]=b;b.hab=makeHab(def);

  var lb=document.createElement('div');lb.className='lb'+(def.parent?' moon':'');
  var lbb=document.createElement('button');lbb.textContent=def.name;lbb.tabIndex=-1;lbb.addEventListener('click',function(){focusBody(def.id);});
  lb.appendChild(lbb);$('labels').appendChild(lb);b.label=lb;
  if(def.comet&&!def.asteroid)buildCometFx(b);
  return b;
}
function disposeBody(b){
  b.pivot.parent.remove(b.pivot);
  /* yörünge çizgisi cismin alt ağacında değildir (sahneye ya da gezegene bağlı): geometrisi ve malzemesi ayrıca bırakılır; eskiden her silmede bir geometri sızıyordu */
  if(b.line){if(b.line.parent)b.line.parent.remove(b.line);if(b.line.geometry)b.line.geometry.dispose();if(b.line.material)b.line.material.dispose();}
  b.pivot.traverse(function(o){if(o.geoHi)o.geometry=o.geoHi;if(o.geometry)o.geometry.dispose();if(o.material){var m=o.material;['map','bumpMap','emissiveMap'].forEach(function(k){if(m[k])m[k].dispose();});m.dispose();}});
  if(b.label.parentNode)b.label.parentNode.removeChild(b.label);
  var i=BODIES.indexOf(b);if(i>=0)BODIES.splice(i,1);delete byId[b.id];
}
