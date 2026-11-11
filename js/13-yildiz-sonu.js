/* Celestia · Süpernova, nötron yıldızı, kara delik ve kütleçekimsel mercek.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ================= SÜPERNOVA VE KARA DELİK ================= */
var EXO={disk:null,beams:null,sn:null,ringS:null};
function diskMat(){return new THREE.ShaderMaterial({uniforms:{t:{value:0},b:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vP;varying float vD;void main(){vP=position.xy;vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 tg=normalize(vec3(-position.y,position.x,0.0));vec3 vel=normalize((modelViewMatrix*vec4(tg,0.0)).xyz);vD=dot(vel,normalize(-mv.xyz));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float t;uniform float b;varying vec2 vP;varying float vD;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
  'void main(){float r=length(vP);float a=atan(vP.y,vP.x);float rr=(r-1.0)/3.2;if(rr<0.0||rr>1.0)discard;float sw=a+t*(1.6/(r*r))*3.0;float st=n(vec2(sw*6.0,r*5.0))*.5+n(vec2(sw*14.0,r*12.0))*.3+n(vec2(sw*31.0,r*26.0))*.2;'+
  'float lanes=.86+.14*sin(r*17.0+st*7.0+sw*2.0);float k=pow(1.0-rr,2.4)*(.45+.8*st)*lanes*smoothstep(0.0,.035,rr)*smoothstep(1.0,.75,rr)*b;'+
  'float dop=clamp(1.0+vD*.85,.2,2.1);k*=dop*dop;'+
  'vec3 c=mix(vec3(.95,.25,.04),vec3(1.0,.8,.5),pow(1.0-rr,2.0));c=mix(c,vec3(.92,.96,1.0),pow(1.0-rr,7.0));c=mix(c,c*vec3(.8,.92,1.25),clamp(vD,0.0,1.0)*.6);c=mix(c,c*vec3(1.15,.8,.6),clamp(-vD,0.0,1.0)*.5);'+
  'gl_FragColor=vec4(c*k*1.7,1.0);}'});}
function haloMat(){return new THREE.ShaderMaterial({uniforms:{t:{value:0},b:{value:1},dk:{value:0},nP:{value:new THREE.Vector2(0,1)},dop:{value:new THREE.Vector2(1,0)},edge:{value:1},rD:{value:4}},transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float t;uniform float b;uniform float dk;uniform vec2 nP;uniform vec2 dop;uniform float edge;uniform float rD;varying vec2 vP;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
  'void main(){float r=length(vP);vec2 d=vP/r;float a=atan(d.y,d.x);'+
  'float ph=exp(-pow((r-1.035)/.018,2.0))*1.6+exp(-pow((r-1.05)/.09,2.0))*.35;'+
  'float up=dot(d,nP);float arc=pow(abs(up),1.3)*(up>0.0?1.0:.5)*edge;'+
  'float band=smoothstep(1.06,1.3,r)*(1.0-smoothstep(rD*.55,rD*1.05,r));'+
  'float st=n(vec2(a*5.0+t*.9,r*3.0))*.6+n(vec2(a*13.0-t*.5,r*8.0))*.4;'+
  'float ln=dk*band*arc*(.45+.7*st)*pow(clamp(1.0-(r-1.0)/rD,0.0,1.0),1.2)*2.6;'+
  'float dk=clamp(1.0+.75*dot(d,dop),.25,1.9);'+
  'vec3 c=mix(vec3(1.0,.42,.1),vec3(1.0,.9,.75),clamp(ph*.6+ln*.3,0.0,1.0));'+
  'gl_FragColor=vec4(c*(ph+ln)*dk*b,1.0);}'});}
var NEBPX={value:600};
function nebMat(){return new THREE.ShaderMaterial({uniforms:{op:{value:0},px:NEBPX},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float aS;attribute vec4 aC;uniform float px;varying vec4 vC;void main(){vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.0);float sc=length(modelMatrix[0].xyz);gl_PointSize=clamp(aS*sc*px/max(-mv.z,.001),1.0,90.0);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float op;varying vec4 vC;void main(){vec2 d=gl_PointCoord-.5;float r2=dot(d,d)*4.0;if(r2>1.0)discard;float a=exp(-r2*3.0)*vC.a*op;gl_FragColor=vec4(vC.rgb*a,1.0);}'});}
function vh3(x,y,z,sd){var v=Math.sin(x*127.1+y*311.7+z*74.7+sd)*43758.5453;return v-Math.floor(v);}
function vn3(x,y,z,sd){var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
  function L(a,b,t){return a+(b-a)*t;}
  return L(L(L(vh3(ix,iy,iz,sd),vh3(ix+1,iy,iz,sd),fx),L(vh3(ix,iy+1,iz,sd),vh3(ix+1,iy+1,iz,sd),fx),fy),L(L(vh3(ix,iy,iz+1,sd),vh3(ix+1,iy,iz+1,sd),fx),L(vh3(ix,iy+1,iz+1,sd),vh3(ix+1,iy+1,iz+1,sd),fx),fy),fz);}
/* bulutsu: noktalardan değil, yumuşak ve filamentli bir gaz kabuğundan oluşur (sınırda parlayan, gürültüyle yırtılmış ince bir zar).
   kind: 'snr' süpernova kalıntısı, 'pn' gezegenimsi bulutsu, 'lrn' kırmızı nova. Birim yarıçap tür başına eski nokta bulutuyla aynı. */
var NEB_VS='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
/* hacimli bulut: kürenin içinden ışın yürütülür; her adımda yoğunluk okunur ve ışıma toplanır. Yoğunluk türe göre değişir:
   - gezegenimsi bulutsu (kind 1): içi boş, ince ve parlak kabuk. Kenardan bakınca ışın kabuğun içinden uzun yol aldığı için halka gibi
     parlar (gerçekteki "kenar parlaması"). İçte mavi-yeşil (oksijen), kabuğun dışında kırmızı (hidrojen, azot); kabuktan dışa uzanan iplikler;
     en dışta yıldızın önceki nabızlarından kalan soluk eşmerkezli halkalar. bip>0 ise bel daralır, iki loblu olur.
     ion: 0 → gaz yeni atıldı, soğuk ve kızıl; 1 → ortadaki beyaz cücenin morötesi ışığı gazı iyonlaştırdı, renkler açıldı.
   - süpernova kalıntısı (kind 0): düzensiz, ipliksi kabuk (Yengeç, Peçe bulutsuları gibi) ve içte pulsarın aydınlattığı mavimsi bölge.
   - kırmızı nova (kind 2): içi dolu, tozlu bulut (eski görünüm).
   Adım boyu kabuk kalınlığına yakın olduğu için başlangıç noktası piksel başına kaydırılır: bantlaşma yerine ince tanecik olur. */
/* her tür kendi programını derler (KIND): gölgelendirici yalnızca o türün yoğunluk fonksiyonunu çalıştırır */
var NEB_FS='uniform float op;uniform float sd;uniform float kind;uniform float R;uniform float ns;uniform float ion;uniform float bip;uniform vec3 ax;uniform vec3 uCam;uniform vec3 cA;uniform vec3 cB;uniform vec3 cC;varying vec3 vP;'
 +'float hs(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}'
 +'float nz(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}'
 +'float fb(vec3 p){float a=.5,s=0.0;for(int i=0;i<3;i++){s+=a*nz(p);p=p*2.1+1.7;a*=.5;}return s;}'
 +'float fb2(vec3 p){return (.5*nz(p)+.25*nz(p*2.1+1.7))*1.1667;}'
 +'float g2(float x){return exp(-x*x);}'
 /* gezegenimsi bulutsu. Pahalı gürültü yalnızca katkı olan bölgede hesaplanır: kabuğun yakınında doku, kabuğun dışında iplikler */
 +'vec3 pn(vec3 q,float rs){float r=length(q);if(r>1.12)return vec3(0.0);vec3 dq=q/max(r,1e-4);float mu=dq.y;'
 +'float r0=.5*(1.0-bip*(1.0-mu*mu))*(.93+.14*nz(dq*2.3+sd));float x=(r-r0)/.07;'
 +'float shell=0.0,fil=0.0,inner=0.0;'
 +'if(abs(x)<2.6)shell=g2(x)*(.4+1.25*fb(dq*5.0+sd));'
 +'if(r>r0&&r<r0+.55){float sp=nz(dq*13.0+sd*1.7);fil=exp(-(r-r0)/.13)*sp*sp*sp*sp*1.5;}'
 +'if(r<r0)inner=(1.0-smoothstep(0.0,r0,r))*(.03+.06*nz(q*4.0+sd));'
 +'float rings=0.0,halo=0.0;if(r>r0*1.15){rings=g2((r-r0*1.34)/.02)*.3+g2((r-r0*1.6)/.022)*.22+g2((r-r0*1.88)/.024)*.15;halo=g2((r-r0*1.5)/.32)*.03;}'
 +'vec3 teal=vec3(.18,.82,.72),red=vec3(1.0,.36,.24),blue=vec3(.3,.58,.95),pink=vec3(.95,.38,.45);'
 +'vec3 c=mix(teal,red,smoothstep(-.9,1.1,x))*shell+red*fil+blue*inner+pink*(rings+halo);'
 /* iyonlaşmadan önce: sönük, kızıl gaz */
 +'vec3 cold=vec3(1.0,.42,.2)*(shell*.5+fil*.3+rings*.6+halo);'
 +'return mix(cold,c,ion)*(1.0-smoothstep(.86,1.0,rs));}'
 /* süpernova kalıntısı: iplik gürültüsü yalnızca kabuk ve iç ağ bölgesinde hesaplanır */
 +'vec3 snr(vec3 q,float rs){float r=length(q);if(r>1.05)return vec3(0.0);vec3 dq=q/max(r,1e-4);'
 +'float r0=.6*(.8+.42*nz(dq*2.4+sd));float x=(r-r0)/.075;'
 +'float sw=0.0,rg=0.0;'
 +'if((abs(x)<2.6||abs(r-r0*.62)<.34)){vec3 wq=q*6.2+sd;float n=fb2(wq+1.6*nz(wq+3.1));rg=1.0-abs(2.0*n-1.0);rg=rg*rg;rg=rg*rg*rg;sw=g2(x)*(.025+3.4*rg)+g2((r-r0*.6)/.22)*rg*.8;}'
 +'float wind=r<r0*.6?(1.0-smoothstep(0.0,r0*.6,r))*(.04+.26*nz(q*5.0+sd+2.0))*.8:0.0;'
 +'vec3 f=vec3(0.0);if(sw>.002)f=mix(cB,vec3(.32,.8,.78),smoothstep(.5,.8,nz(q*2.3+sd+9.0)))*sw+cC*rg*g2(x)*.35;'
 +'return (f+vec3(.5,.68,1.0)*wind)*(1.0-smoothstep(.86,1.0,rs));}'
 /* kırmızı nova: içi dolu tozlu bulut */
 +'vec3 lrn(vec3 q){float r=length(q);vec3 dq=q/max(r,1e-4);float edge=.55+.6*nz(dq*1.4+sd);float fall=1.0-smoothstep(.15,1.0,r/edge);if(fall<.01)return vec3(0.0);'
 +'vec3 w=vec3(nz(q*1.6+sd+3.1),nz(q*1.6+sd+7.7),nz(q*1.6+sd+1.3));float n=fb(q*2.6+sd+w*1.8);'
 +'float rg=pow(1.0-abs(2.0*n-1.0),1.2);float gas=smoothstep(.42,.78,n);float mk=smoothstep(.25,.6,fb(q*.9+sd+11.0));'
 +'float d=(rg*.9+gas*.9)*mk*fall;float m2=nz(q*1.9+sd+9.0);vec3 col=mix(cA,cB,smoothstep(.3,.7,m2));return mix(col,cC,rg*.4)*d;}'
 +'void main(){vec3 ro=uCam,rd=normalize(vP-ro);float b=dot(ro,rd),c=dot(ro,ro)-R*R,h=b*b-c;if(h<=0.0)discard;h=sqrt(h);float t0=max(-b-h,0.0),t1=-b+h;if(t1<=t0)discard;'
 +'float dt=(t1-t0)/ns;vec3 acc=vec3(0.0);float t=t0+dt*fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);'
 +'for(int i=0;i<48;i++){if(float(i)>=ns)break;vec3 p=ro+rd*t;float rs=length(p)/R;vec3 q=p/R/ax;'
 +'\n#if KIND==0\nvec3 e=snr(q,rs);\n#elif KIND==1\nvec3 e=pn(q,rs);\n#else\nvec3 e=lrn(q);\n#endif\nacc+=e*dt/R;t+=dt;}'
 /* kazanç: kabuğun ortasından bakınca soluk, kenarından bakınca parlak kalacak biçimde ayarlı (ekran beyaza doymasın) */
 +'\n#if KIND==0\nfloat gain=1.25;\n#elif KIND==1\nfloat gain=1.2;\n#else\nfloat gain=4.0;\n#endif\ngl_FragColor=vec4(acc*op*gain,1.0);}';
function nebPoints(kind){
  var Rn=Math.random,rad=kind==='pn'?.34:kind==='lrn'?.24:.43,
      cols=kind==='lrn'?[[1,.34,.1],[1,.62,.28],[1,.85,.55]]:kind==='pn'?[[.3,.72,.78],[.95,.45,.38],[.85,.8,.95]]:[[.45,.62,1],[1,.42,.38],[.9,.92,1]];
  /* kabuklu türlerde (gezegenimsi bulutsu, süpernova kalıntısı) ince kabuğu yakalamak için daha çok adım; biçim küreye yakın, hafif basık.
     gezegenimsi bulutsuların yarıya yakını iki lobludur (bip) */
  var shellK=kind!=='lrn',axv=shellK?new THREE.Vector3(.88+Rn()*.2,.82+Rn()*.3,.88+Rn()*.2):new THREE.Vector3(.7+Rn()*.6,.55+Rn()*.7,.7+Rn()*.6);
  var m=new THREE.ShaderMaterial({uniforms:{op:{value:0},sd:{value:Rn()*80},R:{value:rad},ns:{value:kind==='pn'?(LOWQ?16:26):kind==='snr'?(LOWQ?14:22):(LOWQ?14:24)},kind:{value:kind==='lrn'?2:kind==='pn'?1:0},
    ion:{value:kind==='pn'?0:1},bip:{value:kind==='pn'&&Rn()<.5?.18+Rn()*.22:0},
    ax:{value:axv},uCam:{value:new THREE.Vector3()},
    cA:{value:new THREE.Color().setRGB(cols[0][0],cols[0][1],cols[0][2])},cB:{value:new THREE.Color().setRGB(cols[1][0],cols[1][1],cols[1][2])},cC:{value:new THREE.Color().setRGB(cols[2][0],cols[2][1],cols[2][2])}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,vertexShader:NEB_VS,fragmentShader:'#define KIND '+(kind==='lrn'?2:kind==='pn'?1:0)+'\n'+NEB_FS});
  var pts=new THREE.Mesh(new THREE.SphereGeometry(rad,32,20),m);pts.frustumCulled=false;pts.renderOrder=1;
  pts.rotation.set(Rn()*TAU,Rn()*TAU,Rn()*TAU);
  pts.onBeforeRender=function(r,sc,cam){this.material.uniforms.uCam.value.copy(cam.position);this.worldToLocal(this.material.uniforms.uCam.value);};
  Object.defineProperty(m,'opacity',{get:function(){return this.uniforms.op.value;},set:function(x){if(this.uniforms)this.uniforms.op.value=x;},configurable:true});
  m.opacity=0;return pts;
}
function nebPxUpdate(){NEBPX.value=renderer.domElement.height/(2*Math.tan(camera.fov*D2R/2));}
function nebTex(){
  var S=512,c=document.createElement('canvas');c.width=c.height=S;var g=c.getContext('2d'),C=S/2;
  var rg=g.createRadialGradient(C,C,0,C,C,C);rg.addColorStop(0,'rgba(170,200,255,.55)');rg.addColorStop(.25,'rgba(120,150,255,.22)');rg.addColorStop(.7,'rgba(255,110,70,.08)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,S,S);
  g.globalCompositeOperation='lighter';g.lineCap='round';
  var q1=Math.random()*TAU,q2=Math.random()*TAU,q3=Math.random()*TAU;
  for(var i=0;i<520;i++){var a=Math.random()*TAU,sh=1+.22*Math.sin(2*a+q1)+.1*Math.sin(3*a+q2),r0=C*(.18+Math.random()*.3)*sh,r1=r0+C*(.08+Math.random()*.3)*sh,w=Math.random()*.6-.3;if(Math.random()>.55+.45*Math.cos(a-q3))continue;
    g.strokeStyle=Math.random()<.55?'rgba(255,'+(90+Math.random()*90|0)+',60,'+(.05+Math.random()*.12)+')':'rgba(140,'+(170+Math.random()*60|0)+',255,'+(.04+Math.random()*.1)+')';g.lineWidth=.6+Math.random()*2.2;
    g.beginPath();g.moveTo(C+Math.cos(a)*r0,C+Math.sin(a)*r0);g.quadraticCurveTo(C+Math.cos(a+w*.5)*(r0+r1)/2,C+Math.sin(a+w*.5)*(r0+r1)/2,C+Math.cos(a+w)*r1,C+Math.sin(a+w)*r1);g.stroke();}
  var c2=document.createElement('canvas');c2.width=c2.height=S;var g2=c2.getContext('2d');try{g2.filter='blur(2px)';}catch(e){}g2.drawImage(c,0,0);
  var t=new THREE.CanvasTexture(c2);t.encoding=THREE.sRGBEncoding;return t;
}
/* ışın: kameraya dönük, kenarları yumuşak, uzaklaştıkça incelip sönen ışık huzmesi (sert koniler yerine) */
function beamMat(k,wd){return new THREE.ShaderMaterial({uniforms:{k:{value:k},wd:{value:wd},f:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'uniform float wd;varying vec2 vU;varying float vAl;void main(){vec4 o=modelViewMatrix*vec4(0.0,0.0,0.0,1.0);vec4 e=modelViewMatrix*vec4(0.0,1.0,0.0,1.0);vec3 ax=e.xyz-o.xyz;vAl=1.0-smoothstep(.75,.97,abs(dot(normalize(ax),normalize(-o.xyz))));vec3 pos=o.xyz+ax*position.y;vec3 sd=cross(ax,pos);float l=length(sd);sd=l>1e-6?sd/l:vec3(0.0);pos+=sd*position.x*wd*mix(1.0,2.6,position.y);vU=vec2(position.x,position.y);gl_Position=projectionMatrix*vec4(pos,1.0);}',
  fragmentShader:'uniform float k;uniform float f;varying vec2 vU;varying float vAl;void main(){float x2=vU.x*vU.x;float g=exp(-x2*5.0),c=exp(-x2*36.0);float al=exp(-vU.y*2.2)*(1.0-smoothstep(.8,1.0,vU.y));vec3 col=mix(vec3(.5,.68,1.0),vec3(.96,.98,1.0),c);float a=(g*.28+c*.85)*al*k*(1.0+f*2.2)*vAl;gl_FragColor=vec4(col*a,1.0);}'});}
/* manyetik eksenin dönme eksenine eğikliği: gözlenen pulsarlarda çoğunlukla 10–40°; burada ~22° */
var PULS_HZ=5,PULS_TILT=.38;
function removeExotic(){
  if(!sunBody)return;EXO.dimK=null;
  if(sunBody.sunMat){sunBody.mesh.material=sunBody.sunMat;sunBody.sunMat=null;}
  if(EXO.disk){EXO.disk.parent.remove(EXO.disk);EXO.disk=null;}
  if(EXO.ringS){EXO.ringS.parent.remove(EXO.ringS);EXO.ringS=null;}
  if(EXO.beams){EXO.beams.parent.remove(EXO.beams);EXO.beams=null;}
  if(EXO.neb){EXO.neb.parent.remove(EXO.neb);EXO.neb=null;}
  sunBody.glow1.visible=sunBody.glow2.visible=true;if(FX&&FX.g)FX.g.visible=true;sunBody.mesh.visible=true;
}
/* Nötron yıldızı: 20 km'lik, ~1 milyon °C sıcaklıkta bir küre. Yüzeyi granülasyonlu değil, pürüzsüz ve mavi-beyaz; manyetik
   kutuplardaki "sıcak noktalar" en parlak yerlerdir. Çevresinde (gerçekte görünmeyen) dipol manyetik alan çizgileri ve manyetik
   eksen boyunca iki dar hüzme. Manyetik eksen dönme eksenine göre eğik olduğu için hüzmeler deniz feneri gibi döner.
   Hüzmeler gerçekte radyo/X-ışınıdır, burada görselleştirme olarak çizilir ve yakından bakınca ekranı kaplamasın diye söner. */
/* nötron yıldızı yüzeyi. Eskiden neredeyse düz beyazdı: yakından bakınca ekranda ayrıntı kalmıyordu.
   Yüzey manyetik eksene göre boyanır (eksen çevresinde simetrik, bu yüzden saniyede birkaç tur dönerken titreşmez):
   - manyetik kutuplarda küçük, beyaz-sıcak lekeler ve çevrelerinde yumuşak bir hale: hüzmeler buradan çıkar; yıldız döndükçe lekeler de
     dönme ekseninin çevresinde dolanır, dönüş gözle görülür. Atım anında (f) parlarlar.
   - kutuplardan ekvatora doğru soğuyan mavi tonlar ve ince manyetik enlem şeritleri,
   - kenara doğru kararma ve ince, mavi bir kenar ışıması (yıldızın sıkı sarılı sıcak atmosferi). */
function nsMat(){return new THREE.ShaderMaterial({uniforms:{mAx:{value:new THREE.Vector3(0,1,0)},f:{value:0}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 mAx;uniform float f;varying vec3 vN;varying vec3 vV;void main(){vec3 n=normalize(vN);float mu=clamp(dot(n,normalize(vV)),0.0,1.0);float c=abs(dot(n,normalize(mAx)));'+
    /* çok sıcak bir yüzey: ortası beyaza yakın, kenarı elektrik mavisi (gaz devi gibi koyu mavi şeritli görünmesin diye şeritler çok ince) */
    'vec3 hot=vec3(.95,.98,1.0);vec3 base=mix(vec3(.3,.5,1.0),vec3(.7,.83,1.0),pow(mu,.85));'+
    'base*=mix(.8,1.0,smoothstep(0.0,.8,c));base*=1.0+.03*sin(c*46.0)+.018*sin(c*113.0+1.3);'+
    'float cap=pow(c,26.0),halo=pow(c,5.0);vec3 col=base+hot*(cap*(1.0+1.7*f)+halo*.3);'+
    'col+=vec3(.3,.5,1.0)*pow(1.0-mu,3.0)*.6;gl_FragColor=vec4(min(col,vec3(1.4)),1.0);}'});}
function magLines(r0){
  var pos=[],Ls=[2.6,4.2,7],nA=8;
  Ls.forEach(function(L){for(var a=0;a<nA;a++){var ph=a/nA*TAU+L*.4,th0=Math.asin(Math.min(1,Math.sqrt(1/L))),prev=null;
    for(var i=0;i<=48;i++){var th=th0+(Math.PI-2*th0)*i/48,r=L*Math.pow(Math.sin(th),2),p=[r*Math.sin(th)*Math.cos(ph)*r0,r*Math.cos(th)*r0,r*Math.sin(th)*Math.sin(ph)*r0];
      if(prev)pos.push(prev[0],prev[1],prev[2],p[0],p[1],p[2]);prev=p;}}});
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  var m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x7fc8ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));m.frustumCulled=false;return m;
}
function makePulsar(R,parent,noNeb,r0x){
  /* r0x: gerçek ölçekte yıldızın gerçek yarıçapı; hüzme boyu yıldıza oranı aynı kalacak biçimde kısalır */
  var r0=r0x||R*SUN_TYPES[5].sc,o={},bg=new THREE.Group(),L=r0/SUN_TYPES[5].sc*30,mt=beamMat(.75,r0*1.6),pg=new THREE.PlaneGeometry(2,1,1,1);pg.translate(0,.5,0);
  [1,-1].forEach(function(sg){var st=new THREE.Mesh(pg,mt);st.scale.y=L;if(sg<0)st.rotation.z=Math.PI;st.renderOrder=3;st.frustumCulled=false;bg.add(st);});
  var ml=magLines(r0);bg.add(ml);o.mag=ml;
  var arm=new THREE.Group();arm.rotation.z=PULS_TILT;arm.add(bg);o.arm=arm;
  var spin=new THREE.Group();spin.add(arm);parent.add(spin);o.beams=spin;o.bmats=[mt];o.ph=Math.random()*TAU;o.fl=0;
  /* süpernova kalıntısı bulutsusu yalnızca yeni doğan pulsarda: birkaç on bin yılda dağılır. Ekle'den eklenen (yaşlı) pulsar bulutsusuz */
  if(!noNeb){var ns=nebPoints('snr');ns.scale.setScalar(R*44);parent.add(ns);o.neb=ns;o.nebT=0;o.nebK=.55;}o.R=R;
  return o;
}
function makeBH(R,parent){
  var dk=new THREE.Mesh(new THREE.RingGeometry(1,4.2,192,6),diskMat());dk.rotation.x=-Math.PI/2+.22;dk.scale.setScalar(R*.6);parent.add(dk);
  var hl=new THREE.Mesh(new THREE.RingGeometry(1,6,192,8),haloMat());hl.renderOrder=4;parent.add(hl);
  return {disk:dk,ringS:hl};
}
function applyExotic(i){
  removeExotic();var R=sunBody.def.vr;if(i<6)EXO.col=null;
  if(i===5){var o=makePulsar(R,sunBody.pivot,false,realCompact(sunBody,5)?NS_KM/KM_U:0);for(var k in o)EXO[k]=o[k];sunBody.sunMat=sunBody.mesh.material;sunBody.mesh.material=nsMat();if(FX&&FX.g)FX.g.visible=false;}
  else if(i===6){
    sunBody.sunMat=sunBody.mesh.material;sunBody.mesh.material=new THREE.MeshBasicMaterial({color:0x000000});
    sunBody.glow1.visible=sunBody.glow2.visible=false;if(FX&&FX.g)FX.g.visible=false;
    var q=makeBH(R,sunBody.pivot);EXO.disk=q.disk;EXO.ringS=q.ringS;EXO.fuel=2;
  }else if(i===7){
    sunBody.mesh.visible=false;sunBody.glow1.visible=sunBody.glow2.visible=false;if(FX&&FX.g)FX.g.visible=false;
    var ns=nebPoints('snr');sunBody.pivot.add(ns);EXO.neb=ns;EXO.nebT=0;EXO.nebK=.8;
  }
  refreshStarDot(sunBody);
}
var STARDOT={0:['#ffd36b','#ff8a1c'],1:['#ff8a5a','#a8200a'],2:['#eef4ff','#3a6bff'],3:['#ffb070','#b02a0a'],4:['#ffffff','#9fb3dd'],5:['#eef6ff','#5f8fff'],7:['#40304a','#0a0a12']};
function starDotCss(t){return t===6?'background:radial-gradient(circle,#000 36%,#ffd09a 44%,#c0501a 58%,#1a0800 72%)':dotStyle(STARDOT[t]||STARDOT[0]);}
var SUNNM={4:'Beyaz cüce',5:'Pulsar',6:'Kara delik',7:'Kalıntı'};
function refreshStarDot(b){var t=b===sunBody?sunType:b.starType,nm=(b===sunBody&&!SYS)?(SUNNM[t]||'Güneş'):null;[b.treeBtn,b.dockBtn].forEach(function(el){var d=el&&el.querySelector('.dot');if(d)d.setAttribute('style',starDotCss(t));if(el&&nm&&el.lastChild&&el.lastChild.nodeType===3)el.lastChild.nodeValue=nm;});if(nm&&b.label&&b.label.firstChild)b.label.firstChild.textContent=nm;}
/* ek yıldızlar: tür değişimi, süpernova, kara delik */
function labStar(){if(FORCE_STAR)return FORCE_STAR;return (focus&&focus.def.star&&focus!==sunBody&&!isGone(focus))?focus:sunBody;}
function clearStarExo(b){var x=b.exo;if(!x)return;['beams','neb','disk','ringS'].forEach(function(k){if(x[k]&&x[k].parent)x[k].parent.remove(x[k]);});
  if(b.sunMat){b.mesh.material=b.sunMat;b.sunMat=null;}b.glow1.visible=b.glow2.visible=true;b.exo=null;}
function setStarOn(b,i){
  if(b===sunBody){setStar(i);return;}
  b.pend=null;morphClear(b);if(b.exoCol&&i!==6){colAbort(b.exoCol);b.exoCol=null;}
  var T=SUN_TYPES[i],T0=SUN_TYPES[b.starType];clearStarExo(b);
  /* adı türden geliyorsa ("Nötron yıldızı B") tür değişince ad da değişir: "Kara delik B" */
  if(T0&&T0!==T&&b.def.name.indexOf(T0.name)===0){b.def.name=T.name+b.def.name.slice(T0.name.length);customs.forEach(function(c){if(c.id===b.id)c.name=b.def.name;});if(b.label&&b.label.firstChild)b.label.firstChild.textContent=b.def.name;b.renamed=true;}
  b.starType=i;
  b.sunU.lo.value.setHex(T.lo);b.sunU.hi.value.setHex(T.hi);b.sunU.spots.value=(i>=4||i===2)?0:1;
  b.glow1.material.color.setHex(T.glow);b.glow2.material.color.setHex(T.glow);
  if(b.light){b.light.color.setHex(T.light);b.light.intensity=T.I*.7;}
  b.typeScale=typeSc(b,i);b.tilt.scale.setScalar(b.mod.size*b.typeScale);b.vr=effVr(b);
  if(i===5){b.exo=makePulsar(b.def.vr,b.pivot,b.nsOld,realCompact(b,5)?NS_KM/KM_U:0);b.nsOld=false;b.sunMat=b.mesh.material;b.mesh.material=nsMat();}
  else if(i===6){b.sunMat=b.mesh.material;b.mesh.material=new THREE.MeshBasicMaterial({color:0x000000});b.glow1.visible=b.glow2.visible=false;b.exo=makeBH(b.def.vr,b.pivot);b.exo.fuel=b.bhOld?0:2;b.bhOld=false;}
  if(b.def.stats&&b.def.stats[0])b.def.stats[0][1]=T.name;
  if(b.def.stats){if(!b.def.stats0)b.def.stats0=b.def.stats.map(function(r){return r.slice();});if(!b.def.desc0)b.def.desc0=b.def.desc;
    var st=b.def.stats0.map(function(r){return r.slice();});st[0][1]=T.name;
    if(i===5){st[1]=['Çap','~20 km'];st.splice(2,0,['Ekranda',nsScaleTxt(b)]);b.def.desc='Süpernovadan geriye kalan çökmüş çekirdek: yaklaşık 1,4 Güneş kütlesi 20 km\'lik bir küreye sıkışmış; bir çay kaşığı malzemesi milyarlarca ton. Yüzeyi yaklaşık 1 milyon °C, en sıcak yerleri manyetik kutuplar. Ekrandaki ışın hüzmeleri ve manyetik alan çizgileri görselleştirmedir: gerçekte göze görünmezler, hüzmeler yalnızca radyo ve X-ışını atımı olarak ölçülür.';}
    else if(i===6){st[1]=['Olay ufku','~'+Math.round(3*stMass(b))+' km yarıçap'];st.splice(2,0,['Ekranda',bhScaleTxt(b)]);b.def.desc=b.def.desc0;}
    else{b.def.desc=b.def.desc0;
      /* eklenen yıldızın "Çap" satırı tür değişince de çizilen boyutu göstersin (eskiden hep sarı cüce çapı yazıyordu); beyaz cücede gerçek çap + büyütme notu */
      if(b.def.custom&&st[1]&&st[1][0]==='Çap'){
        if(i===4){st[1]=['Çap','~12.000 km (Dünya kadar)'];var br=bigRow(effVr(b),6000);if(br.length)st.splice(2,0,br[0]);}
        else st[1]=['Çap',Math.round(1392700*b.def.vr/SUNVR*b.mod.size*typeSc(b,i)).toLocaleString('tr-TR')+' km'+(i===3&&!REAL?' (modelde; gerçek kırmızı devler çok daha büyük)':'')];}}
    b.def.stats=st;}b.def.kind=i>=5?'Yıldız kalıntısı · yarattığın':'Yıldız · yarattığın';
  customs.forEach(function(c){if(c.id===b.id)c.type=i;});saveCustom();if(b.renamed){b.renamed=false;if(typeof rebuildLists==='function')rebuildLists();}refreshStarDot(b);
  if(focus===b){updateInfo();syncLab();}
}
function starFlare(){
  var t=labStar();if(t===sunBody&&sunType>=4){toast(sunType===4?'Beyaz cücenin yüzeyinde füzyon ve manyetik fırtına yok; patlama olmaz.':sunType===7?'Burada artık bir yıldız yok.':'Bu bir yıldız kalıntısı ('+SUN_TYPES[sunType].name.toLowerCase()+'); yüzeyinde güneş patlaması olmaz.',5000);return;}
  if(t===sunBody){if(!FX)return;emitFlare();emitCme(true);FX.cm.t=0;FX.cm.force=true;FX.cmPts.visible=true;return;}
  if(t.starType>=5){toast(t.def.name+' artık bir yıldız kalıntısı; yüzeyinde patlama olmaz');return;}
  flashAt(t.pivot,new THREE.Vector3(),effVr(t)*7,SUN_TYPES[t.starType].glow);if(typeof audWhoosh==='function')audWhoosh();
  toast(t.def.name+': yıldız patlaması (parlama). Yüzeydeki manyetik alan çizgileri koptu, saniyeler içinde milyarlarca atom bombası kadar enerji saçıldı.',5000);
}
function starNova(t){
  if(EXO.sn){toast('Önce süren patlama bitsin');return;}
  if(t.starType>=5){toast('Yıldız zaten öldü');return;}
  if(t.starType===1){toast('Kırmızı cüceler süpernova olamaz: çok hafifler.',5000);return;}
  act('nova',{tg:t.id});
  var ia=t.starType===4;
  snStart(t,ia);
  if(ia)after(1.8,function(){if(isGone(t))return;hideStar(t);focusBody('sun',{dist:OVD()*.6});});
  else if(stMass(t)>=20){t.exoCol=colInit(t);t.exoCol.mode=stMass(t)>=40?'grb':'fallback';}
  else{t.pend=5;after(1.8,function(){if(!isGone(t)&&t.pend===5){setStarOn(t,5);nsMass(t);}});}
  toast(!ia&&stMass(t)>=20?t.def.name+' süpernova oldu! Çekirdeği nötron yıldızı olarak kalamayacak kadar ağır: geriye kara delik kalacak.':ia?t.def.name+': Tip Ia süpernova! Beyaz cüce kütle sınırını (1,4 Güneş) aşınca karbon tutuşur ve yıldız tamamen parçalanır; geriye hiçbir şey kalmaz. Evrendeki demirin çoğu böyle oluşur.':t.def.name+' süpernova oldu! Gerçekte bunun için en az 8 Güneş kütlesi gerekir; bu bir "ya olsaydı" senaryosu.',8000);
  if(typeof audWhoosh==='function')audWhoosh();
}
/* süpernovadan kalan nötron yıldızı ~1,4 M☉: geri kalan kütle uzaya savrulur */
function nsMass(b){if(stMass(b)<=2.3)return;if(b===sunBody){sunMass=1.4+EATEN/333000;$('sMass').value=sliderFromMass(1.4);$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();}else b.massAbs=1.4;}
function starBH(t){
  if(t.starType===6||t.exoCol)return;
  t.exoCol=colInit(t);if(t.starType===5)clearStarExo(t);focusBody(t.def.id,{dist:t.exoCol.mode==='grb'?Math.max(effVr(t)*9,OVD()*.15):effVr(t)*9});toast(t.def.name+': çekirdek çöküyor…'+pauseNote(),4000);
}
var _v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3(),_q1=new THREE.Quaternion();
/* gerçekte olay ufku kütleyle doğru orantılı (1000 Güneş kütlesi = 2950 km, yine de Güneş'ten 240 kat küçük). Ekranda görünsün diye büyütülmüş ama kütleyle yavaşça büyür: 1000 kat kütle yıldızdan büyük bir delik demek değildir */
function bhMassK(){if(REAL&&!SYS)return 1;/* gerçek ölçekte kütle zaten boyutun içinde (typeSc) */var M=Math.max(.2,sunMass);return M<1?Math.cbrt(M):Math.pow(M,.16);}
/* ufuk yarıçapı kütleyle büyür: Güneş'te yavaşça (bhMassK), diğer kara deliklerde oluştuğu andaki kütleye göre */
function bhK(b){if(b===sunBody)return bhMassK();if(REAL)return 1;var o=b.exo;if(!o)return 1;var m=Math.max(.2,stMass(b));if(!o.m0)o.m0=m;return Math.pow(m/o.m0,.16);}
/* disk parlaklığı: Güneş kara deliği de eklenen kara delikler de aynı kural. fuel = yakın zamanda yutulan madde; zamanla diske düşüp söner.
   dimK: kilonova sonrası gibi sönük enkaz halkası. Logaritmik: büyük bir yutma diski parlatır ama ekranı beyaza boğmaz. */
/* disk yalnızca madde varken parlar: yalnız bir kara deliğin çevresinde yutacak gaz yoktur, yalnızca gölge ve foton halkası görünür.
   Çöküşten geri düşen madde (fuel≈2) yaklaşık bir dakikada tükenir; bir şey yutunca disk yeniden parlar. Logaritmik: büyük yutmalar ekranı beyaza boğmaz. */
function diskFuelStep(o,dt){o.fuel=(o.fuel||0)*Math.exp(-Math.abs(dt)*(o.fuel>1?.12:.06));if(o.fuel<.003)o.fuel=0;var f=o.fuel;if(o.disk&&o.disk.material.uniforms.b)o.disk.material.uniforms.b.value=Math.pow(Math.min(1,f),.8)+Math.log(1+Math.max(0,f-1))*.6;}
function bhExo(t){return t===sunBody?EXO:t.exo;}
function bhStep(o,body,dt){
  realSizeSync(body,6);
  var kM=bhK(body),sh=effVr(body)*kM;
  /* birleşme sonrası "ringdown": yeni olay ufku şekil değiştirip birkaç salınımda sönerek küresel hale gelir */
  if(o.rd!=null){o.rd+=Math.abs(dt);sh*=1+.2*Math.exp(-o.rd/.9)*Math.sin(o.rd*TAU*3.2);if(o.rd>6)o.rd=null;}
  /* uzak (mercek kapalı) disk modeli mercekteki diskle aynı ölçüde: parlak bölgenin genişliği mercekteki diskle (ISCO 3 r_s – 14 r_s) aynı görünecek şekilde.
     Önceden iki kat büyüktü; yaklaşıp uzaklaşınca disk sıçrıyordu */
  o.sh=sh;o.disk.scale.setScalar(sh*2);
  /* disk her zaman sıcak gazla parlar (yıldızın çöküşünden geri düşen madde); bir şey yutunca daha da parlar */
  if(body!==sunBody)o.disk.material.uniforms.t.value+=dt;
  diskFuelStep(o,dt);
  var hl=o.ringS;if(!hl)return;var U=hl.material.uniforms;U.t.value+=dt;var db=o.disk.material.uniforms.b.value;U.dk.value=Math.min(1,db);U.b.value=.75+.25*Math.min(1,db)+Math.max(0,db-1)*.35;
  hl.quaternion.copy(camera.quaternion);hl.scale.setScalar(sh);
  var n=o.disk.getWorldDirection(_v1).normalize(),v=_v2.copy(camera.position).sub(body.pos).normalize(),dn=n.dot(v);
  U.edge.value=.25+.75*(1-Math.abs(dn));U.rD.value=2.3;
  var nn=_v3.copy(n).multiplyScalar(dn>=0?1:-1).sub(v.clone().multiplyScalar(Math.abs(dn))),qi=_q1.copy(camera.quaternion).invert();nn.applyQuaternion(qi);U.nP.value.set(nn.x,nn.y).normalize();
  var pa=new THREE.Vector3().crossVectors(v,n).applyQuaternion(qi);U.dop.value.set(pa.x,pa.y);if(U.dop.value.lengthSq()>1e-6)U.dop.value.normalize();
}
/* ================= KÜTLEÇEKİMSEL MERCEK (kara delik) =================
   Kara delik ekrandayken sahne iki parçada çizilir:
   1) kara deliğin arkasında kalan her şey bir dokuya (renk + derinlik),
   2) tam ekran bir ışın izleme geçişi: her piksel için ışığın Schwarzschild uzay-zamanındaki yolu hesaplanır
      (foton yörünge denklemi x'' = -3/2 h² x / r⁵, birim: Schwarzschild yarıçapı r_s). Işın olay ufkuna düşerse siyah,
      yığılma diskini keserse diskin o noktadaki ışığı (Doppler + kütleçekimsel kırmızıya kayma), kaçarsa arkadaki sahneden
      bükülmüş yönde örnek alınır. Arkadaki cismin uzaklığı derinlik dokusundan okunur: yakın cisim az, uzak cisim çok bükülür.
   3) kara deliğin önünde kalanlar normal şekilde üstüne çizilir.
   Uzak ışınlar için zayıf alan yaklaşımı (α = 2 r_s / b) kullanılır; ikisi entegrasyon küresinin sınırında süreksizlik olmadan birleşir.
   Gölge yarıçapı ≈ 2,6 r_s, iç disk kenarı ISCO = 3 r_s, foton halkası ≈ 1,5 r_s'deki kararsız yörüngeden gelir. */
var LENS_GLSL_NOISE='float lh(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}'+
  'float ln3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(lh(i),lh(i+vec3(1,0,0)),f.x),mix(lh(i+vec3(0,1,0)),lh(i+vec3(1,1,0)),f.x),f.y),mix(mix(lh(i+vec3(0,0,1)),lh(i+vec3(1,0,1)),f.x),mix(lh(i+vec3(0,1,1)),lh(i+vec3(1,1,1)),f.x),f.y),f.z);}';
function lensMat(st){
  return new THREE.ShaderMaterial({defines:{STEPS:st||(LOWQ?90:170)},depthTest:false,depthWrite:false,
    uniforms:{tCol:{value:null},tDep:{value:null},tSky:{value:null},hasDep:{value:0},skyOp:{value:.9},invProj:{value:new THREE.Matrix4()},camW:{value:new THREE.Matrix4()},vp:{value:new THREE.Matrix4()},
      camPos:{value:new THREE.Vector3()},bh:{value:new THREE.Vector3()},dN:{value:new THREE.Vector3(0,1,0)},rs:{value:1},rIn:{value:3},rOut:{value:14},rInt:{value:23},tm:{value:0},dB:{value:1},n1:{value:1},f1:{value:1000}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:'precision highp float;uniform sampler2D tCol;uniform sampler2D tDep;uniform sampler2D tSky;uniform float hasDep;uniform float skyOp;uniform mat4 invProj;uniform mat4 camW;uniform mat4 vp;'+
    'uniform vec3 camPos;uniform vec3 bh;uniform vec3 dN;uniform float rs;uniform float rIn;uniform float rOut;uniform float rInt;uniform float tm;uniform float dB;uniform float n1;uniform float f1;varying vec2 vUv;'+
    LENS_GLSL_NOISE+
    /* piksel ışını yakın düzlemdeki noktadan (z=-1) çözülür: uzak düzlemde (z=1) w = 1/uzak olur ve uzak/yakın oranı çok büyükken
       (gerçek ölçekte 10⁸) tek duyarlıklı çıkarmada sıfıra yuvarlanır; ışın yönü bozulup ekran kararıyordu */
    'vec3 rayDir(vec2 uv){vec4 c=invProj*vec4(uv*2.0-1.0,-1.0,1.0);return normalize((camW*vec4(normalize(c.xyz/c.w),0.0)).xyz);}'+
    'vec3 sky(vec3 d){float u=fract(atan(d.z,-d.x)/6.2831853);float v=1.0-acos(clamp(d.y,-1.0,1.0))/3.1415927;return texture2D(tSky,vec2(u,v)).rgb*skyOp;}'+
    'float linD(float d){float z=d*2.0-1.0;return 2.0*n1*f1/(f1+n1-z*(f1-n1));}'+
    /* bükülmüş ışının sahnede neye çarptığını bul: önce sonsuzdaki yönü ekrana yansıt, oradaki derinlikten cismin konumunu al,
       ışının o uzaklıktaki noktasını yeniden yansıt (2-3 adımda yakınsar). Ekran dışına düşerse Samanyolu dokusundan örnekle. */
    'vec3 bg(vec3 X,vec3 V){vec4 c=vp*vec4(V,0.0);float ok=step(1e-5,c.w);vec2 uv=c.xy/max(c.w,1e-5)*.5+.5;'+
      'if(hasDep>.5&&ok>.5){vec3 fw=normalize((camW*vec4(0.0,0.0,-1.0,0.0)).xyz);for(int i=0;i<3;i++){if(uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0)break;float d=texture2D(tDep,uv).x;if(d>.99999)break;'+
        'vec3 rd=rayDir(uv);vec3 P=camPos+rd*(linD(d)/max(dot(rd,fw),.05));float t=max(dot(P-X,V),0.0);vec4 c2=vp*vec4(X+V*t,1.0);if(c2.w<=0.0)break;uv=c2.xy/c2.w*.5+.5;}}'+
      'vec2 e=min(uv,1.0-uv);float k=ok*smoothstep(0.0,.015,min(e.x,e.y));vec3 s=k<1.0?sky(V):vec3(0.0);vec3 sc=k>0.0?texture2D(tCol,clamp(uv,0.0,1.0)).rgb:vec3(0.0);return mix(s,sc,k);}'+
    'vec3 temp(float t){vec3 c=mix(vec3(.38,.035,.008),vec3(1.0,.32,.05),smoothstep(.12,.5,t));c=mix(c,vec3(1.0,.72,.36),smoothstep(.45,.8,t));c=mix(c,vec3(1.0,.94,.84),smoothstep(.75,1.05,t));return mix(c,vec3(.78,.86,1.0),smoothstep(1.05,1.45,t));}'+
    /* ince disk: Novikov-Thorne akı profili F ∝ r⁻³(1-√(r_in/r)), sıcaklık T ∝ F^¼. Gaz Kepler hızıyla döner (β = √(0.5/(r-1)));
       gözlenen frekans oranı g = √(1-1/r) / (γ(1-β cosψ)). Bize gelen taraf mavimsi ve parlak, uzaklaşan taraf kızıl ve sönük. */
    'vec4 disk(vec3 p,vec3 v,float r){vec3 e1=normalize(cross(dN,abs(dN.y)<.9?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0)));vec3 e2=cross(dN,e1);float ph=atan(dot(p,e2),dot(p,e1));'+
      'float om=1.6/pow(r,1.5),T=7.0,t1=mod(tm,T),t2=mod(tm+T*.5,T),w=abs(t1/T*2.0-1.0);'+
      'float a1=ph-om*t1,a2=ph-om*t2,lr=log(r)*9.0;'+
      'float q1=ln3(vec3(cos(a1)*2.2,sin(a1)*2.2,lr))*.6+ln3(vec3(cos(a1)*5.0,sin(a1)*5.0,lr*2.7))*.4;'+
      'float q2=ln3(vec3(cos(a2)*2.2,sin(a2)*2.2,lr+7.0))*.6+ln3(vec3(cos(a2)*5.0,sin(a2)*5.0,lr*2.7+3.0))*.4;float n=mix(q1,q2,w);'+
      'float x=rIn/r,F=x*x*x*max(0.0,1.0-sqrt(x))/.0567;'+
      'vec3 u=normalize(cross(dN,p));float be=min(sqrt(.5/max(r-1.0,.05)),.97),ga=1.0/sqrt(1.0-be*be),cs=dot(u,-normalize(v));'+
      'float g=sqrt(max(1.0-1.0/r,0.0))/(ga*(1.0-be*cs));float Tn=pow(max(F,0.0),.25)*g;'+
      'float fade=smoothstep(rIn,rIn*1.08,r)*smoothstep(rOut,rOut*.7,r);float lanes=.9+.1*sin(lr*5.0+n*8.0);'+
      'float I=dB*1.1*g*g*g*F*(.4+1.2*n)*lanes;vec3 c=1.0-exp(-temp(Tn*.82)*I*1.6);'+
      'float a=clamp(dB*1.6,0.0,1.0)*clamp((.35+.9*sqrt(F))*(.55+.7*n)*fade,0.0,.97);return vec4(c*fade,a);}'+
    'void main(){vec3 base=texture2D(tCol,vUv).rgb;vec3 d=rayDir(vUv);vec3 o=(camPos-bh)/rs;float ro=length(o);float tca=-dot(o,d);vec3 pc=o+d*tca;float b=length(pc);'+
      'if(tca<0.0&&ro>rInt){gl_FragColor=vec4(base,1.0);return;}'+
      'vec3 pn=b>1e-5?pc/b:normalize(cross(d,abs(d.y)<.9?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0)));'+
      'vec3 col=vec3(0.0);float acc=0.0;vec3 X;vec3 V;bool cap=false;'+
      'if(b>rInt){float al=(1.0/b)*(1.0+sqrt(max(0.0,1.0-b*b/(ro*ro))));if(al<2e-4){gl_FragColor=vec4(base,1.0);return;}V=normalize(d*cos(al)-pn*sin(al));X=pc;}'+
      'else{vec3 x=o;vec3 v=d;'+
        'if(ro>rInt){float th=sqrt(rInt*rInt-b*b);x=o+d*(tca-th);float ai=(1.0/max(b,1e-3))*(sqrt(max(0.0,1.0-b*b/(ro*ro)))-sqrt(max(0.0,1.0-b*b/(rInt*rInt))));v=normalize(d*cos(ai)-pn*sin(ai));}'+
        'vec3 hv=cross(x,v);float h2=dot(hv,hv);'+
        'for(int i=0;i<STEPS;i++){float r=length(x);if(r<1.0){cap=true;break;}if(r>rInt&&dot(x,v)>0.0)break;'+
          'float dt=clamp(.075*r*(r<3.0?.55:1.0),.015,2.5);vec3 a1=-1.5*h2*x/pow(r,5.0);vec3 xm=x+v*dt*.5;vec3 vm=v+a1*dt*.5;float rm=length(xm);vec3 a2=-1.5*h2*xm/pow(rm,5.0);vec3 xn=x+vm*dt;v+=a2*dt;'+
          'float s0=dot(x,dN),s1=dot(xn,dN);if(s0*s1<0.0){vec3 xp=mix(x,xn,s0/(s0-s1));float rr=length(xp);if(rr>rIn&&rr<rOut){vec4 dc=disk(xp,v,rr);col+=(1.0-acc)*dc.rgb;acc+=(1.0-acc)*dc.a;if(acc>.985)break;}}'+
          'x=xn;}'+
        'X=x;V=normalize(v);float r2=length(x);'+
        'if(!cap&&r2>=rInt*.98){vec3 pv=x-V*dot(x,V);float b2=length(pv);if(b2>1e-3){float ao=(1.0/b2)*(1.0-sqrt(max(0.0,1.0-b2*b2/(r2*r2))));V=normalize(V*cos(ao)-(pv/b2)*sin(ao));}}'+
        'else if(!cap&&acc<.985){cap=true;}}'+
      'vec3 bc=cap?vec3(0.0):bg(bh+X*rs,V);gl_FragColor=vec4(col+(1.0-acc)*bc,1.0);}'
  });
}
function lensInit(){
  if(LENS.quad)return true;
  try{
    var gl2=renderer.capabilities.isWebGL2;LENS.hasDep=gl2||!!renderer.extensions.get('WEBGL_depth_texture');
    var opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false};
    LENS.rt=gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(4,4,opt):new THREE.WebGLRenderTarget(4,4,opt);
    if(LENS.rt.samples!=null)LENS.rt.samples=LOWQ?2:4;
    LENS.rt.texture.encoding=THREE.sRGBEncoding;
    if(LENS.hasDep){LENS.rt.depthTexture=new THREE.DepthTexture(4,4);LENS.rt.depthTexture.type=THREE.UnsignedIntType;}
    var m=lensMat();m.uniforms.hasDep.value=LENS.hasDep?1:0;if(SKYG&&SKYG.mw)m.uniforms.tSky.value=SKYG.mw.material.map;
    /* yavaş cihazlar için daha az adımlı ikinci gölgelendirici: kare süresi uzarsa ona geçilir */
    LENS.hi=m;LENS.lo=lensMat(LOWQ?50:80);LENS.lo.uniforms=m.uniforms;LENS.lo.uniforms.hasDep.value=m.uniforms.hasDep.value;
    LENS.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),m);LENS.quad.frustumCulled=false;
    LENS.qs=new THREE.Scene();LENS.qs.add(LENS.quad);LENS.qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    return true;
  }catch(e){console.error(e);LENS.fail=true;return false;}
}
/* ekranda en büyük görünen kara delik merceklenir (aynı anda ikisini ışın izlemek telefonlarda ağır kaçar); diğerleri eski disk modeliyle çizilir */
var _lv=new THREE.Vector3(),_lw=new THREE.Vector3(),_lsz=new THREE.Vector2(),_lm=new THREE.Matrix4();
function lensPick(){
  if(!LENS.on||LENS.fail||mode==='surface')return null;
  var best=null,bk=0;
  function cand(b,o){if(!o||!o.disk||!o.sh||!b.pivot.visible)return;b.pivot.getWorldPosition(_lv);var dd=camera.position.distanceTo(_lv);if(!(dd>0))return;
    var k=o.sh/dd;if(k>bk){bk=k;best={b:b,o:o,d:dd};}}
  if(sunBody&&sunType===6&&!SYS&&!EXO.col)cand(sunBody,EXO);
  for(var i=0;i<BODIES.length;i++){var b=BODIES[i];if(b!==sunBody&&b.exo&&b.exo.disk&&!isGone(b)&&!b.sysHide)cand(b,b.exo);}
  if(!best)return null;
  /* gölge birkaç pikselden küçükse mercek görünmez: maliyete değmez */
  var px=bk/Math.tan(camera.fov*D2R/2)*H*.5;if(px<4)return null;
  return best;
}
function renderFrame(){
  var L=lensPick();
  if(!L||!lensInit()){renderer.render(scene,camera);return;}
  if(LENS.hi){var slow=perfEma>(LENS.quad.material===LENS.lo?.022:.03);LENS.quad.material=slow?LENS.lo:LENS.hi;}
  var b=L.b,o=L.o,rs=o.sh/2.6;b.pivot.getWorldPosition(_lv);
  camera.updateMatrixWorld();_lw.copy(_lv).applyMatrix4(camera.matrixWorldInverse);var zB=-_lw.z;
  var n0=camera.near,f0=camera.far,split=zB>n0*1.5&&zB<f0*.9;
  renderer.getDrawingBufferSize(_lsz);
  if(LENS.w!==_lsz.x||LENS.h!==_lsz.y){LENS.w=_lsz.x;LENS.h=_lsz.y;LENS.rt.setSize(_lsz.x,_lsz.y);if(LENS.rt.depthTexture){LENS.rt.depthTexture.image.width=_lsz.x;LENS.rt.depthTexture.image.height=_lsz.y;}}
  var hid=[o.disk,o.ringS,b.tilt||b.mesh],vis=hid.map(function(x){return x?x.visible:false;});hid.forEach(function(x){if(x)x.visible=false;});
  /* yörünge çizgileri gerçek cisim değil, yön bulma yardımı: bükülmüş halleri gölgenin üstüne sarılıp cam küre gibi görünüyordu.
     Merceğe girmezler; en sonda bükülmeden çizilir, gölgenin arkasında kalan kısımları gizlenir */
  var LN=[];BODIES.forEach(function(x){if(x.line&&x.line.visible){LN.push(x.line);x.line.visible=false;}});
  /* parlamalar ve kütleçekim dalgası halkaları da merceğe girmez: kara deliğin merkezindeki parlama bükülünce halka gibi görünüyordu */
  FXL.forEach(function(f){if(f.o&&f.o.userData.post&&f.o.visible){LN.push(f.o);f.o.visible=false;}});
  TDL.forEach(function(T){if(T.host===b&&T.pts.visible){LN.push(T.pts);T.pts.visible=false;}});
  if(EXO.sn&&EXO.sn.kn){[EXO.sn.flash,EXO.sn.jets].forEach(function(o){if(o&&o.visible){LN.push(o);o.visible=false;}});}
  try{
    /* 1) kara deliğin arkası */
    if(split){camera.near=zB;camera.updateProjectionMatrix();}
    renderer.setRenderTarget(LENS.rt);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);
    var U=LENS.quad.material.uniforms;
    U.tCol.value=LENS.rt.texture;U.tDep.value=LENS.rt.depthTexture||null;U.n1.value=camera.near;U.f1.value=camera.far;
    /* gölgelendiriciye konumlar kameraya göre verilir (kamera = orijin): tek duyarlıklı sayılarda dünya koordinatı birkaç AU uzakta ~16 km hata yapar,
       gerçek boyutlu (onlarca km) bir kara delikte görüntü titrerdi. Fark çift duyarlıkta burada alınır */
    U.invProj.value.copy(camera.projectionMatrixInverse);U.camW.value.copy(camera.matrixWorld);
    _lm.copy(camera.matrixWorld).setPosition(0,0,0).invert();U.vp.value.multiplyMatrices(camera.projectionMatrix,_lm);
    U.camPos.value.set(0,0,0);U.bh.value.copy(_lv).sub(camera.position);U.rs.value=rs;o.disk.getWorldDirection(U.dN.value);U.dN.value.normalize();
    U.tm.value=o.disk.material.uniforms.t.value;U.dB.value=o.disk.material.uniforms.b.value;
    if(SKYG&&SKYG.mw){U.tSky.value=SKYG.mw.material.map;U.skyOp.value=SKYG.mw.material.opacity*(SKYG.mw.visible?1:0);}
    /* 2) ışın izleme */
    renderer.render(LENS.qs,LENS.qc);
    /* 3) önde kalanlar */
    if(split){camera.near=n0;camera.far=zB;camera.updateProjectionMatrix();var ac=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=ac;}
    /* 4) yörünge çizgileri: tüm derinlik aralığında, gölge küresi yalnızca derinliğe yazılarak çizgileri örter */
    if(LN.length){camera.near=n0;camera.far=f0;camera.updateProjectionMatrix();var ac2=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();
      var occ=LENS.occ;if(!occ){occ=LENS.occ=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),new THREE.MeshBasicMaterial({colorWrite:false}));}
      occ.position.copy(_lv);occ.scale.setScalar(o.sh);occ.updateMatrixWorld();
      var ls=LENS.ls;if(!ls)ls=LENS.ls=new THREE.Scene();ls.add(occ);
      LN.forEach(function(l){l.visible=true;});
      renderer.render(occ,camera);LN.forEach(function(l){renderer.render(l,camera);});
      renderer.autoClear=ac2;}
  }catch(e){console.error(e);LENS.fail=true;}
  LN.forEach(function(l){l.visible=true;});
  camera.near=n0;camera.far=f0;camera.updateProjectionMatrix();
  hid.forEach(function(x,i){if(x)x.visible=vis[i];});
  LENS.cur=L;
}
function pulsarStep(o,body,dt){
  realSizeSync(body,5);
  var ph0=o.ph;o.ph+=Math.min(dt,.1)*TAU*PULS_HZ;o.beams.rotation.y=o.ph;
  var v=_v1.copy(camera.position).sub(body.pos).normalize(),th=Math.acos(clamp(v.y,-1,1)),az=Math.atan2(-v.z,v.x);
  var mN=Math.exp(-Math.pow((th-PULS_TILT)/.6,2)),mS=Math.exp(-Math.pow((th-(Math.PI-PULS_TILT))/.6,2));
  [0,Math.PI].forEach(function(of){var m=of?mN:mS;if(Math.floor((ph0+of-az)/TAU)!==Math.floor((o.ph+of-az)/TAU)){o.fl=Math.max(o.fl,m);if(focus===body||(body===sunBody&&m>.3))audPulse(.35+.65*m);}});
  o.fl*=Math.exp(-dt*16);
  /* yakından bakınca hüzme ekranı kaplamasın; manyetik alan çizgileri yalnızca yakındayken görünür */
  var rr=effVr(body),cd=camera.position.distanceTo(body.pos),nk=ss(rr*5,rr*40,cd);
  o.bmats.forEach(function(mt){mt.uniforms.f.value=o.fl*nk;mt.uniforms.k.value=.75*(.15+.85*nk);});
  if(o.mag)o.mag.material.opacity=.3*ss(rr*3,rr*12,cd)*(1-ss(rr*30,rr*120,cd));
  var mm=body.mesh.material;if(mm&&mm.uniforms&&mm.uniforms.mAx&&o.arm){o.arm.updateMatrixWorld();_v3.set(0,1,0).transformDirection(o.arm.matrixWorld).transformDirection(camera.matrixWorldInverse);mm.uniforms.mAx.value.copy(_v3);mm.uniforms.f.value=o.fl;}
  body.glow1.material.opacity=.55+o.fl*1.2;body.glow2.material.opacity=.18+o.fl*.5;
  if(body===sunBody)sunLight.intensity=SUN_TYPES[5].I*(1+o.fl*1.6);else if(body.light)body.light.intensity=SUN_TYPES[5].I*.7*(1+o.fl*1.6);
  nebStep(o,body,dt);
}
function nebStep(o,body,dt){if(o.neb){nebPxUpdate();o.nebT+=dt;
  /* kamera bulutsunun içindeyken tüm ekran pembe sise boğuluyordu: içeriden bakınca bulutsu söner (gerçekte de içinden bakınca seçilmez) */
  var nr=o.neb.scale.x,cdn=camera.position.distanceTo(body.pos),inK=ss(nr*.35,nr*1.1,cdn);
  o.neb.material.opacity=clamp(o.nebT/8,0,1)*(o.nebK||.5)*inK;o.neb.rotation.y+=dt*.004;/* kalıntı patlama dalgasının ardından genişler: küçük başlar, bir-iki dakikada eski boyutunun yaklaşık iki katına ulaşır (eskiden neredeyse sabitti) */
  o.neb.scale.setScalar(body.def.vr*(16+68*(1-Math.exp(-o.nebT/38))));}}
/* gezegenimsi bulutsu */
var PNEB=[];
function pnTex(){
  var S=384,c=document.createElement('canvas');c.width=c.height=S;var g=c.getContext('2d'),im=g.createImageData(S,S),D=im.data,Rn=Math.random;
  var rot=Rn()*Math.PI,e=.62+Rn()*.25,p1=Rn()*TAU,p2=Rn()*TAU,p3=Rn()*TAU,p4=Rn()*TAU,p5=Rn()*TAU,bip=Rn()<.6?.25+Rn()*.35:0,sd=Rn()*100,cr=Math.cos(rot),sr=Math.sin(rot);
  function vh(x,y){var v=Math.sin(x*127.1+y*311.7+sd)*43758.5453;return v-Math.floor(v);}
  function vn(x,y){var ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);var a=vh(ix,iy),b=vh(ix+1,iy),c2=vh(ix,iy+1),d=vh(ix+1,iy+1);return a+(b-a)*fx+(c2-a)*fy+(a-b-c2+d)*fx*fy;}
  for(var py=0;py<S;py++)for(var px=0;px<S;px++){
    var x0=px/S*2-1,y0=py/S*2-1,x=x0*cr-y0*sr,y=(x0*sr+y0*cr)/e,r=Math.sqrt(x*x+y*y),th=Math.atan2(y,x);
    var R0=.5*(1+.1*Math.sin(2*th+p1)+.06*Math.sin(3*th+p2)+.04*Math.sin(5*th+p3)),w=.08+.03*Math.sin(4*th+p4);
    var cl=.55*vn(x*9+3,y*9+7)+.45*vn(x*23,y*23),side=1+.4*Math.cos(th-p5);
    var ring=Math.exp(-Math.pow((r-R0)/w,2))*(.45+1.1*cl)*side;
    var inner=Math.exp(-Math.pow(r/(R0*.85),4))*(.12+.26*vn(x*6,y*6));
    var halo=Math.exp(-Math.pow((r-R0*1.45)/.16,2))*.16*(.5+cl);
    var lobe=bip?Math.exp(-Math.pow((Math.abs(x0*cr-y0*sr)-.72)/.18,2))*Math.exp(-Math.pow((x0*sr+y0*cr)/(.22+.1*Math.abs(x0*cr-y0*sr)),2))*bip*(.4+cl):0;
    var knot=r<R0&&r>R0-w*1.6&&vn(x*40,y*40)>.84?.35:0;
    var t=clamp((r-R0+w)/(2.4*w),0,1),rr=255,gg=200-130*t,bb=110-60*t;
    var I=ring*(1-knot);
    var R=inner*70+I*rr+halo*220+lobe*200,G=inner*210+I*gg+halo*50+lobe*90,B=inner*220+I*bb+halo*70+lobe*160;
    var A=Math.min(1,inner+I+halo+lobe)*Math.min(1,(1-r*.62)*3);
    var o=(py*S+px)*4;D[o]=Math.min(255,R/(A+.001)*.9);D[o+1]=Math.min(255,G/(A+.001)*.9);D[o+2]=Math.min(255,B/(A+.001)*.9);D[o+3]=clamp(A,0,1)*255;}
  g.putImageData(im,0,0);
  var t2=new THREE.CanvasTexture(c);t2.encoding=THREE.sRGBEncoding;return t2;
}
function planetaryNebula(){
  var t=labStar(),ty=t===sunBody?sunType:t.starType;
  if(!(ty===0||ty===3)){toast(ty===1?'Kırmızı cüceler bu evreye trilyonlarca yıl sonra ulaşır; dış katman atacak kadar şişmezler.':ty===2?'Mavi devler bulutsu bırakarak sönmez; süpernova olarak patlarlar.':'Bu yıldız zaten ölmüş durumda.',6000);return;}
  act('pn',{tg:t.id});
  var sp=nebPoints('pn');sp.scale.setScalar(t.def.vr*2);t.pivot.add(sp);
  PNEB.push({ts:simDays,sp:sp,t:0,R:t.def.vr});
  if(t===sunBody){setStar(4);focusBody('sun',{dist:sunBody.def.vr*40});}else{setStarOn(t,4);focusBody(t.def.id,{dist:t.def.vr*40});}
  toast((t===sunBody?'Güneş\'in gerçek sonu: yaklaşık 7,5 milyar yıl sonra kırmızı dev':t.def.name+': kırmızı dev')+' dış katmanlarını yavaşça uzaya savurdu; geriye sıcak çekirdek, yani beyaz cüce kaldı. Çekirdeğin morötesi ışığı bu kabuğu parlatıyor: gezegenimsi bulutsu (adı yanıltıcı, gezegenle ilgisi yok). Yaklaşık 10.000 yıl görünür kalır.',9000);
  if(typeof audWhoosh==='function')audWhoosh();
}
/* birleşme/başarısız süpernova kabuğu (kırmızı nova) az kütlelidir: genişledikçe incelir, soğuyup toza dönüşür ve sönükleşir.
   Gezegenimsi bulutsu ise beyaz cücenin morötesi ışığıyla on binlerce yıl parlar. */
function pnStep(dt){if(PNEB.length)nebPxUpdate();for(var i=PNEB.length-1;i>=0;i--){var P=PNEB[i];P.t+=dt;var lrn=P.k==='lrn';
  P.sp.scale.setScalar(P.R*(lrn?2+30*(1-Math.exp(-P.t/26)):2+58*(1-Math.exp(-P.t/14))));P.sp.rotation.y+=dt*.003;
  /* oluşum: kabuk önce soğuk ve kızıl görünür; beyaz cüce ortaya çıkıp ısındıkça (3–15. saniye) gaz iyonlaşır, renkler açılır */
  if(!lrn)P.sp.material.uniforms.ion.value=clamp((P.t-3)/12,0,1);
  P.sp.material.opacity=lrn?clamp(P.t/3,0,1)*.7*Math.exp(-P.t/38):clamp(P.t/4,0,1)*.9*(P.t>180?Math.max(0,1-(P.t-180)/40):1);if(P.t>(lrn?170:220)){P.sp.parent&&P.sp.parent.remove(P.sp);P.sp.geometry.dispose();P.sp.material.dispose();PNEB.splice(i,1);}}}
function audPulse(vol){
  if(!AUD.on||!AUD.ctx||document.hidden)return;var ctx=AUD.ctx,t=ctx.currentTime+.005;
  var b=ctx.createBufferSource();b.buffer=AUD.nb||(AUD.nb=audNoise(ctx));var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.9;b.connect(bp);audEnv(bp,t,.0015,.42*vol,.035);b.start(t,Math.random()*3);b.stop(t+.08);
  var o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(55,t+.06);audEnv(o,t,.002,.3*vol,.06);o.start(t);o.stop(t+.1);
}
function updateExotic(dt){
  if(EXO.beams)pulsarStep(EXO,sunBody,dt);else if(EXO.neb)nebStep(EXO,sunBody,dt);
  pnStep(dt);
  if(EXO.disk)EXO.disk.material.uniforms.t.value+=dt;
  if(EXO.disk&&!EXO.col)bhStep(EXO,sunBody,dt);
  BODIES.forEach(function(b){if(b===sunBody||!b.def.star||isGone(b))return;
    if(b.exo){if(b.exo.beams)pulsarStep(b.exo,b,dt);if(b.exo.disk)bhStep(b.exo,b,dt);}
    if(b.exoCol&&colStep(b,b.exoCol,dt)){b.exoCol=null;setStarOn(b,6);flashAt(b.pivot,new THREE.Vector3(),b.def.vr*8,0xffe8d0);toast(b.def.name+' artık bir kara delik. Işığı kesildi; yalnızca arkadaki ışığı büken karanlık bir gölge görünür, disk madde yutunca parlar.',5000);}
  });
  if(EXO.col&&colStep(sunBody,EXO.col,dt))blackHoleDone(true);
  var S=EXO.sn;if(!S)return;S.t+=dt;
  var spd=OVD()*.35,r=S.t*spd;
  S.shell.scale.setScalar(Math.max(.01,r));S.shell.material.opacity=clamp(1-S.t/9,0,1)*.9;
  if(S.kn){S.shell.visible=false;knStep(S,dt);}
  else{S.flash.scale.setScalar(S.R*(6+S.t*30));S.flash.material.opacity=clamp(1-S.t/2.5,0,1);}
  if(S.cb===sunBody&&!S.kn)sunLight.intensity=S.t<2?8*(1-S.t/2)+.9:sunLight.intensity;
  BODIES.forEach(function(b){
    if(b.parent||b.def.star||b.def.craft||b.def.id==='sun'||S.hit[b.id]||isGone(b)||b.engulfed)return;
    var d=b.pos.distanceTo(S.c);if(d>r||(S.cb!==sunBody&&d>OVD()*.5))return;S.hit[b.id]=1;
    /* kilonova: fırlayan madde süpernovadakinin ~%1'i, momentumu ~15 kat az; yalnızca yakın gezegenler etkilenir (~3 AU içi) */
    if(S.kn&&invOrbit(d)>3)return;
    var rocky=b.hab&&!b.hab.gas&&(b.hab.surf||b.hab.atm==='co2');
    if(rocky&&invOrbit(d)<1.8){flashAt(b.pivot,new THREE.Vector3(),effVr(b)*5,0xcfe0ff);destroyBody(b);S.gone.push(b.def.name);}
    else if(b.hab){b.hab.atm=b.hab.gas?'h2':'none';b.hab.water=0;b.hab.melt=rocky?1:b.hab.melt;b.impT0=simDays;b.impK=rocky?1:.4;atmoVisual(b);S.burnt.push(b.def.name);}
  });
  if(S.t>(S.kn?16:9)){scene.remove(S.shell);if(S.flash.parent)S.flash.parent.remove(S.flash);if(S.jets){if(S.jets.parent)S.jets.parent.remove(S.jets);S.jets.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}EXO.sn=null;if(S.bh&&!S.gone.length&&!S.burnt.length)return;
    if(S.kn){if(S.gone.length||S.burnt.length)toast((S.gone.length?S.gone.join(', ')+' buharlaştı. ':'')+(S.burnt.length?S.burnt.join(', ')+' kilonovanın fırlattığı maddeyle kavruldu. ':'')+'Uzaktaki gezegenler etkilenmedi.',7000);return;}
    toast((S.gone.length?S.gone.join(', ')+' buharlaştı. ':'')+(S.burnt.length?S.burnt.join(', ')+' kavruldu, atmosferleri söküldü. ':'')+(S.ia?'Yıldızdan geriye hiçbir şey kalmadı.':S.bh?'Geriye bir kara delik kaldı.':'Geriye dönen bir nötron yıldızı (pulsar) kaldı.'),9000);}
}
function supernova(){
  var tg=labStar();if(tg!==sunBody){starNova(tg);return;}
  if(EXO.sn||sunType>=5){toast('Yıldız zaten öldü; önce yıldız türünü değiştir');return;}
  if(sunType===1){toast('Kırmızı cüceler süpernova olamaz: çok hafifler, yakıtlarını trilyonlarca yılda yavaşça yakarlar.',6000);return;}
  act('nova',{tg:'sun'});
  if(sunType!==4&&sunMass>=20){EXO.col=colInit(sunBody);EXO.col.mode=sunMass>=40?'grb':'fallback';focusBody('sun',{dist:EXO.col.mode==='grb'?Math.max(effVr(sunBody)*9,OVD()*.15):OVD()*.9});
    toast('Süpernova! '+Math.round(sunMass)+' Güneş kütleli bir yıldızın çekirdeği nötron yıldızı olarak kalamayacak kadar ağır: geriye kara delik kalacak. Çekirdek çöküyor…'+pauseNote(),6000);return;}
  if(sunType===4){snStart(sunBody,true);SUN_PEND=7;after(1.8,function(){if(SUN_PEND===7)setStar(7);});focusBody('sun',{dist:OVD()*.9});
    toast('Tip Ia süpernova! Beyaz cüce 1,4 Güneş kütlesi sınırını aşınca karbon bir anda tutuşur ve yıldız tamamen parçalanır; geriye hiçbir şey kalmaz. Gerçekte kütlesi yok olduğu için gezegenler düz bir çizgide uzaya savrulurdu; burada yörüngeler korunuyor.',9000);
    if(typeof audWhoosh==='function')audWhoosh();return;}
  snStart(sunBody,false);SUN_PEND=5;
  after(1.8,function(){if(SUN_PEND===5){setStar(5);nsMass(sunBody);}});
  focusBody('sun',{dist:OVD()*.9});
  toast((sunType===2?'Süpernova! Mavi devler gerçekten böyle ölür: demir çekirdek çöker, dış katmanlar ışık hızının onda biriyle savrulur. Geriye bir nötron yıldızı kalır.':'Süpernova! Not: Güneş gerçekte süpernova olamaz, en az 8 Güneş kütlesi gerekir. Bu bir "ya olsaydı" senaryosu.')+(sunMass>2.3?' Kütlenin çoğu uzaya savrulur: geriye yaklaşık 1,4 Güneş kütleli nötron yıldızı kalır, gezegenler çok daha zayıf çekilir.':''),8000);
  if(typeof audWhoosh==='function')audWhoosh();
}
/* ---- kilonova (iki nötron yıldızının birleşmesi; GW170817 / AT2017gfo) ----
   0–1,5 sn: kısa gama ışını patlaması, kutuplardan dar iki jet (gerçekte ~2 saniye, ışık hızına yakın).
   Sonra kilonova: fırlayan ~0,01–0,05 Güneş kütlesi madde ağır elementler (r-süreci) üretirken radyoaktif bozunmayla ısınır.
   Önce mavi-beyaz (lantanitsiz "mavi bileşen", ~1 gün), sonra kızıla döner (lantanitçe zengin "kırmızı bileşen", ~1 hafta) ve söner.
   Tepe parlaklığı süpernovanın yüzde birinden azdır; burada günler saniyelere kısaltıldı. */
function kilonova(t,ej){
  snStart(t,false);var S=EXO.sn;S.kn=true;S.ej=ej;S.flash.material.color.setHex(0xcfe0ff);S.flash.scale.setScalar(.01);
  /* parlama ve jetler kalıntıya bağlı: yörüngede ilerlese de üstünde kalır */
  t.pivot.add(S.flash);S.flash.position.set(0,0,0);S.flash.userData.post=true;
  var R=effVr(t),L=R*32,jets=new THREE.Group(),ax=new THREE.Vector3(Math.random()-.5,1,Math.random()-.5).normalize();
  var jm=beamMat(1.6,R*.5),pg=new THREE.PlaneGeometry(2,1,1,1);pg.translate(0,.5,0);
  [1,-1].forEach(function(sg){var st=new THREE.Mesh(pg,jm);st.scale.y=L;if(sg<0)st.rotation.z=Math.PI;st.renderOrder=3;st.frustumCulled=false;jets.add(st);});
  jets.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),ax);jets.userData.post=true;t.pivot.add(jets);S.jets=jets;S.jm=jm;
}
var _knC1=new THREE.Color(0xd8e6ff),_knC2=new THREE.Color(0xffb070),_knC3=new THREE.Color(0xc0381a);
function knStep(S,dt){
  var t=S.t,R=effVr(S.cb),k=clamp(S.ej/.05,.15,1.2);
  /* kalıntının pulsar ışınları kilonova sürerken gizli: ortalık fırlayan maddeyle kaplı */
  var bx=S.cb===sunBody?EXO:S.cb.exo;if(bx&&bx.beams)bx.beams.visible=t>14;
  if(S.jets){var jk=t<1.6?1-t/1.6:0;S.jm.uniforms.k.value=1.6*jk;S.jm.uniforms.f.value=jk;S.jets.visible=jk>0;}
  /* parlama ~2 sn'de tepe yapar, 14 sn'de söner; renk mavi-beyaz → turuncu → koyu kızıl */
  var rise=ss(.2,2,t),fall=1-ss(3,15,t),a=rise*fall*k,q=clamp((t-1.5)/9,0,1),c=S.flash.material.color;
  if(q<.5)c.copy(_knC1).lerp(_knC2,q*2);else c.copy(_knC2).lerp(_knC3,(q-.5)*2);
  S.flash.scale.setScalar(Math.min(R*(14+t*7),camera.position.distanceTo(S.cb.pos)*.55));S.flash.material.opacity=Math.min(1,a*1.3);
}
function snStart(cb,ia){
  var sg=new THREE.SphereGeometry(1,48,32),sm=new THREE.MeshBasicMaterial({color:0xbfd8ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,wireframe:false});
  var shell=new THREE.Mesh(sg,new THREE.ShaderMaterial({uniforms:{},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vO;void main(){vO=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vN;varying vec3 vV;varying vec3 vO;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}void main(){float f=1.0-abs(dot(normalize(vN),vV));float fil=.5+.5*sin(vO.x*9.0+sin(vO.y*7.0)*2.0)*sin(vO.z*8.0+sin(vO.x*5.0));gl_FragColor=vec4(mix(vec3(.6,.75,1.0),vec3(1.0,.45,.25),fil)*pow(f,3.0)*(.35+fil*.5),1.0);}'}));
  shell.material.opacity=1;scene.add(shell);shell.position.copy(cb.pos);
  var ft=glowTex([[0,'rgba(255,255,255,1)'],[.2,'rgba(220,235,255,.8)'],[1,'rgba(160,200,255,0)']]);
  var fl=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));scene.add(fl);fl.position.copy(cb.pos);
  EXO.sn={ts:simDays,t:0,shell:shell,flash:fl,hit:{},gone:[],burnt:[],cb:cb,c:cb.pos.clone(),ia:!!ia,R:cb.def.vr};
}
function bhBlock(t){var ty=t===sunBody?sunType:t.starType;
  if(ty===1)return 'Kırmızı cüceler kara delik olamaz: çok hafifler. Trilyonlarca yıl sonra sessizce beyaz cüceye dönüşürler.';
  if(ty===4)return 'Beyaz cüce kara deliğe çökmez. Üzerine madde yağıp 1,4 Güneş kütlesini aşarsa Tip Ia süpernova olarak tamamen patlar. Süpernova düğmesini dene.';
  if(ty===5&&!(t===sunBody&&sunMass>=2.3))return 'Nötron yıldızı ancak üzerine madde yağıp yaklaşık 2,3 Güneş kütlesini aşarsa kara deliğe çöker.'+(t===sunBody?' Kütle kaydırıcısını 2,3×\'ün üstüne çıkarıp tekrar dene.':'');
  if(ty===7)return 'Burada artık bir yıldız yok.';return null;}
/* ---- gerçekçi çekirdek çöküşü ----
   0–1,2 sn: demir çekirdek çöker (dışarıdan görünmez), sonra sekme + nötrino patlaması.
   Kütleye göre: <20 M☉ geri düşmeli süpernova, 20–40 M☉ başarısız süpernova (yıldız sessizce kaybolur),
   ≥40 M☉ kolapsar: iki kutup jeti = uzun gama ışını patlaması. Nötron yıldızı: doğrudan çöküş. */
function pauseNote(){return playing&&!reverse?'':' Zaman durdurulmuş: oynatınca devam eder.';}
function rsOf(M){var r=2.95*M;return (r<10?r.toFixed(1):Math.round(r).toLocaleString('tr-TR')).replace('.',',')+' km';}
function colRemnant(C){var M=C.M;return C.mode==='ns'?M*.98:C.mode==='failed'?M*.9:C.mode==='grb'?M*.8:(M<8?M*.9:Math.max(3,M*.4));}
function colInit(b){var ty=stType(b),M=stMass(b),C={t:0,s0:b.typeScale,M:M,mode:ty===5?'ns':M>=40?'grb':M>=20?'failed':'fallback',objs:[]};C.Mr=colRemnant(C);return C;}
/* kalıntı kütlesi: patlamada savrulan madde sistemden çıkar (yerçekimi açıksa gezegen yörüngeleri genişler, hatta çözülür) */
function colApplyMass(b,C){var Mr=colRemnant(C);if(b===sunBody){sunMass=Mr+EATEN/333000;$('sMass').value=sliderFromMass(Math.max(.1,Mr));$('oMass').textContent=massTxt();}else b.massAbs=Mr;}
function colAbort(C){if(!C||!C.objs)return;C.objs.forEach(function(o){o.parent&&o.parent.remove(o);});C.objs=[];}
function burstRing(host,R,col,T){var rg=new THREE.Mesh(new THREE.RingGeometry(.93,1,160),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.7,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));rg.rotation.x=-Math.PI/2;host.add(rg);FXL.push({o:rg,t:0,T:T||3,k:'ring',s:R});}
function makeJets(){
  var g=new THREE.CylinderGeometry(.024,.004,1,24,10,true);g.translate(0,.5,0);
  var m=new THREE.ShaderMaterial({uniforms:{op:{value:0},t:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying float vY;varying vec3 vN;varying vec3 vV;void main(){vY=position.y;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float op;uniform float t;varying float vY;varying vec3 vN;varying vec3 vV;void main(){float core=pow(abs(dot(normalize(vN),vV)),1.5);float knot=.75+.25*sin(vY*60.0-t*40.0);float a=pow(1.0-vY,1.4)*op*core*knot;gl_FragColor=vec4(mix(vec3(1.0,.97,.9),vec3(.5,.65,1.0),vY)*a,1.0);}'});
  var G=new THREE.Group(),j1=new THREE.Mesh(g,m),j2=new THREE.Mesh(g,m);j2.rotation.z=Math.PI;j1.frustumCulled=j2.frustumCulled=false;G.add(j1);G.add(j2);G.userData.m=m;return G;
}
function colMsg(b,C){
  var nm=b===sunBody?'Güneş':b.def.name,Mr=colRemnant(C),lost=1-Mr/C.M,rs=(lost>.05?' Patlamada kütlenin %'+Math.round(lost*100)+'\'i uzaya savruldu; kara deliğin kütlesi '+(Mr<10?Mr.toFixed(1).replace('.',','):Math.round(Mr))+' Güneş'+(gravityOn&&b===sunBody?'. Çekim zayıfladığı için gezegenlerin yörüngeleri genişleyecek':'')+'.':'')+' Olay ufku yarıçapı: '+rsOf(Mr)+'.';
  if(C.mode==='ns')return nm+': nötron yıldızı kütle sınırını aştı. Nötron basıncı bile ağırlığı taşıyamadı ve yıldız milisaniyeler içinde kara deliğe çöktü. Kısa bir nötrino ve kütleçekim dalgası parlaması oldu; savrulacak dış katman olmadığı için patlama yok.'+rs;
  var core='Çekirdek çöktü! Demir çekirdek saniyenin onda birinde birkaç bin km\'den 20-30 km\'ye büzüldü ve geri sekti. Açığa çıkan kütleçekim enerjisi yaklaşık 3×10⁴⁶ J: Güneş\'in 10 milyar yıllık ömrü boyunca saldığının 250 katı. Bunun %99\'unu birkaç saniyede kaçan nötrinolar taşır. ';
  if(C.mode==='fallback')return core+'Şok dalgası dış katmanları savurdu (süpernova), ama yetmedi: maddenin bir kısmı geri düştü ve yeni doğan nötron yıldızını kara deliğe çevirdi (geri düşmeli süpernova).'+(C.M<8?' Not: '+nm+' gerçekte bunun için fazla hafif; en az 20 Güneş kütlesi gerekir.':'')+rs;
  if(C.mode==='failed')return core+'Başarısız süpernova: şok dalgası yıldızı patlatamadı. Nötrinoların götürdüğü kütle çekimi biraz zayıflattı; gevşek dış zarf yavaşça savruldu (soluk kırmızı parıltı). Sonra yıldız sessizce gözden kayboldu. NGC 6946-BH1 adlı yıldızın böyle kaybolduğu düşünülüyor.'+rs;
  return core+'Kolapsar: hızlı dönen çekirdek doğrudan kara deliğe çöktü. Etrafında oluşan disk, kutuplardan ışık hızına yakın iki jet fırlattı: uzun gama ışını patlaması (GRB). Jet bize dönük olsaydı milyarlarca ışık yılı öteden görünürdü.'+(C.M>300?' (Gerçekte bilinen en ağır yıldızlar 200-300 Güneş kütlesi civarındadır.)':'')+rs;
}
function colStep(b,C,dt){
  if(dt<=0)return false;
  var sun=b===sunBody,t0=C.t;C.t+=dt;var t=C.t,R=b.def.vr,host=b.pivot,I0=SUN_TYPES[b.starType].I*(sun?1:.7);
  function light(v){if(sun)sunLight.intensity=v;else if(b.light)b.light.intensity=v;}
  if(sun&&sunBody.sunU)sunBody.sunU.ha.value=0;
  var TB=C.mode==='ns'?.35:1.2;
  if(t<TB){light(I0*(1+.05*Math.sin(t*37)));return false;}
  if(t0<TB){
    flashAt(host,new THREE.Vector3(),R*(C.mode==='ns'?10:18),0xd8ecff);burstRing(host,R*40,0xcfe6ff,2.6);
    if(C.mode==='ns')gwRipple(host,R*30);
    if(C.mode==='fallback'||C.mode==='grb'){if(!EXO.sn){snStart(b,false);EXO.sn.bh=true;}}
    if(C.mode==='failed'){var sp=nebPoints('lrn');sp.scale.setScalar(R*2.2);host.add(sp);PNEB.push({ts:simDays,k:'lrn',sp:sp,t:0,R:R*.7});}
    if(C.mode==='grb'){var J=makeJets();J.quaternion.copy(b.tilt.quaternion);host.add(J);C.jets=J;C.objs.push(J);}
    toast(colMsg(b,C),13000);toastLock=performance.now()+11000;if(typeof audWhoosh==='function')audWhoosh();
  }
  var D=C.mode==='ns'?1.2:C.mode==='failed'?4.5:3.6,f=Math.min(1,(t-TB)/D),e=f*f*(3-2*f);
  b.typeScale=C.s0+(typeSc(b,6)-C.s0)*e;b.tilt.scale.setScalar(b.mod.size*b.typeScale);b.vr=effVr(b);
  if(C.mode==='failed')light(I0*(1+.9*Math.sin(Math.PI*Math.min(1,f*2.2)))*(1-e));
  else if(!(sun&&EXO.sn&&EXO.sn.t<2))light(I0*(1-e)+(f<.1?(1-f/.1)*I0*3:0));
  if(C.jets){var L=OVD()*(.02+.33*Math.pow(Math.min(1,(t-TB)/2.2),.7)),m=C.jets.userData.m;C.jets.scale.setScalar(L);m.uniforms.op.value=Math.min(1,(t-TB)/.25)*Math.pow(1-f,.6)*1.1;m.uniforms.t.value=t;}
  if(f>=1){colAbort(C);colApplyMass(b,C);return true;}
  return false;
}
function blackHole(){
  var tg=labStar(),bl=bhBlock(tg);if(bl){toast(bl,7000);return;}
  if(!(tg===sunBody&&(EXO.col||sunType===6))&&!tg.exoCol&&!(tg!==sunBody&&tg.starType===6))act('bh',{tg:tg.id});if(tg!==sunBody){starBH(tg);return;}
  if(EXO.col||sunType===6)return;
  EXO.col=colInit(sunBody);focusBody('sun',{dist:EXO.col.mode==='grb'?Math.max(effVr(sunBody)*9,OVD()*.15):effVr(sunBody)*9});toast('Çekirdek çöküyor…'+pauseNote(),4000);
}
function blackHoleDone(quiet){
  var wasNS=sunType===5;if(EXO.col)colAbort(EXO.col);EXO.col=null;setStar(6);flashAt(sunBody.pivot,new THREE.Vector3(),sunBody.def.vr*10,0xffe8d0);
  if(quiet){toast('Güneş artık bir kara delik. Işığı kesildi; gezegenler donuyor. Henüz yutacak maddesi olmadığı için disk yok: yalnızca arkadaki ışığı büken karanlık bir gölge ve zayıf bir halka görünür. Olay ufku yarıçapı '+rsKm()+'.',5000);return;}
  if(wasNS){toast('Nötron yıldızı kütle sınırını aştı: nötronlar bile ağırlığa dayanamadı ve yıldız kara deliğe çöktü. Olay ufku yarıçapı '+rsKm()+'.',8000);return;}
  toast('Güneş aynı kütleli bir kara deliğe dönüştü. Yörüngeler değişmez, çünkü kütle aynı! Ama ışık kesildiği için gezegenler donar. Olay ufku yarıçapı '+rsKm()+' olurdu (kütleyle doğru orantılı büyür). Gerçekte Güneş kara delik olamayacak kadar hafiftir.',9000);
}
$('sNova').addEventListener('click',supernova);
$('sBH').addEventListener('click',blackHole);$('sPN').addEventListener('click',planetaryNebula);
