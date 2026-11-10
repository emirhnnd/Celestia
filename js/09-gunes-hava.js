/* Celestia · Güneş aktivitesi, Dünya hava durumu ve diğer gezegenlerde hava olayları.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- Güneş aktivitesi: protuberans, parlama, CME, kutup ışığı, meteor ---------- */
var ACT_K=[1,1.8,.7,.6,0,0,0,0],actLevel=1,auroraBoost=0,showPart=false;
var FX=null;
var PROM_VS='uniform float grow;uniform float R;varying vec3 vN;varying vec3 vV;varying vec2 vU;void main(){vU=uv;float rad=length(position);vec3 d=position/rad;float nr=R+(rad-R)*grow;vec3 p=position+d*(nr-rad);vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(p,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
var PROM_FS='uniform float grow;uniform float time;uniform float seed;uniform vec3 col;varying vec3 vN;varying vec3 vV;varying vec2 vU;\n'+SUN_GLSL+'\nvoid main(){float fr=abs(dot(normalize(vN),vV));float core=pow(fr,1.6);float f1=fbm3(vec3(vU.x*9.0-time*.18,vU.y*1.6,seed));float f2=fbm3(vec3(vU.x*26.0+time*.1,vU.y*3.0,seed+4.0));float fil=smoothstep(.38,.72,f1*.65+f2*.35);float ends=smoothstep(0.0,.12,vU.x)*smoothstep(1.0,.88,vU.x);float a=core*fil*ends*grow*.5*smoothstep(.0,.35,1.0-fr*.6);vec3 c=mix(vec3(.75,.12,.03),vec3(1.0,.42,.14),core*fil);c=mix(c,col,.2);gl_FragColor=vec4(c*a,1.0);}';
function buildFx(){
  var R=sunBody.def.vr,g=new THREE.Group();sunBody.tilt.add(g);
  FX={R:R,g:g,proms:[],t:0,nextFlare:3,nextCme:9,nextMet:4,flares:[],cme:null,met:null};
  var col=new THREE.Color(SUN_TYPES[sunType].glow);
  for(var i=0;i<7;i++){
    var m=new THREE.ShaderMaterial({uniforms:{grow:{value:0},R:{value:R},time:{value:0},seed:{value:Math.random()*50},col:{value:col.clone()}},vertexShader:PROM_VS,fragmentShader:PROM_FS,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    var mesh=new THREE.Mesh(new THREE.BufferGeometry(),m);mesh.frustumCulled=false;g.add(mesh);
    FX.proms.push({mesh:mesh,life:1,dur:1,wait:i*1.4});
  }
  /* parlama parçacıkları (güneş yerel uzayı) */
  var N=360,pos=new Float32Array(N*3),cl=new Float32Array(N*3);
  var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));pg.setAttribute('color',new THREE.BufferAttribute(cl,3));
  FX.sp={N:N,pos:pos,cl:cl,vel:new Float32Array(N*3),age:new Float32Array(N).fill(9),life:new Float32Array(N).fill(1),i:0,geo:pg};
  FX.spPts=new THREE.Points(pg,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,map:dotTex()}));
  FX.spPts.frustumCulled=false;g.add(FX.spPts);
  /* parlama noktası */
  var gt=glowTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,230,180,.7)'],[1,'rgba(255,160,60,0)']]);
  FX.flash=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));g.add(FX.flash);
  /* CME bulutu (dünya uzayı) */
  var M=320,cp=new Float32Array(M*3),cc=new Float32Array(M*3),cg=new THREE.BufferGeometry();
  cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('color',new THREE.BufferAttribute(cc,3));
  FX.cm={M:M,pos:cp,col:cc,dir:new Float32Array(M*3),spd:new Float32Array(M),r:new Float32Array(M),geo:cg,on:false,t:0,hit:false,aim:new THREE.Vector3()};
  FX.cmPts=new THREE.Points(cg,new THREE.PointsMaterial({size:3.4,sizeAttenuation:false,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,map:dotTex()}));
  FX.cmPts.frustumCulled=false;FX.cmPts.visible=false;scene.add(FX.cmPts);
  /* güneş rüzgârı */
  var W=700,wp=new Float32Array(W*3),wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.BufferAttribute(wp,3));
  FX.wd={W:W,pos:wp,dir:new Float32Array(W*3),r:new Float32Array(W),sp:new Float32Array(W)};
  for(var k=0;k<W;k++)respawnWind(k,true);
  FX.wind=new THREE.Points(wg,new THREE.PointsMaterial({color:0xffe0b0,size:2.2,sizeAttenuation:false,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,map:dotTex()}));
  FX.wind.frustumCulled=false;scene.add(FX.wind);
  /* meteorlar */
  var mp=new Float32Array(6*2*3),mc=new Float32Array(6*2*3),mg=new THREE.BufferGeometry();
  mg.setAttribute('position',new THREE.BufferAttribute(mp,3));mg.setAttribute('color',new THREE.BufferAttribute(mc,3));
  FX.met={pos:mp,col:mc,geo:mg,life:new Float32Array(6),a:[],v:[]};for(var q=0;q<6;q++){FX.met.a.push(new THREE.Vector3());FX.met.v.push(new THREE.Vector3());}
  FX.metLines=new THREE.LineSegments(mg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  FX.metLines.frustumCulled=false;scene.add(FX.metLines);
}
function respawnWind(k,init){
  var d=FX.wd,u=Math.random()*2-1,t=Math.random()*TAU,s=Math.sqrt(1-u*u);
  d.dir[k*3]=s*Math.cos(t);d.dir[k*3+1]=u*.25;d.dir[k*3+2]=s*Math.sin(t);
  var L=Math.hypot(d.dir[k*3],d.dir[k*3+1],d.dir[k*3+2]);d.dir[k*3]/=L;d.dir[k*3+1]/=L;d.dir[k*3+2]/=L;
  d.sp[k]=rnd(4,10)*DS;d.r[k]=init?rnd(0,260*DS):effVr(sunBody)*1.05;
}
function newProm(p){
  var R=FX.R,A=new THREE.Vector3(rnd(-1,1),rnd(-.8,.8),rnd(-1,1)).normalize();
  var ax=new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).cross(A).normalize();
  var ang=rnd(.06,.22),B=A.clone().applyAxisAngle(ax,ang),h=R*(.04+ang*.45)*rnd(.7,1.15);
  var pts=[];for(var i=0;i<=14;i++){var t=i/14,v=A.clone().lerp(B,t).normalize();pts.push(v.multiplyScalar(R*(1-.04*(1-Math.sin(Math.PI*t)))+h*Math.pow(Math.sin(Math.PI*t),.8)));}
  var cv2=new THREE.CatmullRomCurve3(pts),geo=new THREE.TubeGeometry(cv2,36,R*rnd(.014,.026),8,false);
  p.mesh.geometry.dispose();p.mesh.geometry=geo;p.life=0;p.dur=rnd(16,30)/Math.max(.4,actLevel);p.mesh.material.uniforms.seed.value=Math.random()*50;
}
function emitFlare(){
  var R=FX.R,n=new THREE.Vector3(rnd(-1,1),rnd(-.7,.7),rnd(-1,1)).normalize(),sp=FX.sp;
  FX.flash.position.copy(n).multiplyScalar(R*1.02);FX.flash.userData.t=0;
  for(var k=0;k<28;k++){
    var i=sp.i=(sp.i+1)%sp.N,v=new THREE.Vector3(rnd(-.5,.5),rnd(-.5,.5),rnd(-.5,.5)).add(n.clone().multiplyScalar(rnd(.6,1.4))).normalize().multiplyScalar(R*rnd(.35,1.1));
    sp.pos[i*3]=n.x*R;sp.pos[i*3+1]=n.y*R;sp.pos[i*3+2]=n.z*R;sp.vel[i*3]=v.x;sp.vel[i*3+1]=v.y;sp.vel[i*3+2]=v.z;sp.age[i]=0;sp.life[i]=rnd(1.6,3.2);
  }
  return n;
}
function emitCme(aimEarth){
  var cm=FX.cm,ea=byId.earth,dir=new THREE.Vector3(rnd(-1,1),rnd(-.2,.2),rnd(-1,1)).normalize();
  if(aimEarth&&ea&&!isEngulfed(ea))dir.copy(ea.pos).normalize();
  cm.aim.copy(dir);cm.on=true;cm.t=0;cm.hit=false;cm.hits={};cm.force=false;FX.cmPts.visible=showPart;
  var up=Math.abs(dir.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),e1=new THREE.Vector3().crossVectors(dir,up).normalize(),e2=new THREE.Vector3().crossVectors(dir,e1);
  for(var i=0;i<cm.M;i++){
    var a=Math.random()*TAU,rr=Math.sqrt(Math.random())*.38,d=dir.clone().add(e1.clone().multiplyScalar(Math.cos(a)*rr)).add(e2.clone().multiplyScalar(Math.sin(a)*rr)).normalize();
    cm.dir[i*3]=d.x;cm.dir[i*3+1]=d.y;cm.dir[i*3+2]=d.z;cm.spd[i]=rnd(5,8.5)*DS;cm.r[i]=effVr(sunBody)*1.02;
  }
  if(aimEarth)note('Koronal kütle atımı Dünya\'ya yöneldi');
}
function updateSolarFx(now,dt){
  if(!sunBody||!sunBody.mesh)return;
  if(!FX)buildFx();
  var act=actLevel*(ACT_K[sunType]||0)*(EXO.col?0:1),R=FX.R,t=now*.001;FX.t=t;
  /* protuberanslar */
  FX.proms.forEach(function(p){
    var u=p.mesh.material.uniforms;u.time.value=t;
    if(p.wait>0){p.wait-=dt;u.grow.value=0;return;}
    p.life+=dt/p.dur;
    if(p.life>=1){if(act>.05&&Math.random()<Math.min(1,.5+act*.5)){newProm(p);}else{p.wait=2;u.grow.value=0;}return;}
    u.grow.value=ss(0,.25,p.life)*ss(1,.7,p.life)*clamp(act,0,1.3);
    u.col.value.setHex(SUN_TYPES[sunType].glow);
  });
  FX.g.visible=act>.02;
  /* parlama */
  FX.nextFlare-=dt*act;if(FX.nextFlare<=0){emitFlare();FX.nextFlare=rnd(3.5,8);if(Math.random()<.18)FX.nextCme=Math.min(FX.nextCme,.5);}
  var f=FX.flash;if(f.userData.t!=null){f.userData.t+=dt;var ft=f.userData.t;f.material.opacity=ft<3?Math.sin(Math.min(1,ft/3)*Math.PI)*.55:0;f.scale.setScalar(R*(.25+Math.min(ft,2)*.18));}
  var sp=FX.sp;
  for(var i=0;i<sp.N;i++){
    if(sp.age[i]>=sp.life[i]){sp.cl[i*3]=sp.cl[i*3+1]=sp.cl[i*3+2]=0;continue;}
    sp.age[i]+=dt;var a=sp.age[i]/sp.life[i];
    sp.pos[i*3]+=sp.vel[i*3]*dt;sp.pos[i*3+1]+=sp.vel[i*3+1]*dt;sp.pos[i*3+2]+=sp.vel[i*3+2]*dt;
    var px=sp.pos[i*3],py=sp.pos[i*3+1],pz=sp.pos[i*3+2],pr=Math.sqrt(px*px+py*py+pz*pz),gk=R*R*.55/(pr*pr+1)*dt;
    sp.vel[i*3]-=px/pr*gk*2;sp.vel[i*3+1]-=py/pr*gk*2;sp.vel[i*3+2]-=pz/pr*gk*2;
    var fa=(1-a)*(1-a);sp.cl[i*3]=1*fa;sp.cl[i*3+1]=.62*fa;sp.cl[i*3+2]=.22*fa;
  }
  sp.geo.attributes.position.needsUpdate=true;sp.geo.attributes.color.needsUpdate=true;
  /* CME */
  FX.nextCme-=dt*act;if(FX.nextCme<=0&&!FX.cm.on){emitCme(Math.random()<.45);FX.nextCme=rnd(22,40);}
  var cm=FX.cm;
  if(cm.on){
    cm.t+=dt;var maxR=orbitR(10),ea=byId.earth,far=0;
    for(var j=0;j<cm.M;j++){
      cm.r[j]+=cm.spd[j]*dt;var r=cm.r[j];
      cm.pos[j*3]=cm.dir[j*3]*r;cm.pos[j*3+1]=cm.dir[j*3+1]*r;cm.pos[j*3+2]=cm.dir[j*3+2]*r;
      var fa=clamp(1-r/maxR,0,1)*clamp((r-effVr(sunBody))*.5,0,1);far=Math.max(far,r);
      cm.col[j*3]=.7*fa;cm.col[j*3+1]=.34*fa;cm.col[j*3+2]=.14*fa;
    }
    cm.geo.attributes.position.needsUpdate=true;cm.geo.attributes.color.needsUpdate=true;
    BODIES.forEach(function(pb){
      if(pb.parent||!pb.hab||pb.def.star||isEngulfed(pb)||(cm.hits&&cm.hits[pb.id]))return;
      var er=pb.pos.length(),ang=Math.acos(clamp(pb.pos.clone().normalize().dot(cm.aim),-1,1));
      if(far>er&&ang<.32){cm.hits=cm.hits||{};cm.hits[pb.id]=1;pb.aurB=1;if(pb===focus||pb===ea)audWhoosh();if(pb===ea)auroraBoost=1;
        var h=pb.hab,msg=pb.def.name+': güneş fırtınası ulaştı';
        if(h.atm==='none')msg+=' (atmosfer yok, yüzey doğrudan parçacık yağmuruna tutuldu)';
        else if(h.mag<.3)msg+=' (manyetik kalkan zayıf, atmosferden bir miktar gaz koptu)';
        else msg+=', kutup ışıkları';
        if(pb===focus||pb===ea)note(msg);}
    });
    if(far>maxR+5){cm.on=false;FX.cmPts.visible=false;}
  }
  auroraBoost=Math.max(0,auroraBoost-dt*.05);
  BODIES.forEach(function(pb){if(!pb.shU||!pb.hab)return;pb.aurB=Math.max(0,(pb.aurB||0)-dt*.05);var base=pb.def.id==='earth'?.07:0,bo=pb.def.id==='earth'?auroraBoost:pb.aurB;pb.shU.aur.value=(base+bo*.9)*(.25+.75*pb.hab.mag)*(pb.hab.atm==='none'?0:1);});
  BODIES.forEach(function(b){if(b.shU)b.shU.tm.value=t;});
  /* güneş rüzgârı */
  var wAct=sunType===5?1.4:act;FX.wind.material.color.setHex(sunType===5?0x9fc8ff:sunType===1||sunType===3?0xffb090:sunType===2?0xbfd4ff:0xffe0b0);
  var d=FX.wd,sr=effVr(sunBody);FX.wind.visible=showPart&&wAct>.02&&!SYS;FX.spPts.visible=showPart;if(cm.on)FX.cmPts.visible=showPart||cm.force;FX.wind.material.opacity=clamp(.16+act*.14,.05,.45);
  if(FX.wind.visible){
  for(var k=0;k<d.W;k++){
    d.r[k]+=d.sp[k]*dt*(.6+wAct*.5)*(sunType===5?3:1);if(d.r[k]>270*DS)respawnWind(k,false);
    var rr=Math.max(d.r[k],sr*1.03);d.pos[k*3]=d.dir[k*3]*rr;d.pos[k*3+1]=d.dir[k*3+1]*rr;d.pos[k*3+2]=d.dir[k*3+2]*rr;
  }
  FX.wind.geometry.attributes.position.needsUpdate=true;}
  /* meteorlar */
  var mt=FX.met;FX.nextMet-=dt;
  if(FX.nextMet<=0){
    FX.nextMet=rnd(3,8);var k2=-1;for(var m=0;m<6;m++)if(mt.life[m]<=0){k2=m;break;}
    if(k2>=0){var u=Math.random()*2-1,tt=Math.random()*TAU,s=Math.sqrt(1-u*u),dd=new THREE.Vector3(s*Math.cos(tt),u,s*Math.sin(tt));
      var tg=new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).cross(dd).normalize();
      mt.a[k2].copy(camera.position).add(dd.multiplyScalar(2400));mt.v[k2].copy(tg).multiplyScalar(rnd(1100,1800));mt.life[k2]=rnd(.5,.9);mt.life[k2+6]=mt.life[k2];}
  }
  for(var m2=0;m2<6;m2++){
    var l=mt.life[m2];
    if(l>0){mt.life[m2]-=dt;mt.a[m2].addScaledVector(mt.v[m2],dt);var tail=mt.a[m2].clone().addScaledVector(mt.v[m2],-.09),fa2=clamp(mt.life[m2]*2,0,1);
      mt.pos.set([mt.a[m2].x,mt.a[m2].y,mt.a[m2].z,tail.x,tail.y,tail.z],m2*6);
      mt.col.set([fa2,fa2,fa2,0,0,0],m2*6);}
    else{mt.col.fill(0,m2*6,m2*6+6);}
  }
  mt.geo.attributes.position.needsUpdate=true;mt.geo.attributes.color.needsUpdate=true;
}
function bindSolarUi(){
  var s=$('sAct');if(!s)return;
  s.addEventListener('input',function(){actLevel=+this.value;$('oAct').textContent=actLevel.toFixed(1).replace('.',',')+'×';});
  /* starFlare sonraki bir dosyada tanımlı: ad, yüklenirken değil tıklanınca çözülsün */
  $('sFlare').addEventListener('click',function(){starFlare();});
}

bindSolarUi();
Array.prototype.forEach.call(document.querySelectorAll('.dsb'),function(b){
  var cur=function(){return b.dataset.ds==='R'?REAL:(!REAL&&+b.dataset.ds===DS);};
  b.setAttribute('aria-checked',String(cur()));
  b.addEventListener('click',function(){if(cur())return;try{localStorage.setItem('se_ds',b.dataset.ds);}catch(e){}
    try{sessionStorage.setItem('se_carry',JSON.stringify({c:encodeState(),d:simDays,f:focus&&focus.id,ev:!!(gravityOn||EVENTS.length)}));}catch(e){}
    toast('Mesafe ölçeği değişiyor…');setTimeout(function(){location.reload();},350);});
});
/* ---------- Dünya hava durumu (simülasyon zamanına bağlı) ---------- */
var wxT=0;
var WX={P:8,R:null,G:null,C:null,nTex:null,cTex:null,u:null};
function wxInit(){
  if(WX.R)return;
  var seed=1234567;function rr(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}
  var N=256,R=new Uint8Array(N*N),G=new Uint8Array(N*N),d=new Uint8Array(N*N*4);
  for(var i=0;i<N*N;i++)R[i]=Math.floor(rr()*256);
  for(var y=0;y<N;y++)for(var x=0;x<N;x++){var k=y*N+x;G[k]=R[((y+17)%N)*N+((x+37)%N)];d[k*4]=R[k];d[k*4+1]=G[k];d[k*4+3]=255;}
  WX.R=R;WX.G=G;
  var nt=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);nt.wrapS=nt.wrapT=THREE.RepeatWrapping;nt.magFilter=nt.minFilter=THREE.LinearFilter;nt.generateMipmaps=false;nt.needsUpdate=true;WX.nTex=nt;
  if(!EMASK)initEarthMask();
  var BL=[ // lat, lon, yarıçap(°), yıllık, yaz farkı
    [23,10,14,-.38,0],[23,47,9,-.32,0],[-25,133,12,-.32,0],[-23,-70,6,-.32,0],[30,-110,8,-.2,-.05],[-23,20,7,-.22,.05],[43,105,9,-.2,.05],[38,60,8,-.2,-.05],
    [-3,-62,12,.24,0],[0,22,9,.22,0],[-2,115,12,.24,0],[8,-75,6,.12,.1],
    [22,80,12,-.06,.42],[18,103,10,0,.3],[28,115,7,.06,.16],[13,-15,7,-.08,.3],
    [36,138,6,.14,.14],[41.4,31.8,3.5,.2,-.08],[41,40,4,.15,-.05],[55,-5,8,.2,0],[61,6,5,.18,0],[48,-124,6,.2,-.12],[-45,-73,6,.26,0],[50,8,7,.08,0],
    [38,15,10,0,-.3],[36,-5,6,-.04,-.25],[34,-119,5,-.08,-.2],[60,30,9,.08,0],[65,-20,6,.15,0]];
  var C=new Uint8Array(360*180*4);
  for(var j=0;j<180;j++){var lat=90-(j+.5);for(var i2=0;i2<360;i2++){
    var lon=-180+(i2+.5),land=emSample((lon+180)/360,(90-lat)/180)>.5?1:0;
    var ann=-.12*land*Math.exp(-Math.pow((Math.abs(lat)-25)/10,2)),sea=.06*land*(Math.abs(lat)>20&&Math.abs(lat)<60?1:0);
    for(var b=0;b<BL.length;b++){var q=BL[b],dl=lon-q[1];if(dl>180)dl-=360;if(dl<-180)dl+=360;var dd=lat-q[0],c=Math.cos(lat*D2R);var g=Math.exp(-(dd*dd+dl*dl*c*c)/(q[2]*q[2]));ann+=q[3]*g;sea+=q[4]*g;}
    var k2=(j*360+i2)*4;C[k2]=Math.round(clamp(.5+ann,0,1)*255);C[k2+1]=Math.round(clamp(.5+sea,0,1)*255);C[k2+3]=255;
  }}
  WX.C=C;
  var ct=new THREE.DataTexture(C,360,180,THREE.RGBAFormat);ct.wrapS=THREE.RepeatWrapping;ct.wrapT=THREE.ClampToEdgeWrapping;ct.magFilter=ct.minFilter=THREE.LinearFilter;ct.generateMipmaps=false;ct.needsUpdate=true;WX.cTex=ct;
}
function wxBil(A,W,H,x,y,ch,stride,wrapY){
  var x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,x1=x0+1,y1=y0+1;
  x0=((x0%W)+W)%W;x1=((x1%W)+W)%W;
  if(wrapY){y0=((y0%H)+H)%H;y1=((y1%H)+H)%H;}else{y0=clamp(y0,0,H-1);y1=clamp(y1,0,H-1);}
  var s=stride||1,o=ch||0,a=A[(y0*W+x0)*s+o],b=A[(y0*W+x1)*s+o],c=A[(y1*W+x0)*s+o],d=A[(y1*W+x1)*s+o];
  return ((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy)/255;
}
function wxN3(x,y,z){
  var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
  var ux=ix+37*iz+fx,uy=iy+17*iz+fy;
  var r=wxBil(WX.R,256,256,ux,uy,0,1,true),g=wxBil(WX.G,256,256,ux,uy,0,1,true);
  return r+(g-r)*fz;
}
function wxFbm(x,y,z){var s=0,a=.5;for(var i=0;i<5;i++){s+=a*wxN3(x,y,z);var nx=(.8*y+.6*z)*2.03,ny=(-.8*x+.36*y-.48*z)*2.03,nz=(-.6*x-.48*y+.64*z)*2.03;x=nx;y=ny;z=nz;a*=.5;}return s;}
function wxWind(lat){var al=Math.abs(lat);return -8*Math.exp(-Math.pow(lat/18,2))+14*Math.exp(-Math.pow((al-45)/12,2))-4*Math.exp(-Math.pow((al-75)/8,2));}
function wxState(){
  var t=wxT/WX.P,k=Math.floor(t),f=t-k,tb=t+.5,kb=Math.floor(tb),fb=tb-kb;
  var dt=new Date(J2000+simDays*86400000),doy=(dt-Date.UTC(dt.getUTCFullYear(),0,1))/86400000;
  /* mevsim katsayısı: Güneş'in en büyük sapması eğiklikle orantılı (seasonK); eğiklik 0'da mevsim yok, 90°'de Dünya'dakinin ~2,4 katı */
  var ee=byId.earth,sk=ee?seasonK(ee):1;
  return {fA:f,fB:fb,sA:((k%53)+53)%53,sB:(((kb+17)%53)+53)%53,wA:1-Math.abs(2*f-1),wB:1-Math.abs(2*fb-1),s:sk*Math.cos(TAU*(doy-172)/365.25),sk:sk,doy:doy};
}
function wxLayer(px,py,pz,w,f,sd){
  var a=w*D2R*WX.P*(f-.5),ca=Math.cos(a),sa=Math.sin(a);
  var x=px*ca-pz*sa,z=pz*ca+px*sa;
  return wxFbm(x*4.6+sd*1.31,py*4.6+sd*.71,z*4.6+f*.5);
}
function wxBand(lat,s){var al=Math.abs(lat),sg=lat>0?1:(lat<0?-1:0);return .5+.28*Math.exp(-Math.pow((lat-6*s)/7,2))-.22*Math.exp(-Math.pow((al-25+3*s*sg)/9,2))+.14*Math.exp(-Math.pow((al-55)/12,2));}
function wxAt(lat,lon,st){
  var phi=(lon+180)/360*TAU,cl=Math.cos(lat*D2R),px=-Math.cos(phi)*cl,py=Math.sin(lat*D2R),pz=Math.sin(phi)*cl;
  var w=wxWind(lat),dA=wxLayer(px,py,pz,w,st.fA,st.sA),dB=wxLayer(px,py,pz,w,st.fB,st.sB);
  var d=(st.wA*(dA-.485)+st.wB*(dB-.485))/Math.hypot(st.wA,st.wB);
  var u=(lon+180)/360,v=(90-lat)/180,ann=wxBil(WX.C,360,180,u*360-.5,v*180-.5,0,4,false),sea=wxBil(WX.C,360,180,u*360-.5,v*180-.5,1,4,false);
  var sg=lat>0?1:(lat<0?-1:0),cov=wxBand(lat,st.s)+(ann-.5)+(sea-.5)*st.s*sg;
  var x=.5+d+(cov-.5)*.75;
  if(WX.R){var aA=w*D2R*WX.P*(st.fA-.5),aB=w*D2R*WX.P*(st.fB-.5),rr=function(a,o){var uu=u-a/TAU+o;uu-=Math.floor(uu);return wxBil(WX.R,512,256,uu*512-.5,v*256-.5,0,1,false)/255;};
    var rA=rr(aA,wxROff(st.sA)),rB=rr(aB,wxROff(st.sB)),r=(st.wA*rA+st.wB*rB)/Math.max(st.wA+st.wB,.001);x=x+(.45+r*.3+(cov-.5)*.15-x)*WX.RK;}
  return {x:x,d:d,cov:cov};
}
function wxROff(sd){var f=sd*.6180339;return (f-Math.floor(f))*.5-.25;}
var WX_GLSL=[
'uniform vec4 cyc[4];uniform float cyT;uniform sampler2D nT;uniform sampler2D cT;uniform sampler2D rT;uniform float rK;uniform vec2 rO;varying vec2 vUv;uniform vec4 lay;uniform vec2 wts;uniform float seas;uniform float wP;uniform float op;uniform vec3 tint;',
'varying vec3 vObj;varying vec3 vN;varying vec3 vP;',
'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);vec2 uv=i.xy+vec2(37.0,17.0)*i.z+f.xy;vec2 rg=texture2D(nT,(uv+.5)/256.0).xy;return mix(rg.x,rg.y,f.z);}',
'float fb5(vec3 p){float s=0.0;float a=.5;for(int i=0;i<5;i++){s+=a*n3(p);p=vec3(.8*p.y+.6*p.z,-.8*p.x+.36*p.y-.48*p.z,-.6*p.x-.48*p.y+.64*p.z)*2.03;a*=.5;}return s;}',
'float layer(vec3 p,float w,float f,float sd){float a=w*0.0174533*wP*(f-.5);float ca=cos(a);float sa=sin(a);vec3 r=vec3(p.x*ca-p.z*sa,p.y,p.z*ca+p.x*sa);return fb5(vec3(r.x*4.6+sd*1.31,r.y*4.6+sd*.71,r.z*4.6+f*.5));}',
'void main(){',
' vec3 p=normalize(vObj);float lat=asin(clamp(p.y,-1.0,1.0))*57.29578;float al=abs(lat);',
' float w=-8.0*exp(-pow(lat/18.0,2.0))+14.0*exp(-pow((al-45.0)/12.0,2.0))-4.0*exp(-pow((al-75.0)/8.0,2.0));',
' float dA=layer(p,w,lay.x,lay.z);float dB=layer(p,w,lay.y,lay.w);',
' float d=(wts.x*(dA-.485)+wts.y*(dB-.485))/length(wts);',
' float u=fract(atan(p.z,-p.x)/6.2831853);float v=.5-asin(clamp(p.y,-1.0,1.0))/3.14159265;',
' vec4 ct=texture2D(cT,vec2(u,v));float sg=sign(lat);',
' float band=.5+.28*exp(-pow((lat-6.0*seas)/7.0,2.0))-.22*exp(-pow((al-25.0+3.0*seas*sg)/9.0,2.0))+.14*exp(-pow((al-55.0)/12.0,2.0));',
' float cov=band+(ct.r-.5)+(ct.g-.5)*seas*sg;',
' float x=.5+d+(cov-.5)*.75;',
' if(rK>0.0){float aA=w*0.0174533*wP*(lay.x-.5);float aB=w*0.0174533*wP*(lay.y-.5);float rA=texture2D(rT,vec2(vUv.x-aA/6.2831853+rO.x,vUv.y)).r;float rB=texture2D(rT,vec2(vUv.x-aB/6.2831853+rO.y,vUv.y)).r;float r=(wts.x*rA+wts.y*rB)/max(wts.x+wts.y,.001);x=mix(x,.45+r*.3+(cov-.5)*.15,rK);}',
' for(int i=0;i<4;i++){vec4 cy=cyc[i];if(cy.w>.01){vec3 cc=cy.xyz;float R=.15;float dd=acos(clamp(dot(p,cc),-1.0,1.0));if(dd<R*2.0){vec3 e=normalize(cross(vec3(0.0,1.0,0.0),cc));vec3 nn=cross(cc,e);vec2 q=vec2(dot(p,e),dot(p,nn))/R;float r=length(q);float hs=cc.y>0.0?1.0:-1.0;float ph=atan(q.y,q.x)+hs*cyT;float arm=.5+.5*sin(2.0*ph*hs-log(r+.03)*4.5+fb5(p*30.0)*2.0);float fall=exp(-r*r*1.1);float eye=smoothstep(.05,.11,r*(1.0+.4*(1.0-cy.w)));float wall=exp(-pow((r-.14)/.06,2.0));float core=exp(-r*r*2.2);x=mix(x,.35,fall*cy.w*.6);x+=cy.w*(core*.42+fall*(.05+.3*smoothstep(.25,.85,arm))+wall*.25)*eye;x-=cy.w*(1.0-eye)*.9;}}}',
' float a=smoothstep(.47,.67,x)*op;float rn=smoothstep(.62,.72,x);',
' vec3 n=normalize(vN);vec3 sp=(viewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;vec3 L=normalize(sp-vP);float dd=dot(n,L);',
' float lit=max(dd,0.0)*1.15+.002;',
' vec3 c=mix(vec3(1.0),vec3(.48,.51,.56),rn)*tint*lit;',
' c+=vec3(.9,.45,.25)*smoothstep(-.12,0.0,dd)*(1.0-smoothstep(0.0,.18,dd))*.015;',
' gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),a*.96);',
'}'].join('\n');
function weatherMaterial(){
  wxInit();
  var U={rT:{value:DUMMY},rK:{value:0},rO:{value:new THREE.Vector2()},nT:{value:WX.nTex},cT:{value:WX.cTex},lay:{value:new THREE.Vector4()},wts:{value:new THREE.Vector2(1,0)},seas:{value:0},wP:{value:WX.P},op:{value:1},tint:{value:new THREE.Color(1,1,1)},cyc:{value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4()]},cyT:{value:0}};
  WX.u=U;
  return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vObj;varying vec3 vN;varying vec3 vP;varying vec2 vUv;void main(){vUv=uv;vObj=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:WX_GLSL});
}
function updateWeather(){
  if(!WX.u)return;var st=wxState(),U=WX.u;
  U.lay.value.set(st.fA,st.fB,st.sA,st.sB);U.wts.value.set(st.wA,st.wB);U.seas.value=st.s;U.rO.value.set(wxROff(st.sA),wxROff(st.sB));
  var e=byId.earth;if(e&&e.shU){e.shU.seas.value=st.s;e.shU.dTg.value=e.cl?clamp(e.cl.Ts-288,-60,60):0;}
  var list=activeStorms();WX.storms=list;
  for(var i=0;i<4;i++){var v=U.cyc.value[i],s=list[i];if(s){var la=s.lat*D2R,a=(s.lon+180)/360*TAU,cl=Math.cos(la);v.set(-Math.cos(a)*cl,Math.sin(la),Math.sin(a)*cl,s.k);}else v.w=0;}
  U.cyT.value=wxT*1.2;stormFollow();
  var key=list.map(function(s){return s.id;}).join(',');
  
  WX.key=key;
}
/* Fırtına havzaları. g: doğum bölgeleri [enlem min, enlem max, boylam min, boylam max, ağırlık]; h: ilk yön (derece, doğudan saat yönü tersine:
   180 batı, 90 kuzey, 270 güney); v: ilerleme hızı (derece/gün, gerçekte 15-25 km/sa ≈ 3-5°/gün); pr: kıvrılma (recurvature) olasılığı;
   lr: kıvrılmanın başladığı enlem; he: kıvrılınca yöneldiği yön (kuzeyde kuzeydoğu, güneyde güneydoğu). Kıvrılmayan fırtınalar
   yavaşça kutba doğru sapar (beta kayması) ve çoğu karaya vurup söner. Değerler NOAA/JTWC iz istatistiklerinin kabaca özetidir. */
var BASINS=[
  {n:'Kasırga · Atlas Okyanusu',s0:155,s1:330,slots:4,p:.5,g:[[9,17,-45,-18,.55],[13,27,-96,-62,.45]],h:[150,172],v:[2.6,4],pr:.62,lr:[20,30],he:45},
  {n:'Kasırga · Doğu Pasifik',s0:140,s1:310,slots:3,p:.45,g:[[9,18,-115,-90,1]],h:[155,180],v:[2.4,3.8],pr:.2,lr:[16,22],he:70},
  {n:'Tayfun · Batı Pasifik',s0:120,s1:340,slots:4,p:.55,g:[[6,20,124,168,1]],h:[145,172],v:[2.6,4],pr:.55,lr:[18,28],he:50},
  {n:'Siklon · Bengal Körfezi',s0:270,s1:345,slots:1,p:.5,g:[[8,16,84,93,1]],h:[95,130],v:[2.5,4],pr:.45,lr:[15,19],he:55},
  {n:'Siklon · Arap Denizi',s0:280,s1:330,slots:1,p:.3,g:[[10,18,62,72,1]],h:[110,165],v:[2.5,4],pr:.3,lr:[18,22],he:60},
  {n:'Siklon · Güney Hint Okyanusu',s0:320,s1:470,slots:2,p:.5,g:[[-16,-7,52,98,1]],h:[190,220],v:[2.4,3.8],pr:.5,lr:[17,24],he:315},
  {n:'Siklon · Avustralya',s0:330,s1:460,slots:2,p:.45,g:[[-18,-10,108,162,1]],h:[195,250],v:[2.2,3.6],pr:.45,lr:[17,24],he:310}
];
function landAt(lat,lon){if(!EMASK)initEarthMask();return emSample((((lon+180)/360)%1+1)%1,clamp(.5-lat/180,0,1))>.5;}
/* fırtınanın t (0-1) anındaki konumu ve gücü: yol, doğduğu andan küçük adımlarla ilerletilir; karada ve soğuk suda hızla zayıflar */
function stormAt(B,yy,bi,k,t,dur){
  function r(n){return h3(yy,bi*7+n,k*13+5);}
  var gi=0,w=r(1),acc=0;for(var q=0;q<B.g.length;q++){acc+=B.g[q][4];if(w<=acc){gi=q;break;}gi=q;}
  var G=B.g[gi],lat=G[0]+(G[1]-G[0])*r(2),lon=G[2]+(G[3]-G[2])*r(3),sgn=lat>=0?1:-1;
  var h0=(B.h[0]+(B.h[1]-B.h[0])*r(4))*D2R,v=B.v[0]+(B.v[1]-B.v[0])*r(5),rec=r(6)<B.pr,lr=B.lr[0]+(B.lr[1]-B.lr[0])*r(7),he=B.he*D2R,wob=r(8)*TAU;
  var days=t*dur,n=Math.max(1,Math.ceil(days/.25)),dt=days/n,tr=0,land=0,cold=0,head=h0;
  for(var i=0;i<n;i++){var d=i*dt;
    if(rec&&(Math.abs(lat)>=lr||d>dur*.6))tr=Math.min(1,tr+dt/2.2);
    head=h0+sgn*.035*d+(he-h0)*tr*tr*(3-2*tr)+.12*Math.sin(wob+d*1.3);
    var sp=v*(1+tr*.9);lat+=Math.sin(head)*sp*dt;lon+=Math.cos(head)*sp*dt/Math.max(.25,Math.cos(lat*D2R));
    if(landAt(lat,lon))land+=dt;else land=Math.max(0,land-dt*.3);
    if(Math.abs(lat)>28)cold+=dt*(Math.abs(lat)-28)/8;}
  lon=((lon+540)%360)-180;
  return {lat:lat,lon:lon,decay:Math.exp(-land/.45)*Math.exp(-cold*.5),land:land>.2,rec:rec&&tr>.5};
}
function activeStorms(any){
  var e=byId.earth,out=[];
  if(!e||!e.hab||isEngulfed(e)||e.hab.water<.3||(e.hab.melt||0)>.1||e.hab.atm==='none'||!e.cl||e.cl.Ts<275||e.cl.Ts>340)return out;
  if(!any&&SPEEDS[speedIdx].d>400)return out;
  var dt=new Date(J2000+simDays*86400000),Y=dt.getUTCFullYear(),doy=(dt-Date.UTC(Y,0,1))/86400000,warm=clamp((e.cl.Ts-275)/13,0,1.6);
  BASINS.forEach(function(B,bi){
    for(var yo=-1;yo<=0;yo++){var yy=Y+yo,dd=doy-yo*365.25;
      for(var k=0;k<B.slots;k++){
        if(h3(yy,bi*7+3,k*13+1)>B.p*Math.min(1.3,warm))continue;
        var dur=6+h3(yy,bi,k+50)*7,st=B.s0+h3(yy+3,bi,k)*(B.s1-B.s0-dur);
        if(dd<st||dd>st+dur)continue;
        var t=(dd-st)/dur,S=stormAt(B,yy,bi,k,t,dur);
        var k0=Math.sin(Math.PI*Math.min(1,t*1.1))*S.decay;if(k0<.06)continue;
        var cat=Math.max(1,Math.min(5,Math.round(1+4*h3(yy,bi,k+33)*k0)));
        out.push({id:yy+'-'+bi+'-'+k,name:B.n,lat:S.lat,lon:S.lon,k:clamp(k0*(.55+cat*.09),0,1),cat:cat,t:t,land:S.land,rec:S.rec});
      }
    }
  });
  out.sort(function(a,b){return b.k-a.k;});return out.slice(0,4);
}
/* kamera fırtınayı izler: Dünya döndükçe ve fırtına ilerledikçe görüş fırtınanın üstünde kalır; sürükleyince bırakılır */
var _sv=new THREE.Vector3();
function stormFollow(){
  var id=WX.follow;if(!id)return;var e=byId.earth;
  if(mode!=='orbit'||focus!==e||!e||!e.clouds){WX.follow=null;return;}
  var s=(WX.storms||[]).filter(function(x){return x.id===id;})[0];
  if(!s){WX.follow=null;toast('Fırtına dağıldı',2500);return;}
  var la=s.lat*D2R,a=(s.lon+180)/360*TAU,cl=Math.cos(la);_sv.set(-Math.cos(a)*cl,Math.sin(la),Math.sin(a)*cl).transformDirection(e.clouds.matrixWorld);
  var th=Math.atan2(_sv.z,_sv.x),ph=Math.acos(clamp(_sv.y,-1,1)),d=Math.atan2(Math.sin(th-theta),Math.cos(th-theta)),k=trans?0:1-Math.exp(-Math.min(.1,FRAME_DT)*10);
  theta+=d*k;phi+=(ph-phi)*k;
  if(s.land!==WX.fLand){WX.fLand=s.land;if(s.land)toast(s.name.split(' · ')[0]+' karaya vurdu: sıcak okyanus suyundan kopunca hızla zayıflıyor',4500);}
}
var WXCITIES=[
  ['Samsun',41.29,36.33,[7,7,8,11,16,20,23,23,20,16,12,9]],
  ['Zonguldak',41.45,31.79,[6,6,8,12,16,21,23,23,20,16,12,8]],
  ['İstanbul',41.01,28.97,[6,6,8,12,17,22,24,25,21,17,12,8]],
  ['Ankara',39.93,32.86,[0,2,6,11,16,20,24,24,19,13,7,2]],
  ['Erzurum',39.9,41.27,[-9,-8,-3,5,10,14,19,19,14,8,0,-6]],
  ['Tokyo',35.68,139.69,[5,6,9,14,19,22,26,27,24,18,13,8]],
  ['Londra',51.51,-0.13,[5,5,7,10,13,16,19,18,16,12,8,6]],
  ['Kahire',30.04,31.24,[14,15,18,22,25,28,29,29,27,24,19,15]],
  ['Mumbai',19.08,72.88,[24,25,27,29,30,29,28,27,28,29,28,26]],
  ['Manaus',-3.12,-60.02,[27,27,27,27,27,28,28,29,29,29,28,28]],
  ['New York',40.71,-74.01,[0,2,6,12,17,22,25,25,21,14,9,3]],
  ['Sidney',-33.87,151.21,[23,23,22,19,16,13,13,14,16,18,20,22]]
];
function wxLabel(x,T){
  if(x>=.7)return [T<1?'Yoğun kar':'Sağanak yağış','bad'];
  if(x>=.64)return [T<1?'Kar':'Yağmurlu','bad'];
  if(x>=.57)return ['Bulutlu','warn'];
  if(x>=.5)return ['Parçalı bulutlu','warn'];
  return ['Açık','good'];
}
function renderWeather(b){
  var box=$('wx');if(!box)return;
  var ok=b&&b.def.id==='earth'&&WX.u&&!isEngulfed(b)&&b.hab&&b.hab.atm!=='none';
  box.hidden=!ok;if(!ok)return;
  var st=wxState(),m=st.doy/365.25*12-.5,m0=Math.floor(m),fm=m-m0,dT=b.cl?(b.cl.Ts-288):0;
  var html=WXCITIES.map(function(c){
    var r=wxAt(c[1],c[2],st),a=c[3][((m0%12)+12)%12],z=c[3][((m0+1)%12+12)%12],mm=c[3].reduce(function(s,v){return s+v;},0)/12,
      T=mm+(a+(z-a)*fm-mm)*st.sk+r.d*14-Math.max(0,r.x-.5)*6+dT;
    var L=wxLabel(r.x,T);
    return '<div class="hrow"><i class="q '+L[1]+'"></i><span>'+esc(c[0])+'</span><b>'+esc(L[0])+' · '+Math.round(T)+' °C</b></div>';
  }).join('')+stormRows(st);var wr=$('wxRows');if(wr.__h!==html){wr.__h=html;wr.innerHTML=html;}
  /* düğme ve not sabit: satırlar her 0,3 sn'de yeniden yazıldığından düğme içerideyken tıklama/dokunma arada kayboluyordu */
  var g=$('wxGo'),gt=(WX.storms&&WX.storms.length)?'Fırtınayı göster':'Sonraki fırtınaya git';if(g&&g.textContent!==gt)g.textContent=gt;var nt=$('wxNote');if(nt&&!nt.textContent)nt.textContent='Kasırga, tayfun ve siklonlar ılık okyanuslarda, kendi mevsimlerinde oluşur ve bir haftayı biraz aşkın sürer. Yeri ve zamanı gerçek fırtınaları göstermez, modelin rastgele üretimidir. Kuzey yarım kürede saat yönünün tersine, güneyde saat yönünde dönerler. Hortumlar (tornado) birkaç yüz metre genişliğinde oldukları için uzaydan görülmez; en sık ilkbaharda ABD\'nin orta ovalarında, "Hortum Koridoru"nda olurlar.';
}
function stormRows(st){
  var L=(WX.storms||[]).map(function(s){return '<div class="hrow"><i class="q bad"></i><span>'+esc(s.name)+'</span><b>'+(s.k>.45?'Kategori '+s.cat:'Tropikal fırtına')+'</b></div>';});
  var m=new Date(J2000+simDays*86400000).getUTCMonth(),torn=m>=3&&m<=5;
  return (L.length?'<div class="tag" style="margin-top:6px">Tropikal fırtınalar</div>'+L.join(''):'')+
    (torn?'<div class="hrow"><i class="q warn"></i><span>Hortum mevsimi</span><b>ABD\'nin orta ovaları</b></div>':'');
}

/* ---------- diğer gezegenlerde hava olayları ---------- */
// mode: 0 Venüs süper dönüş, 1 Mars toz, 2 gaz devi jetleri, 3 Neptün/Uranüs, 4 Titan
var PWX={
  venus:{mode:0,c1:[.96,.9,.7],c2:[.85,.72,.45],cov:.92,op:.92,P:3,sc:[2.2,5.5,2.2],light:0},
  mars:{mode:1,c1:[.86,.62,.4],c2:[.95,.95,1],cov:.18,op:.85,P:6,sc:[3,3,3],light:0},
  jupiter:{mode:2,c1:[1,.98,.93],c2:[.75,.55,.4],cov:.2,op:.7,P:20,sc:[3,12,3],light:1},
  saturn:{mode:2,c1:[1,.98,.9],c2:[.9,.82,.62],cov:.14,op:.6,P:25,sc:[3,14,3],light:1},
  uranus:{mode:3,c1:[.95,1,1],c2:[.8,.95,.97],cov:.1,op:.6,P:20,sc:[3,10,3],light:0},
  neptune:{mode:3,c1:[.97,.99,1],c2:[.6,.75,1],cov:.18,op:.75,P:10,sc:[3,10,3],light:0},
  titan:{mode:4,c1:[.95,.93,.88],c2:[.9,.6,.3],cov:.15,op:.7,P:12,sc:[3,5,3],light:0}
};
var PWX_GLSL=[
'uniform sampler2D nT;uniform vec4 lay;uniform vec2 wts;uniform float wP;uniform float op;uniform vec3 c1;uniform vec3 c2;uniform vec3 sc;uniform float cov;uniform float storm;uniform float mode;uniform float lightn;uniform float tm;uniform float lk;uniform float sd;uniform vec3 spot;uniform float spotA;',
'varying vec3 vObj;varying vec3 vN;varying vec3 vP;',
'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);vec2 uv=i.xy+vec2(37.0,17.0)*i.z+f.xy;vec2 rg=texture2D(nT,(uv+.5)/256.0).xy;return mix(rg.x,rg.y,f.z);}',
'float fb5(vec3 p){float s=0.0;float a=.5;for(int i=0;i<5;i++){s+=a*n3(p);p=vec3(.8*p.y+.6*p.z,-.8*p.x+.36*p.y-.48*p.z,-.6*p.x-.48*p.y+.64*p.z)*2.03;a*=.5;}return s;}',
'float wind(float lat){float al=abs(lat);',
' if(mode<.5)return -90.0*cos(lat*0.01745);',
' if(mode<1.5)return 6.0*sin(lat*0.035);',
' if(mode<2.5)return 9.0*cos(lat*0.21)+4.0*exp(-pow(lat/12.0,2.0));',
' if(mode<3.5)return -14.0*exp(-pow(lat/30.0,2.0))+8.0*exp(-pow((al-60.0)/15.0,2.0));',
' return 3.0*cos(lat*0.035);}',
'float layer(vec3 p,float w,float f,float s){float a=w*0.0174533*wP*(f-.5);float ca=cos(a);float sa=sin(a);vec3 r=vec3(p.x*ca-p.z*sa,p.y,p.z*ca+p.x*sa);return fb5(r*sc+vec3(s*1.31+sd,s*.71,f*.5));}',
'void main(){',
' vec3 p=normalize(vObj);float lat=asin(clamp(p.y,-1.0,1.0))*57.29578;float al=abs(lat);',
' float w=wind(lat);float dA=layer(p,w,lay.x,lay.z);float dB=layer(p,w,lay.y,lay.w);',
' float d=(wts.x*(dA-.485)+wts.y*(dB-.485))/length(wts);',
' float c=cov+storm;',
' if(mode<.5){c+=.08*sin(lat*0.12);}',
' if(mode>1.5&&mode<2.5){c*=.6+.8*exp(-pow((al-22.0)/12.0,2.0));}',
' if(mode>2.5&&mode<3.5){c*=.4+1.2*exp(-pow((al-30.0)/15.0,2.0));}',
' float x=.5+d*1.3+(c-.5)*.9;',
' float a=smoothstep(.5,.66,x)*op;',
' if(mode<.5)a=op*(.82+.18*smoothstep(.35,.7,x));',
' float st=smoothstep(.62,.75,x);',
' vec3 n=normalize(vN);vec3 spv=(viewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;vec3 L=normalize(spv-vP);float dd=dot(n,L);',
' float lit=max(dd,0.0)*1.1+.003;',
' vec3 col=mix(c1,c2,mode<.5?smoothstep(.3,.7,x):(mode<1.5?0.0:st*.5))*lit*lk;',
' if(mode<.5){col=mix(c2,c1,smoothstep(.25,.75,x+.15*sin(lat*0.2)))*lit*lk;}',
' if(spotA>.01){float sd2=length((p-spot)*vec3(1.0,1.9,1.0));float a2=smoothstep(.1,.06,sd2)*spotA;col=mix(col,vec3(.03,.07,.22)*lit*lk,a2);float ring=exp(-pow((sd2-.11)/.018,2.0))*spotA;col=mix(col,vec3(.95,.97,1.0)*lit*lk,ring);a=max(a,max(a2*.9,ring*.8));}',
' if(lightn>.5){vec3 cell=floor(p*40.0);float fl=step(.985,fract(sin(dot(cell+floor(tm*7.0),vec3(12.9898,78.233,37.719)))*43758.5453));col+=vec3(.75,.85,1.0)*fl*st*(1.0-smoothstep(-.05,.1,dd))*2.5;a=max(a,fl*st*(1.0-smoothstep(-.05,.1,dd)));}',
' gl_FragColor=vec4(pow(col,vec3(1.0/2.2)),a);',
'}'].join('\n');
function planetWxMaterial(id){
  wxInit();var c=PWX[id];
  var U={nT:{value:WX.nTex},lay:{value:new THREE.Vector4()},wts:{value:new THREE.Vector2(1,0)},wP:{value:c.P},op:{value:c.op},c1:{value:new THREE.Vector3(c.c1[0],c.c1[1],c.c1[2])},c2:{value:new THREE.Vector3(c.c2[0],c.c2[1],c.c2[2])},sc:{value:new THREE.Vector3(c.sc[0],c.sc[1],c.sc[2])},cov:{value:c.cov},storm:{value:0},mode:{value:c.mode},lightn:{value:c.light},tm:{value:0},lk:{value:1},sd:{value:id.length*3.7},spot:{value:new THREE.Vector3(1,0,0)},spotA:{value:0}};
  return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vObj;varying vec3 vN;varying vec3 vP;void main(){vObj=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:PWX_GLSL});
}
function addPlanetWx(b){
  if(!PWX[b.def.id]||b.pwx)return;
  var m=new THREE.Mesh(new THREE.SphereGeometry(b.def.vr*1.008,LOWQ?48:72,LOWQ?32:48),planetWxMaterial(b.def.id));
  b.tilt.add(m);b.pwx=m;
}
function pwxPhase(P){var t=wxT/P,k=Math.floor(t),f=t-k,tb=t+.5,kb=Math.floor(tb),fb=tb-kb;return [f,fb,((k%53)+53)%53,(((kb+17)%53)+53)%53,1-Math.abs(2*f-1),1-Math.abs(2*fb-1)];}
// zamana bağlı olaylar
var T2018=(Date.UTC(2018,5,20)-Date.UTC(2000,0,1,12))/86400000,T2010=(Date.UTC(2010,11,15)-Date.UTC(2000,0,1,12))/86400000;
function marsDust(){var y=(simDays-T2018)/686.98,k=Math.round(y),ph=y-k,season=Math.exp(-Math.pow(ph/.1,2));var glob=(((k%3)+3)%3===0)?season:0;return {reg:season*.25,glob:glob};}
function saturnGWS(){var y=(simDays-T2010)/(29.46*365.25),ph=y-Math.round(y);return Math.exp(-Math.pow(ph/.03,2));}
function neptuneGDS(){var y=simDays/(6*365.25),ph=y-Math.floor(y);return ph<.55?1:0;}
function updatePlanetWx(){
  BODIES.forEach(function(b){
    if(!PWX[b.def.id])return;
    if(!b.pwx)addPlanetWx(b);
    var U=b.pwx.material.uniforms,c=PWX[b.def.id],ph=pwxPhase(c.P);
    U.lay.value.set(ph[0],ph[1],ph[2],ph[3]);U.wts.value.set(ph[4],ph[5]);U.tm.value=performance.now()*.001;
    b.pwx.rotation.y=b.mesh.rotation.y;
    var K=b.cl?b.cl.K:1,h=b.hab,hot=b.cl?ss(500,900,b.cl.Ts):0;U.lk.value=K;
    var noAtm=h&&h.atm==='none';
    if(b.def.id==='venus'&&b.realMap){var wm=(noAtm&&b.surfMap)?b.surfMap:b.realMap;if(b.mesh.material.map!==wm)b.mesh.material.map=wm;}
    var st=0;
    if(b.def.id==='mars'){var md=marsDust();st=md.reg+md.glob*.75;}
    if(b.def.id==='saturn')st=saturnGWS()*.35;
    U.storm.value=st;
    if(b.def.id==='neptune'){var la=-20*D2R,phi=1.2-wxT*.03;U.spot.value.set(-Math.cos(phi)*Math.cos(la),Math.sin(la),Math.sin(phi)*Math.cos(la));U.spotA.value+=((neptuneGDS()?1:0)-U.spotA.value)*.05;}
    U.op.value=noAtm?0:c.op*(b.realTex?(b.def.id==='venus'?.3:.45):1)*(b.def.id==='venus'?1:(1-hot*(b.def.id==='mars'?0:.7)));if(b.realTex&&b.def.id==='neptune')U.spotA.value=0;
  });
}
var PWX_INFO={
  mercury:['Atmosferi yok denecek kadar ince; hava olayı yok.','Güneş rüzgârı yüzeye doğrudan çarpar, gündüz 430 °C, gece −180 °C.'],
  venus:['Sülfürik asit bulutları tüm gezegeni kaplar.','Bulut katmanı 4 günde gezegenin çevresini dolaşır (süper dönüş), yüzey ise 243 günde bir döner.','Asit yağmuru yağar ama yere ulaşmadan buharlaşır.','Yüzeyde rüzgâr çok yavaş, basınç Dünya\'nın 92 katı.'],
  mars:['Toz fırtınaları: bölgesel fırtınalar her yıl, gezegeni saran küresel fırtınalar birkaç yılda bir, Güneş\'e en yakın dönemde.','Toz şeytanları (küçük hortumlar) ve ince su buzu bulutları.','Kışın kutuplarda CO₂ karı yağar, kutup başlıkları büyür.'],
  jupiter:['Amonyak bulutları ve 600 km/sa\'e varan zıt yönlü jet akımları bantları oluşturur.','Büyük Kırmızı Leke: Dünya\'dan büyük, yüzyıllardır süren bir fırtına.','Yıldırımlar (Dünya\'dakinden çok daha güçlü) ve derinlerde helyum yağmuru.'],
  saturn:['Kuzey kutbunda altıgen biçimli kalıcı bir jet akımı.','Yaklaşık 30 yılda bir, kuzey yazında "Büyük Beyaz Leke" fırtınası patlar.','1800 km/sa rüzgârlar ve yıldırım fırtınaları.'],
  uranus:['Metan bulutları ve parlak fırtınalar; ekseni yan yattığı için mevsimleri 21 yıl sürer.','Derinlerde elmas yağmuru olabileceği düşünülüyor (kuramsal, laboratuvar deneyleri destekliyor).'],
  neptune:['Güneş Sistemi\'nin en hızlı rüzgârları: 2000 km/sa.','Büyük Karanlık Leke gibi fırtınalar birkaç yılda oluşup kaybolur, yanlarında beyaz metan bulutları olur.','Derinlerde elmas yağmuru olabileceği düşünülüyor (kuramsal).'],
  titan:['Dünya dışında yüzeyinde sıvı ve yağmur olan tek yer: metan yağmuru yağar.','Metan gölleri ve nehirleri, kalın turuncu pus.'],
  io:['Hava olayı yok ama 400\'den fazla aktif yanardağ 500 km yükseğe kükürt püskürtür.'],
  moon:['Atmosferi yok; hava olayı olmaz.'],
  pluto:['Çok ince azot atmosferi ve katmanlı pus; Güneş\'ten uzaklaştıkça atmosferi donup yüzeye kar olarak yağar.']
};
function renderPlanetWx(b){
  var box=$('pwx');if(!box)return;
  var id=b&&b.def.id,info=PWX_INFO[id];
  if(!info||isEngulfed(b)){box.hidden=true;return;}
  box.hidden=false;
  var now=[];
  if(id==='mars'){var md=marsDust();now.push(md.glob>.4?['Küresel toz fırtınası: gezegenin tamamı tozla kaplı','bad']:md.reg>.12?['Bölgesel toz fırtınaları','warn']:['Sakin, ince toz ve su buzu bulutları','good']);}
  if(id==='saturn'){var g=saturnGWS();now.push(g>.3?['Büyük Beyaz Leke fırtınası etkin','warn']:['Altıgen jet akımı ve bant fırtınaları','good']);}
  if(id==='neptune')now.push(neptuneGDS()?['Büyük Karanlık Leke görünür durumda','warn']:['Karanlık leke dağıldı, yenisi oluşacak','good']);
  if(id==='jupiter')now.push(['Büyük Kırmızı Leke ve gece tarafında yıldırımlar','warn']);
  if(id==='venus')now.push(['Asit bulutları süper dönüşte','warn']);
  if(b.cl&&b.cl.Ts>900&&b.hab&&b.hab.surf)now.unshift(['Aşırı sıcak: bulutlar dağıldı, yüzey eriyor','bad']);
  $('pwxRows').innerHTML=now.map(function(r){return '<div class="hrow"><i class="q '+r[1]+'"></i><span>Şu an</span><b>'+esc(r[0])+'</b></div>';}).join('')+
    '<ul class="pwxl">'+info.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>';
}
