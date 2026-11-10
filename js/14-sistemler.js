/* Celestia · Diğer yıldız sistemleri ve gelgit parçalanması.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ================= YILDIZ SİSTEMLERİ ================= */
var SYS=null,SUNDEF0=null;
var SYSTEMS=[
 {id:'sol',name:'Güneş Sistemi',ly:0,sub:'Evimiz · Sarı cüce, 8 gezegen'},
 {id:'proxima',name:'Proxima Centauri',ly:4.24,sub:'En yakın yıldız · Kırmızı cüce, 2 gezegen',type:1,sc:.154,L:.0017,kind:'Yıldız · M5.5 kırmızı cüce',
  desc:'Güneş\'e en yakın yıldız (4,24 ışık yılı). Güneş\'in yaklaşık sekizde biri kütlesinde, sönük bir kırmızı cüce. Sık ve güçlü parlamalar yapar; bu, yaşanabilir bölgedeki Proxima b\'nin atmosferini aşındırabilir.',
  stats:[['Uzaklık','4,24 ışık yılı'],['Yarıçap','0,15 Güneş'],['Parlaklık','Güneş\'in %0,17\'si'],['Sıcaklık','~2.750 °C']],
  pl:[['Proxima d',.02886,5.12,.81,'desert','#c8915a','thin','Kütlesi Dünya\'nın yaklaşık dörtte biri; yıldızına çok yakın, sıcak bir dünya. 2022\'de keşfedildi.'],
      ['Proxima b',.0485,11.19,1.07,'rocky','#a8705a','thin','Yaşanabilir bölgede, Dünya\'dan biraz ağır bir gezegen. Muhtemelen gelgit kilitli; yıldızın parlamaları ve X-ışınları yüzünden yaşam için zor bir ortam. 2016\'da keşfedildi.']]},
 {id:'alphacen',name:'Alfa Centauri A ve B',ly:4.37,sub:'İki güneşli sistem · Doğrulanmış gezegen yok',type:0,sc:1.22,L:1.52,kind:'Yıldız · G2 sarı cüce (A)',
  desc:'Birbirinin çevresinde 80 yılda bir dönen iki Güneş benzeri yıldız. A, Güneş\'ten biraz büyük ve parlak; B, biraz küçük ve turuncu. Proxima Centauri bu sistemin üçüncü, uzak üyesidir. Doğrulanmış gezegen yok; yeşil bant yaşanabilir bölgeyi gösterir. Laboratuvar\'dan oraya kendi gezegenini ekleyebilirsin.',
  stats:[['Uzaklık','4,37 ışık yılı'],['A yarıçapı','1,22 Güneş'],['B yarıçapı','0,86 Güneş'],['A–B yörüngesi','79,9 yıl, ~23 AU']],
  star2:{name:'Alfa Centauri B',type:0,size:.86,a:23.3,P:79.91*365.25},pl:[]},
 {id:'trappist',name:'TRAPPIST-1',ly:40.7,sub:'7 Dünya boyutlu gezegen · 3\'ü yaşanabilir bölgede',type:1,sc:.119,L:.000553,kind:'Yıldız · M8 ultra soğuk cüce',
  desc:'Jüpiter\'den biraz büyük, çok sönük bir kırmızı cüce. Çevresinde Dünya boyutlu 7 gezegen var; hepsi Merkür\'ün yörüngesinden çok daha içeride ve büyük olasılıkla gelgit kilitli. JWST ölçümleri b ve c gezegenlerinde kalın atmosfer olmadığını gösterdi; diğerlerinin atmosferi bilinmiyor (burada varsayımsal).',
  stats:[['Uzaklık','40,7 ışık yılı'],['Yarıçap','0,12 Güneş'],['Parlaklık','Güneş\'in %0,055\'i'],['Gezegen','7']],
  pl:[['TRAPPIST-1 b',.01154,1.511,1.116,'rocky','#9a5a3a','none','En içteki gezegen; JWST kalın bir atmosferi olmadığını gösterdi, gündüz tarafı yaklaşık 230 °C.'],
      ['TRAPPIST-1 c',.0158,2.422,1.097,'rocky','#a07050','none','Venüs benzeri kalın bir CO₂ atmosferi JWST ile dışlandı.'],
      ['TRAPPIST-1 d',.02227,4.05,.788,'ocean','#5f86aa','thin','Yaşanabilir bölgenin iç kenarında, Dünya\'dan küçük.'],
      ['TRAPPIST-1 e',.02925,6.101,.92,'ocean','#3f6fa8','earth','Yaşanabilirlik için en umut verici aday; Dünya\'ya en çok benzeyen yoğunluk ve ışık.'],
      ['TRAPPIST-1 f',.03849,9.208,1.045,'ice','#a9c3d6','earth','Yaşanabilir bölgede; su varsa büyük ölçüde donmuş olabilir.'],
      ['TRAPPIST-1 g',.04683,12.354,1.129,'ice','#b9cfdc','thin','Yaşanabilir bölgenin dış kenarı.'],
      ['TRAPPIST-1 h',.06189,18.773,.755,'ice','#d0dde6','none','En dıştaki, soğuk ve buzlu gezegen.']]},
 {id:'cancri',name:'55 Cancri',ly:41,sub:'Lav dünyası 55 Cancri e ve 4 gaz devi',type:0,sc:.94,L:.58,kind:'Yıldız · G8 sarı cüce',
  desc:'Güneş\'e benzeyen, biraz daha soğuk bir yıldız. En içteki gezegen 55 Cancri e bir "lav dünyası": 18 saatte bir tur atar, gündüz tarafı ~2.000 °C ve JWST kalın bir atmosferi olabileceğini gösterdi. Dış gezegen f yaşanabilir bölgede bir gaz devi.',
  stats:[['Uzaklık','41 ışık yılı'],['Yarıçap','0,94 Güneş'],['Parlaklık','Güneş\'in %58\'i'],['Gezegen','5']],
  pl:[['55 Cancri e',.01544,.7365,1.88,'lava','#d0542a','thick','Süper Dünya; yüzeyi büyük olasılıkla erimiş kaya. Bir yılı 18 saat.'],
      ['55 Cancri b',.1134,14.65,11,'gas','#c9a77a','h2','Sıcak Jüpiter benzeri gaz devi (~0,8 Jüpiter kütlesi).'],
      ['55 Cancri c',.2373,44.4,8,'gas','#b8a080','h2','Satürn\'den hafif bir gaz devi.'],
      ['55 Cancri f',.7708,260,8,'gas','#a9b88a','h2','Yaşanabilir bölgede bir gaz devi; ayları olsaydı yaşanabilir olabilirdi.'],
      ['55 Cancri d',5.74,4825,11,'gas','#c7b896','h2','Jüpiter\'e benzer uzak bir dev (~3,9 Jüpiter kütlesi), 13 yılda bir tur.']]},
 {id:'kepler16',name:'Kepler-16',ly:245,sub:'Gerçek bir "Tatooine": iki güneşli gezegen',type:0,sc:.65,L:.15,kind:'Yıldız · K tipi turuncu cüce (A)',
  desc:'Birbirinin çevresinde 41 günde dönen iki yıldız: turuncu bir K cücesi ve küçük bir kırmızı cüce. Kepler-16b ikisinin birden çevresinde döner; gökyüzünde iki güneş batar. 2011\'de keşfedilen ilk "çift yıldız çevresinde dönen" gezegen. (Bu modelde A yıldızı merkezde sabit tutuldu.)',
  stats:[['Uzaklık','245 ışık yılı'],['A yarıçapı','0,65 Güneş'],['B yarıçapı','0,23 Güneş'],['A–B yörüngesi','41 gün']],
  star2:{name:'Kepler-16 B',type:1,size:.23,a:.224,P:41.08},
  pl:[['Kepler-16b',.7048,228.8,8.45,'gas','#c9b08a','h2','Satürn kütleli, soğuk bir gaz devi (yaklaşık −80 °C). İki yıldızın çevresinde 229 günde döner.']]}
];
function sysHideAll(on){
  BODIES.forEach(function(b){if(b.def.id==='sun'||b.sysOwn)return;b.sysHide=on;b.pivot.visible=!on&&!b.destroyed&&!b.engulfed;if(b.line)b.line.visible=false;});
}
function hzRing(L){
  var inn=Math.sqrt(L/1.1),out=Math.sqrt(L/.53),g=new THREE.RingGeometry(orbitR(inn),orbitR(out),128,1);
  var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x5fd08a,transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;
}
function unloadSystem(){
  if(!SYS)return;
  BODIES.filter(function(b){return b.sysOwn&&!b.parent;}).forEach(function(b){BODIES.filter(function(x){return x.parent===b;}).forEach(disposeBody);disposeBody(b);});
  if(SYS.hz){scene.remove(SYS.hz);SYS.hz=null;}
  sysHideAll(false);belt.visible=kuiper.visible=true;
  var d=sunBody.def;d.name=SUNDEF0.name;d.kind=SUNDEF0.kind;d.desc=SUNDEF0.desc;d.stats=SUNDEF0.stats;sunBody.label.firstChild.textContent=d.name;
  SYS=null;
}
function loadSystem(id){
  var S=SYSTEMS.filter(function(x){return x.id===id;})[0];if(!S)return;
  $('sysPanel').hidden=true;exitSurface(true);if(TRIP)endTrip();
  var fade=$('fade');fade.textContent=S.ly?S.name+' · '+String(S.ly).replace('.',',')+' ışık yılı':'Güneş Sistemi\'ne dönülüyor';fade.classList.add('on');
  setTimeout(function(){
    if(gravityOn)setGravity(false);clearTimeline();clearDestruction();
    unloadSystem();
    if(id==='sol'){setStar(0);rebuildLists();focusBody('sun',{dist:OVD()});speedIdx=4;speed.value=4;setSpeed();fade.classList.remove('on');toast('Güneş Sistemi');return;}
    if(!SUNDEF0){var d0=sunBody.def;SUNDEF0={name:d0.name,kind:d0.kind,desc:d0.desc,stats:d0.stats};}
    SYS={id:id,L:S.L,sc:S.sc};
    sysHideAll(true);
    setStar(S.type,true);
    var d=sunBody.def;d.name=S.name.replace(' A ve B',' A');d.kind=S.kind;d.desc=S.desc;d.stats=S.stats;sunBody.label.firstChild.textContent=d.name;
    var compact=S.pl.length&&S.pl[S.pl.length-1][1]<.1;
    S.pl.forEach(function(p,k){
      var pid='x_'+id+k;
      addCustom({id:pid,name:p[0],type:p[4],color:p[5],size:p[3],a:p[1],ring:false,moons:0,seed:k*17+3,L0:rnd(0,360),tilt:compact?0:rnd(0,25),rotH:compact?p[2]*24:rnd(10,30)},true);
      customs=customs.filter(function(c){return c.id!==pid;});
      var b=byId[pid];if(!b)return;b.sysOwn=true;
      var dd=b.def;dd.P=p[2];dd.kind=CUSTOM_TYPES[p[4]]+' · '+S.name.replace(' A ve B','');dd.desc=p[7];
      dd.stats=[['Yıldıza uzaklık',fmt.format(p[1])+' AU'],['Yıl',p[2]<2?(Math.round(p[2]*24))+' saat':(p[2]<800?fmt.format(p[2])+' gün':fmt.format(p[2]/365.25)+' yıl')],['Yarıçap',fmt.format(p[3])+' Dünya'],['Atmosfer','Varsayımsal']];
      dd.r=orbitR(p[1]);b.ang=dd.L0*D2R;if(b.hab){b.hab.atm=p[6];atmoVisual(b);}
      if(p[1]<.12&&p[4]!=='gas')b.mod.lock=true;
      b.typeScale=p[3]>5?.55:(compact?.42:.7);applySize(b);
    });
    if(S.star2){var s2=S.star2,sid2='x_'+id+'s';addStar({id:sid2,name:s2.name,type:s2.type,size:s2.size,a:orbitR(s2.a)/DS,L0:rnd(0,360)},true);
      customs=customs.filter(function(c){return c.id!==sid2;});var sb=byId[sid2];if(sb){sb.sysOwn=true;sb.def.P=s2.P;sb.def.kind='Yıldız · '+S.name;sb.def.desc='Sistemin ikinci yıldızı.';}}
    SYS.hz=hzRing(S.L);scene.add(SYS.hz);belt.visible=kuiper.visible=false;
    rebuildLists();focusBody('sun',{dist:OVD()});
    speedIdx=compact?2:3;speed.value=speedIdx;setSpeed();playing=true;setPlayIcon();
    fade.classList.remove('on');
    toast(S.name+': '+S.sub+'. Yeşil bant yaşanabilir bölge.',7000);
  },900);
}
function openSysPanel(){
  vm.hidden=true;var L=$('sysList');L.innerHTML='';
  SYSTEMS.forEach(function(S){var b=document.createElement('button');b.className='sysItem'+((SYS?SYS.id:'sol')===S.id?' on':'');
    b.innerHTML='<b>'+esc(S.name)+'</b><span>'+esc(S.sub)+(S.ly?' · '+String(S.ly).replace('.',',')+' ışık yılı':'')+'</span>';
    b.addEventListener('click',function(){loadSystem(S.id);});L.appendChild(b);});
  $('sysPanel').hidden=false;
}
$('vSys').addEventListener('click',openSysPanel);
$('sysClose').addEventListener('click',function(){$('sysPanel').hidden=true;});

/* ================= GELGİT PARÇALANMASI (spagettileşme) ================= */
var TDES=[];
function clearTDES(){TDES.forEach(function(T){if(T.pts){if(T.pts.parent)T.pts.parent.remove(T.pts);T.pts.geometry.dispose();T.pts.material.dispose();}});TDES=[];TDEDONE=[];}
var TDEDONE=[];
/* geri sarma TDE'nin başladığı ana gelince: gaz akıntısı kalkar, yıldız parçalanmadan hemen önceki haline ve fırlatma yoluna döner */
function tdeUndo(T,fromRestore){
  if(T.pts){if(T.pts.parent)T.pts.parent.remove(T.pts);T.pts.geometry.dispose();T.pts.material.dispose();T.pts=null;}
  var a=T.body;if(!a||!byId[a.id])return;
  if(a.def.star){if(a.destroyed){undestroy(a);a.ownDestroy=false;if(a.cust&&!customs.some(function(c){return c.id===a.id;})){customs.push(a.cust);saveCustom();}rebuildLists();}
    if(T.D){a.dart=T.D;T.D.lk=(simDays-T.D.t0)/T.D.Ts;}}
  if(!fromRestore&&T.em){EATEN-=T.em;sunMass-=T.em/333000;$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();}
}
function massFromSlider(v){return .1*Math.pow(10000,v);}
function sliderFromMass(m){return Math.log(m/.1)/Math.log(10000);}
function rtOf(b){return effVr(sunBody)*4*Math.cbrt(Math.max(1,sunMass))+effVr(b)*1.5;}
var EATEN=0;
function eatMass(b){var m=b.def.star?stMass(b)*333000*.5:bodyMass(b);EATEN+=m;sunMass+=m/333000;$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();return m;}
function massTxt(){return sunMass<10?(EATEN>0?sunMass.toFixed(4).replace('.',',')+'×':fmtX(sunMass)):Math.round(sunMass)+'×';}
function startTDE(b,Dsv){
  /* gerçek gelgit bozulmalarında cisim kara deliğe dümdüz düşmez: gelgit yarıçapına yakın bir enberiyle neredeyse parabolik bir yörüngede geçer.
     Yaklaşma yolu çoğu zaman neredeyse radyal olduğundan (fırlatma), bu anda hızı enberideki gibi teğetsel yaparız: böylece maddenin yarısı
     kara deliğe bağlı kalıp onun çevresinde girdap çizerek diske dolar, yarısı kurtulup uzaya savrulur. Radyal hızla tüm madde bir saniyede içeri düşüyordu. */
  (function(){var rx=b.gx,ry=b.gy,rz=b.gz,rl=Math.sqrt(rx*rx+ry*ry+rz*rz)||1,ux=rx/rl,uy=ry/rl,uz=rz/rl,vx=b.gvx||0,vy=b.gvy||0,vz=b.gvz||0;
    var vr=vx*ux+vy*uy+vz*uz,tx=vx-vr*ux,ty=vy-vr*uy,tz=vz-vr*uz,tl=Math.sqrt(tx*tx+ty*ty+tz*tz);
    if(tl<1e-6){tx=-uz;ty=0;tz=ux;tl=Math.sqrt(tx*tx+tz*tz)||1;if(tl<1e-6){tx=1;tz=0;tl=1;}}
    /* çekirdek bağlı (dairesel hızın 1,3 katı, kaçış 1,41); aşağıda yakın taraf yavaş (bağlı, girdap), uzak taraf hızlı (kurtulur) */
    var vs=Math.sqrt((b.GM||1)*sunMass/rl)*1.3;b.gvx=tx/tl*vs;b.gvy=ty/tl*vs;b.gvz=tz/tl*vs;})();
  var N=b.def.star?(LOWQ?1800:4200):(LOWQ?900:2200),pos=new Float32Array(N*3),vel=new Float32Array(N*3),col=new Float32Array(N*3),alive=new Uint8Array(N),R=effVr(b);
  var c=new THREE.Vector3(b.gx,b.gy,b.gz),u=c.clone().normalize(),rr=c.length(),GM=(b.GM||1)*sunMass,w=Math.sqrt(GM/(rr*rr*rr));
  var base=new THREE.Color(b.def.dot?b.def.dot[0]:'#c08060');
  for(var i=0;i<N;i++){
    var d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1);if(d.lengthSq()>1){i--;continue;}d.multiplyScalar(R);
    var s=d.dot(u);
    pos[i*3]=c.x+d.x;pos[i*3+1]=c.y+d.y;pos[i*3+2]=c.z+d.z;
    var tf=1+.26*s/R;vel[i*3]=b.gvx*tf+u.x*s*w*3.2+(Math.random()-.5)*w*R*.1;vel[i*3+1]=b.gvy*tf+u.y*s*w*3.2;vel[i*3+2]=b.gvz*tf+u.z*s*w*3.2+(Math.random()-.5)*w*R*.1;
    col[i*3]=base.r;col[i*3+1]=base.g;col[i*3+2]=base.b;alive[i]=1;
  }
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pts=new THREE.Points(g,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,map:dotTex()}));
  /* akıntı Güneş'in çerçevesinde (Güneş ortak kütle merkezi etrafında hareket edebilir) */
  pts.frustumCulled=false;sunBody.pivot.add(pts);
  /* kamera yalnızca izlenen cisim yutulduysa yeni hedefe geçer; kullanıcı zaten kara delikteyse (uzaklaşmış olsa bile) kamerayı oynatma */
  if(focus===b||focus.parent===b){focusBody('sun',{dist:Math.max(dist,rtOf(b)*7)});}
  if(SPEEDS[speedIdx].d>1){speedIdx=3;speed.value=3;setSpeed();}
  var Tobj={ts:simDays,body:b,D:Dsv||null,tau:0,pts:pts,pos:pos,vel:vel,col:col,alive:alive,N:N,GM:(b.GM||1),rt:rtOf(b),left:N,age:0,base:base,name:b.def.name};TDES.push(Tobj);
  var isSt=!!b.def.star;if(isSt)hideStar(b);else destroyBody(b);var em=eatMass(b);Tobj.em=em;
  {var GM0=Tobj.GM*sunMass;Tobj.k=TAU*Math.sqrt(Math.pow(Tobj.rt,3)/GM0)*.25;}
  toast(isSt?b.def.name+' gelgit sınırını geçti: kara deliğe yakın yüzü uzak yüzünden çok daha güçlü çekiliyor. Yıldız uzayıp sıcak gaz akıntısına dönüşüyor; bu bir "gelgit bozulması olayı" (TDE). Gazın yaklaşık yarısı diske düşüp aylarca X-ışınıyla parlar, yarısı uzaya savrulur.':b.def.name+' gelgit sınırını geçti: kara deliğe yakın yüzü uzak yüzünden çok daha güçlü çekiliyor. Gezegen uzayıp kaya ve lav akıntısına dönüşüyor (spagettileşme). Kara deliğin kütlesi '+(em<10?em.toFixed(2).replace('.',','):Math.round(em))+' Dünya kütlesi artacak.',9000);
  if(typeof audWhoosh==='function')audWhoosh();
}
function stepTDE(h){for(var k=TDES.length-1;k>=0;k--)stepTDEStream(TDES[k],h);}
function stepTDEStream(T,h){
  var hz=effVr(sunBody)*(sunType===6?bhMassK():1)*1.05;
  {var p=T.pos,v=T.vel,GM=T.GM*sunMass;
    for(var i=0;i<T.N;i++){if(!T.alive[i])continue;
      var x=p[i*3],y=p[i*3+1],z=p[i*3+2],r2=x*x+y*y+z*z+.05,r=Math.sqrt(r2),a=-GM/(r2*r)*h;
      v[i*3]+=x*a;v[i*3+1]+=y*a;v[i*3+2]+=z*a;
      if(h>0&&r<T.rt*1.4){var dr=Math.min(.2,Math.abs(h)*.01*(T.rt/r));v[i*3]*=1-dr;v[i*3+1]*=1-dr*1.5;v[i*3+2]*=1-dr;}
      p[i*3]+=v[i*3]*h;p[i*3+1]+=v[i*3+1]*h;p[i*3+2]+=v[i*3+2]*h;
      if((r<hz&&h>0)||r>4000*DS){T.alive[i]=0;T.left--;p[i*3]=p[i*3+1]=p[i*3+2]=0;if(r<hz)feedBH(sunBody,.004);}
    }
  }
}
/* ---- eklenen kara deliklerde gelgit bozulması (TDE) ----
   Güneş kara deliğe dönüşünce yıldız akıntısı zaten vardı (startTDE). Sonradan eklenen bir kara delik bir yıldızı ya da gezegeni
   yuttuğunda ise cisim yalnızca kayboluyordu. Burada kurban, kara deliğin yerel çerçevesinde (onunla birlikte yörüngede ilerleyen)
   parçacıklara dönüşür: gelgit kuvveti onu yörünge yönünde spagetti gibi uzatır; kara deliğe yakın taraftaki madde bağlı kalır,
   diske düşüp ısınır (beyaz-mavi), uzak taraftaki madde kurtulma hızını aşıp soğuyarak uzaya savrulur (yaklaşık yarı yarıya). */
/* akıntı rengi (Güneş kara deliği ve eklenen kara delikler ortak): diske yakın gaz yüz binlerce derece (beyaz-mavi, X-ışını),
   uzaklaştıkça genişleyip soğur (turuncu-kırmızı, sönük). x = uzaklık / gelgit yarıçapı, fresh = kurbanın kendi renginden geçiş */
function tdeColor(c,j,x,fresh,base,hotK,coolA,coolB,fall){
  var hot=clamp(1.5-x*hotK,0,1),cool=clamp((x-coolA)/coolB,0,1);
  var R=hot+(1-hot)*(.95*(1-cool)+.72*cool),G=.92*hot+(1-hot)*(.6*(1-cool)+.27*cool),B=hot+(1-hot)*(.35*(1-cool)+.16*cool),br=(.28+1.3*hot)/(1+x*fall);
  c[j*3]=(R*(1-fresh)+base.r*fresh)*br;c[j*3+1]=(G*(1-fresh)+base.g*fresh)*br;c[j*3+2]=(B*(1-fresh)+base.b*fresh)*br;}
var TDL=[];
function tdeLite(host,vic,rel){
  if(!host||!host.exo||!host.exo.disk||!rel)return;
  var N=vic.def.star?(LOWQ?1200:2800):(LOWQ?700:1600),pos=new Float32Array(N*3),vel=new Float32Array(N*3),col=new Float32Array(N*3),alive=new Uint8Array(N);
  var sh=host.exo.sh||effVr(host)*2.6,rs=sh/2.6,R0=Math.max(rel.length(),sh*2.2),u=rel.clone().normalize(),up=new THREE.Vector3(0,1,0),tau=new THREE.Vector3().crossVectors(up,u);
  if(tau.lengthSq()<1e-6)tau.set(0,0,1);tau.normalize();var Rv=Math.max(effVr(vic)*.8,R0*.08),GM=Math.pow(TAU,2)*Math.pow(R0,3)/(5*5),vc=Math.sqrt(GM/R0);
  var base=new THREE.Color(vic.def.dot?vic.def.dot[0]:'#c08060'),c0=u.clone().multiplyScalar(R0);
  for(var i=0;i<N;i++){
    var d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1);if(d.lengthSq()>1){i--;continue;}
    var sr=d.dot(u);d.multiplyScalar(Rv);d.addScaledVector(tau,d.dot(tau)*2.5);
    var p=c0.clone().add(d);pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;
    /* enerji yayılımı: kara deliğe yakın yarı bağlı (v < √2·vc), uzak yarı serbest */
    /* Güneş kara deliğindeki akıntıyla aynı fizik: çekirdek bağlı (1,3·v_dairesel), yakın taraf yavaş (girdap çizip diske dolar), uzak taraf kurtulur */
    var vt=vc*1.3*(1+.26*sr)+(Math.random()-.5)*vc*.03,v=tau.clone().multiplyScalar(vt).addScaledVector(u,sr*vc*.25);
    vel[i*3]=v.x;vel[i*3+1]=v.y;vel[i*3+2]=v.z;col[i*3]=base.r;col[i*3+1]=base.g;col[i*3+2]=base.b;alive[i]=1;
  }
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pts=new THREE.Points(g,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,map:dotTex()}));
  pts.frustumCulled=false;pts.userData.post=true;host.pivot.add(pts);
  TDL.push({host:host,pts:pts,pos:pos,vel:vel,col:col,alive:alive,N:N,left:N,GM:GM,rs:rs,R0:R0,age:0,ts:simDays,base:base,name:vic.def.name,star:!!vic.def.star});
}
function tdlKill(T){if(T.pts.parent)T.pts.parent.remove(T.pts);T.pts.geometry.dispose();T.pts.material.dispose();}
function stepTDL(dt){
  for(var k=TDL.length-1;k>=0;k--){var T=TDL[k];
    if(simDays<T.ts||isGone(T.host)||!T.host.exo||!T.host.exo.disk){tdlKill(T);TDL.splice(k,1);continue;}
    if(dt>0){var n=Math.ceil(dt/.01),h=Math.min(dt,.1)/n,p=T.pos,v=T.vel,hz=T.rs*2.2,feed=0;
      for(var s=0;s<n;s++)for(var i=0;i<T.N;i++){if(!T.alive[i])continue;
        var x=p[i*3],y=p[i*3+1],z=p[i*3+2],r2=x*x+y*y+z*z+T.rs*T.rs*.01,r=Math.sqrt(r2),a=-T.GM/(r2*r)*h;
        v[i*3]+=x*a;v[i*3+1]+=y*a;v[i*3+2]+=z*a;
        /* diskte sürtünme (viskozite): bağlı gaz yavaş yavaş içeri sarmal çizer, diske yassılaşır */
        if(r<T.R0*1.2){var dr=Math.min(.05,h*.12*(T.R0/r));v[i*3]*=1-dr;v[i*3+1]*=1-dr*3;v[i*3+2]*=1-dr;}
        p[i*3]+=v[i*3]*h;p[i*3+1]+=v[i*3+1]*h;p[i*3+2]+=v[i*3+2]*h;
        if(r<hz||r>T.R0*40){T.alive[i]=0;T.left--;p[i*3]=p[i*3+1]=p[i*3+2]=0;if(r<hz)feed++;}}
      if(feed&&T.host.exo)T.host.exo.fuel=Math.min(4,(T.host.exo.fuel||0)+feed*(T.star?.0025:.0012));
      T.age+=dt;}
    var c=T.col,P=T.pos,fresh=clamp(1-T.age/4,0,1);
    for(var j=0;j<T.N;j++){if(!T.alive[j]){c[j*3]=c[j*3+1]=c[j*3+2]=0;continue;}
      var rr=Math.sqrt(P[j*3]*P[j*3]+P[j*3+1]*P[j*3+1]+P[j*3+2]*P[j*3+2]);tdeColor(c,j,rr/T.R0,fresh,T.base,1.2,1.5,6,.3);}
    T.pts.geometry.attributes.position.needsUpdate=true;T.pts.geometry.attributes.color.needsUpdate=true;
    if(T.left<=T.N*.03||T.age>60){tdlKill(T);TDL.splice(k,1);toast(T.name+' artık yok: bağlı kalan maddesi diskte ısınıp olay ufkundan içeri düştü, kalanı uzaya savruldu.',5000);}
  }
}
function drawTDE(dt){
  stepTDL(dt);
  for(var u=TDES.length-1;u>=0;u--)if(simDays<TDES[u].ts){tdeUndo(TDES[u]);TDES.splice(u,1);}
  for(u=TDEDONE.length-1;u>=0;u--)if(simDays<TDEDONE[u].ts){tdeUndo(TDEDONE[u]);TDEDONE.splice(u,1);}
  /* akıntı simülasyon saatine bağlı: iç zaman = (şimdi − başlangıç) × k; geri sarınca aynı yoldan geri akar */
  TDES.forEach(function(T){var GM=T.GM*sunMass,Td=TAU*Math.sqrt(Math.pow(T.rt,3)/GM),hs=Td/160,del=(simDays-T.ts)*T.k-T.tau;if(Math.abs(del)<1e-9)return;
    var m=Math.ceil(Math.abs(del)/hs);if(m>60){m=60;del=(del>0?1:-1)*60*hs;}var h=del/m;for(var q=0;q<m;q++)stepTDEStream(T,h);T.tau+=del;T.age=T.tau/(Td*.25);});
  if(EXO.disk&&EXO.col)diskFuelStep(EXO,dt);
  for(var k=TDES.length-1;k>=0;k--){var T=TDES[k],p=T.pos,c=T.col;T.age+=dt;
    for(var i=0;i<T.N;i++){if(!T.alive[i]){c[i*3]=c[i*3+1]=c[i*3+2]=0;continue;}
      var r=Math.sqrt(p[i*3]*p[i*3]+p[i*3+1]*p[i*3+1]+p[i*3+2]*p[i*3+2]);tdeColor(c,i,r/T.rt,clamp(1-T.age/6,0,1),T.base,.6,2,10,.12);}
    T.pts.geometry.attributes.position.needsUpdate=true;T.pts.geometry.attributes.color.needsUpdate=true;
    if(T.left<=T.N*.02||T.age>120||sunType!==6){if(T.pts.parent)T.pts.parent.remove(T.pts);T.pts.geometry.dispose();T.pts.material.dispose();T.pts=null;TDES.splice(k,1);TDEDONE.push(T);
      if(sunType===6)toast(T.name+' artık yok: maddesinin çoğu diskte ısınıp X-ışını saçarak olay ufkundan içeri düştü.',6000);}
  }
}

/* rehber */
function seen(){try{return localStorage.getItem('gsg-coach')==='1';}catch(_){return false;}}
function markSeen(){try{localStorage.setItem('gsg-coach','1');}catch(_){}}
$('coachOk').addEventListener('click',function(){$('coach').hidden=true;markSeen();});
$('coachLab').addEventListener('click',function(){$('coach').hidden=true;markSeen();showTab('lab');});
