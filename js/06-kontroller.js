/* Celestia · Zaman kontrolleri, üst çubuk, yan panel, arama ve hazır deneyler.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- zaman kontrolleri ---------- */
var playIc=$('playIc'),playBtn=$('play');
function setPlayIcon(){
  playIc.innerHTML=playing?'<rect x="2" y="1" width="3.6" height="12"/><rect x="8.4" y="1" width="3.6" height="12"/>':'<path d="M3 1l10 6-10 6z"/>';
  playBtn.setAttribute('aria-label',playing?'Duraklat':'Oynat');
}
function togglePlay(){playing=!playing;setPlayIcon();}
playBtn.addEventListener('click',togglePlay);
$('rev').addEventListener('click',function(){reverse=!reverse;this.setAttribute('aria-pressed',reverse);toast(reverse?'Zaman geri akıyor':'Zaman ileri akıyor');});
var speed=$('speed'),speedLbl=$('speedLbl');
SPEEDS.forEach(function(sp,i){var o=document.createElement('option');o.value=i;o.textContent=sp.t;speed.appendChild(o);});speed.value=speedIdx;
function setSpeed(){var sp0=SPEEDS[speedIdx]?SPEEDS[speedIdx].d:1;speedIdx=+speed.value;
  /* süren bir fırlatma/birleşme hız değişince yavaşlayıp dakikalarca sürmesin: kalan kısmı yeni hızda aynı gerçek sürede oynar */
  var sp1=SPEEDS[speedIdx].d;if(sp1!==sp0)BODIES.forEach(function(b){var D=b.dart;if(!D||!D.Ts)return;var k=clamp((simDays-D.t0)/D.Ts,0,1);D.Ts=D.Ts*sp1/sp0;D.t0=simDays-k*D.Ts;D.lk=k;if(D.ev){D.ev.Ts=D.Ts;}});speedLbl.textContent='Hız';if(gravityOn&&SPEEDS[speedIdx].d>400)toast('Yer çekimi modunda hız en fazla yaklaşık 1 yıl/sn olarak uygulanır');}
speed.addEventListener('change',setSpeed);
$('now').addEventListener('click',function(){
  simDays=(Date.now()-J2000)/86400000;
  BODIES.forEach(function(b){if(b.def.id!=='sun')b.ang=initialAngle(b.def);});resyncReal();updateBodies(0);
  if(gravityOn)BODIES.forEach(function(b){if(b.grav)gInit(b);});
  clearTimeline();
  reverse=false;$('rev').setAttribute('aria-pressed','false');toast('Bugünün tarihine dönüldü');
});

/* ---------- üst çubuk ---------- */
$('mOrbit').addEventListener('click',function(){setMode('orbit');});
$('mFree').addEventListener('click',function(){setMode('free');toast('Serbest uçuş: W A S D ile ilerle');});
$('tOver').addEventListener('click',function(){focusBody('sun',{dist:OVD()});theta=.9;phi=1.12;});
/* gök cisimleri listesi: üstteki düğmeyle açılan çekmece; dar ekranda bir cisim seçilince kapanır */
(function(){var tr=$('tree'),tb=$('tList');function setT(o){tr.classList.toggle('open',o);tb.setAttribute('aria-expanded',String(o));}
  tb.addEventListener('click',function(e){e.stopPropagation();setT(!tr.classList.contains('open'));});
  $('treeList').addEventListener('click',function(e){if(e.target.closest('button')&&innerWidth<=900)setT(false);});
  document.addEventListener('click',function(e){if(tr.classList.contains('open')&&innerWidth<=900&&!tr.contains(e.target)&&e.target!==tb)setT(false);});})();
/* kaydırıcıların dolu kısmı (Chromium/Safari): değer koddan da değiştiği için görünür olanlar düzenli güncellenir */
function rangeFill(r){var mn=+r.min||0,mx=+r.max||100,v=+r.value;r.style.setProperty('--p',((v-mn)/((mx-mn)||1)*100).toFixed(1)+'%');}
document.addEventListener('input',function(e){if(e.target&&e.target.type==='range')rangeFill(e.target);});
setInterval(function(){var sb=$('sideBody');if(!sb||!sb.offsetParent)return;sb.querySelectorAll('input[type=range]').forEach(function(r){if(r.offsetParent)rangeFill(r);});},400);
/* temiz ekran */
var cleanT=0;function setClean(on){document.body.classList.toggle('clean',on);$('viewMenu').hidden=true;if(on){document.body.classList.add('poke');clearTimeout(cleanT);cleanT=setTimeout(function(){document.body.classList.remove('poke');},2200);$('cleanX').focus({preventScroll:true});}resize();}
$('tClean').addEventListener('click',function(e){e.stopPropagation();setClean(true);});
$('cleanX').addEventListener('click',function(){setClean(false);});
/* temiz ekranda dokunma/hareket geri getirme düğmesini kısa süre belirginleştirir */
addEventListener('pointerdown',function(){if(!document.body.classList.contains('clean'))return;document.body.classList.add('poke');clearTimeout(cleanT);cleanT=setTimeout(function(){document.body.classList.remove('poke');},2200);},true);
/* yüzey çubuğunu küçült / aç */
$('surfMin').addEventListener('click',function(){var b=$('surfBar'),m=!b.classList.contains('min');b.classList.toggle('min',m);this.setAttribute('aria-expanded',String(!m));this.setAttribute('aria-label',m?'Çubuğu aç':'Çubuğu küçült');});
var vm=$('viewMenu'),tv=$('tView');
tv.addEventListener('click',function(e){e.stopPropagation();vm.hidden=!vm.hidden;tv.setAttribute('aria-expanded',!vm.hidden);});
document.addEventListener('click',function(e){if(!vm.hidden&&!vm.contains(e.target)){vm.hidden=true;tv.setAttribute('aria-expanded','false');}});
function sw(id,fn){var b=$(id);b.addEventListener('click',function(){var on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);fn(on);});}
sw('vOrb',function(on){showOrbits=on;});
sw('vLab',function(on){showLabels=on;});
sw('vPart',function(on){showPart=on;});
sw('vHa',function(on){if(sunBody&&sunBody.sunU)sunBody.sunU.ha.value=on?1:0;toast(on?'H-alfa filtresi: Güneş\'in kromosferi görünüyor (teleskop fotoğraflarındaki gibi)':'Beyaz ışık: Güneş\'in fotosferi');});
sw('vCons',function(on){showSkyNames=on;if(SKYG&&SKYG.cons)SKYG.cons.visible=on;});
var SMALLV=matchMedia('(max-width:1000px),(max-height:640px)');
$('vNote').setAttribute('aria-checked',String(notifyOn));sw('vNote',function(on){notifyOn=on;try{localStorage.setItem('se_notif',on?'1':'0');}catch(e){}toast(on?'Tutulma, güneş fırtınası gibi olaylar bildirilecek':'Olay bildirimleri kapalı',1800);});
if(SMALLV.matches){showMini=false;$('vMini').setAttribute('aria-checked','false');}
$('vLens').setAttribute('aria-checked',String(LENS.on));sw('vLens',function(on){LENS.on=on;try{localStorage.setItem('gsg-lens',on?'1':'0');}catch(e){}toast(on?'Kara deliğin çevresinde ışık bükülüyor':'Işık bükülmesi kapalı (daha hafif çizim)',1800);if(focus)labCtx();});
sw('vMini',function(on){showMini=on;var m=$('mini');m.style.display=on?'':'none';m.classList.toggle('force',on&&SMALLV.matches);resize();});
$('vFs').addEventListener('click',function(){
  vm.hidden=true;
  try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(function(){toast('Tam ekran bu görünümde kullanılamıyor');});}catch(_){}
});
$('tHelp').addEventListener('click',function(){$('help').hidden=false;});
$('helpOk').addEventListener('click',function(){$('help').hidden=true;});
$('help').addEventListener('click',function(e){if(e.target===$('help'))$('help').hidden=true;});

/* ---------- yan panel ---------- */
function showTab(t){
  $('tabInfo').hidden=t!=='info';$('tabLab').hidden=t!=='lab';
  $('tbInfo').setAttribute('aria-pressed',t==='info');$('tbLab').setAttribute('aria-pressed',t==='lab');
  $('sideBody').scrollTop=0;
  if($('side').classList.contains('collapsed'))$('side').classList.remove('collapsed');
}
$('tbInfo').addEventListener('click',function(){showTab('info');});
$('tbLab').addEventListener('click',function(){showTab('lab');});
$('goLab').addEventListener('click',function(){showTab('lab');});
/* üst çubuk sarınca paneller altına kaysın */
function layoutTop(){var t=$('top');if(!t)return;var r=t.getBoundingClientRect(),h=Math.ceil(r.bottom+8);if(innerWidth<=760)h=Math.ceil(r.bottom+6);document.documentElement.style.setProperty('--toph',h+'px');}
layoutTop();addEventListener('resize',layoutTop);if(window.ResizeObserver)new ResizeObserver(layoutTop).observe($('top'));
/* ================= ARA / KOMUT PALETİ ================= */
function trn(x){return String(x).toLocaleLowerCase('tr-TR').replace(/[çÇ]/g,'c').replace(/[ğĞ]/g,'g').replace(/[ıİ]/g,'i').replace(/[öÖ]/g,'o').replace(/[şŞ]/g,'s').replace(/[üÜ]/g,'u').replace(/[âÂ]/g,'a');}
function clk(id){var e=$(id);if(e&&!e.disabled)e.click();}
function openSide(){var sd=$('side');if(sd)sd.classList.remove('collapsed');}
function onStar(fn){return function(){if(!focus||!focus.def.star)focusBody('sun');setTimeout(function(){openSide();showTab('lab');fn();},80);};}
/* zirve gecesi: yerel 18:00 ile ertesi 07:00 arasında, Güneş astronomik alacakaranlığın altındayken çıkış noktasının en yüksek olduğu an */
function showerBestTime(sh,c,t0){
  try{var d=new Date(t0),obs=new AE.Observer(c[1],c[2],0),base=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),18,0)-c[3]*36e5,best=null;
    for(var m=0;m<=13*60;m+=10){var t=base+m*6e4,dt=new Date(t),se=AE.Equator('Sun',dt,obs,true,true),sa=AE.Horizon(dt,obs,se.ra,se.dec,'normal').altitude;if(sa>-12)continue;
      var h=AE.Horizon(dt,obs,sh[4]/15,sh[5],'normal');if(!best||h.altitude>best.alt+.01)best={t:t,alt:h.altitude,az:h.azimuth};}
    return best;}catch(e){return null;}
}
function nextShowerJump(){
  var c=CITIES[cityIdx],now=new Date(J2000+simDays*864e5),best=null;
  SHOWERS.forEach(function(sh){if(sh[3]<15)return;for(var y=now.getUTCFullYear();y<=now.getUTCFullYear()+1;y++){var t=Date.UTC(y,0,1)+(sh[1]-1)*864e5;var d=new Date(t);var night=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),23-c[3],30);if(night>now.getTime()+864e5&&(!best||night<best.t)){best={t:night,s:sh};}}});
  if(!best)return;
  /* eskiden her yağmur için saat 23:30'a gidiliyordu; Leonidler, Orionidler, Eta Akuaridler ve Kadrantidlerin çıkış noktası o saatte
     daha ufkun altında, bu yüzden neredeyse hiç meteor görünmüyordu. Gece boyunca (Güneş -12°'nin altındayken) çıkış noktasının
     en yüksek olduğu anı buluyoruz: gerçek gözlemciler de yağmuru o saatte izler. */
  var bn=showerBestTime(best.s,c,best.t);if(bn)best.t=bn.t;
  if(gravityOn)setGravity(false);
  var jump=(best.t-J2000)/864e5-simDays;updateBodies(jump);simDays+=jump;speedIdx=0;speed.value=0;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
  focusBody('earth');setTimeout(function(){enterSurface(byId.earth);if(SURF){SURF.aim=skyDir(best.s[4],best.s[5]);SURF.init=true;}toast(best.s[0]+' · '+c[0].replace(/ \(.*\)/,'')+', yerel saat '+('0'+new Date(best.t+c[3]*36e5).getUTCHours()).slice(-2)+':'+('0'+new Date(best.t+c[3]*36e5).getUTCMinutes()).slice(-2)+'. Çıkış noktası en yüksekte; izler oradan dağılıyor gibi görünür.',6000);},400);
}
var ACTIONS=[
 ['🕳️','Güneş\'i kara deliğe dönüştür','Işık kesilir, uzay-zaman ışığı büker; disk yalnızca madde yutunca parlar','kara delik karadelik black hole cokme',onStar(function(){clk('sBH');})],
 ['💥','Süpernova patlat','Yıldız patlar, geriye pulsar ve bulutsu kalır','supernova supernova patlama nötron pulsar',onStar(function(){clk('sNova');})],
 ['🌫️','Gezegenimsi bulutsu (Güneş\'in gerçek sonu)','Kırmızı dev kabuğunu savurur, beyaz cüce kalır','nebula bulutsu beyaz cuce son',onStar(function(){clk('sPN');})],
 ['☀️','Güneş patlaması tetikle','Parlama ve koronal kütle atımı; Dünya\'ya ulaşırsa kutup ışıkları','gunes patlamasi flare cme firtina kutup isiklari',onStar(function(){clk('sFlare');})],
 ['⭐','Yıldız türünü değiştir','Kırmızı cüce, mavi dev, kırmızı dev, beyaz cüce','yildiz turu kirmizi dev mavi dev cuce',onStar(function(){labGo('lsStar');})],
 ['✨','İkinci yıldız ekle','Sisteme yeni bir güneş koy','yildiz ekle ikinci gunes',function(){addPick('s2');labGo('lsAdd');}],
 ['🌍','Kendi gezegenini yarat','Tür, renk, halka ve uydu seç','gezegen ekle yarat olustur',function(){addPick('p:ocean');labGo('lsAdd');}],
 ['🎯','Yıldızı bir şeye fırlat','Eklediğin yıldızı Güneş\'e, bir gezegene ya da kara deliğe at','yildiz firlat carpistir kara delik birlesme kilonova',function(){var st=BODIES.filter(function(b){return b.def.star&&b!==sunBody&&!isGone(b);})[0];if(!st){addPick('s2');labGo('lsAdd');toast('Önce ikinci bir yıldız ekle, sonra onu hedefe fırlat',5000);return;}focusBody(st.def.id);setTimeout(function(){labGo('lsGrav');},80);}],
 ['☄️','Gezegenleri çarpıştır','Yerçekimi simülasyonu ve fırlatma','carpistir carpisma firlat yercekimi gravity',function(){if(!focus||!focus.grav)focusBody('mars');setTimeout(function(){labGo('lsGrav');},80);}],
 ['🌑','Sonraki Güneş tutulması','Gerçek tarihine git','tutulma gunes tutulmasi eclipse',function(){gotoEclipse(false);}],
 ['🌕','Sonraki Ay tutulması','Ay kızıla döner','tutulma ay tutulmasi kanli ay',function(){gotoEclipse(true);}],
 ['🌠','Sonraki meteor yağmurunu izle','Seçili şehirden gece gökyüzü','meteor yagmuru kayan yildiz gok tasi perseid',nextShowerJump],
 ['🏙️','Şehirden gökyüzüne bak','Samsun, İstanbul, Tokyo… gerçek gökyüzü','sehir gokyuzu yuzey samsun istanbul',function(){focusBody('earth');setTimeout(function(){enterSurface(byId.earth);},300);}],
 ['🔭','Ölçek yolculuğu','Güneş\'ten yakın yıldızlara ve galaksilere','olcek yolculuk evren galaksi mesafe',function(){clk('vTrip');}],
 ['🪐','Diğer yıldız sistemleri','TRAPPIST-1, Proxima, Kepler-16…','yildiz sistemi trappist proxima exoplanet otegezegen',function(){clk('vSys');}],
 ['🌌','Takımyıldızlarını göster','Yıldız adları ve çizgileri','takimyildiz yildiz adlari constellation',function(){clk('vCons');}],
 ['🔴','H-alfa filtresi','Güneş\'in kromosferini gör','h-alfa halfa filtre kromosfer',function(){clk('vHa');}],
 ['🧭','Genel görünüm','Tüm sistemi göster','genel gorunum tum sistem',function(){clk('tOver');}],
 ['✈️','Serbest uçuş','W A S D ile uç','serbest ucus kamera',function(){clk('mFree');}],
 ['⏩','Zamanı hızlandır','Hız menüsünü aç','zaman hiz hizlandir yavaslat',function(){var sp=$('speed');if(sp){sp.focus();try{sp.showPicker();}catch(e){}}}],
 ['⏪','Zamanı geri sar','Olaylar geri alınır, ileri oynatınca tekrar yaşanır','geri sar zaman rewind',function(){clk('rev');}],
 ['📅','Bugüne dön','Gerçek tarihe dön','bugun simdi tarih',function(){clk('now');}],
 ['🔊','Sesi aç / kapat','Gezegen ve pulsar sesleri','ses muzik sound',function(){clk('tSnd');}],
 ['🔔','Olay bildirimleri','Tutulma, fırtına bildirimlerini aç/kapat','bildirim toast',function(){clk('vNote');}],
 ['🗺️','Mini harita','Üstten görünüm','mini harita',function(){clk('vMini');}],
 ['🔗','Sistemi paylaş','Kodla arkadaşına gönder','paylas kod',function(){labGo('lsShare');}],
 ['♻️','Güneş Sistemini sıfırla','Tüm değişiklikleri geri al (iki kez onayla)','sifirla reset',function(){clk('vReset');}],
 ['❓','Yardım','Kontroller ve ipuçları','yardim nasil',function(){clk('tHelp');}]
];
var POPULAR=[0,1,10,11,7,8,2,12];
/* ---------- hazır deneyler ----------
   Tek tıkla kurulan senaryolar: araçları açmakla yetinmez, deneyi kurar, ilgili cisme odaklanır ve sonucu izlemek için grafiği açar.
   Her biri kullanıcının elle yapabileceği adımları aynı düğme ve kaydırıcılar üzerinden uygular (geri alma kaydı ve sınırlar aynen geçerli). */
function slideTo(id,v){var e=$(id);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
function watchGraph(key,msg){openSide();showTab('info');GR.key=key;grSetOpen(true);if(!playing)clk('play');if(msg)toast(msg,3200);}
function alive(id){var b=byId[id];return b&&!isGone(b)&&!b.engulfed?b:null;}
function needBodies(ids){var miss=ids.filter(function(i){return !alive(i);});if(miss.length){toast('Bu deney için sistemi sıfırlaman gerek.',3200);return false;}return true;}
var PRESETS=[
 ['🌖','Ay nasıl oluştu?','Mars büyüklüğünde bir gezegen Dünya\'ya çarpar; enkazın yörüngeye savrulmasını izle','ay olusumu theia dev carpisma hazir deney',function(){
    if(!needBodies(['mars','earth']))return;focusBody('mars');setTimeout(function(){launchPair(byId.mars,byId.earth);watchGraph('dist','Mars Dünya\'ya gidiyor: çarpışmayı izle');},250);}],
 ['🔥','Kontrolden çıkan sera etkisi','Dünya\'nın CO₂\'si 8 katına çıkar; sıcaklık eğrisinin tırmanışını izle','sera etkisi co2 karbondioksit kuresel isinma iklim hazir deney',function(){
    if(!needBodies(['earth']))return;focusBody('earth');setTimeout(function(){slideTo('cCo2',3);watchGraph('temp','CO₂ ×8: sıcaklık eğrisini izle');},250);}],
 ['❄️','Dünya, Mars\'ın yerinde olsaydı','Mars\'ın uzaklığına Dünya benzeri bir gezegen koyar; yaşanabilir kalır mı?','dunya mars uzaklik yasanabilir kusak ikinci dunya hazir deney',function(){
    var n0=customs.length;openSide();showTab('lab');showLabTab('ekle');addPick('p:earth');$('nName').value='Dünya 2';$('nName').dataset.user='1';slideTo('nSize',1);slideTo('nDist',1.5);clk('nAdd');
    setTimeout(function(){if(customs.length>n0)watchGraph('temp','1,5 AU\'da bir Dünya: sıcaklığı izle');},400);}],
 ['🌗','Ay çok yaklaşırsa','Ay\'ı Roche sınırının içine indirir; gelgit kuvveti onu parçalayıp halkaya çevirir','ay roche siniri gelgit parcalanma halka hazir deney',function(){
    if(!needBodies(['earth','moon']))return;focusBody('moon');setTimeout(function(){labGo('moonSec');setTimeout(function(){slideTo('sMoonD',.02);if(!playing)clk('play');},120);},250);}]
];
var CMD={items:[],sel:0};
function openCmd(){$('cmdk').hidden=false;$('cmdIn').value='';renderCmd('');setTimeout(function(){$('cmdIn').focus();},20);}
function closeCmd(){$('cmdk').hidden=true;}
function bodyIcon(b){return '<span class="ic" style="'+(b.def.star?starDotCss(b===sunBody?sunType:b.starType):dotStyle(b.def.dot))+'"></span>';}
function renderCmd(q){
  var t=trn(q).trim(),tk=t?t.split(/\s+/):[],out=[],html='';
  function hit(str){str=trn(str);return tk.every(function(w){return str.indexOf(w)>=0;});}
  var acts=t?ACTIONS.filter(function(a){return hit(a[1]+' '+a[2]+' '+a[3]);}):POPULAR.map(function(i){return ACTIONS[i];});
  var pres=t?PRESETS.filter(function(a){return hit(a[1]+' '+a[2]+' '+a[3]);}):PRESETS;
  var bods=BODIES.filter(function(b){return !b.sysHide&&!isGone(b)&&!b.engulfed&&(t?hit(b.def.name+' '+(b.def.kind||'')):(!b.def.parent&&!b.def.minor));});
  var cities=t?CITIES.map(function(c,i){return [c,i];}).filter(function(x){return hit(x[0][0]+' sehir gokyuzu');}):[];
  if(pres.length){html+='<div class="cmdg">Hazır deneyler</div>';pres.forEach(function(a){out.push(a[4]);html+='<button class="cmdi" data-i="'+(out.length-1)+'"><span class="ic">'+a[0]+'</span><span>'+esc(a[1])+'<small>'+esc(a[2])+'</small></span></button>';});}
  if(acts.length){html+='<div class="cmdg">'+(t?'Eylemler':'Popüler deneyler')+'</div>';acts.slice(0,t?12:8).forEach(function(a){out.push(a[4]);html+='<button class="cmdi" data-i="'+(out.length-1)+'"><span class="ic">'+a[0]+'</span><span>'+esc(a[1])+'<small>'+esc(a[2])+'</small></span></button>';});}
  if(cities.length){html+='<div class="cmdg">Şehirden gökyüzü</div>';cities.forEach(function(x){out.push(function(){cityIdx=x[1];try{localStorage.setItem('se_city',cityIdx);}catch(e){}$('surfCity').value=cityIdx;focusBody('earth');setTimeout(function(){enterSurface(byId.earth);},300);});html+='<button class="cmdi" data-i="'+(out.length-1)+'"><span class="ic">🏙️</span><span>'+esc(x[0][0])+'<small>Bu şehirden şu anki gökyüzü</small></span></button>';});}
  if(bods.length){html+='<div class="cmdg">Gök cisimleri</div>';bods.slice(0,t?14:12).forEach(function(b){out.push(function(){focusBody(b.def.id);});html+='<button class="cmdi" data-i="'+(out.length-1)+'">'+bodyIcon(b)+'<span>'+esc(b.def.name)+'<small>'+esc(b.def.kind||'')+'</small></span></button>';});}
  if(!out.length)html='<div class="cmdg">Sonuç yok</div><p class="note" style="padding:0 10px">Başka bir kelime dene: "çarpış", "tutulma", "Jüpiter", "meteor"…</p>';
  CMD.items=out;CMD.sel=0;$('cmdList').innerHTML=html;markCmd();
}
function markCmd(){var bs=$('cmdList').querySelectorAll('.cmdi');[].forEach.call(bs,function(b,i){b.classList.toggle('sel',i===CMD.sel);if(i===CMD.sel)b.scrollIntoView({block:'nearest'});});}
function runCmd(i){var f=CMD.items[i];closeCmd();if(f)setTimeout(f,30);}
$('tFind').addEventListener('click',openCmd);$('cmdX').addEventListener('click',closeCmd);
$('cmdk').addEventListener('click',function(e){if(e.target===this)closeCmd();});
$('cmdIn').addEventListener('input',function(){renderCmd(this.value);});
$('cmdList').addEventListener('click',function(e){var b=e.target.closest('.cmdi');if(b)runCmd(+b.dataset.i);});
$('cmdIn').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){CMD.sel=Math.min(CMD.items.length-1,CMD.sel+1);markCmd();e.preventDefault();}
  else if(e.key==='ArrowUp'){CMD.sel=Math.max(0,CMD.sel-1);markCmd();e.preventDefault();}
  else if(e.key==='Enter'){runCmd(CMD.sel);e.preventDefault();}
  else if(e.key==='Escape'){closeCmd();e.preventDefault();}
  e.stopPropagation();
});
window.addEventListener('keydown',function(e){var tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;
  if((e.key==='/'||(e.key==='k'&&(e.ctrlKey||e.metaKey)))&&$('cmdk').hidden){e.preventDefault();e.stopPropagation();openCmd();}
  else if(e.key==='Escape'&&!$('cmdk').hidden)closeCmd();},true);
/* bilgi panelinde bağlama göre hızlı deneyler */
function renderQuick(){
  var q=$('quick');if(!q||!focus)return;var b=focus,d=b.def,list=[];
  function A(lbl,fn){list.push([lbl,fn]);}
  if(d.star||b===sunBody){var ty=b===sunBody?sunType:b.starType;
    if(ty<5&&ty!==1)A('💥 Süpernova',function(){showTab('lab');clk('sNova');});
    if(!bhBlock(b))A('🕳️ Kara delik',function(){showTab('lab');clk('sBH');});
    if(ty===0||ty===3)A('🌫️ Bulutsu',function(){showTab('lab');clk('sPN');});
    if(ty<5)A('☀️ Patlama',function(){clk('sFlare');});
    A('⭐ Türünü değiştir',function(){labGo('lsStar');});
    if(b!==sunBody)A('🎯 Bir şeye fırlat',function(){labGo('lsGrav');});
  }else if(d.id==='earth'){
    A('🏙️ Şehirden gökyüzü',function(){enterSurface(b);});A('🌠 Meteor yağmuru',nextShowerJump);A('🌑 Tutulma',function(){gotoEclipse(false);});A('🔥 İklimi değiştir',function(){labGo('climSec');});
  }else if(d.craft){
  }else if(!d.comet){
    if(b.grav&&!d.parent)A('☄️ Bir şeye çarptır',function(){labGo('lsGrav');});
    if(b.hab)A('🔥 İklimi değiştir',function(){labGo('climSec');});
    if(d.parent&&MOONR[d.id])A('🌗 Uyduyu yaklaştır',function(){labGo('moonSec');});
    A('🎛️ Boyut ve dönüş',function(){labGo('lsBody');});
  }
  q.innerHTML='';list.forEach(function(x){var bt=document.createElement('button');bt.textContent=x[0];bt.addEventListener('click',x[1]);q.appendChild(bt);});
}
/* laboratuvar: kısayollar ve katlanabilir bölümler */
var LTABS=[['cisim','Cisim',['lsBody','moonSec','climSec']],['yildiz','Yıldız',['lsStar']],['fizik','Fizik',['lsGrav','lsAll']],['ekle','Ekle',['lsAdd']]],LTAB='cisim';
(function(){
  var J=$('lJump');J.className='ltabs';J.setAttribute('role','tablist');J.innerHTML='';
  LTABS.forEach(function(x){var bt=document.createElement('button');bt.textContent=x[1];bt.dataset.t=x[0];bt.setAttribute('role','tab');bt.addEventListener('click',function(){showLabTab(x[0]);$('sideBody').scrollTop=0;});J.appendChild(bt);x[2].forEach(function(id){var el=$(id);if(el){el.dataset.tab=x[0];el.classList.remove('closed');}});});
  var mr=$('sMass').closest('.rrow'),ar=$('sAct').closest('.rrow');if(mr&&ar)ar.parentNode.insertBefore(mr,ar.nextSibling);
  var ra=$('resetAll');if(ra)ra.hidden=true;
  $('shBody').appendChild($('lsShare'));
  $('vShare').addEventListener('click',function(){$('viewMenu').hidden=true;$('tView').setAttribute('aria-expanded','false');$('shareDlg').hidden=false;});
  $('shX').addEventListener('click',function(){$('shareDlg').hidden=true;});$('shareDlg').addEventListener('click',function(e){if(e.target===this)this.hidden=true;});
  var h=$('lsAll').querySelector('h4');if(h)h.firstChild.nodeValue='Tüm sistem ';
})();
function showLabTab(t){LTAB=t;[].forEach.call($('lJump').children,function(b){b.classList.toggle('on',b.dataset.t===t);b.setAttribute('aria-selected',b.dataset.t===t);});
  [].forEach.call(document.querySelectorAll('#tabLab .lsec'),function(sc){sc.classList.toggle('off',sc.dataset.tab!==t);});}
function labGo(sec){openSide();showTab('lab');if(sec==='lsShare'){$('shareDlg').hidden=false;return;}var el=$(sec);if(!el)return;showLabTab(el.dataset.tab||'cisim');setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});},60);}
function labContext(){if(!focus)return;showLabTab((focus.def.star||focus===sunBody)?'yildiz':'cisim');}
$('sideToggle').addEventListener('click',function(){$('side').classList.toggle('collapsed');});
$('sideMini').addEventListener('click',function(){$('side').classList.remove('collapsed');});
if(innerWidth<=760)$('side').classList.add('collapsed');
