/* Celestia · Yıldız haritası: Güneş'in komşuları gerçek yön ve uzaklıklarıyla; gidilebilir sistemlere buradan yolculuk başlatılır.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok). Bu dosya en son yüklenir:
   önceki dosyalardaki adları (SYSTEMS, loadSystem, ACTIONS, $, esc, toast …) kullanır. */
'use strict';
/* ================= YILDIZ HARİTASI =================
   Ana sahneden bağımsız, 2B tuvale çizilen küçük bir 3B harita. Ayrı tutulmasının nedeni ölçek: en yakın yıldız 268 bin AU uzakta,
   gezegenlerle aynı koordinat sistemine konursa ekran kartının tek duyarlıklı sayıları yetmez. Harita yalnızca etkileşimde yeniden çizilir,
   boştayken işlemci kullanmaz.
   Konumlar: sağ açıklık (saat), dik açıklık (derece), uzaklık (ışık yılı); ekliptik düzlemine çevrilir, yani haritanın yatay düzlemi
   gezegenlerin yörünge düzlemidir. Uzaklık ekseni logaritmiktir: 4 ışık yılındaki Proxima ile 245 ışık yılındaki Kepler-16 aynı
   haritaya sığsın, yakın yıldızlar da üst üste binmesin. */
var SMAP_STARS=[
  /* [ad, sağ açıklık (saat), dik açıklık (°), uzaklık (ışık yılı), tayf sınıfı, kısa açıklama, gidilebilir sistemin kimliği] */
  ['Güneş',0,0,0,'G','Sarı cüce · evimiz','sol'],
  ['Proxima Centauri',14.4953,-62.6794,4.2465,'M','Kırmızı cüce · en yakın yıldız','proxima'],
  ['Alfa Centauri A ve B',14.6600,-60.8339,4.37,'G','Sarı ve turuncu cüce çifti','alphacen'],
  ['Barnard Yıldızı',17.9633,4.6933,5.96,'M','Kırmızı cüce · gökyüzünde en hızlı kayan yıldız'],
  ['Wolf 359',10.9414,7.0147,7.86,'M','Çok sönük kırmızı cüce'],
  ['Lalande 21185',11.0556,35.97,8.31,'M','Kırmızı cüce'],
  ['Sirius',6.7525,-16.7161,8.6,'A','Gece göğünün en parlak yıldızı · beyaz cüce eşi var'],
  ['Luyten 726-8',1.6503,-17.9503,8.73,'M','Kırmızı cüce çifti (UV Ceti)'],
  ['Ross 154',18.8303,-23.8361,9.69,'M','Kırmızı cüce'],
  ['Ross 248',23.6986,44.175,10.3,'M','Kırmızı cüce'],
  ['Epsilon Eridani',3.5489,-9.4583,10.47,'K','Genç turuncu cüce · en az bir gezegen'],
  ['Lacaille 9352',23.0978,-35.8531,10.72,'M','Kırmızı cüce'],
  ['Ross 128',11.7956,0.8044,11.0,'M','Sakin kırmızı cüce · Dünya kütleli gezegen'],
  ['61 Cygni',21.115,38.7494,11.4,'K','Turuncu cüce çifti · uzaklığı ölçülen ilk yıldız'],
  ['Procyon',7.655,5.225,11.46,'F','Sarı-beyaz yıldız · beyaz cüce eşi var'],
  ['Epsilon Indi',22.0561,-56.7861,11.87,'K','Turuncu cüce · kahverengi cüce eşleri var'],
  ['Tau Ceti',1.7344,-15.9375,11.9,'G','Güneş\'e benzeyen en yakın tek yıldız'],
  ['Altair',19.8464,8.8683,16.7,'A','Çok hızlı dönen beyaz yıldız'],
  ['Vega',18.6156,38.7836,25.0,'A','Kuzey göğünün parlak beyaz yıldızı'],
  ['Fomalhaut',22.9608,-29.6222,25.1,'A','Çevresinde toz halkası olan genç yıldız'],
  ['Pollux',7.7553,28.0261,33.8,'K','Turuncu dev · bir gezegeni var','','dev'],
  ['Arcturus',14.2611,19.1825,36.7,'K','Turuncu dev · kuzey göğünün en parlağı','','dev'],
  ['TRAPPIST-1',23.1081,-5.0414,40.7,'M','Ultra soğuk cüce · 7 kayalık gezegen','trappist'],
  ['55 Cancri',8.8767,28.3308,41,'G','Sarı cüce · 5 gezegen','cancri'],
  ['Capella',5.2781,45.9981,42.9,'G','Dört yıldızlı sistem · iki sarı dev','','dev'],
  ['Aldebaran',4.5986,16.5092,65,'K','Turuncu dev · Boğa\'nın gözü','','dev'],
  ['Regulus',10.1394,11.9672,79,'B','Mavi-beyaz yıldız · Aslan\'ın kalbi'],
  ['Kepler-16',19.2717,51.7575,245,'K','İki güneşli gezegen sistemi','kepler16']
];
/* yıldız rengi tayf sınıfından (fiziksel renk; arayüzün vurgu rengi yalnızca seçimi gösterir) */
var SMAP_COL={M:'#ff9d6e',K:'#ffc27d',G:'#ffe6a3',F:'#fff3d9',A:'#dfe8ff',B:'#b9ccff'};
var SMAP_CLS={M:'kırmızı cüce',K:'turuncu yıldız',G:'sarı yıldız',F:'sarı-beyaz yıldız',A:'beyaz yıldız',B:'mavi-beyaz yıldız'};
var SMAP_RINGS=[5,10,25,50,100,250],SMAP_MAXLY=250;
var SMAP={open:false,yaw:.6,pitch:.42,zoom:1,sel:0,hov:-1,pts:[],ptr:{},trip:null,raf:0,w:0,h:0,cx:0,cy:0,base:1};
/* logaritmik uzaklık: 0 → 0, 250 ışık yılı → 1 */
function smapR(ly){return Math.log(1+ly/3)/Math.log(1+SMAP_MAXLY/3);}
/* ekvator koordinatı → ekliptik birim vektör (harita ekseni: x, y yukarı = ekliptik kuzey, z) */
(function(){var eps=23.4393*Math.PI/180,ce=Math.cos(eps),se=Math.sin(eps);
  SMAP.stars=SMAP_STARS.map(function(s,i){var a=s[1]*15*Math.PI/180,d=s[2]*Math.PI/180,x=Math.cos(d)*Math.cos(a),y=Math.cos(d)*Math.sin(a),z=Math.sin(d),
      ye=y*ce+z*se,ze=-y*se+z*ce,r=smapR(s[3]);
    return {i:i,name:s[0],ly:s[3],cls:s[4],sub:s[5],sys:s[6]||'',giant:s[7]==='dev',x:x*r,y:ze*r,z:-ye*r};});})();
function smapHere(){var id=SYS?SYS.id:'sol';for(var i=0;i<SMAP.stars.length;i++)if(SMAP.stars[i].sys===id)return i;return 0;}
function smapProj(x,y,z,out){
  var cy=Math.cos(SMAP.yaw),sy=Math.sin(SMAP.yaw),cp=Math.cos(SMAP.pitch),sp=Math.sin(SMAP.pitch);
  var x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp-z1*sp,z2=y*sp+z1*cp;
  /* hafif perspektif: yakın yarı biraz büyük */
  var k=SMAP.zoom*SMAP.base/(1-z2*.22);
  out.x=SMAP.cx+x1*k;out.y=SMAP.cy-y2*k;out.d=z2;return out;}
function smapFmtLy(v){return v.toLocaleString('tr-TR',{maximumFractionDigits:v<10?2:v<100?1:0});}
function smapYears(y){return y>=1e6?(y/1e6).toLocaleString('tr-TR',{maximumFractionDigits:1})+' milyon yıl':y>=1e3?Math.round(y/1e3).toLocaleString('tr-TR')+' bin yıl':Math.round(y).toLocaleString('tr-TR')+' yıl';}
function smapDraw(){
  var cv=$('smapCv');if(!SMAP.open||!cv)return;
  var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  var dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  SMAP.w=w;SMAP.h=h;
  /* dar ekranda bilgi kartı alt yarıyı kaplar: harita kartın üstünde kalan alana ortalanır */
  var card=cv.parentNode.querySelector('.smapcard'),narrow=w<=640,top=narrow?104:0,bot=narrow&&card?card.getBoundingClientRect().height+16:0,ah=Math.max(120,h-top-bot);
  SMAP.cx=w/2;SMAP.cy=top+ah/2;SMAP.base=Math.min(w,ah)*(narrow?.5:.46);
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  var cs=getComputedStyle(document.documentElement),cFg=cs.getPropertyValue('--fg').trim()||'#eef0f6',cDim=cs.getPropertyValue('--dim').trim()||'#8a90a2',cAcc=cs.getPropertyValue('--accent').trim()||'#f2b84b';
  var p={},q={},i,n;
  /* ekliptik düzlemindeki uzaklık halkaları */
  g.lineWidth=1;g.font='11px system-ui,sans-serif';g.textAlign='left';g.textBaseline='middle';
  SMAP_RINGS.forEach(function(ly){var r=smapR(ly);g.beginPath();
    for(n=0;n<=72;n++){var a=n/72*TAU;smapProj(Math.cos(a)*r,0,Math.sin(a)*r,p);if(n)g.lineTo(p.x,p.y);else g.moveTo(p.x,p.y);}
    g.strokeStyle='rgba(214,222,255,.13)';g.stroke();
    smapProj(r,0,0,p);g.fillStyle=cDim;g.fillText(ly+' ıy',p.x+5,p.y);});
  /* yıldızlar: uzaktan yakına çizilir */
  var S=SMAP.stars,here=smapHere(),order=S.map(function(s){smapProj(s.x,s.y,s.z,p);return {s:s,x:p.x,y:p.y,d:p.d};}).sort(function(a,b){return a.d-b.d;});
  SMAP.pts=order;
  order.forEach(function(o){var s=o.s;if(!s.ly)return;
    /* düzleme inen sap: yıldızın düzlemin neresinde ve ne kadar yukarıda/aşağıda olduğunu gösterir (aşağıdaysa kesikli) */
    smapProj(s.x,0,s.z,q);g.save();if(s.y<0)g.setLineDash([2,3]);g.strokeStyle='rgba(214,222,255,.16)';g.beginPath();g.moveTo(o.x,o.y);g.lineTo(q.x,q.y);g.stroke();g.restore();
    g.fillStyle='rgba(214,222,255,.22)';g.beginPath();g.arc(q.x,q.y,1.3,0,TAU);g.fill();});
  /* yolculuk çizgisi */
  var T=SMAP.trip;if(T){var a0=S[T.from],b0=S[T.to];smapProj(a0.x,a0.y,a0.z,p);smapProj(b0.x,b0.y,b0.z,q);
    g.strokeStyle=cAcc;g.lineWidth=1.5;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+(q.x-p.x)*T.k,p.y+(q.y-p.y)*T.k);g.stroke();
    g.fillStyle=cAcc;g.beginPath();g.arc(p.x+(q.x-p.x)*T.k,p.y+(q.y-p.y)*T.k,3.5,0,TAU);g.fill();g.lineWidth=1;}
  g.textAlign='center';g.textBaseline='alphabetic';
  /* etiketler önem sırasıyla yerleştirilir (seçili, bulunduğun yer, gidilebilir, diğerleri); üstte yer yoksa alta, orada da yoksa atlanır.
     Proxima ile Alfa Centauri 0,2 ışık yılı arayla durur: biri üste biri alta düşer */
  var placed=[],labels={};
  var fits=function(x,y,wd){var a={x0:x-wd/2-3,x1:x+wd/2+3,y0:y-12,y1:y+3};if(a.x0<2||a.x1>w-2)return null;for(var k=0;k<placed.length;k++){var b=placed[k];if(a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0)return null;}return a;};
  var rOf=function(o){var s=o.s;return (s.giant?4.6:s.cls==='M'?2.3:s.cls==='A'||s.cls==='B'||s.cls==='F'?3.8:3.1)*(1+o.d*.25);};
  order.slice().sort(function(a,b){var pr=function(o){return o.s.i===SMAP.sel?0:o.s.i===here?1:o.s.sys?2:o.s.i===SMAP.hov?3:4;};return pr(a)-pr(b)||b.d-a.d;}).forEach(function(o){var s=o.s,sel=s.i===SMAP.sel;
    if(!(s.sys||sel||s.i===SMAP.hov||SMAP.zoom>1.7))return;
    g.font=(s.sys||sel?'600 ':'')+'12px system-ui,sans-serif';var txt=s.name+(s.i===here?' · buradasın':''),wd=g.measureText(txt).width,r=rOf(o);
    var up=fits(o.x,o.y-r-10,wd),dn=up?null:fits(o.x,o.y+r+20,wd),box=up||dn;
    if(!box&&!sel)return;if(box)placed.push(box);
    labels[s.i]={txt:txt,y:up||!dn?o.y-r-10:o.y+r+20};});
  order.forEach(function(o){var s=o.s,sel=s.i===SMAP.sel,hov=s.i===SMAP.hov,r=(s.giant?4.6:s.cls==='M'?2.3:s.cls==='A'||s.cls==='B'||s.cls==='F'?3.8:3.1)*(1+o.d*.25),col=SMAP_COL[s.cls]||'#fff';
    /* gidilebilir sistem: ince halka; seçili: vurgu rengi halka */
    g.globalAlpha=.75+.25*Math.min(1,Math.max(0,(o.d+1)/1.5));
    var gr=g.createRadialGradient(o.x,o.y,0,o.x,o.y,r*3.2);gr.addColorStop(0,col);gr.addColorStop(.3,col);gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.beginPath();g.arc(o.x,o.y,r*3.2,0,TAU);g.fill();
    g.fillStyle=col;g.beginPath();g.arc(o.x,o.y,r,0,TAU);g.fill();
    g.globalAlpha=1;
    if(s.sys){g.strokeStyle=sel?cAcc:'rgba(238,240,246,.55)';g.lineWidth=sel?2:1;g.beginPath();g.arc(o.x,o.y,r+6,0,TAU);g.stroke();g.lineWidth=1;}
    else if(sel){g.strokeStyle=cAcc;g.lineWidth=2;g.beginPath();g.arc(o.x,o.y,r+6,0,TAU);g.stroke();g.lineWidth=1;}
    var lb=labels[s.i];if(lb){g.font=(s.sys||sel?'600 ':'')+'12px system-ui,sans-serif';g.fillStyle=sel?cFg:s.sys?cFg:cDim;g.fillText(lb.txt,o.x,lb.y);}
  });
}
function smapCard(){
  var s=SMAP.stars[SMAP.sel],here=smapHere(),isHere=s.i===here,box=$('smapInfo');
  var html='<h3>'+esc(s.name)+'</h3><p class="smapsub">'+esc(s.sub)+'</p>';
  if(s.ly){html+='<dl class="smapdl"><div><dt>Uzaklık</dt><dd>'+smapFmtLy(s.ly)+' ışık yılı</dd></div>'
      +'<div><dt>Işık hızıyla</dt><dd>'+smapFmtLy(s.ly)+' yıl</dd></div>'
      +'<div><dt>Voyager 1 hızıyla</dt><dd>~'+smapYears(s.ly*299792.458/16.9)+'</dd></div></dl>';}
  else html+='<p class="smapsub">Haritanın merkezi. Halkalar Güneş\'e uzaklığı gösterir.</p>';
  if(isHere)html+='<p class="note">Şu an buradasın.</p>';
  else if(s.sys)html+='<div class="btnrow"><button type="button" class="btn pri" id="smapGo">'+(s.sys==='sol'?'Güneş Sistemi\'ne dön':'Bu sisteme git')+'</button></div>';
  else html+='<p class="note">Bu yıldız için gezegen sistemi modellenmedi; yalnızca haritada gösteriliyor.</p>';
  box.innerHTML=html;
  var go=$('smapGo');if(go)go.addEventListener('click',function(){smapTravel(s.i);});
  [].forEach.call($('smapList').children,function(b){b.setAttribute('aria-pressed',+b.dataset.i===SMAP.sel?'true':'false');});
}
function smapSelect(i){SMAP.sel=i;smapCard();smapDraw();}
/* yolculuk: haritada bulunduğun yerden hedefe bir çizgi uzar, sonra sistem yüklenir. Hareket azaltma tercihinde çizgi beklemeden tamamlanır */
function smapTravel(i){
  var s=SMAP.stars[i];if(!s.sys||SMAP.trip)return;
  var from=smapHere(),reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now(),dur=reduce?0:1400;
  SMAP.trip={from:from,to:i,k:0};$('smapInfo').innerHTML='<h3>'+esc(s.name)+'</h3><p class="smapsub">Yola çıkıldı…</p>';
  var step=function(now){var k=dur?Math.min(1,(now-t0)/dur):1;SMAP.trip.k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;smapDraw();
    if(k<1){SMAP.raf=requestAnimationFrame(step);return;}
    SMAP.trip=null;smapClose();loadSystem(s.sys);};
  SMAP.raf=requestAnimationFrame(step);
}
function smapOpen(){
  if(SMAP.open)return;
  $('sysPanel').hidden=true;if(typeof closeCmd==='function')closeCmd();
  SMAP.open=true;SMAP.sel=smapHere();SMAP.hov=-1;SMAP.trip=null;
  var L=$('smapList');L.textContent='';
  SMAP.stars.filter(function(s){return s.sys;}).forEach(function(s){var b=document.createElement('button');b.type='button';b.className='grtab';b.dataset.i=s.i;b.textContent=s.name;
    b.addEventListener('click',function(){smapSelect(s.i);});L.appendChild(b);});
  $('smap').hidden=false;smapCard();smapDraw();
  setTimeout(function(){var c=$('smapClose');if(c)c.focus();},30);
}
function smapClose(){if(!SMAP.open)return;SMAP.open=false;cancelAnimationFrame(SMAP.raf);SMAP.trip=null;$('smap').hidden=true;}
(function(){
  var cv=$('smapCv'),P=SMAP.ptr,moved=0,pinch0=0,zoom0=1;
  var pos=function(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  var hit=function(x,y){var best=-1,bd=24*24;SMAP.pts.forEach(function(o){var dx=o.x-x,dy=o.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=o.s.i;}});return best;};
  var setZoom=function(z){SMAP.zoom=Math.min(6,Math.max(.7,z));};
  cv.addEventListener('pointerdown',function(e){if(SMAP.trip)return;cv.setPointerCapture(e.pointerId);P[e.pointerId]=pos(e);moved=0;
    var ids=Object.keys(P);if(ids.length===2){var a=P[ids[0]],b=P[ids[1]];pinch0=Math.hypot(a.x-b.x,a.y-b.y);zoom0=SMAP.zoom;}});
  cv.addEventListener('pointermove',function(e){var p=pos(e),o=P[e.pointerId],ids=Object.keys(P);
    if(!o){var h=hit(p.x,p.y);if(h!==SMAP.hov){SMAP.hov=h;cv.style.cursor=h>=0?'pointer':'grab';smapDraw();}return;}
    if(ids.length===2){P[e.pointerId]=p;var a=P[ids[0]],b=P[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0>0)setZoom(zoom0*d/pinch0);moved=99;smapDraw();return;}
    var dx=p.x-o.x,dy=p.y-o.y;moved+=Math.abs(dx)+Math.abs(dy);SMAP.yaw+=dx*.008;SMAP.pitch=Math.min(1.5,Math.max(-1.5,SMAP.pitch+dy*.008));P[e.pointerId]=p;smapDraw();});
  var up=function(e){var o=P[e.pointerId];delete P[e.pointerId];pinch0=0;if(!o||SMAP.trip)return;
    /* sürüklemeden bırakıldıysa dokunma sayılır: en yakın yıldız seçilir */
    if(moved<6){var p=pos(e),h=hit(p.x,p.y);if(h>=0)smapSelect(h);}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',function(e){delete P[e.pointerId];pinch0=0;});
  cv.addEventListener('wheel',function(e){e.preventDefault();setZoom(SMAP.zoom*Math.exp(-e.deltaY*.0015));smapDraw();},{passive:false});
  /* klavye: oklar döndürür, + / − yakınlaştırır */
  cv.addEventListener('keydown',function(e){var k=e.key,u=true;
    if(k==='ArrowLeft')SMAP.yaw-=.12;else if(k==='ArrowRight')SMAP.yaw+=.12;else if(k==='ArrowUp')SMAP.pitch=Math.min(1.5,SMAP.pitch+.1);else if(k==='ArrowDown')SMAP.pitch=Math.max(-1.5,SMAP.pitch-.1);
    else if(k==='+'||k==='=')setZoom(SMAP.zoom*1.2);else if(k==='-')setZoom(SMAP.zoom/1.2);else u=false;
    if(u){e.preventDefault();e.stopPropagation();smapDraw();}});
  $('smapClose').addEventListener('click',smapClose);
  $('smapIn').addEventListener('click',function(){setZoom(SMAP.zoom*1.35);smapDraw();});
  $('smapOut').addEventListener('click',function(){setZoom(SMAP.zoom/1.35);smapDraw();});
  /* Esc kapatır (harita açıkken sahne kısayolları, kendi dinleyicilerindeki SMAP.open denetimiyle devre dışıdır) */
  window.addEventListener('keydown',function(e){if(SMAP.open&&e.key==='Escape'&&!SMAP.trip){smapClose();e.preventDefault();}},true);
  window.addEventListener('resize',function(){if(SMAP.open)smapDraw();});
  $('sysMap').addEventListener('click',smapOpen);
  /* arama kutusundan da açılır */
  ACTIONS.push(['✨','Yıldız haritası','Güneş\'in komşularını gerçek yön ve uzaklıklarıyla gör; başka bir sisteme yolculuk et','yildiz haritasi komsu yildizlar yolculuk galaksi proxima sirius vega',smapOpen]);
})();
