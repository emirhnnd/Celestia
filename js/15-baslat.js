/* Celestia · Açılış: sahneyi kurar ve kare döngüsünü başlatır.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- başlat ---------- */
/* Mesafe ölçeği değişince sayfa yeniden kurulur; paylaşma koduyla taşınabilen ayarları, tarihi ve odağı geri getirir. */
function restoreCarry(){
  var v=null;try{v=sessionStorage.getItem('se_carry');sessionStorage.removeItem('se_carry');}catch(_){}
  if(!v)return;
  try{
    var o=JSON.parse(v);
    applyState(JSON.parse(decodeURIComponent(escape(atob(o.c)))));
    var dd=+o.d-simDays;if(isFinite(dd)&&Math.abs(dd)>1e-6){updateBodies(dd);simDays+=dd;}
    if(o.f&&byId[o.f])focusBody(o.f);
    updateDate();
    toast(o.ev?'Ölçek değişti. Ayarların korundu; çarpışma ve yer çekimi sıfırlandı.':'Ölçek değişti. Ayarların korundu.',3500);
  }catch(_){}
}
/* açılış adımları ayrı ayrı korunur: biri hata verse de geri kalanlar çalışır, yükleme ekranı kapanır ve döngü başlar
   (eskiden tek bir hata kullanıcıyı mesajsız biçimde yükleme ekranında bırakıyordu) */
function init(){
  /* kütüphane ya da veri dosyası yüklenemediyse hata ekranı gösterilmiştir: yarım bir sahneyle açılıp o ekranı kapatma */
  if($('boot').classList.contains('err'))return;
  var bootFail=0;
  function step(f){try{f();}catch(e){bootFail++;console.error('Açılış adımı başarısız:',e);}}
  step(addSky);step(addBelt);
  DEFS.forEach(function(d){step(function(){buildBody(d);});});
  step(initReal);
  step(addCraft);
  step(loadRealEarth);step(loadRealPlanets);step(loadRealSky);
  step(loadCustom);
  step(buildStarBtns);
  step(rebuildLists);
  step(function(){setupMini();resize();});
  step(function(){
    focus=byId.sun;
    focusBody('sun',{dist:OVD()});
    trans=null;target.set(0,0,0);dist=OVD();
  });
  step(function(){setStar(0);setSpeed();setPlayIcon();updateHint();updateDate();updateLive();fillOuts();$('oGSpin').textContent=fmtX(1);});
  camera.position.set(0,0,0);
  step(restoreCarry);
  if(!AE)toast('Gök mekaniği kütüphanesi yüklenemedi: konumlar yaklaşık, gerçek tutulma tarihleri bulunamaz.',6000);
  else if(bootFail)toast('Bazı bölümler yüklenemedi; sayfayı yenilemeyi dene.',4000);
  step(function(){if(!seen())$('coach').hidden=false;});
  requestAnimationFrame(function(t){last=t;requestAnimationFrame(frame);});
  setTimeout(function(){$('boot').classList.add('gone');},250);
}
resize();
/* yükleme sırasında ertelenen işler: tüm dosyalar yüklendi, init'ten önce çalışır (eski tek dosyalı düzendeki setTimeout(...,0) ile aynı an) */
setTimeout(function(){LOAD_Q.forEach(function(f){f();});LOAD_Q.length=0;},0);
requestAnimationFrame(function(){setTimeout(init,30);});
