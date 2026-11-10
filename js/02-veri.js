/* Celestia · Veri: ölçek sabitleri ve gök cisimlerinin tanımları.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- veri ---------- */
var AU_LM=8.317;
/* ---- GERÇEK ÖLÇEK ----
   Mesafe menüsündeki "Gerçek ölçek" seçeneğinde boyutlar ve uzaklıklar gerçek oranlarında: 1 sahne birimi = 3.982 km (Dünya yarıçapı 1,6 birim),
   1 AU = 37.570 birim. Diğer seçeneklerde boyutlar kökle, uzaklıklar üslü bir eğriyle sıkıştırılır ki her şey ekrana sığsın. */
var REAL=(function(){try{return localStorage.getItem('se_ds')==='R';}catch(e){return false;}})();
var KM_U=6371/1.6,AU_U=149597870.7/KM_U;
function vr(R){return REAL?R/KM_U:1.6*Math.pow(R/6371,.5);}
var LOWQ=(innerWidth<760)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
var LENS={on:true,rt:null,quad:null,qs:null,qc:null,fail:false,hasDep:false,w:0,h:0,cur:null};
try{if(localStorage.getItem('gsg-lens')==='0')LENS.on=false;}catch(e){}
var PS=1;
var DS=REAL?940:(function(){try{var v=+localStorage.getItem('se_ds');return v>0&&v<10?v:2.5;}catch(e){return 2.5;}})();
PS=REAL?1:(DS>=6?.4:1);
function orbitR(a){return REAL?a*AU_U:(40*Math.pow(a,.62)+10)*DS;}
function invOrbit(r){return REAL?Math.max(r,1e-6)/AU_U:Math.pow(Math.max(r/DS-10,.5)/40,1/.62);}
var SUN_TYPES=[
  {name:'Sarı cüce',lo:0xff6a08,hi:0xffe58a,light:0xfff0dc,I:1.85,glow:0xffb040,gm:1,L:1,sc:1,uv:1,life:1,uvName:'Normal',stage:'Ana kol'},
  {name:'Kırmızı cüce',lo:0x7a1200,hi:0xff6a2a,light:0xff7a50,I:1.7,glow:0xff3a10,gm:1.1,L:.004,sc:.5,uv:3,life:1,uvName:'Güçlü parlamalar',stage:'Ana kol (uzun ömürlü)'},
  {name:'Mavi dev',lo:0x2a6bff,hi:0xd8eaff,light:0xbcd6ff,I:2.2,glow:0x5fa0ff,gm:.95,L:600,sc:2.4,uv:10,life:.05,uvName:'Çok yüksek UV',stage:'Ana kol (kısa ömürlü)'},
  {name:'Kırmızı dev',lo:0x8a1400,hi:0xff8a30,light:0xff8a50,I:2,glow:0xff5a20,gm:1.15,L:2000,sc:6,uv:.3,life:.1,uvName:'Düşük UV',stage:'Kırmızı dev evresi'},
  {name:'Beyaz cüce',lo:0xaabbdd,hi:0xffffff,light:0xe0e8ff,I:1.6,glow:0xcfe0ff,gm:1.3,L:.02,sc:.16,uv:.6,life:.02,uvName:'Düşük',stage:'Beyaz cüce (ölü yıldız)'},
  {name:'Nötron yıldızı',lo:0x8fb0ff,hi:0xffffff,light:0xcfe0ff,I:.9,glow:0x9fc0ff,gm:.55,L:.0005,sc:.07,uv:50,life:.01,uvName:'Ölümcül X-ışını',stage:'Süpernova sonrası pulsar'},
  {name:'Kara delik',lo:0x000000,hi:0x000000,light:0xffb070,I:.22,glow:0x000000,gm:0,L:.0003,sc:.12,uv:5,life:0,uvName:'Diskten X-ışını',stage:'Kara delik'},
  {name:'Yok (patladı)',lo:0x000000,hi:0x000000,light:0x9fb0ff,I:.03,glow:0x000000,gm:0,L:.00001,sc:.05,uv:0,life:0,uvName:'Yok',stage:'Tip Ia süpernova kalıntısı'}
];
var DEFS=[
 {id:'sun',name:'Güneş',kind:'Yıldız',vr:9,rotH:25*24,tilt:7,dot:['#ffd36b','#ff8a1c'],
  desc:'Sistemin kütlesinin yüzde 99,8\'ini taşıyan sarı cüce. Çekirdeğinde her saniye yaklaşık 4 milyon ton madde enerjiye dönüşür.',
  stats:[['Çap','1.392.700 km'],['Kütle','333.000 Dünya'],['Dönüş','~25 gün (ekvator)'],['Yerçekimi','274 m/s²'],['Yüzey','5.500 °C'],['Çekirdek','15 milyon °C']]},
 {id:'mercury',name:'Merkür',kind:'Gezegen',a:.387,P:87.97,L0:252.25,vr:vr(2439.7),tex:'mercury',tw:512,rotH:1407.6,tilt:.03,crat:1.4,cratD:1.6,dot:['#b9b2a8','#6f6a63'],
  desc:'Güneş\'e en yakın ve en küçük gezegen. Atmosferi olmadığı için gündüz ile gece arasındaki sıcaklık farkı 600 dereceyi aşar.',
  stats:[['Çap','4.879 km'],['Güneş\'e uzaklık','57,9 milyon km'],['Yıl','88 gün'],['Gün (dönüş)','58,6 Dünya günü'],['Yerçekimi','3,7 m/s²'],['Sıcaklık','−180 / 430 °C'],['Uydu','0']]},
 {id:'venus',name:'Venüs',kind:'Gezegen',a:.723,P:224.7,L0:181.98,vr:vr(6051.8),tex:'venus',tw:512,rotH:5832.5,tilt:177.4,atmo:[0xffd98a,1.1],dot:['#f0d9a0','#b88a45'],
  desc:'Yoğun karbondioksit atmosferi sera etkisini uç noktaya taşır; yüzey, Merkür\'den bile sıcaktır. Ters yönde ve çok yavaş döner.',
  stats:[['Çap','12.104 km'],['Güneş\'e uzaklık','108,2 milyon km'],['Yıl','224,7 gün'],['Gün (dönüş)','243 Dünya günü, ters'],['Yerçekimi','8,87 m/s²'],['Sıcaklık','464 °C'],['Uydu','0']]},
 {id:'earth',name:'Dünya',kind:'Gezegen',a:1,P:365.25,L0:100.46,vr:vr(6371),tex:'earth',tw:512,rotH:23.934,tilt:23.44,clouds:true,earthShader:true,atmo:[0x5aa8ff,1.12],dot:['#6fb2ff','#1c5aa0'],
  desc:'Yüzeyinde sıvı su ve yaşam bilinen tek gezegen. Eksen eğikliği 23,4° olduğu için mevsimler oluşur. Gece tarafında şehir ışıkları görünür.',
  stats:[['Çap','12.742 km'],['Güneş\'e uzaklık','149,6 milyon km (1 AU)'],['Yıl','365,25 gün'],['Gün','23 sa 56 dk'],['Yerçekimi','9,81 m/s²'],['Sıcaklık','ortalama 15 °C'],['Uydu','1']]},
 {id:'moon',name:'Ay',kind:'Uydu · Dünya',parent:'earth',orbit:4.4,P:27.32,incl:5.14,vr:.44,tex:'moon',tw:256,crat:1.2,cratD:1.5,dot:['#d6d3cc','#8a867e'],
  desc:'Dünya\'nın tek doğal uydusu. Hep aynı yüzünü bize gösterir; kütle çekimi okyanus gelgitlerini yönetir. Bu modelde Dünya ve Ay büyütüldüğü için gölgeler daha sık düşer; tutulma sırasında üstte açılan Dünya\'dan Güneş penceresi ise gerçek açılarla hesaplanır.',
  stats:[['Çap','3.474 km'],['Dünya\'ya uzaklık','384.400 km'],['Yörünge','27,3 gün'],['Yerçekimi','1,62 m/s²'],['Sıcaklık','−173 / 127 °C']]},
 {id:'mars',name:'Mars',kind:'Gezegen',a:1.524,P:687,L0:355.45,vr:vr(3389.5),tex:'mars',tw:512,rotH:24.623,tilt:25.2,crat:.5,cratD:.55,atmo:[0xff9a6a,1.07],dot:['#e0875a','#8f3d22'],
  desc:'Demir oksit nedeniyle kızıl görünür. Güneş sisteminin en yüksek yanardağı Olympus Mons burada, yüksekliği yaklaşık 22 km.',
  stats:[['Çap','6.779 km'],['Güneş\'e uzaklık','227,9 milyon km'],['Yıl','687 gün'],['Gün','24 sa 37 dk'],['Yerçekimi','3,71 m/s²'],['Sıcaklık','ortalama −65 °C'],['Uydu','2']]},
 {id:'jupiter',name:'Jüpiter',kind:'Gaz devi',a:5.203,P:4332.6,L0:34.4,vr:vr(69911),tex:'jupiter',tw:512,rotH:9.925,tilt:3.1,dot:['#e8cfa4','#a8683c'],
  desc:'Diğer tüm gezegenlerin toplamından 2,5 kat kütlelidir. Büyük Kırmızı Leke, yüzyıllardır süren dev bir fırtınadır.',
  stats:[['Çap','139.820 km'],['Güneş\'e uzaklık','778,5 milyon km'],['Yıl','11,86 Dünya yılı'],['Gün','9 sa 56 dk'],['Yerçekimi','24,8 m/s²'],['Bulut tepesi','−110 °C'],['Uydu','90\'dan fazla']]},
 {id:'io',name:'Io',kind:'Uydu · Jüpiter',parent:'jupiter',orbit:8.2,P:1.769,vr:.5,tex:'io',tw:256,dot:['#f0e48a','#c2552a'],
  desc:'Güneş sisteminin en yanardağlı cismi. Jüpiter\'in gelgit kuvveti içini sürekli yoğurur.',
  stats:[['Çap','3.643 km'],['Jüpiter\'e uzaklık','421.700 km'],['Yörünge','1,77 gün'],['Yerçekimi','1,80 m/s²']]},
 {id:'europa',name:'Europa',kind:'Uydu · Jüpiter',parent:'jupiter',orbit:10.6,P:3.551,vr:.42,tex:'europa',tw:256,dot:['#efe9dc','#a38b70'],
  desc:'Buz kabuğunun altında küresel bir okyanus barındırır; yaşam aramak için en umut verici adaylardan biri.',
  stats:[['Çap','3.122 km'],['Jüpiter\'e uzaklık','671.000 km'],['Yörünge','3,55 gün'],['Yerçekimi','1,31 m/s²']]},
 {id:'ganymede',name:'Ganymede',kind:'Uydu · Jüpiter',parent:'jupiter',orbit:13.6,P:7.155,vr:.72,tex:'ganymede',tw:256,crat:.8,dot:['#b9b0a2','#5e5750'],
  desc:'Güneş sisteminin en büyük uydusu; Merkür\'den büyüktür ve kendi manyetik alanı vardır.',
  stats:[['Çap','5.268 km'],['Jüpiter\'e uzaklık','1.070.000 km'],['Yörünge','7,15 gün'],['Yerçekimi','1,43 m/s²']]},
 {id:'callisto',name:'Callisto',kind:'Uydu · Jüpiter',parent:'jupiter',orbit:17.6,P:16.69,vr:.66,tex:'callisto',tw:256,crat:1.3,cratD:1.7,dot:['#8f8174','#403730'],
  desc:'Güneş sisteminde en yoğun kraterli yüzeylerden birine sahip. Yüzeyi milyarlarca yıldır neredeyse değişmedi.',
  stats:[['Çap','4.821 km'],['Jüpiter\'e uzaklık','1.883.000 km'],['Yörünge','16,7 gün'],['Yerçekimi','1,24 m/s²']]},
 {id:'saturn',name:'Satürn',kind:'Gaz devi',a:9.537,P:10759,L0:49.94,vr:vr(58232),tex:'saturn',tw:512,rotH:10.55,tilt:26.7,ring:true,dot:['#f1e3bd','#b49a62'],
  desc:'Halkaları çoğunlukla buz parçacıklarından oluşur ve yüzlerce bin km genişliğe karşın birkaç on metre kalındır. Yoğunluğu sudan düşüktür.',
  stats:[['Çap','116.460 km'],['Güneş\'e uzaklık','1,43 milyar km'],['Yıl','29,4 Dünya yılı'],['Gün','10 sa 33 dk'],['Yerçekimi','10,4 m/s²'],['Bulut tepesi','−140 °C'],['Uydu','270\'ten fazla']]},
 {id:'titan',name:'Titan',kind:'Uydu · Satürn',parent:'saturn',orbit:12.2,P:15.945,vr:.72,tex:'titan',tw:256,atmo:[0xffb347,1.12],dot:['#e9b657','#a8701c'],
  desc:'Kalın azot atmosferi olan tek uydu. Yüzeyinde sıvı metan ve etan gölleri bulunur.',
  stats:[['Çap','5.150 km'],['Satürn\'e uzaklık','1.222.000 km'],['Yörünge','15,9 gün'],['Yerçekimi','1,35 m/s²'],['Sıcaklık','−179 °C']]},
 {id:'uranus',name:'Uranüs',kind:'Buz devi',a:19.19,P:30688,L0:313.23,vr:vr(25362),tex:'uranus',tw:512,rotH:17.24,tilt:97.8,atmo:[0x9ff0f4,1.08],dot:['#bff0f2','#6fb9c0'],
  desc:'Yan yatmış hâlde, ekseni yörünge düzlemine neredeyse paralel dönen gezegen. Metan, rengini verir.',
  stats:[['Çap','50.724 km'],['Güneş\'e uzaklık','2,87 milyar km'],['Yıl','84 Dünya yılı'],['Gün','17 sa 14 dk, ters'],['Yerçekimi','8,69 m/s²'],['Sıcaklık','−195 °C'],['Uydu','28']]},
 {id:'neptune',name:'Neptün',kind:'Buz devi',a:30.07,P:60182,L0:304.88,vr:vr(24622),tex:'neptune',tw:512,rotH:16.11,tilt:28.3,atmo:[0x4f86ff,1.08],dot:['#6a98f2','#2849c0'],
  desc:'En uzak gezegen. Güneş sistemindeki en hızlı rüzgârlar burada saatte 2.000 km\'ye yaklaşır.',
  stats:[['Çap','49.244 km'],['Güneş\'e uzaklık','4,50 milyar km'],['Yıl','164,8 Dünya yılı'],['Gün','16 sa 6 dk'],['Yerçekimi','11,15 m/s²'],['Sıcaklık','−200 °C'],['Uydu','16']]},
 {id:'pluto',name:'Plüton',kind:'Cüce gezegen',a:39.48,P:90560,L0:238.9,vr:vr(1188)*1.1,tex:'pluto',tw:256,rotH:153.3,tilt:122.5,atmo:[0x9fb4d6,1.06],dot:['#d8c3a8','#7d6451'],
  desc:'2006\'dan beri cüce gezegen sayılıyor. Yörüngesi çok eğik ve eliptiktir; yüzeyinde dev bir azot buzu ovası olan kalp biçimli Tombaugh Bölgesi vardır.',
  stats:[['Çap','2.377 km'],['Güneş\'e uzaklık','5,9 milyar km'],['Yıl','248 Dünya yılı'],['Gün','6,4 Dünya günü, ters'],['Yerçekimi','0,62 m/s²'],['Sıcaklık','−230 °C'],['Uydu','5']]},
 {id:'halley',name:'Halley',kind:'Kuyruklu yıldız',comet:true,cm:{q:.586,Q:35.1,ry:.9,rx:2.83,tp:[1986,1,9],size:1},P:27510,vr:.45,tex:'smallMoon',tw:256,rotH:52,tilt:0,dot:['#cfe8ff','#6a8aa8'],
  desc:'Yaklaşık 75 yılda bir Güneş\'e yaklaşan kuyruklu yıldız. Güneş\'e yaklaştıkça buzları buharlaşır ve Güneş\'in tersi yönünde iki kuyruk oluşur: mavi iyon kuyruğu ve sarımsı toz kuyruğu. Yörüngesi bu modelde ölçeklendirilmiştir.',
  stats:[['Çekirdek','~11 km'],['Yörünge','75,3 yıl'],['En yakın','0,59 AU'],['En uzak','35 AU'],['Yön','Gezegenlerin tersine'],['Son geçiş','1986']]},
 {id:'encke',name:'Encke',kind:'Kuyruklu yıldız',comet:true,minor:true,cm:{q:.336,Q:4.09,ry:2.3,rx:.206,tp:[2023,9,22],size:.45},P:1204,vr:.18,tex:'smallMoon',tw:128,rotH:11,tilt:0,dot:['#d8ecff','#6a8aa8'],
  desc:'Bilinen en kısa dönemli kuyruklu yıldız: 3,3 yılda bir Güneş\'e yaklaşır. Kuyruğu sönüktür. Kasım ayındaki Toros meteor yağmurunun kaynağıdır.',
  stats:[['Çekirdek','~4,8 km'],['Yörünge','3,3 yıl'],['En yakın','0,34 AU'],['En uzak','4,1 AU']]},
 {id:'cg67p',name:'67P/Çuryumov–Gerasimenko',kind:'Kuyruklu yıldız',comet:true,minor:true,cm:{q:1.21,Q:5.68,ry:4.1,rx:.12,tp:[2021,10,2],size:.4},P:2355,vr:.18,tex:'smallMoon',tw:128,rotH:12.4,tilt:0,dot:['#d0d0d0','#555'],
  desc:'Avrupa Uzay Ajansı\'nın Rosetta aracının 2014–2016 arasında yörüngesinde dolaştığı ve Philae iniş aracını indirdiği kuyruklu yıldız. Lastik ördek biçimlidir.',
  stats:[['Çekirdek','4,1 × 3,3 km'],['Yörünge','6,4 yıl'],['En yakın','1,21 AU'],['En uzak','5,7 AU']]},
 {id:'swifttuttle',name:'Swift–Tuttle',kind:'Kuyruklu yıldız',comet:true,minor:true,cm:{q:.96,Q:51.2,ry:5.4,rx:1.97,tp:[1992,11,12],size:.8},P:48600,vr:.3,tex:'smallMoon',tw:128,rotH:20,tilt:0,dot:['#e6f2ff','#7a8aa0'],
  desc:'Ağustos\'taki Perseid meteor yağmurunun kaynağı. Çekirdeği 26 km ile Dünya\'nın yörüngesini kesen en büyük cisimlerden biri. Bir sonraki geçişi 2126\'da.',
  stats:[['Çekirdek','~26 km'],['Yörünge','133 yıl'],['En yakın','0,96 AU'],['Sonraki geçiş','2126']]},
 {id:'apophis',name:'Apophis',kind:'Asteroit · Dünya\'ya yakın',comet:true,asteroid:true,minor:true,cm:{q:.746,Q:1.099,ry:0,rx:0,size:0,apophis:true},P:323.6,vr:.1,tex:'smallMoon',tw:128,rotH:30.6,tilt:0,dot:['#b8aa98','#5e5548'],
  desc:'340 metrelik asteroit. 13 Nisan 2029\'da Dünya\'nın yaklaşık 32.000 km yakınından, yani bazı uydulardan daha yakından geçecek ve çıplak gözle görülebilecek. Çarpma riski yok.',
  stats:[['Çap','~340 m'],['Yörünge','324 gün'],['Yakın geçiş','13 Nisan 2029'],['Uzaklık','~32.000 km']]},
 {id:'bennu',name:'Bennu',kind:'Asteroit · Dünya\'ya yakın',comet:true,asteroid:true,minor:true,cm:{q:.897,Q:1.356,ry:1.7,rx:.105,tp:[2023,8,25],size:0},P:436.6,vr:.1,tex:'smallMoon',tw:128,rotH:4.3,tilt:0,dot:['#8a8478','#3a362f'],
  desc:'NASA\'nın OSIRIS-REx aracının 2020\'de örnek alıp 2023\'te Dünya\'ya getirdiği asteroit. 2182 yılında Dünya\'ya çarpma olasılığı yaklaşık 2700\'de 1.',
  stats:[['Çap','~490 m'],['Yörünge','1,2 yıl'],['Örnek','2023\'te Dünya\'ya getirildi']]}
];
/* gerçek ölçekte elle verilmiş yarıçaplar gerçek değerlerine çekilir (km) */
/* kuyruklu yıldız çekirdekleri ve asteroitler her ölçekte görünsün diye büyütülmüş çizilir (Halley gerçekte ~11 km).
   Bilgi panelinde kaç kat büyütüldüğü yazar: çizilen yarıçap Dünya'nın çizimine (1,6 birim = 6.371 km) oranlanır; gerçek ölçekte bu doğrudan km oranıdır */
function katTxt(k){return 'Görünsün diye ~'+(k>=1000?Math.round(k/1000).toLocaleString('tr-TR')+' bin':Math.round(k))+' kat büyütüldü';}
(function(){var SMALLKM={halley:5.5,encke:2.4,cg67p:1.9,swifttuttle:13,apophis:.17,bennu:.245};
  DEFS.forEach(function(d){var km=SMALLKM[d.id];if(km&&d.stats)d.stats.push(['Ekranda',katTxt(d.vr/1.6*6371/km)]);});})();
if(REAL){var RKM={sun:696000,moon:1737.4,io:1821.6,europa:1560.8,ganymede:2634.1,callisto:2410.3,titan:2574.7,pluto:1188.3};DEFS.forEach(function(d){if(RKM[d.id])d.vr=vr(RKM[d.id]);});}
var SUNVR=REAL?vr(696000):9;
DEFS.forEach(function(d){ if(d.a) d.r=orbitR(d.a); });

var SPEEDS=[{d:1/86400,t:'Gerçek zaman (1 sn/sn)'},{d:1/1440,t:'1 dakika/sn'},{d:1/24,t:'1 saat/sn'},{d:1,t:'1 gün/sn'},{d:7,t:'1 hafta/sn'},{d:30.44,t:'1 ay/sn'},{d:365.25,t:'1 yıl/sn'},{d:3652.5,t:'10 yıl/sn'},{d:36525,t:'100 yıl/sn'},{d:365250,t:'1000 yıl/sn'}];
var J2000=Date.UTC(2000,0,1,12);
