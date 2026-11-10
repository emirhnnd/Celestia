/* Celestia · Liste, durum, bilgi paneli, canlı grafik ve girdi (fare, dokunma, klavye).
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- liste ve arayüz ---------- */
function dotStyle(d){return 'background:radial-gradient(circle at 32% 30%,'+d[0]+','+d[1]+')';}
function rebuildLists(){
  var tl=$('treeList'),pl=$('planets');tl.innerHTML='';pl.innerHTML='';
  BODIES.forEach(function(b){
    var d=b.def;if(b.sysHide)return;
    var tb=document.createElement('button');tb.dataset.id=d.id;tb.className=(d.parent?'moon':'')+(d.custom&&!d.parent&&!b.sysOwn?' custom':'');
    tb.innerHTML='<span class="dot" style="'+dotStyle(d.dot)+'"></span>'+esc(d.name);
    tb.addEventListener('click',function(){focusBody(d.id);});tl.appendChild(tb);b.treeBtn=tb;if(isGone(b)||b.engulfed)tb.hidden=true;
    if(!d.parent&&!d.minor){
      var pb=document.createElement('button');pb.dataset.id=d.id;pb.title=d.name;pb.setAttribute('aria-label',d.name);
      pb.innerHTML='<span class="dot" style="'+dotStyle(d.dot)+'"></span>'+esc(d.name);
      pb.addEventListener('click',function(){focusBody(d.id);});pl.appendChild(pb);b.dockBtn=pb;if(isGone(b)||b.engulfed)pb.hidden=true;
    }
    if((d.star||b===sunBody)&&typeof refreshStarDot==='function')refreshStarDot(b);
  });
  setActiveUI();
}
function setActiveUI(){
  if(!focus)return;
  BODIES.forEach(function(x){
    var on=x===focus;
    if(x.treeBtn)x.treeBtn.classList.toggle('on',on);
    x.label.classList.toggle('on',on);
    if(x.dockBtn)x.dockBtn.classList.toggle('on',x===systemOf(focus));
    if(x.def.minor&&x.line)x.line.visible=x===focus;
  });
}
var notifyOn=false;try{notifyOn=localStorage.getItem('se_notif')==='1';}catch(e){}
function note(msg,ms){if(notifyOn)toast(msg,ms);}
var toastLock=0;
/* Bildirim: kısa bir başlık görünür; ayrıntı varsa dokununca açılır. Başlık ile ayrıntı '\n' ile ayrılır, yoksa ilk cümle başlık olur. */
function toast(msg,ms){
  if(performance.now()<toastLock&&!(ms>=6000))return;
  var t=$('toast'),h=msg,b='',k=msg.indexOf('\n');
  if(k>0){h=msg.slice(0,k);b=msg.slice(k+1);}
  else if(msg.length>110){var mm=msg.match(/^(.{20,150}?[.!?])\s+(?=\S)/);if(mm){h=mm[1];b=msg.slice(mm[0].length);}else{var c=msg.lastIndexOf(' ',110);h=msg.slice(0,c)+'…';b=msg;}}
  t.textContent='';var hd=document.createElement('span');hd.textContent=h;t.appendChild(hd);
  t.classList.remove('open');t.classList.toggle('more',!!b);
  if(b){var tm=document.createElement('span');tm.className='tm';tm.textContent='Ayrıntı ▾';t.appendChild(tm);var bd=document.createElement('div');bd.className='tb';bd.textContent=b;t.appendChild(bd);}
  t.classList.add('show');clearTimeout(toast.t);
  toast.t=setTimeout(function(){if(!t.classList.contains('open'))t.classList.remove('show');},Math.max(ms||2400,b?6000:0));
}
document.getElementById('toast').addEventListener('click',function(){
  var t=this;if(!t.classList.contains('more'))return;
  if(t.classList.contains('open')){t.classList.remove('open','show');clearTimeout(toast.t);return;}
  t.classList.add('open');clearTimeout(toast.t);var tm=t.querySelector('.tm');if(tm)tm.textContent='Kapat ▴';
});

/* ---------- durum ---------- */
var mode='orbit',focus=null,target=new THREE.Vector3(),theta=.9,phi=1.15,dist=380,desired=380,trans=null;
var yaw=0,pitch=0;
function OVD(){var m=30;BODIES.forEach(function(b){if(!b.parent&&b.def.r&&!b.sysHide&&!b.def.minor)m=Math.max(m,b.def.r);});return clamp(m*1.05*1.6,SYS?90:560*DS,1500*DS)*(W<760?1.55:1);}
var simDays=(Date.now()-J2000)/86400000,speedIdx=4,playing=true,reverse=false,gSpin=1;
var showOrbits=true,showLabels=true,showMini=false;
var sunType=0;

function systemOf(b){return b.parent?b.parent:b;}
function effVr(b){return b.def.vr*b.mod.size*(b.typeScale||1);}
/* Gerçek ölçekte nötron yıldızı ve kara delik gerçek boyutunda çizilir: nötron yıldızı 10 km yarıçap; kara deliğin gölgesi olay ufkunun
   2,6 katı, olay ufku kütleyle doğru orantılı (2,95 km × Güneş kütlesi). Çoğu zaman pikselden küçük kalırlar: yerlerini işaret noktası
   gösterir, yaklaşınca gerçek küre görünür. Diğer ölçeklerde görünsün diye büyütülmüş hâlleri (SUN_TYPES.sc) kullanılır.
   Başka yıldız sistemine geçildiğinde (SYS) Güneş'in yerindeki yıldız o sistemin ölçeğini kullanır. */
var NS_KM=10,BH_SH_KM=2.95*2.6;
function realCompact(b,i){return REAL&&(i===5||i===6)&&!(b===sunBody&&SYS);}
/* Kırmızı dev ve beyaz cüce de gerçek ölçekte gerçek boyutunda: kırmızı dev ~200 Güneş yarıçapı (0,93 AU: Merkür ve Venüs'ü yutar, Dünya sınırda kalır),
   beyaz cüce ~6.000 km yarıçap (Dünya kadar). Diğer ölçeklerde kırmızı dev küçültülmüş, beyaz cüce büyütülmüş çizilir. */
var RG_RSUN=200,WD_KM=6000;
function realSized(b,i){return REAL&&i>=3&&i<=6&&!(b===sunBody&&SYS);}
function typeSc(b,i){if(!realSized(b,i))return SUN_TYPES[i].sc;if(i===3)return RG_RSUN;
  var km=i===4?WD_KM:i===5?NS_KM:BH_SH_KM*Math.max(.2,stMass(b));return km/KM_U/(b.def.vr*((b.mod&&b.mod.size)||1));}
/* eklenen nötron yıldızı ve kara delikte boyut her karede güncellenir: kara delik madde yuttukça büyür, boyut kaydırıcısı gerçek boyutu değiştirmez */
function realSizeSync(b,i){if(!realCompact(b,i)||b===sunBody||b.morphing||b.exoCol)return;var ts=typeSc(b,i);if(ts!==b.typeScale){b.typeScale=ts;b.tilt.scale.setScalar(b.mod.size*ts);b.vr=effVr(b);}}
function focusBody(id,opts){
  var b=byId[id];if(!b)return;opts=opts||{};
  if(mode==='surface')exitSurface(true);
  if(mode==='free')setMode('orbit');
  focus=b;
  desired=opts.dist||(b.def.craft?(b.def.parent?1.4:1.6):b.def.comet?(b.def.asteroid?3:(b.def.minor?16:34)):effVr(b)*(b.parent?7:5.2))*(W<760?1.7:1);
  /* kara delik: kamera diskin içinde kalmasın; nötron yıldızı: 20 km'lik küre ekranı kaplamasın, hüzmeler görünsün */
  if(!opts.dist){var ex=b===sunBody?(sunType===6?EXO:null):b.exo;if(ex&&ex.disk&&ex.sh)desired=Math.max(desired,ex.sh*14);else if(ex&&ex.disk)desired=Math.max(desired,solidR(b)*6);else if(ex&&ex.beams)desired=Math.max(desired,effVr(b)*30);}
  trans={t:0,s:target.clone(),d0:dist,d1:desired};
  updateInfo();syncLab();setActiveUI();
}
function setMode(m){
  if(m===mode)return;
  if(m==='free'){
    var e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');yaw=e.y;pitch=e.x;trans=null;
  }else{
    focus.pivot.getWorldPosition(tmpV);target.copy(tmpV);
    var off=camera.position.clone().sub(tmpV);dist=Math.max(off.length(),effVr(focus)*1.8);desired=dist;
    theta=Math.atan2(off.z,off.x);phi=clamp(Math.acos(clamp(off.y/off.length(),-1,1)),.05,Math.PI-.05);trans=null;
  }
  mode=m;
  $('mOrbit').setAttribute('aria-pressed',m==='orbit');
  $('mFree').setAttribute('aria-pressed',m==='free');
  updateHint();
}
function updateHint(){
  $('hint').textContent=mode==='orbit'
    ?'Sürükle: döndür · Tekerlek / çimdik: yakınlaş · Bir gök cismine dokun · Boşluk: duraklat'
    :'Sürükle: bak · W A S D: ilerle · Q / E: alçal / yüksel · Shift: hızlı · Tekerlek: ileri / geri';
}

function rsKm(){var r=2.95*sunMass;return (r<10?r.toFixed(1):Math.round(r).toLocaleString('tr-TR')).replace('.',',')+' km';}
function eatTxt(){if(!EATEN)return 'Henüz yok';var e=EATEN<10?EATEN.toFixed(2).replace('.',','):Math.round(EATEN).toLocaleString('tr-TR');var pc=EATEN/333000*100;return e+' Dünya kütlesi (+%'+(pc<.01?pc.toFixed(4):pc.toFixed(2)).replace('.',',')+')';}
function mStr(){return (sunMass<10?sunMass.toFixed(EATEN>0?4:(sunMass<1?2:1)):Math.round(sunMass).toLocaleString('tr-TR')).replace('.',',')+' Güneş';}
/* nötron yıldızı gerçekte ~20 km: Dünya ile aynı ölçekte çizilse hiç görünmezdi. Ekrandaki büyütmeyi Dünya'nın ekrandaki boyutuna göre hesaplar */
/* ekrandaki yarıçapın (sahne birimi) gerçek yarıçapa (km) oranı: ölçü Dünya'nın ekrandaki boyutudur (gerçek ölçekte bu doğrudan km oranıdır) */
function drawK(u,km){var e=byId.earth;return e&&u>0&&km>0?u/effVr(e)*6371/km:0;}
function bigTxt(u,km){var k=drawK(u,km);return !k?'Görünsün diye büyütüldü':k<1.5?'Gerçek boyutunda (yakınlaşınca görünür)':katTxt(k);}
/* yalnızca belirgin büyütme varsa satır ekler (sıkıştırılmış ölçeklerde beyaz cüce zaten Dünya boyutunda çizilir) */
function bigRow(u,km){return drawK(u,km)>=1.5?[['Ekranda',bigTxt(u,km)]]:[];}
/* Güneş tür değiştirirken boyutu yavaşça geçer: etiket geçişin ortasındaki anlık boyutu değil, varacağı boyutu yazar */
function finalVr(b){return b===sunBody&&!SYS?b.def.vr*b.mod.size*starTarget():effVr(b);}
function nsScaleTxt(b){return bigTxt(b?finalVr(b):0,10);}
/* kara delikte ekrandaki gölge, gerçek gölgeyle karşılaştırılır: gölge yarıçapı olay ufkunun ~2,6 katı (2,95 km × kütle × 2,6) */
function bhScaleTxt(b){return bigTxt(finalVr(b)*bhK(b),2.95*2.6*stMass(b));}
function starInfo(){
  if(focus!==sunBody||SYS||sunType===0)return null;var T=SUN_TYPES[sunType];
  var I={
   1:{n:'Güneş (kırmızı cüce)',d:'Güneş kırmızı cüce olsaydı: yarı boyutunda, ışığının yalnızca yaklaşık binde 4\'ünü veren sönük, turuncu-kırmızı bir yıldız. Kırmızı cüceler trilyonlarca yıl yaşar ve evrendeki yıldızların çoğu böyledir. Güçlü parlamaları yakın gezegenlerin atmosferini aşındırabilir.',s:[['Çap','~700.000 km (0,5 Güneş)'],['Parlaklık','Güneş\'in %0,4\'ü'],['Yüzey','~3.000 °C'],['Ömür','1 trilyon yıldan uzun']]},
   2:{n:'Güneş (mavi dev)',d:'Güneş mavi dev olsaydı: çok daha büyük, çok daha sıcak ve yüzlerce kat parlak olurdu. Bu yıldızlar yakıtlarını birkaç on milyon yılda tüketir ve süpernova olarak patlar. Yaydıkları güçlü UV, yakın gezegenlerde yaşamı zorlaştırır.',s:[['Çap','~3,3 milyon km (2,4 Güneş, modelde)'],['Parlaklık','~600 Güneş'],['Yüzey','~20.000 °C'],['Ömür','~10–50 milyon yıl']]},
   3:{n:'Güneş (kırmızı dev)',d:'Güneş yaklaşık 5 milyar yıl sonra çekirdeğindeki hidrojen bitince şişip kırmızı dev olacak. Merkür ve Venüs\'ü yutacak; Dünya\'nın yutulup yutulmayacağı tartışmalı. Yüzeyi soğur ama toplam parlaklığı binlerce kat artar.',s:[['Çap',REAL&&!SYS?'~200 Güneş (~280 milyon km)':'Gerçekte ~200 Güneş (modelde küçültüldü)'],['Parlaklık','~2.000 Güneş'],['Yüzey','~3.000 °C'],['Evre','Kırmızı dev']]},
   4:{n:'Güneş (beyaz cüce)',d:'Güneş\'in son hâli: kırmızı dev, dış katmanlarını gezegenimsi bulutsu olarak savurur; geriye Dünya boyutunda, son derece yoğun sıcak bir çekirdek kalır. İçinde füzyon yoktur, milyarlarca yıl boyunca yavaşça soğur.',s:[['Çap','~12.000 km (Dünya kadar)']].concat(bigRow(finalVr(sunBody),6000),[['Kütle',mStr()+' × 0,55'],['Yoğunluk','Bir çay kaşığı ~5 ton'],['Yüzey','~25.000 °C (başlangıçta)']])},
   5:{n:'Pulsar (eski Güneş)',d:'Süpernovadan geriye kalan çökmüş çekirdek: Güneş kadar madde 20 km\'lik bir küreye sıkıştı. Hızla dönüyor; manyetik kutuplarından çıkan iki ışın deniz feneri gibi uzayı süpürüyor. Işın bize her değdiğinde bir atım görülür; seste de bu atımlar tık tık duyulur. Gerçekte Güneş süpernova olamaz, en az 8 Güneş kütlesi gerekir. Ekrandaki ışın hüzmeleri ve manyetik alan çizgileri görselleştirmedir: gerçekte göze görünmezler, hüzmeler yalnızca radyo ve X-ışını atımı olarak ölçülür.',s:[['Çap','~20 km'],['Ekranda',nsScaleTxt(sunBody)],['Dönüş','Modelde saniyede '+PULS_HZ+' tur (Vela pulsarı 11, en hızlıları 700+)'],['Yoğunluk','Bir çay kaşığı ~1 milyar ton'],['Manyetik alan','Dünya\'nınkinin ~1 trilyon katı'],['Yüzey','~1 milyon °C']]},
   6:{n:'Kara delik (eski Güneş)',d:'Bu kütledeki bir kara deliğin olay ufkundan ışık bile kaçamaz. Yeni oluşan kara delikte henüz yutacak gaz yoktur: yalnızca karanlık bir gölge ve çevresinde bükülen ışığın ince halkası (foton halkası) görünür. Bir gezegen ya da yıldız yutarsa madde disk oluşturup milyonlarca dereceye ısınır ve parlar; diskin bize doğru dönen tarafı daha parlak ve mavimsi görünür (Doppler etkisi), gölgenin üstündeki ve altındaki yaylar diskin arka tarafından gelen ışığın kütleçekimiyle bükülmesidir (kütleçekimsel mercek). Kütleyi artırırsan olay ufku da büyür.',s:[['Kütle',mStr()],['Olay ufku yarıçapı',rsKm()+' (2,95 km × kütle)'],['Gölge çapı','Olay ufkunun ~5,2 katı'],['Ekranda',bhScaleTxt(sunBody)],['Yuttuğu kütle',eatTxt()],['Disk','Madde yutulunca parlar, sonra söner'],['Işık','Yok; yalnızca bükülmüş halka ve (varsa) disk parlar']]}
   ,7:{n:'Tip Ia süpernova kalıntısı',d:'Beyaz cüce olan Güneş kütle sınırını aşıp tamamen patladı; geriye yıldız kalmadı, yalnızca genişleyen sıcak gaz kabuğu var. Bu patlamalar her seferinde neredeyse aynı parlaklıkta olduğu için gökbilimciler onları evrenin genişlemesini ölçmede "standart mum" olarak kullanır.',s:[['Kalıntı','Yok (yıldız tamamen parçalandı)'],['Saçılan madde','~1,4 Güneş kütlesi'],['Ürettiği demir','~0,6 Güneş kütlesi'],['Parlaklık (zirvede)','~5 milyar Güneş']]}
  }[sunType];
  return I?{name:I.n,kind:'Yıldız kalıntısı · '+T.stage,desc:I.d,stats:I.s}:null;
}
var LAST_LABF=null;
function updateInfo(){
  var d=starInfo()||focus.def;$('iKind').textContent=d.kind;$('iName').textContent=d.name;$('iDesc').textContent=d.desc;
  $('stats').innerHTML=d.stats.map(function(s){return '<dt>'+esc(s[0])+'</dt><dd'+(s[0]==='Sıcaklık'&&focus.hab?' id="tNow"':'')+'>'+esc(s[1])+'</dd>';}).join('');
  $('sideBody').scrollTop=0;liveT=0;
  $('sideMini').innerHTML='<small>'+esc(d.kind.split(' ')[0])+'</small>'+esc(d.name)+' · ayrıntı için dokun';
  if(typeof renderQuick==='function')renderQuick();if(typeof labContext==='function'&&LAST_LABF!==focus){LAST_LABF=focus;labContext();}
}
function lightTime(au){
  var m=au*AU_LM;
  if(m>=60)return Math.floor(m/60)+' sa '+Math.round(m%60)+' dk';
  return Math.floor(m)+' dk '+Math.round((m%1)*60)+' sn';
}
var fmt=new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
/* ---------- canlı grafik ----------
   Seçili cismin bir değerini (Güneş'e uzaklık, hız, yüzey sıcaklığı, yaşanabilirlik) simülasyon zamanına göre çizer:
   "Dünya'yı Güneş'e yaklaştırdım, sıcaklık nasıl değişti?" sorusunun cevabı bir eğri olur.
   Örnekler yalnızca zaman ilerlerken alınır; tampon dolunca seyreltilir, böylece cisme odaklanıldığından beri olan her şey görünür. */
var GR={open:false,key:'dist',N:240,id:null,t:[],v:{},step:0,lp:new THREE.Vector3(),lt:null,spd:null,drawn:''};
var GR_M=[
  {k:'dist',n:'Uzaklık',u:' AU',d:2,ok:function(b){return !b.def.parent&&b!==sunBody;}},
  {k:'spd',n:'Hız',u:' km/s',d:1,ok:function(b){return !b.def.parent&&b!==sunBody;}},
  {k:'temp',n:'Sıcaklık',u:' °C',d:0,ok:function(b){return !!(b.cl&&b.hab);}},
  {k:'hab',n:'Yaşanabilirlik',u:'',pre:'%',d:0,ok:function(b){return !!(b.cl&&b.hab&&!b.hab.gas);}}];
function grMetrics(b){return b&&!isGone(b)?GR_M.filter(function(m){return m.ok(b);}):[];}
function grFmt(m,x){if(x==null||!isFinite(x))return '–';var a=Math.abs(x),d=m.k==='dist'?(a>=100?0:a>=10?1:2):m.k==='hab'&&a<1?1:m.d;return (m.pre||'')+x.toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d})+m.u;}
/* Güneş'e göre konum, AU cinsinden: sahnedeki yön × o uzaklığın karşılık geldiği AU (sıkıştırılmış ölçeklerde de gerçek değer çıkar) */
var _gp=new THREE.Vector3();
function grPosAU(b,out){out.copy(b.pos).sub(sunBody.pos);var L=out.length();return L>0?out.multiplyScalar(invOrbit(L)/L):out;}
function grReset(){GR.t.length=0;GR.v={};GR.step=0;GR.lt=null;GR.spd=null;GR.id=focus?focus.def.id:null;}
/* hız her karede izlenir: örnekleme aralığı (0,3 sn) hızlı zaman akışında bir yörüngenin büyük kısmını atlayabilir, kirişten hız ölçülmez */
function grTrack(){
  var b=focus;if(!b||b===sunBody||b.def.parent||isGone(b)){GR.lt=null;return;}
  if(GR.id!==b.def.id)grReset();
  grPosAU(b,_gp);
  if(GR.lt!=null){var dtD=simDays-GR.lt;
    if(dtD>1e-9){var c=_gp.dot(GR.lp)/Math.max(1e-12,_gp.length()*GR.lp.length());
      /* bir karede 0,35 radyandan fazla dönülmüşse kiriş hatası büyür: son geçerli değer korunur */
      if(c>.94)GR.spd=_gp.distanceTo(GR.lp)/dtD*1731.457;}
    else if(dtD<0)GR.spd=null;}
  GR.lp.copy(_gp);GR.lt=simDays;}
function grValue(b,k){
  if(k==='dist')return invOrbit(b.pos.distanceTo(sunBody.pos));
  if(k==='spd'){
    /* kuyruklu yıldızda hız, yörünge enerjisinden (vis-viva): v = 29,78 km/s × √(M☉ (2/r − 1/a)). Sıkıştırılmış ölçeklerde elips sahne biriminde
       çizildiği için konum farkından ölçülen hız gerçek değeri vermez */
    var cm=b.def.comet&&b.def.cm;if(cm&&cm.q&&cm.Q){var r=clamp(invOrbit(b.pos.distanceTo(sunBody.pos)),cm.q,cm.Q);return 29.78*Math.sqrt(Math.max(.05,sunMass)*Math.max(0,2/r-2/(cm.q+cm.Q)));}
    return GR.spd;}
  if(k==='temp')return b.cl.Ts-273.15;
  if(k==='hab')return habScore(b);
  return null;}
function grSample(){
  var box=$('gr'),b=focus,ms=grMetrics(b);
  if(!ms.length||mode==='surface'){box.hidden=true;return;}
  box.hidden=false;
  if(GR.id!==b.def.id)grReset();
  if(!ms.some(function(m){return m.k===GR.key;}))GR.key=ms[0].k;
  var n=GR.t.length,last=n?GR.t[n-1]:null;
  /* zaman geri sarıldıysa eğri anlamını yitirir: baştan başla */
  if(last!=null&&simDays<last-1e-9){grReset();n=0;last=null;}
  if(last==null||simDays-last>GR.step){
    GR.t.push(simDays);ms.forEach(function(m){(GR.v[m.k]||(GR.v[m.k]=[])).push(grValue(b,m.k));});
    if(GR.t.length>=GR.N){ /* tampon doldu: her iki örnekten birini at, örnekleme aralığını iki katına çıkar */
      var keep=function(a){return a.filter(function(_,i){return i%2===0;});};
      GR.step=Math.max(GR.step*2,(GR.t[GR.t.length-1]-GR.t[0])/GR.N*2);GR.t=keep(GR.t);Object.keys(GR.v).forEach(function(k){GR.v[k]=keep(GR.v[k]);});}
  }
  grTabs(ms);grDraw(ms);}
function grTabs(ms){
  var sig=ms.map(function(m){return m.k;}).join(',')+'|'+GR.key;if(sig===GR.tabSig)return;GR.tabSig=sig;
  var box=$('grTabs');box.textContent='';
  ms.forEach(function(m){var bt=document.createElement('button');bt.type='button';bt.className='grtab';bt.textContent=m.n;bt.setAttribute('aria-pressed',m.k===GR.key?'true':'false');
    bt.addEventListener('click',function(){GR.key=m.k;try{localStorage.setItem('gsg-graph-key',m.k);}catch(_){}GR.drawn='';grSample();});box.appendChild(bt);});}
function grSpanTxt(d){return d<=0?'':d<1?'son '+Math.max(1,Math.round(d*24))+' saat':d<730?'son '+Math.round(d)+' gün':'son '+(d/365.25).toLocaleString('tr-TR',{maximumFractionDigits:1})+' yıl';}
function grDraw(ms){
  var m=ms.filter(function(x){return x.k===GR.key;})[0],V=GR.v[GR.key]||[],T=GR.t,n=T.length,cur=grValue(focus,GR.key);
  $('grNow').textContent=m.n+' · '+grFmt(m,cur);
  if(!GR.open)return;
  var cv=$('grCv'),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  var dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);GR.drawn='';}
  var sig=GR.key+'|'+n+'|'+(n?T[n-1]:0)+'|'+cv.width;if(sig===GR.drawn)return;GR.drawn=sig;
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  var pts=[];for(var i=0;i<n;i++)if(V[i]!=null&&isFinite(V[i]))pts.push([T[i],V[i]]);
  var cs=getComputedStyle(document.documentElement),cLine=cs.getPropertyValue('--soft').trim()||'#c4c9d8',cDim=cs.getPropertyValue('--line').trim()||'rgba(214,222,255,.11)',cAcc=cs.getPropertyValue('--accent').trim()||'#f2b84b';
  /* taban ve tavan çizgisi */
  g.strokeStyle=cDim;g.lineWidth=1;g.beginPath();g.moveTo(0,.5);g.lineTo(w,.5);g.moveTo(0,h-.5);g.lineTo(w,h-.5);g.stroke();
  if(pts.length<2){$('grMin').textContent='';$('grMax').textContent='';$('grSpan').textContent=playing?'Veri toplanıyor…':'Zaman durdu: oynatınca çizilir';
    cv.setAttribute('aria-label',m.n+' grafiği: henüz yeterli veri yok');return;}
  var lo=Infinity,hi=-Infinity;pts.forEach(function(p){if(p[1]<lo)lo=p[1];if(p[1]>hi)hi=p[1];});
  /* düz çizgi ekranın ortasında dursun; küçük dalgalanma abartılmasın */
  var span=hi-lo,minSpan=Math.max(Math.abs(hi),Math.abs(lo))*.02+(m.k==='temp'?1:m.k==='hab'?1:1e-4);if(span<minSpan){var mid=(hi+lo)/2;lo=mid-minSpan/2;hi=mid+minSpan/2;span=minSpan;}
  var t0=pts[0][0],t1=pts[pts.length-1][0],dt=Math.max(1e-9,t1-t0),pad=7,X=function(t){return (t-t0)/dt*(w-pad-2)+1;},Y=function(v){return h-pad-(v-lo)/span*(h-2*pad);};
  g.beginPath();pts.forEach(function(p,i){if(i)g.lineTo(X(p[0]),Y(p[1]));else g.moveTo(X(p[0]),Y(p[1]));});
  g.strokeStyle=cLine;g.lineWidth=1.6;g.lineJoin='round';g.stroke();
  /* "şu an" noktası: tek vurgu rengi */
  var lx=X(t1),ly=Y(pts[pts.length-1][1]);g.fillStyle=cAcc;g.beginPath();g.arc(lx,ly,3.2,0,TAU);g.fill();
  $('grMin').textContent='en az '+grFmt(m,lo);$('grMax').textContent='en çok '+grFmt(m,hi);$('grSpan').textContent=grSpanTxt(dt);
  cv.setAttribute('aria-label',m.n+' grafiği, '+grSpanTxt(dt)+': en az '+grFmt(m,lo)+', en çok '+grFmt(m,hi)+', şu an '+grFmt(m,cur));}
function grSetOpen(o){GR.open=o;$('grBody').hidden=!o;$('grTog').setAttribute('aria-expanded',o?'true':'false');GR.drawn='';try{localStorage.setItem('gsg-graph',o?'1':'0');}catch(_){}if(o&&focus)grSample();}
(function(){try{GR.open=localStorage.getItem('gsg-graph')==='1';var k=localStorage.getItem('gsg-graph-key');if(k&&GR_M.some(function(m){return m.k===k;}))GR.key=k;}catch(_){}
  $('grBody').hidden=!GR.open;$('grTog').setAttribute('aria-expanded',GR.open?'true':'false');
  $('grTog').addEventListener('click',function(){grSetOpen(!GR.open);});})();

var liveT=0;
function realXY(b){if(b.au&&realOk(b)&&b.mod.orbit===1&&!(gravityOn&&b.grav))return [b.au.x,-b.au.y];var a=b.def.a||invOrbit(b.pos.length());return [a*Math.cos(b.ang),-a*Math.sin(b.ang)];}
function updateLive(){
  var el=$('live'),d=focus.def;
  renderHab(focus);renderWeather(focus);renderPlanetWx(focus);$('ecl').hidden=!(focus.def.id==='earth'||focus.def.id==='moon');
  $('craftTour').hidden=!d.craft;if(d.craft&&focus.craftC){var tdt=new Date(J2000+(focus.craftC.t0)*864e5);$('craftTour').textContent='Görevi fırlatıştan izle · tarih '+new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',year:'numeric'}).format(tdt)+' olur';}$('goSurf').hidden=!!(d.star||d.craft||d.comet||isGone(focus));$('goSurf').textContent=(focus.hab&&focus.hab.gas)?'Bulut tepesinden bak':'Yüzeyden bak';
  if((d.parent&&!d.craft)||d.star){el.hidden=true;return;}
  el.hidden=false;
  var k1=$('l1k'),v1=$('l1v'),k2=$('l2k'),v2=$('l2v');
  if(d.craft){
    var st=craftStatus(focus),au1=focus.au?focus.au.length():invOrbit(focus.pos.distanceTo(sunBody.pos)),ea=byId.earth&&byId.earth.au,dE=focus.au&&ea?focus.au.distanceTo(ea):(d.id==='jwst'?.01:0);
    k1.textContent='Durum';v1.textContent=st;k2.textContent=d.parent?'Yükseklik':'Dünya\'ya uzaklık';v2.textContent=d.parent?'~400 km':(fmt.format(dE)+' AU · ışıkla '+lightTime(dE));
  }else if(d.comet){
    var au0=invOrbit(focus.pos.length());
    k1.textContent='Güneş\'e uzaklık';v1.textContent=fmt.format(au0)+' AU';k2.textContent='Güneş ışığı';v2.textContent=lightTime(au0);
  }else if(d.id==='sun'&&SYS){
    var SL=SYSTEMS.filter(function(x){return x.id===SYS.id;})[0];k1.textContent='Dünya\'ya uzaklık';v1.textContent=String(SL.ly).replace('.',',')+' ışık yılı';k2.textContent='Işığı bize';v2.textContent=String(SL.ly).replace('.',',')+' yılda ulaşır';
  }else if(d.id==='sun'){
    k1.textContent='Dünya\'ya uzaklık';v1.textContent=fmt.format(1)+' AU';k2.textContent='Işık Dünya\'ya';v2.textContent=lightTime(1);
  }else if(d.id==='earth'){
    var ae=(focus.au&&!(gravityOn))?focus.au.length():invOrbit(focus.pos.distanceTo(sunBody.pos));
    k1.textContent='Güneş\'e uzaklık';v1.textContent=fmt.format(ae)+' AU';k2.textContent='Güneş ışığı';v2.textContent=lightTime(ae);
  }else{
    var p=realXY(focus),e=realXY(byId.earth),au=Math.hypot(p[0]-e[0],p[1]-e[1]);
    k1.textContent='Dünya\'ya uzaklık';v1.textContent=fmt.format(au)+' AU';
    k2.textContent='Işığın yolculuğu';v2.textContent=lightTime(au);
  }
}

/* ---------- girdi ---------- */
var pointers=new Map(),moved=0,lastPinch=0,keys={};
function pinchD(){var a=Array.from(pointers.values());return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;}
function solidR(b){var r=effVr(b);if(b===sunBody&&sunType===6&&!SYS)r*=bhMassK()*2.6;else if(b.exo&&b.exo.disk)r*=2.6;if(b.wob)r*=1.25;if(b.atmoMesh)r*=1.04;return r;}
/* gerçek ölçekte en küçük cisimlerde kamera yakın kırpma düzleminin (en az 0,01 birim ≈ 40 km) içine girmesin */
function minDist(){var m=solidR(focus)*(focus.parent?2.2:1.7);return REAL?Math.max(m,.03):m;}
var DCAM=true;
function dartCam(){if(!DCAM||!focus)return null;var A=null;for(var i=0;i<BODIES.length;i++){var b=BODIES[i];if(b.dart&&b.dart.cam&&(b.dart.t===focus||b===focus)&&!isGone(b)&&!isGone(b.dart.t)){A=b;break;}}if(!A)return null;
  var t=A.dart.t,c=_dcC.copy(A.pos).add(t.pos).multiplyScalar(.5),r=A.pos.distanceTo(t.pos)*.5+Math.max(solidR(A),solidR(t));return {c:c,r:r};}
var _dcC=new THREE.Vector3();
function zoomBy(k){DCAM=false;
  if(mode==='surface'){camera.fov=clamp(camera.fov*k,12,75);camera.updateProjectionMatrix();return;}
  if(mode==='orbit'){dist=clamp(dist*k,minDist(),5000*DS);trans=null;}
  else{camera.translateZ((k-1)*nearestSurface()*1.2);}
}
cv.addEventListener('pointerdown',function(e){
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;if(pointers.size===2)lastPinch=pinchD();
});
cv.addEventListener('pointermove',function(e){
  var p=pointers.get(e.pointerId);if(!p)return;
  var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);if(moved>8)DCAM=false;if(moved>8&&WX.follow&&mode==='orbit'){WX.follow=null;toast('Fırtına takibi bırakıldı',1800);}
  if(pointers.size===1){
    if(mode==='surface'&&SURF){SURF.yaw-=dx*.004;SURF.pitch=clamp(SURF.pitch+dy*.004,-.35,1.55);}
    else if(mode==='orbit'){theta-=dx*.006;phi=clamp(phi-dy*.006,.04,Math.PI-.04);}
    else{yaw-=dx*.0042;pitch=clamp(pitch-dy*.0042,-1.55,1.55);}
  }else if(pointers.size===2){
    var d=pinchD();zoomBy(Math.pow(lastPinch/d,REAL&&mode==='orbit'?1.8:1));lastPinch=d;moved+=10;
  }
});
function endPtr(e){
  var had=pointers.has(e.pointerId);pointers.delete(e.pointerId);
  if(had&&moved<6&&pointers.size===0&&e.type==='pointerup')pick(e.clientX,e.clientY);
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',function(e){e.preventDefault();
  /* gerçek ölçekte yakınlaştırma aralığı milyon katı: tekerlek iki kat hızlı */
  if(mode==='orbit'||mode==='surface')zoomBy(Math.exp(e.deltaY*(REAL&&mode==='orbit'?.0026:.0012)));
  else camera.translateZ(e.deltaY*.0012*nearestSurface()*1.6);
},{passive:false});
addEventListener('keydown',function(e){
  var tag=e.target.tagName;
  if(tag==='INPUT'&&e.target.type!=='range'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.code==='Escape'&&document.body.classList.contains('clean')){setClean(false);return;}
  if(e.code==='Escape'){$('help').hidden=true;$('viewMenu').hidden=true;if(TRIP)endTrip();if(SURF)exitSurface(false);return;}
  if(e.code==='Space'&&tag!=='BUTTON'){e.preventDefault();togglePlay();return;}
  var m=/^Digit(\d)$/.exec(e.code);
  if(m&&tag!=='INPUT'){var ids=['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];var i=+m[1];if(ids[i])focusBody(ids[i]);return;}
  keys[e.code]=true;
});
addEventListener('keyup',function(e){keys[e.code]=false;});
addEventListener('blur',function(){keys={};});

var ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pick(cx,cy){
  var r=cv.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,camera);
  var sys=systemOf(focus),list=[];
  BODIES.forEach(function(b){if(b.parent&&b.parent!==sys)return;if(isEngulfed(b)||b.inactive)return;list.push(b.picker);});
  var hits=ray.intersectObjects(list,false);
  if(hits.length){var b=hits[0].object.userData.body;if(b!==focus)focusBody(b.id);}
}
