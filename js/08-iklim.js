/* Celestia · İklim ve yaşanabilirlik modeli.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- iklim ve yaşanabilirlik ---------- */
var starAge=4.57;
function starL(){if(SYS)return SYS.L;var L=sunType===0?1/(1+.4*(1-starAge/4.57)):SUN_TYPES[sunType].L;return L*Math.pow(sunBody.mod.size,2);}
function starTarget(){
  if(SYS)return SYS.sc;
  if(sunType!==0)return typeSc(sunBody,sunType);
  return starAge<=4.57?.87+.13*starAge/4.57:1+.6*(starAge-4.57)/5.63;
}
function ageOut(){$('oAge').textContent=starAge.toFixed(1).replace('.',',')+' Mr';}
$('sAge').addEventListener('input',function(){
  starAge=+this.value;var t=sunType;
  if(t===0||t===3||t===4){var nt=starAge<10.2?0:(starAge<12.2?3:4);if(nt!==t)setStar(nt,true);}
  ageOut();
});
var HAB={
  mercury:{A:.09,atm:'none',water:0,mag:.1,g:.38,surf:1},
  venus:{A:.77,atm:'co2',water:0,mag:0,g:.9,surf:0},
  earth:{A:.3,atm:'earth',water:1,mag:1,g:1,surf:1,clim:1},
  moon:{A:.12,atm:'none',water:0,mag:0,g:.17,surf:1},
  mars:{A:.25,atm:'thin',water:.05,mag:.05,g:.38,surf:1},
  jupiter:{A:.5,atm:'h2',water:0,mag:1,g:2.5,surf:0,gas:1},
  saturn:{A:.5,atm:'h2',water:0,mag:1,g:1.06,surf:0,gas:1},
  uranus:{A:.5,atm:'h2',water:0,mag:.6,g:.9,surf:0,gas:1},
  neptune:{A:.5,atm:'h2',water:0,mag:.6,g:1.1,surf:0,gas:1},
  pluto:{A:.5,atm:'thin',water:0,mag:0,g:.06,surf:1},
  io:{A:.63,atm:'none',water:0,mag:0,g:.18,surf:1},
  europa:{A:.67,atm:'none',water:.5,mag:0,g:.13,surf:1},
  ganymede:{A:.43,atm:'none',water:.4,mag:.6,g:.15,surf:1},
  callisto:{A:.17,atm:'none',water:.2,mag:0,g:.126,surf:1},
  titan:{A:.22,atm:'thick',water:.2,mag:0,g:.14,surf:1}
};
var HAB_CUSTOM={
  earth:{A:.3,atm:'earth',water:.7,mag:1,clim:1,surf:1},
  ocean:{A:.3,atm:'earth',water:1,mag:.9,clim:1,surf:1},
  rocky:{A:.15,atm:'thin',water:.05,mag:.4,surf:1},
  gas:{A:.5,atm:'h2',water:0,mag:1,gas:1,surf:0},
  ice:{A:.7,atm:'thin',water:.4,mag:.3,clim:1,surf:1},
  lava:{A:.1,atm:'co2',water:0,mag:.3,surf:1},
  desert:{A:.3,atm:'thin',water:.1,mag:.5,clim:1,surf:1}
};
/* levha tektoniği / iç etkinlik (0–1): karbonat-silikat döngüsünü (CO₂'yi dengeleyen termostat) ve uzun vadeli yaşanabilirliği besler.
   Dünya 1; Venüs ve Mars'ta tek parça kabuk (stagnant lid) nedeniyle düşük; Europa ve Io'da gelgit ısınması var; değerler kabaca bir sınıflandırmadır */
var TECT={mercury:0,venus:.15,earth:1,moon:0,mars:.15,pluto:.1,io:.8,europa:.4,ganymede:.2,callisto:0,titan:.2};
var TECT_CUSTOM={earth:1,ocean:.8,rocky:.5,gas:0,ice:.3,lava:.8,desert:.4};
function makeHab(def){
  if(def.star||def.comet||def.craft||def.id==='sun')return null;
  if(def.habType){var o=Object.assign({},HAB_CUSTOM[def.habType]);o.g=o.gas?.6+def.hsize*.2:clamp(Math.pow(def.hsize,.9),.05,5);o.tect=TECT_CUSTOM[def.habType]||0;o.co2=0;o.cs=0;return o;}
  if(HAB[def.id]){var h=Object.assign({},HAB[def.id]);h.tect=TECT[def.id]||0;h.co2=0;h.cs=0;return h;}
  return {A:.15,atm:'none',water:0,mag:0,g:.15,surf:1,tect:0,co2:0,cs:0};
}
/* Milankovitch (yalnızca Dünya, basitleştirilmiş): eğiklik ~41 bin yıl (22,1–24,5°), yörünge basıklığı ~100 bin yıl (0,005–0,058),
   günberi enlemi ~21 bin yılda bir tur (presesyon). Etki, 65°K yaz ışınımındaki değişim üzerinden hesaplanır ve buzul örtülerinin
   yavaş tepkisi nedeniyle gecikmeli uygulanır. Gerçek Laskar çözümü değil; tek sinüslü, bugüne (J2000) göre sıfırlanmış bir model. */
var MIL_W0=283*D2R;
function milOrbit(t){
  var eps=23.3+1.2*Math.cos(TAU*(t+9500)/41000);
  var ecc=.0307+.0273*Math.cos(TAU*t/100000+2.1);
  var w=MIL_W0+TAU*t/21000;
  return {eps:eps,ecc:ecc,w:w};
}
function milTarget(t){
  var a=milOrbit(t),o=milOrbit(0);
  var dQ=8*(a.eps-o.eps)+420*2*(a.ecc*Math.sin(a.w)-o.ecc*Math.sin(o.w));
  return {dQ:dQ,de:a.eps-o.eps};
}
/* ısı dengesi: 1 W/m² ≈ 0,05 K (buz-albedo geri beslemesi ayrıca çalışır) */
function milState(b){
  var h=b.hab;if(!h||b.def.id!=='earth'||h.mil===false)return {dT:0,dQ:0,de:0};
  var t=simDays/365.25,m=milTarget(t),tgt=.05*m.dQ;
  var last=h.milD;
  if(h.milT==null||last==null)h.milT=tgt;
  else{var dy=Math.abs(simDays-last)/365.25;h.milT+=(tgt-h.milT)*(1-Math.exp(-dy/6000));}
  h.milD=simDays;
  return {dT:h.milT,dQ:m.dQ,de:m.de};
}
/* mevsim şiddeti: Güneş'in gökyüzündeki en büyük sapması δ = asin(sin ε · sin λ) olduğundan genlik sin(eğiklik) ile orantılıdır;
   Dünya'nın 23,44° değeri 1 sayılır. Gelgit kilidinde mevsim yoktur. */
var SIN_E0=Math.sin(23.44*D2R);
function seasonK(b){
  if(!b||!b.mod||b.mod.lock)return 0;
  var t=b.mod.tilt+(b.def.id==='earth'&&b.hab&&b.hab.mil!==false?milTarget(simDays/365.25).de:0);
  return clamp(Math.abs(Math.sin(t*D2R))/SIN_E0,0,2.4);
}
function fluxAt(p){
  var S=0;
  BODIES.forEach(function(s){
    if(!s.glow1||isGone(s))return;
    var d=Math.max(invOrbit(p.distanceTo(s.pos)),.005);
    var L=s.def.id==='sun'?starL():SUN_TYPES[s.starType].L*Math.pow(s.def.vr/SUNVR*s.mod.size,2);
    S+=L/(d*d);
  });
  return S;
}
var GH={none:0,thin:6,earth:33,thick:20,co2:510,h2:0};
/* CO₂ ve termostat değişikliklerinin atmosfer türüne göre ne kadar yansıdığı: Venüs gibi doymuş CO₂ atmosferlerinde küçük, atmosfer yoksa sıfır */
var GHD={none:0,thin:.3,earth:1,thick:1,co2:.15,h2:0};
function computeClimate(b){
  var h=b.hab;if(!h)return;
  var host=b.parent||b,S=fluxAt(host.pos),A=h.A;
  var Teq=function(a){return 255*Math.pow(S,.25)*Math.pow((1-a)/.7,.25);};
  var dn=GHD[h.atm]||0,prev=b.cl;
  /* karbonat-silikat termostatı (Walker geri beslemesi): sıcak ve yağmurlu gezegende kayaç aşınması CO₂'yi çeker, soğuk ve donmuş gezegende
     volkanlar CO₂'yi biriktirir. Gerçekte 100 bin–1 milyon yıl sürer; izlenebilsin diye burada ~27 bin yıla sıkıştırılmıştır (dsd/1e7 gün) ve levha tektoniğiyle orantılı işler.
     Sıcaklık 286–292 K ölü bandındayken karışmaz, bu yüzden bugünkü Dünya değişmez. */
  if(h.clim&&dn>.5&&h.water>.2&&(h.tect||0)>0&&prev&&prev.TsS!=null&&!isNaN(prev.TsS)&&prev.TsS>200&&prev.TsS<340){
    var dsd=simDays-prev.sd;
    if(dsd>0){var er=289-prev.TsS;er=er>3?er-3:(er<-3?er+3:0);h.cs=clamp((h.cs||0)+er*h.tect*Math.min(dsd/1e7,.25),-20,45);}
  }
  var mil=milState(b);
  /* sera: CO₂ her ikiye katlanmada ~3 K (logaritmik), termostat ve Milankovitch aynı kanaldan eklenir; atmosfer yoksa etkisi yok */
  var gh=(GH[h.atm]||0)+dn*(3*(h.co2||0)+(h.cs||0)+mil.dT),T0=Teq(A),Ts=T0+gh;
  if(h.clim){
    if(Ts<268){A=A+(.75-A)*ss(268,238,Ts)*(.4+.6*h.water);T0=Teq(A);Ts=T0+gh;}
    if(h.atm==='earth'&&h.water>.2)Ts+=ss(262,305,T0)*450*h.water;
  }
  var hb=b.parent||b;if(hb.impT0!=null){var ag=simDays-hb.impT0;if(ag>=0)Ts+=1900*(hb.impK||1)*Math.exp(-ag/(hb.hab&&hb.hab.gas?60:240));}
  var now=performance.now(),c0=b.cl;
  if(c0&&c0.TsS!=null&&!isNaN(c0.TsS)){
    var tau=h.gas?400:(h.atm==='none'?2:(h.atm==='thin'?8:(h.atm==='earth'?30:90)));
    var eff=Math.max(Math.abs(simDays-c0.sd),(now-c0.rt)/1000*12);
    Ts=c0.TsS+(Ts-c0.TsS)*(1-Math.exp(-eff/tau));
  }
  if(h.base==null)h.base=Ts;
  var ice=h.clim?ss(272,245,Ts):((h.surf&&(h.water>0||h.atm!=='none'))?ss(h.base-15,h.base-70,Ts):0);
  var scorch=h.surf?ss(380,800,Ts):0,glow=ss(750,1700,Ts),K=S<1?Math.max(.42,Math.pow(S,.15)):Math.min(2.4,Math.pow(S,.28));
  h.melt=Math.max(h.melt||0,ss(.35,.6,glow));
  /* mevsim farkı (yaz-kış sıcaklık yarı genliği): eğiklikle artar; su ve kalın atmosfer ısıyı depolayıp dengeler, ince atmosferde sapma büyür */
  var atmF=({none:3,thin:1.7,earth:1,thick:.6,co2:.3,h2:.2})[h.atm];if(atmF==null)atmF=1;
  var sw=clamp(13*seasonK(b)*atmF*(1.25-.55*h.water),0,60);
  b.cl={S:S,Ts:Ts,TsS:Ts,sd:simDays,rt:now,ice:ice,scorch:scorch,glow:glow,K:K,sw:sw,mil:mil.dT,dQ:mil.dQ};
  var st=glow>.5?'molten':((h.surf&&Ts>873)?'crust':(h.water>.05&&Ts>373&&h.surf)?'boil':(ice>.85&&h.clim?'frozen':(ice>.85?'frost':'ok')));
  if(h.st&&st!==h.st&&!isEngulfed(b)&&(b===focus||b.def.id==='earth')){
    var nm=b.def.name;
    note(st==='molten'?nm+': yüzey eriyor, lav denizine dönüşüyor':st==='crust'?nm+': lav soğuyup ince bir kabuk bağlıyor, çatlaklardan hâlâ parlıyor':st==='boil'?nm+': okyanuslar kaynıyor, su buhara dönüşüyor':st==='frozen'?nm+': yüzey tamamen dondu (kartopu gezegen)':st==='frost'?nm+': yüzey kırağı ve buzla kaplandı':nm+': sıcaklık yeniden ılımana döndü');
  }
  h.st=st;
  var U=b.shU;if(U){U.det.value=b.realTex?.5:(h.gas?.3:1);if(h.w0==null)h.w0=h.water;var wv=b.def.id==='earth'?h.water:(h.surf?Math.max(0,h.water-h.w0):0);U.clim.value.set(ice,scorch,glow,wv);U.lightK.value=K;U.melt.value=h.melt;
    if(b.mod.lock&&!b.parent){var lt=lockTemps(b);U.lockP.value.set(1,lt?ss(320,650,lt.d):0,lt?ss(275,215,lt.n):0);}else U.lockP.value.x=0;}
  if(b.ringShU)b.ringShU.lightK.value=K;
  if(b.clouds){
    var cm=b.clouds.material,thick=h.atm==='co2'||scorch>.4;
    var opv=h.atm==='none'?0:(h.atm==='thin'?.25:(thick?1:(ice>.5?.55:.9)));
    if(cm.uniforms&&cm.uniforms.op){var hot=ss(373,650,Ts);cm.uniforms.op.value=(h.atm==='co2'?1.6:opv/.9)*(1-hot);cm.uniforms.tint.value.setRGB(K,K*(thick?.86:1),K*(thick?.62:1));}
    else{cm.opacity=opv;cm.color.setRGB(K,K*(thick?.86:1),K*(thick?.62:1));}
  }
  if(b.atmoMesh)b.atmoMesh.material.uniforms.k.value=(b.atmoK||1)*Math.min(1.2,K)*(1-glow*.7);
}
var ATM_NAME={none:'Yok',thin:'İnce',earth:'Dünya benzeri',thick:'Yoğun',co2:'Yoğun CO₂',h2:'Hidrojen'};
function habFactors(b){
  var h=b.hab,c=b.cl,T=SUN_TYPES[sunType],f={};
  f.T=Math.exp(-Math.pow((c.Ts-288)/35,2));
  f.A=({none:.05,thin:.3,earth:1,thick:.15,co2:.02,h2:0})[h.atm];if(f.A==null)f.A=.05;
  f.W=.12+.88*h.water;
  f.G=Math.exp(-Math.pow(Math.log(Math.max(h.g,.01))/.6,2));
  f.M=.5+.5*h.mag;
  f.UV=Math.min(1,1/(1+.4*(T.uv-1)*(1-.6*h.mag)));
  f.L=Math.sqrt(T.life)*(sunType===0?ss(.3,1.5,starAge):1);
  /* mevsim uçları: yaz-kış farkı ±18 °C'ye kadar sorun değil, ötesinde yaşam için gittikçe zorlaşır (Dünya ≈ ±11 °C) */
  f.S=Math.exp(-Math.pow(Math.max(0,(c.sw||0)-18)/22,2));
  /* gün uzunluğu: 24 saat civarı en elverişli; çok kısa günlerde şiddetli rüzgârlar, çok uzun günlerde gündüz-gece ısı farkı büyür (8 kat sapmada ≈ %61) */
  f.P=Math.abs(b.def.rotH||24)/Math.max(Math.abs(b.mod.spin),.02);
  f.R=b.mod.lock?1:Math.exp(-.5*Math.pow(Math.log(f.P/24)/Math.log(8),2));
  /* levha tektoniği: karbonat-silikat döngüsü ve besin geri dönüşümü sayesinde uzun vadeli elverişlilik; katı yüzeyi olan cisimler için */
  f.Tc=h.surf?.75+.25*(h.tect||0):1;
  return f;
}
function isEngulfed(b){return !!(b.sysHide||b.engulfed||(b.parent&&b.parent.engulfed)||b.destroyed||(b.parent&&b.parent.destroyed));}
function habScore(b){
  if(!b.hab||!b.cl)return 0;if(isEngulfed(b))return 0;
  var f=habFactors(b),p=100*f.T*f.A*Math.pow(f.W,.7)*f.G*Math.pow(f.M,.6)*f.UV*f.L*f.S*f.R*f.Tc*.96;
  if(b.hab.gas)p=Math.min(p,.5);
  return p;
}
function q(v){return v>=.7?'good':(v>=.3?'warn':'bad');}
function renderHab(b){
  var box=$('hab');
  if(!b.hab||!b.cl){box.hidden=true;return;}
  box.hidden=false;
  var tn=$('tNow');if(tn)tn.textContent='şu an '+Math.round(b.cl.Ts-273.15)+' °C';
  var p=habScore(b),f=habFactors(b),h=b.hab,c=b.cl,T=SUN_TYPES[sunType],en=isEngulfed(b);
  var stage=sunType===0?(starAge<10.2?'Ana kol':'Evrimin sonu'):T.stage;
  $('habPct').textContent='%'+(p<1?p.toFixed(1).replace('.',','):Math.round(p));
  var bar=$('habBar');bar.style.width=clamp(p,0,100)+'%';bar.className=p>=60?'':(p>=20?'warn':'bad');
  $('habTxt').textContent=en?'Yıldız tarafından yutuldu':(h.gas?'Katı yüzey yok':(p>=75?'Yaşama çok elverişli':(p>=40?'Sınırda':(p>=10?'Çok zor':'Yaşanamaz'))));
  var rows=[
    ['Yüzey sıcaklığı',Math.round(c.Ts-273.15)+' °C',f.T],
    ['Yıldızdan aldığı ışık',(c.S>=10?Math.round(c.S):c.S.toFixed(c.S<.1?3:2)).toString().replace('.',',')+' × Dünya',f.T],
    ['Atmosfer',ATM_NAME[h.atm]||h.atm,f.A],
    ['Su',Math.round(h.water*100)+'%',f.W],
    ['Çekim',h.g.toFixed(2).replace('.',',')+' g',f.G],
    ['Manyetik kalkan',Math.round(h.mag*100)+'%',f.M],
    ['Yıldız ışınımı',T.uvName,f.UV],
    ['Yıldız evresi',stage,f.L]
  ];
  if(h.surf&&!h.gas){
    var fx=function(v){return (v>=10?Math.round(v):v.toFixed(v>=1?1:2)).toString().replace('.',',');};
    var sg=function(v){return (v>=0?'+':'−')+Math.abs(v).toFixed(1).replace('.',',')+' °C';};
    if(!b.mod.lock)rows.push(['Mevsimler','±'+Math.round(c.sw)+' °C · eğiklik '+Math.round(b.mod.tilt)+'°',f.S]);
    rows.push(['Levha tektoniği',Math.round((h.tect||0)*100)+'%',f.Tc]);
    if(!b.mod.lock)rows.push(['Gün uzunluğu',f.P<48?fx(f.P)+' saat':fx(f.P/24)+' gün',f.R]);
    if((GHD[h.atm]||0)>0){
      if(Math.abs(h.co2||0)>.02)rows.push(['CO₂ düzeyi','×'+fx(Math.pow(2,h.co2)),.8]);
      if(Math.abs(h.cs||0)>=.5)rows.push(['CO₂ termostatı',sg(h.cs),.8]);
    }
    if(b.def.id==='earth'&&h.mil!==false)rows.push(['Yörünge döngüleri',sg(c.mil||0),Math.abs(c.mil||0)<2?1:(Math.abs(c.mil||0)<3.5?.5:.2)]);
  }
  if(b.mod.lock&&!b.parent){var lt=lockTemps(b);if(lt){rows.push(['Gündüz tarafı',Math.round(lt.d-273.15)+' °C',Math.exp(-Math.pow((lt.d-288)/35,2))]);rows.push(['Gece tarafı',Math.round(lt.n-273.15)+' °C',Math.exp(-Math.pow((lt.n-288)/35,2))]);}}
  $('habRows').innerHTML=rows.map(function(r){return '<div class="hrow"><i class="q '+q(r[2])+'"></i><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>';}).join('');
}
function atmoVisual(b){
  var h=b.hab;if(!h)return;
  var k=({none:0,thin:.4,earth:1,thick:1.3,co2:1.5,h2:1})[h.atm];if(k==null)k=1;
  var col=({none:0x888888,thin:0xc98a6a,earth:0x5aa8ff,thick:0xffb347,co2:0xffd98a,h2:(b.def.atmo?b.def.atmo[0]:0x9fb4d6)})[h.atm];
  if(!b.atmoMesh&&k>0){b.atmoMesh=atmoMesh(b.def.vr,col,1.1);b.tilt.add(b.atmoMesh);}
  if(b.atmoMesh){b.atmoMesh.visible=k>0;b.atmoMesh.material.uniforms.c.value.setHex(col);b.atmoK=k;}
}
$('cAtm').addEventListener('change',function(){if(!focus.hab)return;focus.hab.atm=this.value;atmoVisual(focus);});
$('cWater').addEventListener('input',function(){if(!focus.hab)return;focus.hab.water=+this.value;$('oWater').textContent=Math.round(this.value*100)+'%';});
$('goSol').addEventListener('click',function(){gotoEclipse(false);});
$('goLun').addEventListener('click',function(){gotoEclipse(true);});
$('cReset').addEventListener('click',function(){var h=focus.hab;if(!h)return;h.melt=0;h.st=null;toast(focus.def.name+': yüzey sıfırlandı');});
$('cMag').addEventListener('input',function(){if(!focus.hab)return;focus.hab.mag=+this.value;$('oMag').textContent=Math.round(this.value*100)+'%';});
function co2Txt(v){var x=Math.pow(2,v);return (x>=10?Math.round(x):x.toFixed(x>=1?1:2)).toString().replace('.',',');}
$('cCo2').addEventListener('input',function(){if(!focus.hab)return;focus.hab.co2=+this.value;$('oCo2').textContent='×'+co2Txt(+this.value);});
$('cTect').addEventListener('input',function(){if(!focus.hab)return;focus.hab.tect=+this.value;$('oTect').textContent=Math.round(this.value*100)+'%';});
$('cMil').addEventListener('change',function(){if(!focus.hab)return;focus.hab.mil=this.checked;focus.hab.milT=null;});
/* atmosfer değişince CO₂ kaydırıcısının görünürlüğü (atmosferi olmayan cisimde anlamsız) */
$('cAtm').addEventListener('change',function(){if(focus.hab)$('co2Row').hidden=!(GHD[focus.hab.atm]>0);});
