/* Celestia · Laboratuvar: cisim ayarları, ekleme kataloğu, kütleçekim simülasyonu, ikinci yıldız, paylaşma.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- laboratuvar ---------- */
function fmtX(v){return (+v).toFixed(1).replace('.',',')+'×';}
function syncLab(){
  var b=focus;if(!b)return;
  if(typeof labStar==='function'){var ls=labStar();$('starName').textContent=(ls===sunBody?'':ls.def.name+' · ')+SUN_TYPES[ls===sunBody?sunType:ls.starType].name;$('sFlare').textContent=ls===sunBody?'Güneş patlaması tetikle':'Yıldız patlaması tetikle';
    Array.prototype.forEach.call($('starBtns').children,function(btn,k){btn.classList.toggle('on',k===(ls===sunBody?sunType:ls.starType));});}
  $('labName').textContent=b.def.name;
  $('sSpin').value=b.mod.spin;$('oSpin').textContent=fmtX(b.mod.spin);
  $('sOrbit').value=b.mod.orbit;$('oOrbit').textContent=fmtX(b.mod.orbit);$('sOrbit').disabled=b.id==='sun'||(gravityOn&&b.grav);
  $('sSize').value=b.mod.size;$('oSize').textContent=fmtX(b.mod.size);
  $('sTilt').value=b.mod.tilt;$('oTilt').textContent=Math.round(b.mod.tilt)+'°';
  $('labDel').hidden=!(b.def.custom&&!b.parent);
  $('lockRow').hidden=!(b.hab&&!b.parent);$('sLock').checked=!!b.mod.lock;
  syncMoonUI();fillTargets();if(typeof bmSync==='function')bmSync();$('lGo').disabled=!((b.grav||b.def.star||b===sunBody)&&!b.parent&&!isGone(b));
  var hb=b.hab;$('climSec').hidden=!hb;
  if(hb){$('climName').textContent=b.def.name;$('cAtm').value=hb.atm;$('cWater').value=hb.water;$('oWater').textContent=Math.round(hb.water*100)+'%';$('cMag').value=hb.mag;$('oMag').textContent=Math.round(hb.mag*100)+'%';
    $('cCo2').value=hb.co2||0;$('oCo2').textContent='×'+co2Txt(hb.co2||0);$('cTect').value=hb.tect||0;$('oTect').textContent=Math.round((hb.tect||0)*100)+'%';
    $('co2Row').hidden=!(GHD[hb.atm]>0);$('milRow').hidden=b.def.id!=='earth';$('cMil').checked=hb.mil!==false;}
  labCtx();
}
/* laboratuvar bağlamı: seçili cismin türüne göre yalnızca anlamlı ayarlar görünür (kara deliğin "eksen eğikliği", gezegenin "süpernova"sı gibi
   karşılığı olmayan düğmeler gizlenir) */
function rowOf(id){var e=$(id);return e?(e.closest('.rrow')||e.closest('.frow')||e.closest('.btnrow')):null;}
function showRow(id,on){var r=rowOf(id);if(r)r.hidden=!on;}
function labCtx(){
  var b=focus;if(!b)return;var d=b.def,isStar=!!(d.star||b===sunBody),ty=isStar?(b===sunBody?sunType:b.starType):-1,bh=ty===6,craft=!!d.craft,comet=!!d.comet;
  showRow('sSpin',!bh&&!craft&&ty!==7);showRow('sOrbit',b!==sunBody&&!craft);showRow('sSize',!bh&&!craft&&ty!==7);showRow('sTilt',!isStar&&!craft&&!comet);
  $('labReset').hidden=craft||bh;$('labDel').textContent=isStar?(bh?'Kara deliği sil':'Yıldızı sil'):'Gezegeni sil';
  var nt=$('lsBodyNote');if(!nt){nt=document.createElement('p');nt.className='note';nt.id='lsBodyNote';$('labReset').closest('.btnrow').after(nt);}
  nt.textContent=craft?'Uzay araçları gerçek yörüngelerinde ilerler; burada değiştirilecek bir ayarları yok.':bh?'Işık bükülmesi ve kara deliğe cisim fırlatma Yıldız sekmesinde.':isStar?'Yıldızın türü ve ölümü Yıldız sekmesinde.':'';nt.hidden=!nt.textContent;
  var ls=labStar(),lt=ls===sunBody?sunType:ls.starType,sun=ls===sunBody,col=sun?!!EXO.col:!!ls.exoCol;
  var h=$('lsStar').querySelector('h4');if(h&&h.firstChild&&h.firstChild.nodeType===3)h.firstChild.nodeValue=lt===6?'Kara delik ':lt===5?'Nötron yıldızı ':lt===7?'Yıldız kalmadı ':'Yıldız türü ';
  $('lsStar').classList.toggle('rem',lt>=5);$('starBack').hidden=!(sun&&lt>=5);$('starBtns').hidden=!sun&&lt>=5;
  showRow('sAge',sun&&(lt===0||lt===3||lt===4));showRow('sAct',sun&&lt<4);showRow('sFlare',lt<4);
  $('sNova').hidden=!(lt<5&&lt!==1)||col;$('sBH').hidden=lt===6||lt===7||col||!!bhBlock(ls);$('sNova').closest('.btnrow').hidden=$('sNova').hidden&&$('sBH').hidden;
  showRow('sPN',sun&&(lt===0||lt===3));showRow('sMass',false);
  var notes=$('lsStar').querySelectorAll(':scope > .note:not(#starBack)');if(notes[0])notes[0].hidden=!(sun&&lt<4);if(notes[1])notes[1].hidden=!(lt<4);
  var bx=$('bhBox');bx.hidden=lt!==6;
  if(lt===6){$('bhLens').textContent=LENS.on?'Açık':'Kapalı';$('bhLens').classList.toggle('on',LENS.on);$('bhLens').setAttribute('aria-pressed',String(LENS.on));
    var sel=$('bhPrey'),v=sel.value;sel.innerHTML='';BODIES.forEach(function(x){if(x.grav&&!x.parent&&!x.def.star&&!isGone(x)&&!x.sysHide){var o=document.createElement('option');o.value=x.def.id;o.textContent=x.def.name;sel.appendChild(o);}});if(v)sel.value=v;if(!sel.value&&sel.options.length)sel.selectedIndex=0;
    $('bhThrow').disabled=!sel.options.length;}
  if(typeof addSync==='function')addSync();
}
$('bhLens').addEventListener('click',function(){LENS.on=!LENS.on;try{localStorage.setItem('gsg-lens',LENS.on?'1':'0');}catch(e){}$('vLens').setAttribute('aria-checked',String(LENS.on));labCtx();});
$('bhThrow').addEventListener('click',function(){var p=byId[$('bhPrey').value],t=labStar();if(!p||!t)return;launchPair(p,t);});
/* ---- Cisim sekmesinde kütle ----
   Yıldızlar ve kalıntılar Güneş kütlesiyle (M☉), gezegenler Dünya kütlesiyle (M⊕) ayarlanır; logaritmik kaydırıcı.
   Eşikler: nötron yıldızı ~2,3 M☉ üstünde kara deliğe çöker; gaz devi ~13 Jüpiter kütlesinde (4.100 M⊕) kahverengi cüce olur
   (çekirdeğinde döteryum yanar); ~80 Jüpiter kütlesinde hidrojen füzyonu başlar, yani artık bir yıldızdır (kırmızı cüce). */
var MJ=317.8;
function bmKind(b){if(!b||b.def.craft||b.def.comet||b.parent)return null;if(b===sunBody)return SYS?null:'sun';if(b.def.star){var t=b.starType;return t===6?'bh':t===5?'ns':t===7?null:'star';}return b.grav?(b.hab&&b.hab.gas?'gas':'rock'):null;}
function bmRange(k){return k==='bh'?[3,1000]:k==='ns'?[1.1,3]:k==='star'?[.08,150]:k==='gas'?[1,80*MJ]:[.01,20];}
function bmGet(b,k){return k==='sun'?sunMass:(k==='bh'||k==='ns'||k==='star')?stMass(b):bodyMass(b);}
function bmTxt(m,k){if(k==='gas'||k==='rock'){if(m>=150)return (m/MJ).toFixed(m/MJ<10?2:0).replace('.',',')+' MJ';return (m<1?m.toFixed(2):m<10?m.toFixed(1):Math.round(m)+'').replace('.',',')+' M⊕';}return (m<1?m.toFixed(2):m<10?m.toFixed(1):Math.round(m)+'').replace('.',',')+' M☉';}
function bmNoteTxt(m,k){
  if(k==='gas')return m>=80*MJ*.98?'80 Jüpiter kütlesi: çekirdekte hidrojen füzyonu başlar; bu artık bir kırmızı cüce yıldız olurdu. Gaz devleri bu sınırı geçemez.':m>=13*MJ?'13 Jüpiter kütlesinin üstü: kahverengi cüce. Çekirdeğinde bir süre döteryum yanar, kızılötesinde hafifçe parlar ama gerçek bir yıldız değildir.':m>=2*MJ?'Jüpiter\'den ağır gaz devleri çapça pek büyümez: kütle arttıkça kendi ağırlığıyla sıkışır.':'';
  if(k==='rock')return m>=10?'10 Dünya kütlesinin üstündeki kayalık gezegenler genellikle hidrojen tutup gaz devine dönüşür; "süper Dünya"lar ~2–10 M⊕ arasıdır.':'';
  if(k==='ns')return m>2.3?'Bırakınca: nötron basıncı bu ağırlığı taşıyamaz, yıldız kara deliğe çöker.':'';
  if(k==='bh')return 'Kütle arttıkça olay ufku ve gölge büyür (ufuk yarıçapı kütleyle doğru orantılı, ekranda yumuşatılmış).';
  return '';}
function bmSync(){var b=focus,k=bmKind(b),row=rowOf('sBM');if(row)row.hidden=!k;if(!k){$('bmNote').hidden=true;return;}
  var R=bmRange(k),m=bmGet(b,k);if(k==='sun'){$('sBM').value=$('sMass').value;$('oBM').textContent=massTxt()+' M☉';}
  else{$('sBM').value=Math.log(clamp(m,R[0],R[1])/R[0])/Math.log(R[1]/R[0]);$('oBM').textContent=bmTxt(m,k);}
  var nt=bmNoteTxt(m,k);$('bmNote').textContent=nt;$('bmNote').hidden=!nt;}
$('sBM').addEventListener('input',function(){var b=focus,k=bmKind(b);if(!k)return;
  if(k==='sun'){$('sMass').value=this.value;$('sMass').dispatchEvent(new Event('input'));$('oBM').textContent=massTxt()+' M☉';return;}
  var R=bmRange(k),m=R[0]*Math.pow(R[1]/R[0],+this.value);
  if(k==='gas'||k==='rock')b.mass=m/Math.pow(b.mod.size,3);else b.massAbs=m;
  $('oBM').textContent=bmTxt(m,k);var nt=bmNoteTxt(m,k);$('bmNote').textContent=nt;$('bmNote').hidden=!nt;});
$('sBM').addEventListener('change',function(){var b=focus,k=bmKind(b);if(!k)return;
  if(k==='sun'){$('sMass').dispatchEvent(new Event('change'));return;}
  var m=bmGet(b,k);
  if(k==='ns'&&m>2.3){starBH(b);return;}
  /* yıldız kütlesi türünü belirler (ana kol): <0,5 kırmızı cüce, 0,5–8 sarı cüce, >8 mavi dev */
  if(k==='star'&&b.starType<=2){var ny=m<.5?1:m<8?0:2;if(ny!==b.starType){var keep=b.massAbs;setStarOn(b,ny);b.massAbs=keep;toast(b.def.name+': '+SUN_TYPES[ny].name.toLowerCase()+' oldu (kütle '+bmTxt(m,k)+').',4000);}}
  if(focus===b)updateInfo();});
function applySize(b){
  b.tilt.scale.setScalar(b.mod.size*(b.typeScale||1));b.vr=effVr(b);
  if(b===focus){dist=Math.max(dist,minDist());}
}
$('sSpin').addEventListener('input',function(){focus.mod.spin=+this.value;$('oSpin').textContent=fmtX(this.value);});
$('sOrbit').addEventListener('input',function(){focus.mod.orbit=+this.value;$('oOrbit').textContent=fmtX(this.value);});
$('sSize').addEventListener('input',function(){focus.mod.size=+this.value;$('oSize').textContent=fmtX(this.value);applySize(focus);});
$('sTilt').addEventListener('input',function(){focus.mod.tilt=+this.value;$('oTilt').textContent=Math.round(this.value)+'°';setTiltRot(focus,+this.value);});
function resetBody(b){
  if(typeof clearScars==='function')clearScars(b);if(b.wob){b.wob=null;b.mesh.scale.set(1,1,1);}
  b.mod={spin:1,orbit:1,size:1,tilt:b.def.tilt||0};setTiltRot(b,b.mod.tilt);applySize(b);
}
$('labReset').addEventListener('click',function(){resetBody(focus);syncLab();toast(focus.def.name+' sıfırlandı');});
$('labDel').addEventListener('click',function(){
  var b=focus;if(!b.def.custom||b.parent)return;
  BODIES.filter(function(x){return x.parent===b;}).forEach(disposeBody);
  var nm=b.def.name;disposeBody(b);
  customs=customs.filter(function(c){return c.id!==b.id;});saveCustom();
  rebuildLists();focusBody('earth');toast(nm+' silindi');
});

/* yeni gezegen */
var CUSTOM_TYPES={earth:'Dünya benzeri',ocean:'Okyanus dünyası',rocky:'Kayalık dünya',gas:'Gaz devi',ice:'Buz dünyası',lava:'Lav dünyası',desert:'Çöl dünyası'};
var customs=[],cid=0;
function fmtYear(a){var y=Math.pow(a,1.5);return y<1?Math.round(y*365.25)+' gün':fmt.format(y)+' Dünya yılı';}
function addCustom(o,silent){
  var id=o.id||('c'+(++cid));if(/^c\d+$/.test(id))cid=Math.max(cid,+id.slice(1));if(!silent)act('born',{id:id});
  var rgb=hexStr(o.color),seed=o.seed!=null?o.seed:Math.floor(Math.random()*90),fns=customFns(o.type,rgb,seed);
  var v=1.6*Math.sqrt(o.size),a=o.a,light=mix(rgb,[255,255,255],.5),dark=mix(rgb,[0,0,0],.5);
  var P0=365.25*Math.pow(a,1.5),L00=o.L0!=null?o.L0:(silent?null:freeL0(orbitR(a),P0,Math.max(orbitR(a)*.07,6*DS)));
  var def={id:id,custom:true,habType:o.type,hsize:o.size,name:o.name,kind:CUSTOM_TYPES[o.type]+' · yarattığın',a:a,P:P0,L0:L00!=null?L00:rnd(0,360),r:orbitR(a),vr:v,
    texFn:fns.fn,emFn:fns.em,tw:512,rotH:o.rotH||rnd(8,40),tilt:o.tilt!=null?o.tilt:rnd(0,32),ring:!!o.ring,ringTint:o.ring?new THREE.Color(rgb[0]/255*.5+.5,rgb[1]/255*.5+.5,rgb[2]/255*.5+.5):null,
    dot:[rgbCss(light),rgbCss(dark)],
    atmo:(o.type==='earth'||o.type==='ocean'||o.type==='gas'||o.type==='ice')?[parseInt(rgbCss(light).replace(/\D+/g,' ').trim().split(' ').map(function(x,i){return i<3?('0'+(+x).toString(16)).slice(-2):'';}).join(''),16),1.1]:null,
    desc:o.name+' senin yarattığın gezegen. Laboratuvar sekmesinden dönüş hızını, yörüngesini, boyutunu ve eksen eğikliğini değiştirebilirsin.',
    stats:[['Tür',CUSTOM_TYPES[o.type]],['Çap',Math.round(12742*o.size).toLocaleString('tr-TR')+' km'],['Güneş\'e uzaklık',fmt.format(a)+' AU'],['Yıl',fmtYear(a)],['Uydu',String(o.moons)]]};
  var b=buildBody(def);
  var ms=[];
  for(var i=0;i<o.moons;i++){
    ms.push(buildBody({id:id+'m'+i,custom:true,name:o.name+' '+['I','II','III'][i],kind:'Uydu · '+o.name,parent:id,orbit:v*(2.4+i*1.25)+(o.ring?v*1.2:0),P:rnd(2,26),L0:rnd(0,360),vr:v*rnd(.12,.2),texFn:TEX.smallMoon,tw:256,dot:['#c9c1b6','#6c655c'],
      desc:o.name+' gezegeninin küçük bir uydusu.',stats:[['Gezegen',o.name],['Yörünge',''+(Math.round(rnd(2,26)))+' gün']]}));
  }
  if(!silent){
    customs.push({id:id,name:o.name,type:o.type,color:o.color,size:o.size,a:a,ring:!!o.ring,moons:o.moons,seed:seed,L0:def.L0,tilt:def.tilt,rotH:def.rotH});
    saveCustom();rebuildLists();focusBody(id);toast(o.name+' eklendi');
  }else customs.push({id:id,name:o.name,type:o.type,color:o.color,size:o.size,a:a,ring:!!o.ring,moons:o.moons,seed:seed,L0:def.L0,tilt:def.tilt,rotH:def.rotH});
}
function saveCustom(){try{localStorage.setItem('gsg-custom-v1',JSON.stringify(customs));}catch(_){}}
/* her kayıt ayrı korunur: eskiden biri hata verince öncekiler sahnede kalıyor ama liste sıfırlanıyordu, bir sonraki kayıtta silinirlerdi */
function loadCustom(){var arr;try{var s=localStorage.getItem('gsg-custom-v1');arr=s?JSON.parse(s):null;}catch(_){arr=null;}if(!Array.isArray(arr))return;
  arr.slice(0,12).forEach(function(o){try{var q=sane(o);if(!q)return;if(q.kind==='star')addStar(q,true);else addCustom(q,true);}catch(e){console.error('Kayıtlı cisim yüklenemedi:',e);}});}
function readForm(){
  var nm=($('nName').value||'').trim()||'Nova';
  return {name:nm.slice(0,18),type:$('nType').value,color:$('nColor').value,size:+$('nSize').value,a:+$('nDist').value,ring:$('nRing').checked,moons:+$('nMoons').value};
}
$('nAdd').addEventListener('click',function(){
  if(BODIES.filter(function(b){return b.def.custom&&!b.parent&&!b.def.star;}).length>=10){toast('En fazla 10 gezegen ekleyebilirsin');return;}
  addCustom(readForm());
});
var NAMES=['Nova','Kaya','Aster','Zirve','Lumis','Orion-7','Teras','Sirius B','Mira','Atlas','Kyra','Eylül','Bora','Ege','Selva'];
var TYPE_COLORS={earth:['#2a64c0','#2f72b8'],ocean:['#2f6fd0','#2aa6a0'],rocky:['#9a8b7a','#7a6a5a'],gas:['#d8a460','#7aa6d8','#c97a9a'],ice:['#9ad8ff','#bfe8ff'],lava:['#ff5a1a','#ff3a3a'],desert:['#d8a05a','#c8783a']};
$('nRand').addEventListener('click',function(){
  var types=Object.keys(CUSTOM_TYPES),t=types[Math.floor(Math.random()*types.length)],cl=TYPE_COLORS[t];
  $('nName').value=NAMES[Math.floor(Math.random()*NAMES.length)];$('nType').value=t;$('nColor').value=cl[Math.floor(Math.random()*cl.length)];
  var sz=t==='gas'?rnd(4,10):rnd(.4,2.5);$('nSize').value=sz.toFixed(1);$('nDist').value=rnd(.5,35).toFixed(1);
  $('nRing').checked=t==='gas'&&Math.random()<.6;$('nMoons').value=String(Math.floor(Math.random()*4));
  fillOuts();addCustom(readForm());
});
function fillOuts(){$('onSize').textContent=(+$('nSize').value).toFixed(1).replace('.',',')+'×';$('onDist').textContent=(+$('nDist').value).toFixed(1).replace('.',',')+' AU';$('oxSize').textContent=(+$('xSize').value).toFixed(2).replace('.',',')+'×';$('oxDist').textContent=fmtAU(invOrbit(+$('xDist').value*DS))+' AU';$('oMass').textContent=fmtX(massFromSlider(+$('sMass').value));if($('oaMass'))$('oaMass').textContent=String(addMassVal()).replace('.',',')+' M☉';$('oxSize').textContent=(+$('xSize').value).toFixed(2).replace('.',',')+'×';if(typeof addZoneUpd==='function')addZoneUpd();}
$('xSize').addEventListener('input',function(){fillOuts();});$('xDist').addEventListener('input',function(){fillOuts();});
$('nSize').addEventListener('input',fillOuts);$('nDist').addEventListener('input',fillOuts);
$('nType').addEventListener('change',function(){$('nColor').value=TYPE_COLORS[this.value][0];});

/* ---------- Ekle: katalog ----------
   Önce ne ekleneceği seçilir (gezegen türü, yıldız, nötron yıldızı, kara delik); altında yalnızca o cisim için anlamlı ayarlar çıkar.
   Sınırlar: en çok 10 gezegen ve 2 ek yıldız/kalıntı (kara delik ışın izlemeyle çizildiği için telefonda ağırlaşmasın). */
var ADDCAT=[
  ['Gezegenler',[['p:earth','Dünya benzeri','Yaşama uygun'],['p:ocean','Okyanus','Su kaplı'],['p:rocky','Kayalık','Dünya gibi'],['p:gas','Gaz devi','Jüpiter gibi'],['p:ice','Buz','Donmuş'],['p:lava','Lav','Erimiş yüzey'],['p:desert','Çöl','Kuru, tozlu']]],
  ['Yıldızlar',[['s:0','Sarı cüce','Güneş gibi'],['s:1','Kırmızı cüce','Soluk, uzun ömürlü'],['s:2','Mavi dev','Çok sıcak, parlak'],['s:3','Kırmızı dev','Şişmiş, yaşlı'],['s:4','Beyaz cüce','Ölü yıldız çekirdeği']]],
  ['Yıldız kalıntıları',[['s:5','Nötron yıldızı','Pulsar · 1,4 M☉'],['s:6','Kara delik','Işığı büker']]]];
var ADDF={planet:['name','color','psize','pdist','moons','ring'],star:['name','ssize','sdist'],ns:['name','sdist'],bh:['name','mass','sdist']};
var ADDNOTE={
  earth:'Kıtaları, okyanusları ve Dünya gibi bir atmosferi olan kayalık gezegen. Yıldızının yaşanabilir kuşağına koyarsan suyu sıvı kalır; Bilgi sekmesinde yaşanabilirlik endeksine bak. Dünya\'nın 0,5–1,6 katı büyüklüğü gerçekçi.',
  ocean:'Yüzeyi okyanus; uzaklığı ve yıldızın türü sıcaklığını belirler. Çok yaklaştırırsan okyanusları kaynar.',rocky:'Dünya benzeri kayalık bir gezegen.',gas:'Hidrojen ve helyumdan dev bir gezegen. Gerçek gaz devleri Dünya\'dan 4–11 kat büyüktür.',
  ice:'Yüzeyi buz tutmuş soğuk bir dünya.',lava:'Yıldızına çok yakın, yüzeyi erimiş bir dünya.',desert:'Az suyu olan, kurak bir dünya.',
  0:'Güneş benzeri bir yıldız. Işığı tüm gezegenleri aydınlatır; yerçekimi açıksa yörüngeleri bozar.',1:'Evrendeki yıldızların çoğu kırmızı cücedir: küçük, soğuk ve trilyonlarca yıl yaşar.',2:'Güneş\'ten on binlerce kat parlak. Birkaç milyon yıl yaşar, sonu süpernovadır.',
  3:'Yakıtı azalmış, kat kat şişmiş yaşlı bir yıldız.',4:'Dünya boyutunda ama Güneş kadar ağır, yavaşça soğuyan bir yıldız çekirdeği.',
  5:'Süpernovadan kalan 20 km\'lik çekirdek: bir çay kaşığı milyarlarca ton. Dönen ışınları deniz feneri gibi süpürür.',
  6:'Kütlesi kaydırıcıdan. Yaklaşınca arkasındaki gezegenlerin ve yıldızların ışığı bükülür; disk gölgenin üstüne ve altına sarılır.'};
var ADDSEL='p:ocean';
/* aynı adlı iki cisim olmasın: "Nötron yıldızı B" varsa yenisi "Nötron yıldızı C" */
function uniqName(nm){var used={};BODIES.forEach(function(b){if(!isGone(b))used[b.def.name]=1;});if(!used[nm])return nm;var m=nm.match(/^(.*) ([A-Z])$/),base=m?m[1]:nm;for(var c=66;c<91;c++){var n=base+' '+String.fromCharCode(c);if(!used[n])return n;}for(var i=2;i<99;i++){if(!used[nm+' '+i])return nm+' '+i;}return nm;}
/* yaşanabilir kuşak (Kopparapu ve ark. 2013, kabaca): iç sınır √(L/1,1), dış sınır √(L/0,53) AU; L yıldızın parlaklığı (Güneş = 1) */
function habZone(){var L=Math.max(1e-6,starL());return [Math.sqrt(L/1.1),Math.sqrt(L/.53)];}
function fmtAU(x){return (x<1?x.toFixed(2):x.toFixed(1)).replace('.',',');}
/* yakındaki yörüngeler: aynı mesafeye konan cisimler aynı noktada başlayıp iç içe geçmesin diye boş bir açıya yerleştirilir */
function orbitNeighbors(r,tol){var out=[],so=sunBody.pivot.position;BODIES.forEach(function(b){if(b.parent||b===sunBody||isGone(b)||b.def.craft||b.def.comet||b.sysHide)return;var p=b.pivot.position,rb=Math.hypot(p.x-so.x,p.z-so.z);if(Math.abs(rb-r)<tol)out.push({b:b,ang:Math.atan2(-(p.z-so.z),p.x-so.x),rb:rb});});return out;}
function freeL0(r,P,tol){var nb=orbitNeighbors(r,tol);if(!nb.length)return null;var best=0,bd=-1;for(var k=0;k<72;k++){var a=k/72*TAU+Math.random()*.02,md=9;nb.forEach(function(o){var d=Math.abs(Math.atan2(Math.sin(a-o.ang),Math.cos(a-o.ang)));md=Math.min(md,d);});if(md>bd){bd=md;best=a;}}
  return ((best/D2R-360*simDays/P)%360+360)%360;}
function nearOrbitTxt(r){var nb=orbitNeighbors(r,Math.max(r*.07,6*DS));if(!nb.length)return '';nb.sort(function(a,b){return Math.abs(a.rb-r)-Math.abs(b.rb-r);});return nb[0].b.def.name+' ile aynı yörüngede: boş bir noktaya yerleştirilecek.';}
function addZoneUpd(){var el=$('addZone');if(!el||!sunBody)return;var kind=addKind(ADDSEL);if(kind!=='planet'&&kind!=='star'&&kind!=='bh'&&kind!=='ns'){el.textContent='';return;}
  var t='';if(kind==='planet'){var z=habZone(),a=+$('nDist').value,inZ=a>=z[0]&&a<=z[1];t='Yaşanabilir kuşak: '+fmtAU(z[0])+'–'+fmtAU(z[1])+' AU'+(inZ?' · bu mesafe kuşağın içinde ✓':a<z[0]?' · bu mesafe çok sıcak':' · bu mesafe çok soğuk');var no=nearOrbitTxt(orbitR(a));if(no)t+='\n'+no;}
  else{var no2=nearOrbitTxt(+$('xDist').value*DS);if(no2)t=no2;}
  el.textContent=t;}
function addKind(k){if(k.charAt(0)==='p')return 'planet';var t=+k.slice(2);return t===5?'ns':t===6?'bh':'star';}
function addMassVal(){var v=+$('aMass').value;return Math.round(3*Math.pow(100/3,v)*10)/10;}
function bhSizeFor(m){return clamp(.8*Math.pow((m||10)/10,.25),.4,1.6);}
function addCounts(){return {p:BODIES.filter(function(b){return b.def.custom&&!b.parent&&!b.def.star&&!isGone(b);}).length,s:BODIES.filter(function(b){return b.def.star&&b!==sunBody&&!isGone(b)&&!b.sysHide;}).length};}
function addDotCss(k){if(k.charAt(0)==='p'){var c=TYPE_COLORS[k.slice(2)];return 'background:radial-gradient(circle at 35% 30%,'+c[0]+','+(c[1]||c[0])+' 70%,#0b0e18)';}return starDotCss(+k.slice(2));}
function addPick(k){
  if(k==='s2')k='s:2';ADDSEL=k;var kind=addKind(k),f=ADDF[kind];
  [].forEach.call($('addCat').querySelectorAll('button'),function(b){b.classList.toggle('on',b.dataset.k===k);b.setAttribute('aria-pressed',b.dataset.k===k);});
  [].forEach.call($('addForm').querySelectorAll('[data-f]'),function(r){r.hidden=f.indexOf(r.dataset.f)<0;});
  var item=null;ADDCAT.forEach(function(g){g[1].forEach(function(x){if(x[0]===k)item=x;});});
  $('addTitle').textContent=item[1];$('addSub').textContent=item[2];$('addDot').setAttribute('style',addDotCss(k));
  if(kind==='planet'){var t=k.slice(2);$('nType').value=t;$('nColor').value=TYPE_COLORS[t][0];
    if(t==='gas'){if(+$('nSize').value<4)$('nSize').value=7;$('nRing').checked=true;}else{if(+$('nSize').value>3)$('nSize').value=1.2;$('nRing').checked=false;}
    if(t==='earth'&&sunBody){var hz=habZone();$('nSize').value=1;$('nDist').value=Math.max(.2,Math.min(100,Math.sqrt(hz[0]*hz[1]))).toFixed(1);$('nMoons').value='1';}
    if(!$('nName').dataset.user)$('nName').value=NAMES[Math.floor(Math.random()*NAMES.length)];}
  else{var ty=+k.slice(2);$('xType').value=ty;if(!$('nName').dataset.user)$('nName').value=SUN_TYPES[ty].name+' B';}
  $('nRand').hidden=kind!=='planet';$('addGo').textContent=kind==='planet'?'Gezegeni ekle':kind==='bh'?'Kara deliği ekle':kind==='ns'?'Nötron yıldızını ekle':'Yıldızı ekle';
  $('addNote').textContent=ADDNOTE[kind==='planet'?k.slice(2):+k.slice(2)]||'';
  fillOuts();addSync();
}
function addSync(){var c=addCounts(),kind=addKind(ADDSEL),full=kind==='planet'?c.p>=10:c.s>=2;
  $('addCount').textContent='Eklenenler: '+c.p+'/10 gezegen · '+c.s+'/2 yıldız ya da kalıntı';$('addGo').disabled=full;$('nRand').disabled=full;
  if(full)$('addNote').textContent=kind==='planet'?'En fazla 10 gezegen eklenebilir. Yenisi için birini sil (cismi seç, Cisim sekmesi).':'En fazla 2 ek yıldız ya da kalıntı eklenebilir. Yenisi için birini sil.';}
afterLoad(function(){
  var C=$('addCat');ADDCAT.forEach(function(g){var h=document.createElement('div');h.className='acg';h.textContent=g[0];C.appendChild(h);var row=document.createElement('div');row.className='acr';
    g[1].forEach(function(x){var b=document.createElement('button');b.type='button';b.dataset.k=x[0];b.innerHTML='<i style="'+addDotCss(x[0])+'"></i><span>'+esc(x[1])+'</span>';b.title=x[2];
      b.addEventListener('click',function(){$('nName').dataset.user='';addPick(x[0]);var f=$('addForm'),sb=$('sideBody');if(f&&sb){var fr=f.getBoundingClientRect(),sr=sb.getBoundingClientRect();if(fr.bottom>sr.bottom){var J=$('lJump'),top=sr.top+(J?J.offsetHeight+10:0);sb.scrollTo({top:sb.scrollTop+Math.min(fr.top-top,fr.bottom-sr.bottom+8),behavior:'smooth'});}}});row.appendChild(b);});C.appendChild(row);});
  $('nName').addEventListener('input',function(){this.dataset.user=this.value?'1':'';});
  $('aMass').addEventListener('input',fillOuts);
  $('addGo').addEventListener('click',function(){var kind=addKind(ADDSEL);if(kind==='planet')clk('nAdd');else clk('xAdd');$('nName').dataset.user='';setTimeout(function(){addPick(ADDSEL);},50);});
  addPick(ADDSEL);
});

/* yıldız */
var SUN_PEND=null;
function setStar(i,keepAge){
  SUN_PEND=null;if(i!==6&&EXO.col){colAbort(EXO.col);EXO.col=null;}
  if(i!==0&&sunBody.sunU&&sunBody.sunU.ha.value>0){sunBody.sunU.ha.value=0;$('vHa').setAttribute('aria-checked','false');}
  sunType=i;var t=SUN_TYPES[i];morphClear(sunBody);
  sunBody.starType=i;sunBody.sunU.lo.value.setHex(t.lo);sunBody.sunU.hi.value.setHex(t.hi);sunBody.sunU.spots.value=(i>=4||i===2)?0:1;
  sunLight.color.setHex(t.light);sunLight.intensity=t.I;
  sunBody.glow1.material.color.setHex(t.glow);sunBody.glow2.material.color.setHex(t.glow);
  if(!keepAge){starAge=i===0?4.57:(i===3?11.2:(i===4?13:starAge));$('sAge').value=starAge;}
  $('sAge').disabled=!(i===0||i===3||i===4);ageOut();
  $('starName').textContent=t.name;
  Array.prototype.forEach.call($('starBtns').children,function(btn,k){btn.classList.toggle('on',k===i);});
  if(i>=5)applyExotic(i);else{removeExotic();refreshStarDot(sunBody);}
  if(focus===sunBody&&typeof updateInfo==='function')updateInfo();
  if(focus)labCtx();
}
function buildStarBtns(){
  SUN_TYPES.forEach(function(t,i){if(i>=5)return;var b=document.createElement('button');b.className='btn';b.textContent=t.name;b.addEventListener('click',function(){var tg=labStar();act('type',{tg:tg.id,i:i});chooseType(tg,i);toast((tg===sunBody?'Yıldız: ':tg.def.name+': ')+t.name);});$('starBtns').appendChild(b);});
}
/* genel */
$('gSpin').addEventListener('input',function(){gSpin=+this.value;$('oGSpin').textContent=fmtX(gSpin);});
$('chaos').addEventListener('click',function(){
  BODIES.forEach(function(b){b.mod.spin=+(Math.random()<.2?-rnd(.5,4):rnd(.5,14)).toFixed(1);if(b.id!=='sun')b.mod.orbit=+rnd(.3,7).toFixed(1);});
  syncLab();toast('Kaos: her şeyin hızı değişti');
});
var resetArm=0;
function resetSystem(e){
  var now=Date.now(),el=e&&e.currentTarget;
  if(now-resetArm>3500){resetArm=now;toast('Tüm değişiklikler ve eklediğin cisimler silinecek. Onaylamak için tekrar dokun.');if(el){var t0=el.textContent;el.textContent='Emin misin? Tekrar dokun';setTimeout(function(){el.textContent=t0;},3500);}return;}
  resetArm=0;vm.hidden=true;tv.setAttribute('aria-expanded','false');
  setGravity(false);if(SYS)unloadSystem();
  /* süren her şeyi durdur: patlama kabuğu, çöküş, gaz akıntıları, bulutsular, fırlatmalar, bekleyen dönüşümler */
  TIMERS=[];SLOWMO=0;EXO.fuel=0;clearTDES();debClear();
  ENVS.forEach(function(e){scene.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();});ENVS=[];TDL.forEach(tdlKill);TDL=[];MORPH=[];SETTLE=[];
  PNEB.forEach(function(P){P.sp.parent&&P.sp.parent.remove(P.sp);P.sp.geometry.dispose();P.sp.material.dispose();});PNEB=[];
  if(EXO.sn){scene.remove(EXO.sn.shell);if(EXO.sn.flash.parent)EXO.sn.flash.parent.remove(EXO.sn.flash);if(EXO.sn.jets&&EXO.sn.jets.parent)EXO.sn.jets.parent.remove(EXO.sn.jets);EXO.sn=null;}
  if(EXO.col){colAbort(EXO.col);EXO.col=null;}
  SETTLE=[];if(sunBody&&sunBody.pivot)sunBody.pivot.position.set(0,0,0);BODIES.forEach(function(b){b.dart=null;b.homing=null;b.unborn=false;b.ownDestroy=false;b.massAbs=null;if(b.pivot&&!b.parent)unstretch(b);});
  /* eklenen tüm cisimler: yıldızlar, gezegenler, gerçek gezegenlere eklenen uydular ve çarpışma enkazından doğan uydular */
  var cus=BODIES.filter(function(b){return b.def.custom;});
  cus.filter(function(b){return b.parent;}).forEach(disposeBody);cus.filter(function(b){return !b.parent;}).forEach(function(b){BODIES.filter(function(x){return x.parent===b&&BODIES.indexOf(x)>=0;}).forEach(disposeBody);disposeBody(b);});
  customs=[];saveCustom();
  clearDestruction();if(typeof resetBelts==='function')resetBelts();
  BODIES.forEach(function(b){resetBody(b);b.hab=makeHab(b.def);b.cl=null;b.aurB=0;if(b.engulfed){b.engulfed=false;b.pivot.visible=true;}});
  gSpin=1;$('gSpin').value=1;$('oGSpin').textContent=fmtX(1);sunMass=1;EATEN=0;$('sMass').value=sliderFromMass(1);$('oMass').textContent=fmtX(1);
  setStar(0);actLevel=1;$('sAct').value=1;$('oAct').textContent='1,0×';auroraBoost=0;
  if(FX&&FX.cm){FX.cm.on=false;FX.cmPts.visible=false;}
  simDays=(Date.now()-J2000)/86400000;wxT=simDays;
  BODIES.forEach(function(b){if(b.def.id!=='sun')b.ang=initialAngle(b.def);});resyncReal();updateBodies(0);
  speedIdx=4;speed.value=4;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
  rebuildLists();focusBody('sun',{dist:OVD()});syncLab();updateInfo();
  toast('Güneş Sistemi başlangıç haline döndü');
}
$('resetAll').addEventListener('click',resetSystem);
$('vReset').addEventListener('click',resetSystem);

/* ---------- yerçekimi simülasyonu ---------- */
var gravityOn=false,sunMass=1,TR=1500,gSlowNext=1;
function gInit(b){
  var d=b.def,r=d.r,w=TAU/d.P;b.GM=w*w*r*r*r;
  /* Güneş ortak kütle merkezi etrafında hareket edebildiği için yerçekimi koordinatları Güneş merkezli */
  var so=sunBody?sunBody.pivot.position:new THREE.Vector3(),pp=b.pivot.position.clone().sub(so),rr=Math.hypot(pp.x,pp.z);if(rr<1){pp.set(r*Math.cos(b.ang),0,-r*Math.sin(b.ang));rr=r;}
  var an=Math.atan2(-pp.z,pp.x),vc=Math.sqrt(b.GM/rr);
  b.gx=pp.x;b.gy=pp.y;b.gz=pp.z;b.gvx=-vc*Math.sin(an);b.gvy=0;b.gvz=-vc*Math.cos(an);b.trailN=0;
  if(!b.trailLine){
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TR*3),3));g.setDrawRange(0,0);
    b.trailLine=new THREE.Line(g,new THREE.LineBasicMaterial({color:new THREE.Color(d.dot[0]),transparent:true,opacity:.6,depthWrite:false}));
    b.trailLine.frustumCulled=false;scene.add(b.trailLine);
  }
  b.trailLine.visible=true;b.trailLine.geometry.setDrawRange(0,0);
}
function pushTrail(b){
  var arr=b.trailLine.geometry.attributes.position.array,n=b.trailN;
  if(n>0){var dx=arr[(n-1)*3]-b.gx,dy=arr[(n-1)*3+1]-b.gy,dz=arr[(n-1)*3+2]-b.gz;if(dx*dx+dy*dy+dz*dz<.36)return;}
  if(n>=TR){arr.copyWithin(0,3);n=TR-1;}
  arr[n*3]=b.gx;arr[n*3+1]=b.gy;arr[n*3+2]=b.gz;b.trailN=n+1;
  b.trailLine.geometry.setDrawRange(0,b.trailN);b.trailLine.geometry.attributes.position.needsUpdate=true;
}
/* Güneş'e/kara deliğe yutulma eşiği tek yerde: kara delik varken gelgit yarıçapı, yoksa Güneş yüzeyi */
function swallowR(b){return sunType===6?rtOf(b):effVr(sunBody)+effVr(b)*.5;}
function stepGravity(dDays){
  var gb=BODIES.filter(function(b){return b.grav&&b.trailLine&&!b.sysHide&&!b.dart;});
  if(!gb.length||!sunBody)return;
  var stars=BODIES.filter(function(b){return b.def.star;});
  var n=clamp(Math.ceil(Math.abs(dDays)*Math.sqrt(Math.max(1,sunMass))/.5),1,240),h=dDays/n,a=[0,0,0];
  var GMref=byId.earth&&byId.earth.GM?byId.earth.GM:1;gb=gb.filter(function(b){return !b.destroyed;});
  function acc(b){
    var x=b.gx,y=b.gy,z=b.gz,r2=x*x+y*y+z*z+1,k=-b.GM*sunMass/(r2*Math.sqrt(r2));
    a[0]=k*x;a[1]=k*y;a[2]=k*z;
    for(var q=0;q<gb.length;q++){var o=gb[q];if(o===b||o.destroyed)continue;var ex=o.gx-x,ey=o.gy-y,ez=o.gz-z,rq=ex*ex+ey*ey+ez*ez+.5,m=GMref*bodyMass(o)/333000,kq=m/(rq*Math.sqrt(rq));a[0]+=kq*ex;a[1]+=kq*ey;a[2]+=kq*ez;}
    /* ek yıldızın çekimi gerçek kütlesiyle (önceden boyutundan hesaplanıyordu: 100 Güneş kütleli kara delik 1 Güneş gibi çekiyordu).
       Güneş merkezli çerçeve ivmeli bir çerçevedir: yıldız Güneş'i de çeker, bu yüzden her gezegene Güneş'in ivmesinin tersi eklenir
       (dolaylı terim). Böylece ağır bir kara delik eklenince Güneş ve gezegenleri birlikte ona doğru savrulur, gezegenler tek tek değil. */
    stars.forEach(function(s){if(s===sunBody||isGone(s)||s.sysHide)return;
      /* koordinatlar Güneş merkezli: yıldızın Güneş'e göre konumu */
      var sp=s.pivot.position,so=sunBody.pivot.position,sx=sp.x-so.x,sy=sp.y-so.y,sz=sp.z-so.z,m=stMass(s),dx=sx-x,dy=sy-y,dz=sz-z,q=dx*dx+dy*dy+dz*dz+9,kk=b.GM*m/(q*Math.sqrt(q));
      a[0]+=kk*dx;a[1]+=kk*dy;a[2]+=kk*dz;
      var q2=sx*sx+sy*sy+sz*sz+9,k2=b.GM*m/(q2*Math.sqrt(q2));a[0]-=k2*sx;a[1]-=k2*sy;a[2]-=k2*sz;
    });
  }
  if(dDays!==0){
    for(var s=0;s<n;s++){
      var sk=h>0?checkCollisions(gb):1;gSlowNext=Math.min(gSlowNext,sk);gb=gb.filter(function(b){return !b.destroyed;});
      gb.forEach(function(b){
        if(b.homing||b.tdeNow||b.fallNow)return;
        acc(b);b.gvx+=a[0]*h/2;b.gvy+=a[1]*h/2;b.gvz+=a[2]*h/2;
        b.gx+=b.gvx*h;b.gy+=b.gvy*h;b.gz+=b.gvz*h;
        acc(b);b.gvx+=a[0]*h/2;b.gvy+=a[1]*h/2;b.gvz+=a[2]*h/2;
        var rq=Math.sqrt(b.gx*b.gx+b.gy*b.gy+b.gz*b.gz);if(rq<swallowR(b)){if(sunType===6)b.tdeNow=true;else b.fallNow=true;}
        if(s%2===0)pushTrail(b);
      });
      gb.forEach(function(b){
        var H=b.homing;if(!H)return;var t=H.t;
        if(b.destroyed||isGone(t)){b.homing=null;return;}
        var tx=t.def.id==='sun'?0:t.gx,ty=t.def.id==='sun'?0:t.gy,tz=t.def.id==='sun'?0:t.gz,tvx=t.def.id==='sun'?0:t.gvx,tvy=t.def.id==='sun'?0:t.gvy,tvz=t.def.id==='sun'?0:t.gvz;
        var rl=H.rel,d=rl.length()+.3,gm=(t.def.id==='sun'?b.GM*sunMass:GMref*bodyMass(t)/333000)*4;
        if(t.def.id==='sun'&&H.hit)return;
        if(t.def.id==='sun')gm=0;
        var px=rl.x,py=rl.y,pz=rl.z;H.v.addScaledVector(rl,-gm/(d*d*d)*h);rl.addScaledVector(H.v,h);
        if(t.def.id==='sun'){var sx=rl.x-px,sy=rl.y-py,sz=rl.z-pz,L2=sx*sx+sy*sy+sz*sz,u=L2>0?clamp(-(px*sx+py*sy+pz*sz)/L2,0,1):0,cx=px+sx*u,cy=py+sy*u,cz=pz+sz*u;
          if(sunType===6&&Math.sqrt(cx*cx+cy*cy+cz*cz)<rtOf(b)){rl.set(cx,cy,cz);H.hit=true;b.tdeNow=true;}else if(sunType!==6&&Math.sqrt(cx*cx+cy*cy+cz*cz)<effVr(t)+effVr(b)){rl.set(0,0,0);H.v.set(0,0,0);H.hit=true;}}
        else{
          /* adım içinde hedefin içinden geçip geçmediği: gerçek ölçekte cisimler küçük, hız yüksek; bir adımda hedefin üstünden atlayıp
             sapan gibi fırlatılıyordu. Yol parçasının hedefe en yakın noktası temas mesafesindeyse cisim o noktada bırakılır, çarpışma yakalanır */
          var qx=rl.x-px,qy=rl.y-py,qz=rl.z-pz,Q2=qx*qx+qy*qy+qz*qz,w=Q2>0?clamp(-(px*qx+py*qy+pz*qz)/Q2,0,1):0,ex=px+qx*w,ey=py+qy*w,ez=pz+qz*w,Rc=(effVr(t)+effVr(b))*.9,ed=Math.sqrt(ex*ex+ey*ey+ez*ez);
          if(w>0&&w<1&&ed<Rc){var kk=ed>1e-6?Rc*.98/ed:0;rl.set(ex*kk,ey*kk,ez*kk);if(!kk)rl.set(Rc*.98,0,0);}}
        b.gx=tx+rl.x;b.gy=ty+rl.y;b.gz=tz+rl.z;b.gvx=tvx+H.v.x;b.gvy=tvy+H.v.y;b.gvz=tvz+H.v.z;
        if(s%2===0)pushTrail(b);
      });
    }
  }
  gb.forEach(function(b){
    var rr=Math.sqrt(b.gx*b.gx+b.gy*b.gy+b.gz*b.gz);
    if(isNaN(rr)){b.ang=initialAngle(b.def);gInit(b);return;}
    if(sunType===6&&(b.tdeNow||rr<swallowR(b))){b.tdeNow=false;b.fallNow=false;b.homing=null;startTDE(b);return;}
    b.tdeNow=false;
    if(b.fallNow||rr<swallowR(b)){b.fallNow=false;b.homing=null;eatMass(b);toast(fallText(b.def.name,sunType,'Güneş'),7000);flashAt(scene,new THREE.Vector3(b.gx,b.gy,b.gz).add(sunBody.pivot.position),effVr(b)*6,0xffe0a0);var ft=FIRET||(FIRET=glowTex([[0,'rgba(255,255,255,1)'],[.3,'rgba(255,255,255,.75)'],[.65,'rgba(255,255,255,.25)'],[1,'rgba(255,255,255,0)']]));var fs=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,color:0xffd090,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));fs.position.set(b.gx,b.gy,b.gz).add(sunBody.pivot.position);scene.add(fs);FXL.push({o:fs,t:0,T:3,k:'fire',s:effVr(b)*5});destroyBody(b);return;}
    var hitS=null;for(var si=0;si<stars.length;si++){var sx=stars[si];if(sx===sunBody||sx.destroyed||isGone(sx)||sx.sysHide)continue;var sp0=sunBody.pivot.position,ddx=sx.pos.x-sp0.x-b.gx,ddy=sx.pos.y-sp0.y-b.gy,ddz=sx.pos.z-sp0.z-b.gz;if(Math.sqrt(ddx*ddx+ddy*ddy+ddz*ddz)<effVr(sx)*.95+effVr(b)*.5){hitS=sx;break;}}
    if(hitS){b.homing=null;var hT=stType(hitS);if(hT===6)feedBH(hitS,1.5);addStarMass(hitS,bodyMass(b)/333000);toast(fallText(b.def.name,hT,'yıldız'),7000);flashAt(scene,new THREE.Vector3(b.gx,b.gy,b.gz).add(sunBody.pivot.position),effVr(b)*6,0xffe0a0);destroyBody(b);return;}
    if(rr>3000*DS&&!b.rogue){b.rogue=true;toast(b.def.name+' sistemden fırlatıldı: artık yıldızı olmayan başıboş bir gezegen, uzaklaştıkça donacak',6000);}
    b.pivot.position.set(b.gx,b.gy,b.gz);b.ang=Math.atan2(-b.gz,b.gx);if(dDays===0)return;pushTrail(b);
  });
}
/* ---------- korunum göstergesi ----------
   Kütleçekim modunda toplam mekanik enerji ve açısal momentumun, mod açıldığından beri ne kadar saptığını gösterir: simülasyonun
   doğruluğunu ölçmenin yolu. Bütünleyicinin kullandığı kuvvetlerle aynı potansiyel kullanılır (Güneş terimi cismin kendi GM'siyle ve
   yumuşatmayla, gezegen çiftleri Dünya'nın GM'sine oranla). Cisim sayısı ya da yıldız kütlesi değişince ölçüm baştan başlar.
   Ölçülmediği durumlar: ek yıldız varken (yıldızlar hazır yörüngede döner, sisteme dışarıdan enerji verir) ve bir cisim hedefe fırlatılmışken
   ya da yutulurken (o cisim kuvvetle değil yönlendirmeyle hareket eder). */
var CONS={E0:null,L0:null,sig:'',dE:null,dL:null,why:''};
function consBodies(){return BODIES.filter(function(b){return b.grav&&b.trailLine&&!b.sysHide&&!b.dart&&!b.destroyed&&!b.engulfed&&b.gx!=null;});}
function consCalc(gb){
  var GMref=byId.earth&&byId.earth.GM?byId.earth.GM:1,E=0,Lx=0,Ly=0,Lz=0,i,j;
  for(i=0;i<gb.length;i++){var b=gb[i],m=bodyMass(b),r2=b.gx*b.gx+b.gy*b.gy+b.gz*b.gz+1;
    E+=m*(.5*(b.gvx*b.gvx+b.gvy*b.gvy+b.gvz*b.gvz)-b.GM*sunMass/Math.sqrt(r2));
    Lx+=m*(b.gy*b.gvz-b.gz*b.gvy);Ly+=m*(b.gz*b.gvx-b.gx*b.gvz);Lz+=m*(b.gx*b.gvy-b.gy*b.gvx);
    for(j=i+1;j<gb.length;j++){var o=gb[j],ex=o.gx-b.gx,ey=o.gy-b.gy,ez=o.gz-b.gz;E-=GMref*m*bodyMass(o)/333000/Math.sqrt(ex*ex+ey*ey+ez*ez+.5);}}
  return {E:E,L:Math.sqrt(Lx*Lx+Ly*Ly+Lz*Lz)};}
function consUpdate(){
  var box=$('cons');if(!box)return;
  if(!gravityOn){box.hidden=true;CONS.sig='';CONS.dE=CONS.dL=null;return;}
  box.hidden=false;var gb=consBodies(),why='';
  if(BODIES.some(function(b){return b.def.star&&b!==sunBody&&!isGone(b)&&!b.sysHide;}))why='Ek yıldız varken ölçülmez: yıldız hazır yörüngesinde döner ve sisteme enerji verir.';
  else if(gb.some(function(b){return b.homing||b.tdeNow||b.fallNow;}))why='Fırlatma ya da yutulma sürerken ölçülmez.';
  else if(!gb.length)why='Ölçülecek gezegen kalmadı.';
  CONS.why=why;
  if(why){CONS.sig='';CONS.dE=CONS.dL=null;$('consE').textContent='–';$('consL').textContent='–';$('consNote').textContent=why;return;}
  var sig=gb.map(function(b){return b.def.id+':'+b.mod.size;}).join(',')+'|'+sunMass+'|'+sunType,c=consCalc(gb);
  if(sig!==CONS.sig){CONS.sig=sig;CONS.E0=c.E;CONS.L0=c.L;}
  CONS.dE=CONS.E0?(c.E-CONS.E0)/Math.abs(CONS.E0)*100:0;CONS.dL=CONS.L0?(c.L-CONS.L0)/Math.abs(CONS.L0)*100:0;
  var f=function(x){var a=Math.abs(x);return a<1e-4?'%0,0001\'den az':(x<0?'−':'+')+'%'+a.toLocaleString('tr-TR',{minimumFractionDigits:a<.1?4:2,maximumFractionDigits:a<.1?4:2});};
  $('consE').textContent=f(CONS.dE);$('consL').textContent=f(CONS.dL);
  $('consNote').textContent='Mod açıldığından beri toplam enerji ve açısal momentumun değişimi. Sıfıra ne kadar yakınsa hesap o kadar doğru; cisim sayısı ya da yıldız kütlesi değişince ölçüm baştan başlar.';}
function setGravity(on){
  gravityOn=on;var gb=$('gravBtn');gb.setAttribute('aria-pressed',on);gb.textContent=on?'Açık':'Kapalı';gb.classList.toggle('on',on);
  BODIES.forEach(function(b){
    if(!b.grav)return;
    b.homing=null;
    if(on)gInit(b);else{b.trailN=0;if(b.trailLine)b.trailLine.visible=false;}
  });
  syncLab();
}
$('gravBtn').addEventListener('click',function(){act('grav',{on:!gravityOn});setGravity(!gravityOn);toast(gravityOn?'Yerçekimi simülasyonu açıldı':'Sabit yörüngelere dönüldü');});
var massEv=null;$('sMass').addEventListener('change',function(){massEv=null;massRetype();});
/* ana kol yıldızında kütle türü belirler: <0,5 M☉ kırmızı cüce, 0,5–8 sarı/beyazımsı, ≥8 mavi dev (O/B tipi) */
function massRetype(quiet){
  if(SYS||sunType>2)return;var M=sunMass,ny=M<.5?1:M<8?0:2;if(ny===sunType)return;
  setStar(ny,true);syncLab();if(focus===sunBody)updateInfo();
  if(!quiet)toast(ny===1?'Kütle 0,5 Güneş\'in altına indi: bu kütlede bir yıldız kırmızı cüce olur (soğuk, sönük, trilyonlarca yıl yaşar).':ny===2?'Kütle 8 Güneş\'i geçti: bu kütlede bir ana kol yıldızı sıcak, mavi bir dev olur (O/B tipi). Ömrü birkaç milyon yıl; sonunda süpernova olur.':'Bu kütlede yıldız Güneş benzeri bir ana kol yıldızı olur.',7000);
}
$('sMass').addEventListener('input',function(){if(!massEv)massEv=act('mass',{v:sunMass});sunMass=massFromSlider(+this.value)+EATEN/333000;if(massEv)massEv.v=sunMass;$('oMass').textContent=massTxt();if(focus===sunBody&&sunType>=4)updateInfo();});

/* ---------- ikinci yıldız ---------- */
var sid=0;
function addStar(o,silent){
  var id=o.id||('s'+(++sid));if(/^s\d+$/.test(id))sid=Math.max(sid,+id.slice(1));if(!silent)act('born',{id:id});
  var T=SUN_TYPES[o.type],L0=o.L0!=null?o.L0:null;
  /* başlangıç açısı initialAngle'da def.P (2500 gün) ile hesaplanır; boş açıyı ona göre çevir */
  if(L0==null){var fp=silent?null:freeL0(o.a*DS,2500,Math.max(o.a*DS*.08,9*o.size*3));L0=fp!=null?fp:rnd(0,360);}
  var h1='#'+('000000'+T.hi.toString(16)).slice(-6),h2='#'+('000000'+T.lo.toString(16)).slice(-6);
  var def={id:id,custom:true,star:true,name:o.name||(T.name+' B'),kind:'Yıldız · yarattığın',r:o.a*DS,P:2500,L0:L0,vr:SUNVR*o.size,starType:o.type,rotH:600,tilt:0,dot:[h1,h2],
    desc:'Güneş\'in çevresinde dönen ikinci bir yıldız. Işığı tüm gezegenleri aydınlatır; Yerçekimi simülasyonu açıkken yörüngeleri de bozar.',
    stats:[['Tür',T.name],o.type===4?['Çap','~12.000 km (Dünya kadar)']:['Çap',Math.round(1392700*o.size*(REAL&&o.type===3?RG_RSUN:T.sc)).toLocaleString('tr-TR')+' km'+(o.type===3&&!REAL?' (modelde; gerçek kırmızı devler çok daha büyük)':'')]].concat(o.type===4&&!REAL?bigRow(SUNVR*o.size*T.sc,6000):[],[['Güneş\'e uzaklık',fmtAU(invOrbit(o.a*DS))+' AU']])};
  buildBody(def);if(byId[id]&&o.m)byId[id].massAbs=o.m;if(byId[id]&&o.type===5)byId[id].nsOld=true;if(byId[id]&&o.type===6)byId[id].bhOld=true;if(o.type>=5&&byId[id])setTimeout(function(){var sb=byId[id];if(sb&&!sb.exo){setStarOn(sb,o.type);if(o.m)sb.massAbs=o.m;if(focus===sb&&!silent)focusBody(sb.def.id);}},0);
  customs.push({kind:'star',id:id,name:def.name,type:o.type,size:o.size,a:o.a,L0:L0,m:o.m||null});
  /* Güneş'ten ağır bir yıldız eklenince asıl hareket eden Güneş'tir: kısa bir notla söylenir */
  if(!silent){saveCustom();rebuildLists();focusBody(id);toast(def.name+' eklendi'+(byId[id]&&stMass(byId[id])>sunMass*1.05?'. Güneş\'ten ağır: asıl dönen Güneş olacak':''),4200);}
  return id;
}
$('xAdd').addEventListener('click',function(){
  if(BODIES.filter(function(b){return b.def.star&&b!==sunBody&&!isGone(b)&&!b.sysHide;}).length>=2){toast('En fazla 2 ek yıldız ekleyebilirsin');return;}
  var t=+$('xType').value,nm=uniqName(($('nName').value||'').trim()||(SUN_TYPES[t].name+' B')),m=t===6?addMassVal():t===5?1.4:null;
  addStar({type:t,size:t===6?bhSizeFor(m):t===5?.8:+$('xSize').value,a:+$('xDist').value,name:nm.slice(0,18),m:m});
});

/* ---------- paylaşma ---------- */
function sane(o){
  if(!o||typeof o!=='object')return null;
  var nm=String(o.name||'Nova').slice(0,18);
  if(o.kind==='star'){var t=Math.round(+o.type);if(!(t>=0&&t<7))t=0;var m=+o.m>0?clamp(+o.m,1,100):null;return {kind:'star',id:/^s\d+$/.test(o.id)?o.id:null,name:nm,type:t,size:clamp(+o.size||1,.3,2),a:clamp(+o.a||200,80,520),L0:+o.L0||0,m:m};}
  if(!Object.prototype.hasOwnProperty.call(CUSTOM_TYPES,o.type))return null;
  return {id:/^c\d+$/.test(o.id)?o.id:null,name:nm,type:o.type,color:/^#[0-9a-fA-F]{6}$/.test(o.color)?o.color:'#888888',size:clamp(+o.size||1,.1,25),a:clamp(+o.a||1,.2,100),ring:!!o.ring,moons:clamp(Math.round(+o.moons)||0,0,3),seed:+o.seed||0,L0:+o.L0||0,tilt:clamp(+o.tilt||0,0,180),rotH:clamp(+o.rotH||20,4,200)};
}
function encodeState(){
  var m={};
  BODIES.forEach(function(b){var x=b.mod;if(x.spin!==1||x.orbit!==1||x.size!==1||Math.abs(x.tilt-(b.def.tilt||0))>.01)m[b.id]=[x.spin,x.orbit,x.size,x.tilt];});
  return btoa(unescape(encodeURIComponent(JSON.stringify({v:1,c:customs,s:sunType,a:starAge,g:gSpin,m:m}))));
}
function applyState(st){
  focusBody('earth');
  BODIES.filter(function(b){return b.def.custom&&!b.parent;}).forEach(function(b){BODIES.filter(function(x){return x.parent===b;}).forEach(disposeBody);disposeBody(b);});
  customs=[];cid=0;sid=0;
  var stars=0;
  (Array.isArray(st.c)?st.c.slice(0,12):[]).forEach(function(o){
    var s=sane(o);if(!s)return;
    if(s.kind==='star'){if(stars>=2)return;stars++;addStar(s,true);}else addCustom(s,true);
  });
  rebuildLists();saveCustom();
  var t=Math.round(+st.s);setStar(t>=0&&t<5?t:0,true);starAge=clamp(+st.a||4.57,0,14);$('sAge').value=starAge;ageOut();
  gSpin=clamp(+st.g||1,0,20);$('gSpin').value=gSpin;$('oGSpin').textContent=fmtX(gSpin);
  if(st.m&&typeof st.m==='object')Object.keys(st.m).forEach(function(id){
    if(id==='__proto__'||id==='constructor'||id==='prototype')return;
    var b=byId[id],v=st.m[id];if(!b||!Array.isArray(v)||v.length<4)return;
    b.mod={spin:clamp(+v[0]||0,-5,25),orbit:clamp(+v[1]||0,0,12),size:clamp(+v[2]||1,.3,3),tilt:clamp(+v[3]||0,0,180)};
    setTiltRot(b,b.mod.tilt);applySize(b);
  });
  if(gravityOn)setGravity(true);
  syncLab();
}
$('shMake').addEventListener('click',function(){
  var code=encodeState(),ta=$('shCode');ta.value=code;
  var done=function(){toast('Kod kopyalandı');},fail=function(){ta.focus();ta.select();toast('Kodu seçtim, kopyala');};
  try{navigator.clipboard.writeText(code).then(done,fail);}catch(_){fail();}
});
$('shLoad').addEventListener('click',function(){
  var v=$('shIn').value.trim();if(!v){toast('Önce bir kod yapıştır');return;}
  try{
    var st=JSON.parse(decodeURIComponent(escape(atob(v))));
    if(!st||st.v!==1)throw new Error('v');
    applyState(st);toast('Sistem yüklendi');
  }catch(_){toast('Bu kod okunamadı');}
});
