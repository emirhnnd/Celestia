/* Celestia · Çarpışmalar, Roche sınırı, patlama görselleri, zaman çizelgesi, fırlatma ve yıldız birleşmeleri.
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* ---------- çarpışmalar, gelgit ve Roche sınırı ---------- */
var MASS={mercury:.055,venus:.815,earth:1,mars:.107,jupiter:317.8,saturn:95.2,uranus:14.5,neptune:17.1,pluto:.0022};
var MOONR={moon:[60.3,2.88],io:[5.9,1.76],europa:[9.4,1.84],ganymede:[15,2.2],callisto:[26.3,2.27],titan:[20.3,1.74]};
var gSlow=1,slowWarned=0;
function baseMass(b){var d=b.def;if(MASS[d.id]!=null)return MASS[d.id];var R=Math.pow(d.vr/1.6,2),gas=d.habType==='gas';return R*R*R*(gas?.24:1);}
function bodyMass(b){if(b.mass==null)b.mass=baseMass(b);return b.mass*Math.pow(b.mod.size,3);}
var EQR={earth:6378.1/6371,jupiter:71492/69911,saturn:60268/58232};
function moonRR(b){var m=MOONR[b.def.id];return m?m[0]:(b.def.orbit/(b.parent?b.parent.def.vr:1))*8;}
function moonRoche(b){var m=MOONR[b.def.id];return m?m[1]:2.44;}
function moonVisR(b){
  var d=b.def,p=b.parent,rr0=moonRR(b),rr=b.mod.rr||rr0,R0=p.def.vr;
  /* gerçek ölçekte uydu uzaklığı gezegen yarıçapı cinsinden gerçek değer (Ay: 60,3 Dünya yarıçapı).
     MOONR oranları gezegenin ekvator yarıçapına göredir (Io: 5,9 Jüpiter yarıçapı = 421.700 km), sahnedeki küre ise ortalama yarıçapla çizilir;
     ekvator/ortalama oranıyla çarpılmazsa Jüpiter uyduları %2, Titan %3 fazla yakın duruyordu */
  if(REAL)return effVr(p)*rr*(EQR[p.def.id]||1);
  return effVr(p)+(d.orbit-R0)*(rr-1)/(rr0-1);
}
function moonPScale(b){var rr0=moonRR(b),rr=b.mod.rr||rr0;return Math.pow(rr/rr0,1.5);}
function isGone(b){return !!(b.destroyed||(b.parent&&b.parent.destroyed));}
function destroyBody(b){
  b.destroyed=true;b.tdeNow=b.fallNow=false;if(b.treeBtn)b.treeBtn.hidden=true;if(b.dockBtn)b.dockBtn.hidden=true;b.pivot.visible=false;if(b.line)b.line.visible=false;if(b.trailLine)b.trailLine.visible=false;
  BODIES.forEach(function(x){if(x.parent===b){x.destroyed=true;if(x.line)x.line.visible=false;if(x.treeBtn)x.treeBtn.hidden=true;}});
  if(focus===b||focus.parent===b){var t=b.parent&&!b.parent.destroyed?b.parent:null;focusBody(t?t.def.id:'sun',t?{}:{dist:OVD()*.45});}
}
var _fxw=new THREE.Vector3(),_fxs=new THREE.Vector3();
function flashAt(parent,pos,size,color){
  var gt=FLASHT||(FLASHT=glowTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,220,170,.7)'],[1,'rgba(255,140,60,0)']]));
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:color||0xffffff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  sp.position.copy(pos);sp.scale.setScalar(size);sp.userData.post=true;parent.add(sp);FXL.push({o:sp,t:0,T:2.4,k:'flash',s:size});
}
var FLASHT=null,FXL=[];
function debrisCloud(host,n,R,col,spread){
  var pos=new Float32Array(n*3),vel=new Float32Array(n*3);
  for(var i=0;i<n;i++){var u=Math.random()*2-1,t=Math.random()*TAU,s=Math.sqrt(1-u*u),v=R*(.6+Math.random()*spread);vel[i*3]=s*Math.cos(t)*v;vel[i*3+1]=u*v*.35;vel[i*3+2]=s*Math.sin(t)*v;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var p=new THREE.Points(g,new THREE.PointsMaterial({color:col,size:2,sizeAttenuation:false,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,map:dotTex()}));
  p.frustumCulled=false;host.add(p);FXL.push({o:p,t:0,T:9,k:'debris',vel:vel,R:R});
}
function updateFxList(dt){
  BODIES.forEach(function(b){if(!b.wob)return;var W=b.wob;W.t+=dt;var e=W.a*Math.exp(-W.t*.9)*Math.sin(W.t*9);b.mesh.scale.set(1+e,1-e*.8,1+e*.4);if(W.t>6){b.mesh.scale.set(1,1,1);b.wob=null;}});
  for(var i=FXL.length-1;i>=0;i--){var f=FXL[i];f.t+=Math.min(dt,.05);var a=f.t/f.T;
    if(f.k==='fire'||f.k==='ring'||f.k==='ejecta'){updateImpactFx(f,dt);}
    else if(f.k==='sink'){var e=Math.min(1,a),ee=e*e*(3-2*e);f.o.position.copy(f.p0).multiplyScalar(1-ee*.85);f.o.scale.setScalar(f.k0*Math.max(.05,1-ee*.95));if(a>=1){f.o.parent&&f.o.parent.remove(f.o);FXL.splice(i,1);}continue;}
    else if(f.k==='scarglow'){var gw=a<.05?a/.05:Math.pow(1-a,1.4);f.o.material.uniforms.op.value=gw;f.o.material.uniforms.c.value.setRGB(1,.35+.45*gw,.1+.3*gw*gw);if(a>=1){f.o.visible=false;FXL.splice(i,1);}continue;}
    else if(f.k==='scarfade'){f.o.material.uniforms.op.value=.6*(1-a);if(a>=1){f.o.visible=false;FXL.splice(i,1);}continue;}
    else if(f.k==='dring'){var P2=f.o.geometry.attributes.position.array,C2=f.o.geometry.attributes.color.array,co=Math.min(1,Math.max(0,(a-.25)/.65));
      for(var q=0;q<f.N;q++){f.ang[q]+=Math.min(dt,.05)*1.6*Math.pow(f.R*2/f.rad[q],1.5);var tgA=f.seed+(q%f.nm)*Math.PI,da=Math.atan2(Math.sin(tgA-f.ang[q]),Math.cos(tgA-f.ang[q]));f.ang[q]+=da*co*.04;
        var rr=f.rad[q]+(f.R*3.6-f.rad[q])*co*.6;P2[q*3]=Math.cos(f.ang[q])*rr;P2[q*3+1]=f.yy[q]*(1-co);P2[q*3+2]=-Math.sin(f.ang[q])*rr;var cool=Math.max(.25,1-a*.8);C2[q*3]=cool;C2[q*3+1]=cool*.7;C2[q*3+2]=cool*.45;}
      f.o.geometry.attributes.position.needsUpdate=true;f.o.geometry.attributes.color.needsUpdate=true;f.o.material.opacity=a>.9?(1-a)/.1:1;
      if(a>=.92&&!f.born){f.born=true;if(!isGone(f.big))for(var mi=0;mi<f.nm;mi++)birthMoon(f.big);}
      if(a>=1){f.o.parent&&f.o.parent.remove(f.o);f.o.geometry.dispose();f.o.material.dispose();FXL.splice(i,1);}continue;}
    /* parlama kameraya yakınsa ekranın tamamını kaplamasın: görünen boyutu en fazla görüş alanının ~yarısı */
    else if(f.k==='flash'){f.o.material.opacity=Math.max(0,1-a)*(a<.08?a/.08:1);f.o.getWorldPosition(_fxw);var cd=camera.position.distanceTo(_fxw),ps=f.o.parent?f.o.parent.getWorldScale(_fxs).x:1;f.o.scale.setScalar(Math.min(f.s*(1+a*1.5),cd*.45/Math.max(ps,1e-6)));}
    else{var arr=f.o.geometry.attributes.position.array,e=1-Math.exp(-f.t*.9);for(var j=0;j<arr.length;j++)arr[j]=f.vel[j]*e*2.2;f.o.geometry.attributes.position.needsUpdate=true;f.o.material.opacity=Math.max(0,1-a*a);}
    if(a>=1){f.o.parent&&f.o.parent.remove(f.o);f.o.geometry&&f.o.geometry.dispose();f.o.material.dispose();FXL.splice(i,1);}
  }
}
/* ---------- çarpışma patlaması görselleri ---------- */
var SHAKE={t:0,amp:0};
function impactFx(big,sm,ratio){
  var host=big.pivot,R=effVr(big),rs=effVr(sm),k=clamp(Math.sqrt(ratio)*2.2,.25,1.4);
  var n=new THREE.Vector3(sm.gx-big.gx,sm.gy-big.gy,sm.gz-big.gz);if(n.lengthSq()<1e-6)n.set(1,0,0);n.normalize();
  var P=n.clone().multiplyScalar(R*.98);
  // 1) göz kamaştıran çekirdek parlaması (kısa)
  flashAt(host,P,R*(1.2+k*2.5),0xffffff);FXL[FXL.length-1].T=.9;
  // 2) genişleyen ateş topu: beyaz→turuncu→koyu kırmızı
  var gt=FIRET||(FIRET=glowTex([[0,'rgba(255,255,255,1)'],[.3,'rgba(255,255,255,.75)'],[.65,'rgba(255,255,255,.25)'],[1,'rgba(255,255,255,0)']]));
  for(var q=0;q<3;q++){var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:0xffd090,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));
    sp.position.copy(P).addScaledVector(n,R*(.15+q*.25));host.add(sp);FXL.push({o:sp,t:-q*.15,T:3.6+q,k:'fire',s:R*(.8+k*1.6)*(1+q*.35)});}
  // 3) şok dalgası halkası (çarpma noktasında yüzeye teğet)
  var rg=new THREE.Mesh(new THREE.RingGeometry(.975,1,128),new THREE.MeshBasicMaterial({color:0xffe2b0,transparent:true,opacity:.9,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  rg.position.copy(P);rg.lookAt(P.clone().add(n));host.add(rg);FXL.push({o:rg,t:0,T:1.8,k:'ring',s:R*(1.1+k*1.2)});
  var rg2=rg.clone();rg2.material=rg.material.clone();rg2.position.set(0,0,0);rg2.lookAt(n);host.add(rg2);FXL.push({o:rg2,t:-.25,T:2.6,k:'ring',s:R*(1.6+k*2.2)});
  // 4) fırlayan kızgın enkaz: balistik, bir kısmı geri düşer
  var N=LOWQ?500:1400,pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=new Float32Array(N*3),hot=new Float32Array(N);
  var t1=new THREE.Vector3().crossVectors(n,Math.abs(n.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize(),t2=new THREE.Vector3().crossVectors(n,t1);
  for(var i=0;i<N;i++){
    var th=Math.random()*TAU,cone=Math.pow(Math.random(),.6)*1.25,sn=Math.sin(cone),cs=Math.cos(cone);
    var d=n.clone().multiplyScalar(cs).addScaledVector(t1,sn*Math.cos(th)).addScaledVector(t2,sn*Math.sin(th));
    var v=R*(.4+Math.pow(Math.random(),2.2)*3.2)*(.7+k*.6);
    pos[i*3]=P.x;pos[i*3+1]=P.y;pos[i*3+2]=P.z;vel[i*3]=d.x*v;vel[i*3+1]=d.y*v;vel[i*3+2]=d.z*v;hot[i]=.6+Math.random()*.4;
  }
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pm=new THREE.Points(g,new THREE.PointsMaterial({size:2.4,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,map:dotTex()}));
  pm.frustumCulled=false;host.add(pm);FXL.push({o:pm,t:0,T:14,k:'ejecta',vel:vel,hot:hot,R:R,N:N});
  // 5) kamera sarsıntısı
  if(focus===big||camera.position.distanceTo(big.pos)<R*25){SHAKE.t=1.2;SHAKE.amp=R*.06*(.5+k);}
}
var FIRET=null;
function updateImpactFx(f,dt){
  var a=f.t/f.T;if(f.t<0){f.o.visible=false;return;}f.o.visible=true;
  if(f.k==='fire'){var c=f.o.material.color,e=Math.min(1,a*2.2);c.setRGB(1,1-.62*e,.85-.8*Math.min(1,a*3));f.o.material.opacity=(a<.06?a/.06:1)*Math.pow(1-a,1.6)*.95;f.o.scale.setScalar(f.s*(.35+1.9*Math.pow(a,.45)));}
  else if(f.k==='ring'){f.o.scale.setScalar(f.s*(.2+2.4*Math.pow(a,.6)));f.o.material.opacity=(f.o.userData.gw?.2:.6)*Math.pow(1-a,2.2);}
  else if(f.k==='ejecta'){
    var p=f.o.geometry.attributes.position.array,c2=f.o.geometry.attributes.color.array,R=f.R,G=R*R*1.6;
    for(var i=0;i<f.N;i++){var x=p[i*3],y=p[i*3+1],z=p[i*3+2],r=Math.sqrt(x*x+y*y+z*z);
      if(r<R*.97&&f.t>.3){c2[i*3]=c2[i*3+1]=c2[i*3+2]=0;continue;}
      var gk=G/(r*r*r+1e-6)*dt;f.vel[i*3]-=x*gk;f.vel[i*3+1]-=y*gk;f.vel[i*3+2]-=z*gk;
      p[i*3]+=f.vel[i*3]*dt;p[i*3+1]+=f.vel[i*3+1]*dt;p[i*3+2]+=f.vel[i*3+2]*dt;
      var h=Math.max(0,f.hot[i]-f.t*.09);c2[i*3]=Math.min(1,h*1.6);c2[i*3+1]=Math.min(1,h*h*1.1);c2[i*3+2]=h*h*h*.6;
      if(a>.75){var fd=(1-a)/.25;c2[i*3]*=fd;c2[i*3+1]*=fd;c2[i*3+2]*=fd;}}
    f.o.geometry.attributes.position.needsUpdate=true;f.o.geometry.attributes.color.needsUpdate=true;
  }
}
function applyShake(dt){
  if(SHAKE.t<=0)return;SHAKE.t-=dt;var s=SHAKE.amp*Math.max(0,SHAKE.t)/1.2;
  camera.position.x+=(Math.random()-.5)*s;camera.position.y+=(Math.random()-.5)*s;camera.position.z+=(Math.random()-.5)*s;
}

var SLOWMO=0;
function scarMat(col,op,cap,add){return new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(col)},op:{value:op},cc:{value:Math.cos(cap)},sd:{value:Math.random()*50}},transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 c;uniform float op;uniform float cc;uniform float sd;varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7))+sd)*43758.5);}void main(){float d=vP.y;float e=smoothstep(cc,cc+(1.0-cc)*.55,d);float rays=.75+.25*sin(atan(vP.z,vP.x)*13.0+sd)*sin(atan(vP.z,vP.x)*7.0);float rim=exp(-pow((d-cc-(1.0-cc)*.28)/((1.0-cc)*.12+.001),2.0))*.6;float a=clamp(e*rays+rim,0.0,1.0)*op;gl_FragColor=vec4(c*a,a);}'});}
function scarFx(big,nW,ratio){
  var R=big.def.vr,cap=clamp(Math.sqrt(ratio)*1.5,.12,1.15),gas=big.hab&&big.hab.gas;
  big.mesh.updateMatrixWorld(true);var nL=nW.clone().transformDirection(new THREE.Matrix4().copy(big.mesh.matrixWorld).invert()).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),nL);
  var g=new THREE.SphereGeometry(R*1.004,48,12,0,TAU,0,cap);
  var dark=new THREE.Mesh(g,scarMat(gas?0x2a1a14:0x1c100a,gas?.6:.7,cap,false));dark.quaternion.copy(q);dark.renderOrder=1;big.mesh.add(dark);
  var glow=new THREE.Mesh(g.clone(),scarMat(0xff7a2a,1,cap*1.05,true));glow.quaternion.copy(q);glow.scale.setScalar(1.001);glow.renderOrder=2;big.mesh.add(glow);
  big.scars=big.scars||[];big.scars.push(dark);big.scars.push(glow);
  FXL.push({o:glow,t:0,T:gas?20:40,k:'scarglow',d:dark,gas:gas});
  if(gas)FXL.push({o:dark,t:0,T:180,k:'scarfade',keep:false});
}
function clearScars(b){if(!b.scars)return;b.scars.forEach(function(m){m.parent&&m.parent.remove(m);m.geometry.dispose();m.material.dispose();});b.scars=[];}
function sinkFx(big,sm){
  var gm=sm.mesh.clone();var k=effVr(sm)/sm.def.vr;gm.scale.setScalar(k);gm.position.set(sm.gx-big.gx,sm.gy-big.gy,sm.gz-big.gz);gm.rotation.copy(sm.mesh.rotation);big.pivot.add(gm);
  FXL.push({o:gm,t:0,T:1.4,k:'sink',p0:gm.position.clone(),k0:k,keepMat:true});
}
function wobbleFx(big,ratio){big.wob={t:0,a:clamp(Math.sqrt(ratio)*.35,.03,.22)};}
function debrisMoonFx(big,ratio){
  var N=LOWQ?700:1600,R=effVr(big),pos=new Float32Array(N*3),col=new Float32Array(N*3),rad=new Float32Array(N),ang=new Float32Array(N),yy=new Float32Array(N);
  var tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random()-.5)*.5,0,(Math.random()-.5)*.5));
  for(var i=0;i<N;i++){rad[i]=R*(1.6+Math.random()*2.6);ang[i]=Math.random()*TAU;yy[i]=(Math.random()-.5)*R*.15;var h=Math.random();col[i*3]=1;col[i*3+1]=.55+.35*h;col[i*3+2]=.3*h;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pm=new THREE.Points(g,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,map:dotTex()}));pm.quaternion.copy(tilt);pm.frustumCulled=false;big.pivot.add(pm);
  var nMoons=ratio>.3?2:1;
  FXL.push({o:pm,t:0,T:26,k:'dring',rad:rad,ang:ang,yy:yy,N:N,R:R,big:big,seed:Math.random()*TAU,nm:nMoons,born:false});
}
function birthMoon(big,f){
  var id='dm'+(++dmId),R=effVr(big),v=big.def.vr;
  var md=buildBody({id:id,custom:true,name:big.def.name+' · yeni uydu '+dmId,kind:'Uydu · çarpışma enkazından doğdu',parent:big.def.id,orbit:v*(3.2+Math.random()*1.4),P:3+Math.random()*6,L0:Math.random()*360,vr:v*(.12+.1*Math.random()),texFn:TEX.smallMoon,tw:256,dot:['#c9b8a6','#6c5a4c'],
    desc:'Dev bir çarpışmanın yörüngeye savurduğu kızgın enkaz birkaç hafta içinde toplanıp bu uyduyu oluşturdu. Ay\'ımızın da yaklaşık 4,5 milyar yıl önce Theia adlı Mars büyüklüğünde bir gezegenin Dünya\'ya çarpmasıyla böyle doğduğu düşünülüyor.',
    stats:[['Gezegen',big.def.name],['Doğuşu','Çarpışma enkazı']]});
  rebuildLists();toast(big.def.name+' çevresindeki enkaz halkası toplandı: yeni bir uydu doğdu!',6000);return md;
}
var dmId=0;
/* ---- kalıcı enkaz ----
   Çarpışmada uzaya savrulan parçalar kaybolmaz: Güneş'in çekimiyle kendi yörüngelerinde dolaşır. Çarpışmanın olduğu yörünge boyunca
   zamanla yayılıp bir enkaz kuşağı oluştururlar (gerçekte de böyle olur; Ay'ı oluşturan çarpışmanın enkazı on milyonlarca yıl Dünya'ya yağdı).
   Bir parça bir gezegenin yanından geçerse ona çarpar: küçük bir parlama ve krater. Güneş'e düşen parça buharlaşır. */
var DEB={N:0,max:LOWQ?300:700,pos:null,vel:null,gm:null,ts:null,pts:null,warn:0,hits:0};
function debInit(){if(DEB.pts)return;var M=DEB.max;DEB.pos=new Float32Array(M*3);DEB.vel=new Float32Array(M*3);DEB.gm=new Float32Array(M);DEB.ts=new Float64Array(M);DEB.src=[];
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(M*3),3));g.setDrawRange(0,0);
  DEB.pts=new THREE.Points(g,new THREE.PointsMaterial({size:2.8,sizeAttenuation:false,color:0xf0d2b0,transparent:true,opacity:.95,depthWrite:false,map:dotTex(),alphaTest:.05}));DEB.pts.frustumCulled=false;scene.add(DEB.pts);}
function debSpawn(big,n,spread){
  debInit();var vb=Math.sqrt(big.gvx*big.gvx+big.gvy*big.gvy+big.gvz*big.gvz)||1,R=effVr(big);
  for(var i=0;i<n;i++){if(DEB.N>=DEB.max){debDel(0);}var k=DEB.N++,d=new THREE.Vector3(Math.random()-.5,(Math.random()-.5)*.6,Math.random()-.5).normalize();
    DEB.pos[k*3]=big.gx+d.x*R*1.6;DEB.pos[k*3+1]=big.gy+d.y*R*1.6;DEB.pos[k*3+2]=big.gz+d.z*R*1.6;
    /* kaçış hızının biraz üstünde savrulur: Güneş'e göre hız farkı yörünge hızının birkaç yüzdesi */
    var dv=vb*spread*(.3+Math.random());DEB.vel[k*3]=big.gvx+d.x*dv;DEB.vel[k*3+1]=big.gvy+d.y*dv;DEB.vel[k*3+2]=big.gvz+d.z*dv;DEB.gm[k]=big.GM||1;DEB.ts[k]=simDays;DEB.src[k]=big.def.name;}
}
function debDel(k){var L=--DEB.N;if(k!==L){for(var c=0;c<3;c++){DEB.pos[k*3+c]=DEB.pos[L*3+c];DEB.vel[k*3+c]=DEB.vel[L*3+c];}DEB.gm[k]=DEB.gm[L];DEB.ts[k]=DEB.ts[L];DEB.src[k]=DEB.src[L];}}
function debClear(){DEB.N=0;if(DEB.pts)DEB.pts.geometry.setDrawRange(0,0);}
function debStep(dDays){
  if(!DEB.pts||!DEB.N)return;
  for(var k=DEB.N-1;k>=0;k--)if(simDays<DEB.ts[k])debDel(k);   /* geri sarınca çarpışmadan önceye dönülürse enkaz da yok olur */
  if(dDays!==0){var n=clamp(Math.ceil(Math.abs(dDays)*Math.sqrt(Math.max(1,sunMass))/.5),1,120),h=dDays/n,P=DEB.pos,V=DEB.vel,sr=effVr(sunBody)*1.05;
    for(var s=0;s<n;s++)for(var k2=DEB.N-1;k2>=0;k2--){var x=P[k2*3],y=P[k2*3+1],z=P[k2*3+2],r2=x*x+y*y+z*z+1,r=Math.sqrt(r2),a=-DEB.gm[k2]*sunMass/(r2*r)*h;
      V[k2*3]+=x*a;V[k2*3+1]+=y*a;V[k2*3+2]+=z*a;P[k2*3]+=V[k2*3]*h;P[k2*3+1]+=V[k2*3+1]*h;P[k2*3+2]+=V[k2*3+2]*h;
      if(r<sr||r>6000*DS)debDel(k2);}
    debHits();}
  var A=DEB.pts.geometry.attributes.position.array,so=sunBody.pivot.position;for(var i=0;i<DEB.N;i++){A[i*3]=DEB.pos[i*3]+so.x;A[i*3+1]=DEB.pos[i*3+1]+so.y;A[i*3+2]=DEB.pos[i*3+2]+so.z;}
  DEB.pts.geometry.attributes.position.needsUpdate=true;DEB.pts.geometry.setDrawRange(0,DEB.N);
}
/* gezegene çarpma: gezegenin Güneş merkezli konumu (yerçekimi açıksa gx, değilse yörünge konumu) */
var _dh=new THREE.Vector3();
function debHits(){
  var so=sunBody.pivot.position;
  BODIES.forEach(function(b){if(b.parent||b.def.star||b===sunBody||isGone(b)||b.def.craft||b.def.comet||!b.hab)return;
    var bx,by,bz;if(gravityOn&&b.grav){bx=b.gx;by=b.gy;bz=b.gz;}else{bx=b.pivot.position.x-so.x;by=b.pivot.position.y-so.y;bz=b.pivot.position.z-so.z;}
    var R=effVr(b)*1.15,R2=R*R;
    for(var k=DEB.N-1;k>=0;k--){var dx=DEB.pos[k*3]-bx,dy=DEB.pos[k*3+1]-by,dz=DEB.pos[k*3+2]-bz;if(dx*dx+dy*dy+dz*dz>R2)continue;
      if(simDays-DEB.ts[k]<30&&DEB.src[k]===b.def.name){continue;}   /* yeni savrulan parça kendi gezegenine hemen geri düşmüş sayılmasın */
      _dh.set(dx,dy,dz).normalize();flashAt(b.pivot,_dh.clone().multiplyScalar(effVr(b)*.98),effVr(b)*.9,0xffd0a0);FXL[FXL.length-1].T=1.2;
      if(typeof scarFx==='function'&&!(b.hab&&b.hab.gas)&&(!b.lastScar||performance.now()-b.lastScar>8000)){b.lastScar=performance.now();scarFx(b,_dh.clone(),.002);}DEB.hits++;
      if(performance.now()-DEB.warn>9000){DEB.warn=performance.now();toast(DEB.src[k]+' çarpışmasının enkazından bir parça '+b.def.name+'\'e çarptı.',4000);}
      debDel(k);}
  });
}
function collide(a,b){
  takeSnap();
  var ma=bodyMass(a),mb=bodyMass(b),big=ma>=mb?a:b,sm=big===a?b:a,mB=Math.max(ma,mb),mS=Math.min(ma,mb),M=mB+mS;
  big.gvx=(a.gvx*ma+b.gvx*mb)/M;big.gvy=(a.gvy*ma+b.gvy*mb)/M;big.gvz=(a.gvz*ma+b.gvz*mb)/M;
  big.mass=(big.mass==null?baseMass(big):big.mass)*M/mB;
  big.mod.size*=Math.pow(M/mB,1/3);applySize(big);
  var ratio=mS/mB;big.impT0=simDays;big.impK=clamp(Math.sqrt(ratio)*4,.15,1);
  if(big.hab&&big.hab.surf&&ratio>.01){big.hab.melt=1;if(big.hab.water>.5)big.hab.water*=.6;}
  var dir=new THREE.Vector3(sm.gx-big.gx,sm.gy-big.gy,sm.gz-big.gz).normalize().multiplyScalar(effVr(big));
  var cat=ratio>.3;if(cat){big.mass*=.85;big.mod.size*=Math.pow(.85,1/3);applySize(big);}
  impactFx(big,sm,ratio);sinkFx(big,sm);scarFx(big,dir.clone().normalize(),ratio);wobbleFx(big,ratio);
  var gas=big.hab&&big.hab.gas,smGas=sm.hab&&sm.hab.gas;
  destroyBody(sm);
  if(ratio>.04&&!big.def.star)debrisMoonFx(big,ratio);
  /* Güneş etrafında dolaşmaya devam eden enkaz: büyük çarpışmada çok, küçükte az */
  if(ratio>.003)debSpawn(big,Math.round(clamp(ratio*600,12,cat?220:120)),cat?.16:.11);
  focusBody(big.def.id,{dist:effVr(big)*9});SLOWMO=2.5;
  var msg=sm.def.name+', '+big.def.name+' ile çarpıştı: ';
  if(cat)msg+='iki gezegen de parçalandı. Kalıntılar tek bir erimiş gezegende birleşti; kütlenin yaklaşık %15\'i uzaya savruldu. Etrafındaki enkaz halkası toplanıp yeni uydu(lar) oluşturabilir.';
  else if(ratio>.04)msg+=(gas?big.def.name+' çarpanı yuttu; atmosferinde dev bir sıcak leke ve şok dalgası oluştu.':gen(big.def.name)+' kabuğu eridi, çarpma bölgesi magma okyanusuna döndü ve gezegen bir süre sarsılıp şekil değiştirdi.')+' Savrulan enkaz yörüngede halka oluşturdu; zamanla yeni bir uyduya toplanacak. Ay\'ımız da Theia çarpışmasıyla böyle doğdu.';
  else if(ratio>.003)msg+=(gas?'çarpan atmosferde parçalanıp yandı; Shoemaker-Levy 9\'un 1994\'te Jüpiter\'de bıraktığı gibi koyu bir iz kaldı.':'dev bir krater açıldı, kızgın enkaz yüzeye yağdı.');
  else msg+=(gas?'küçük cisim atmosferde yanıp koyu bir iz bıraktı.':'küçük cisim buharlaştı; geriye bir çarpma krateri kaldı.');
  toast(msg,8000);toastLock=performance.now()+7500;if(typeof audWhoosh==='function')audWhoosh();
}
function checkCollisions(gb){
  var minK=1;
  for(var i=0;i<gb.length;i++){var a=gb[i];if(a.destroyed)continue;
    for(var j=i+1;j<gb.length;j++){var b=gb[j];if(b.destroyed)continue;
      var dx=a.gx-b.gx,dy=a.gy-b.gy,dz=a.gz-b.gz,d=Math.sqrt(dx*dx+dy*dy+dz*dz),R=effVr(a)+effVr(b);
      if(d<R){collide(a,b);continue;}
      var cl=(dx*(a.gvx-b.gvx)+dy*(a.gvy-b.gvy)+dz*(a.gvz-b.gvz))<0;
      if(cl&&d<R*5)minK=Math.min(minK,clamp((d-R)/(R*4),.25,1));
    }
  }
  return minK;
}
/* ---------- zaman çizelgesi: geri sarınca olaylar geri alınır, ileri alınca tekrar yaşanır ---------- */
var SNAPS=[],EVENTS=[],lastSnapT=-1e18,tlBusy=false;
function snapIv(){return Math.max(.2,Math.abs(SPEEDS[speedIdx].d)*.2);}
function tlBodies(){return BODIES.filter(function(b){return !b.def.craft&&!b.def.comet&&!b.def.star&&b.def.id!=='sun';});}
function takeSnap(){
  var S={t:simDays,grav:gravityOn,b:{},em:EATEN};
  tlBodies().forEach(function(b){var h=b.hab;
    S.b[b.id]={g:[b.gx,b.gy,b.gz,b.gvx,b.gvy,b.gvz],sz:b.mod.size,m:b.mass,d:!!b.destroyed,i0:b.impT0,ik:b.impK,rr:b.mod.rr,rg:!!b.rogue,sc:b.scars?b.scars.length:0,
      h:h?{melt:h.melt||0,water:h.water,st:h.st}:null,dn:b.debris?b.debris.length:0,
      ho:b.homing?{t:b.homing.t.id,r:b.homing.rel.toArray(),v:b.homing.v.toArray()}:null};});
  S.belt=beltCopy();
  S.sun={ty:EXO.col?6:(SUN_PEND!=null?SUN_PEND:sunType),m:EXO.col?colRemnant(EXO.col)+EATEN/333000:SUN_PEND===5&&sunMass>2.3?1.4+EATEN/333000:sunMass,e:EATEN};S.st={};
  BODIES.forEach(function(b){if(!b.def.star||b===sunBody)return;S.st[b.id]={d:!!b.destroyed,ty:b.exoCol?6:(b.pend!=null?b.pend:b.starType),sz:b.mod.size,r:b.def.r,ang:b.ang};});
  SNAPS.push(S);if(SNAPS.length>3000)SNAPS.shift();lastSnapT=simDays;
}
function undestroy(b){
  b.destroyed=false;b.pivot.visible=true;if(b.treeBtn)b.treeBtn.hidden=false;if(b.dockBtn)b.dockBtn.hidden=false;
  BODIES.forEach(function(x){if(x.parent===b&&x.destroyed&&!x.ownDestroy){x.destroyed=false;if(x.treeBtn)x.treeBtn.hidden=false;}});
}
function restoreSnap(S){
  var changed=false;if(S.sun&&(sunMass!==S.sun.m||EATEN!==S.sun.e)){sunMass=S.sun.m;EATEN=S.sun.e;$('sMass').value=sliderFromMass(Math.max(.1,sunMass-EATEN/333000));$('oMass').textContent=massTxt();}
  if(S.grav!==gravityOn){setGravity(!!S.grav);changed=true;}if(S.em!=null&&S.em!==EATEN){sunMass+=(S.em-EATEN)/333000;EATEN=S.em;$('oMass').textContent=massTxt();}
  tlBodies().forEach(function(b){var o=S.b[b.id];if(!o){if(b.def.custom&&!b.destroyed&&!b.parent){destroyBody(b);b.unborn=true;changed=true;}return;}if(b.unborn&&!o.d)b.unborn=false;
    if(o.d!==!!b.destroyed){changed=true;if(o.d){destroyBody(b);b.ownDestroy=true;}else{undestroy(b);b.ownDestroy=false;}}
    if(b.mod.size!==o.sz){b.mod.size=o.sz;applySize(b);changed=true;}
    b.mass=o.m;b.impT0=o.i0;b.impK=o.ik;b.rogue=o.rg;b.fallNow=false;b.tdeNow=false;b.engulfed=false;
    if(b.scars&&b.scars.length>(o.sc||0)){b.scars.splice(o.sc||0).forEach(function(m){m.parent&&m.parent.remove(m);});changed=true;}
    if(b.mod.rr!==o.rr){b.mod.rr=o.rr;if(b.line&&b.parent&&b.def.orbit)b.line.scale.setScalar(moonVisR(b)/b.def.orbit);}
    if(o.h&&b.hab){if((b.hab.melt||0)!==o.h.melt)changed=true;b.hab.melt=o.h.melt;b.hab.water=o.h.water;b.hab.st=o.h.st;}
    if(b.debris&&b.debris.length>o.dn){b.debris.splice(o.dn).forEach(function(D){D.g.parent.remove(D.g);D.pts.geometry.dispose();D.pts.material.dispose();});changed=true;}
    if(S.grav&&gravityOn&&b.grav){b.gx=o.g[0];b.gy=o.g[1];b.gz=o.g[2];b.gvx=o.g[3];b.gvy=o.g[4];b.gvz=o.g[5];b.pivot.position.set(b.gx,b.gy,b.gz);}
    b.homing=o.ho&&byId[o.ho.t]?{t:byId[o.ho.t],rel:new THREE.Vector3().fromArray(o.ho.r),v:new THREE.Vector3().fromArray(o.ho.v)}:null;
  });
  if(S.st)BODIES.forEach(function(b){if(!b.def.star||b===sunBody)return;var o=S.st[b.id];if(!o){if(!b.destroyed){b.dart=null;destroyBody(b);b.unborn=true;changed=true;}return;}if(b.unborn&&!o.d)b.unborn=false;
    var keepD=b.dart&&b.dart.t0!=null&&S.t>=b.dart.t0;if(!keepD)b.dart=null;if(b.exoCol){colAbort(b.exoCol);b.exoCol=null;}
    if(o.d!==!!b.destroyed){changed=true;if(o.d){destroyBody(b);}else{undestroy(b);if(b.cust&&!customs.some(function(c){return c.id===b.id;})){customs.push(b.cust);saveCustom();}}}
    if(o.ty!==b.starType||b.pend!=null){setStarOn(b,o.ty);changed=true;}
    if(b.mod.size!==o.sz){b.mod.size=o.sz;applySize(b);}if(o.r!=null)b.def.r=o.r;if(o.ang!=null&&!keepD){b.ang=o.ang;var rr=b.def.r||0;b.pivot.position.set(Math.cos(b.ang)*rr,0,-Math.sin(b.ang)*rr);}
  });
  if(S.sun){if(S.sun.ty!==sunType||EXO.col||SUN_PEND!=null){if(EXO.col)colAbort(EXO.col);EXO.col=null;setStar(S.sun.ty);changed=true;}if(sunMass!==S.sun.m||EATEN!==S.sun.e){sunMass=S.sun.m;EATEN=S.sun.e;$('oMass').textContent=massTxt();}}
  TDES=TDES.filter(function(T){if(T.ts>S.t){tdeUndo(T,true);changed=true;return false;}return true;});TDEDONE=TDEDONE.filter(function(T){if(T.ts>S.t){tdeUndo(T,true);return false;}return true;});
  PNEB=PNEB.filter(function(P){if(P.ts>S.t){P.sp.parent&&P.sp.parent.remove(P.sp);P.sp.geometry.dispose();P.sp.material.dispose();changed=true;return false;}return true;});
  if(beltRestore(S.belt))changed=true;
  if(EXO.sn&&EXO.sn.ts>S.t){scene.remove(EXO.sn.shell);if(EXO.sn.flash.parent)EXO.sn.flash.parent.remove(EXO.sn.flash);if(EXO.sn.jets&&EXO.sn.jets.parent)EXO.sn.jets.parent.remove(EXO.sn.jets);EXO.sn=null;changed=true;}
  if(changed){EXO.fuel=0;BODIES.forEach(function(b){if(b.exo)b.exo.fuel=0;});FXL.forEach(function(f){f.o.parent&&f.o.parent.remove(f.o);});FXL=[];TIMERS=[];BODIES.forEach(function(b){if(b.def.star)unstretch(b);});rebuildLists();}
  return changed;
}
function addEvent(e){EVENTS=EVENTS.filter(function(x){return x.t<=simDays;});takeSnap();e.t=simDays;e.done=true;EVENTS.push(e);}
function act(k,o){if(tlBusy)return null;var e={type:'act',k:k};for(var q in (o||{}))e[q]=o[q];addEvent(e);return e;}
var FORCE_STAR=null;
/* tekrar oynatmada: önceki olayın süren dönüşümleri (çöküş, bekleyen tür değişimi) bir sonraki olaydan önce tamamlanır,
   böylece olaylar ilk seferdeki sırayla ve aynı sonuçla yaşanır */
function flushPending(){
  var g=0;while(TIMERS.length&&g++<50){var T=TIMERS.shift();try{T.fn();}catch(x){console.error(x);}}
  g=0;while(EXO.col&&g++<300){if(colStep(sunBody,EXO.col,.1))blackHoleDone(true);}
  BODIES.forEach(function(b){var k=0;while(b.exoCol&&k++<300){if(colStep(b,b.exoCol,.1)){b.exoCol=null;setStarOn(b,6);}}});
}
function runEvent(e){
  flushPending();
  tlBusy=true;
  if(e.type==='launch'){var a=byId[e.a],t=byId[e.tg];if(a&&t&&!isGone(a)&&!isGone(t))doLaunch(a,t,true);}
  else if(e.type==='dart'){var a2=byId[e.a],t2=byId[e.tg];if(a2&&t2&&!isGone(a2)&&!isGone(t2))startDart(a2,t2,true,e.Ts,e.t);}
  else if(e.type==='act'){var tg=e.tg?(byId[e.tg]||sunBody):sunBody;
    if(e.k==='born'){var nb=byId[e.id];if(nb&&nb.destroyed&&nb.unborn){undestroy(nb);nb.unborn=false;rebuildLists();}}
    else if(e.k==='mass'){sunMass=e.v;$('sMass').value=sliderFromMass(Math.max(.1,sunMass-EATEN/333000));$('oMass').textContent=massTxt();massRetype(true);}
    else if(e.k==='grav'){setGravity(e.on);}
    else if(!isGone(tg)){FORCE_STAR=tg;try{if(e.k==='bh')blackHole();else if(e.k==='nova')supernova();else if(e.k==='pn')planetaryNebula();else if(e.k==='type')chooseType(tg,e.i);}finally{FORCE_STAR=null;}}}
  else if(e.type==='rr'){var m=byId[e.id];if(m&&!isGone(m)){m.mod.rr=e.rr;if(m.line)m.line.scale.setScalar(moonVisR(m)/m.def.orbit);if(m.mod.rr<moonRoche(m))roche(m);if(m===focus)syncMoonUI();}}
  tlBusy=false;e.done=true;
}
var rewindNote=0;
function timeline(d){
  if(d>0){
    EVENTS.forEach(function(e){if(!e.done&&e.t<=simDays)runEvent(e);});
    if(simDays-lastSnapT>=snapIv())takeSnap();
  }else if(d<0){
    var popped=null;while(SNAPS.length&&SNAPS[SNAPS.length-1].t>simDays)popped=SNAPS.pop();
    var undone=false;EVENTS.forEach(function(e){if(e.done&&e.t>simDays){e.done=false;undone=true;}});
    if(popped){var ch=restoreSnap(popped);if((ch||undone)&&performance.now()-rewindNote>4000){rewindNote=performance.now();toast('Zaman geri sarıldı: olaylar geri alındı. İleri oynatınca tekrar yaşanacak.',5000);syncLab();}}
    lastSnapT=SNAPS.length?SNAPS[SNAPS.length-1].t:-1e18;
  }
}
$('wxGo').addEventListener('click',gotoStorm);
function lookAtEarthLatLon(lat,lon){
  var e=byId.earth;if(!e||!e.clouds)return;var la=lat*D2R,a=(lon+180)/360*TAU,cl=Math.cos(la),v=new THREE.Vector3(-Math.cos(a)*cl,Math.sin(la),Math.sin(a)*cl);
  scene.updateMatrixWorld(true);v.transformDirection(e.clouds.matrixWorld);
  focusBody('earth',{dist:effVr(e)*2.8});trans=null;theta=Math.atan2(v.z,v.x);phi=Math.acos(clamp(v.y,-1,1));dist=desired=effVr(e)*2.8;
}
function gotoStorm(){
  var L=WX.storms||[];
  if(!L.length){
    if(gravityOn){toast('Yerçekimi modunda zaman atlaması yapılamıyor');return;}
    var o=simDays,found=null;for(var d=.5;d<400;d+=.5){simDays=o+d;var l=activeStorms(true);if(l.length&&l[0].k>.5){found=d;break;}}simDays=o;
    if(found==null){toast('Yakın zamanda fırtına bulunamadı (okyanuslar fırtına için uygun değil olabilir)');return;}
    updateBodies(found);simDays+=found;wxT=simDays;resyncReal();speedIdx=1;speed.value=1;setSpeed();updateBodies(0);
    updateWeather();L=WX.storms||[];if(!L.length)L=activeStorms(true);
  }
  if(!L.length){toast('Fırtına bulunamadı');return;}var s=L[0];
  /* 1 saat/sn: fırtınanın 6-13 günlük ömrü 2,5-5 dakikada geçer; hem dönüşü hem ilerleyişi gözle görülür */
  speedIdx=2;speed.value=2;setSpeed();playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');updateBodies(0);
  lookAtEarthLatLon(s.lat,s.lon);WX.follow=s.id;WX.fLand=s.land;toast(s.name+(s.k>.45?' · kategori '+s.cat:' · tropikal fırtına')+' · kamera izliyor, hız 1 saat/sn',5000);
}
function clearTimeline(){SNAPS=[];EVENTS=[];lastSnapT=-1e18;BELTCOPIES=[];BELTCOPY=null;BELTDIRTY=true;}

/* ---------- yıldız / kara delik fırlatma ve çarpışmaları ---------- */
var STARM=[1,.2,15,1,.6,1.4,6,0];
function chooseType(tg,i){setStarOn(tg,i);if(tg===sunBody){sunMass=STARM[i]+EATEN/333000;$('sMass').value=sliderFromMass(Math.max(.1,STARM[i]));$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();}else tg.massAbs=null;}
function stType(b){return b===sunBody?sunType:(b.def.star?b.starType:-1);}
function stMass(b){return b===sunBody?sunMass:(b.massAbs!=null?b.massAbs:STARM[b.starType]*Math.pow(b.mod.size||1,1.5));}
function isBH(b){return stType(b)===6;}
/* ek yıldızların rüzgârı (Görünüm > Güneş rüzgârı ve parçacıklar) */
var WCOL={0:0xffe0b0,1:0xffa080,2:0xbfd4ff,3:0xffb090,5:0x9fc8ff};
function updateStarWinds(dt){
  BODIES.forEach(function(b){if(b===sunBody||!b.def.star)return;var ty=b.starType,on=showPart&&!isGone(b)&&(ty<4||ty===5)&&!b.sysHide;
    if(!on){if(b.wind)b.wind.visible=false;return;}
    if(!b.wind){var W=LOWQ?220:420,P=new Float32Array(W*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));
      b.wind=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false,map:dotTex()}));b.wind.frustumCulled=false;b.pivot.add(b.wind);
      b.wd={W:W,dir:new Float32Array(W*3),r:new Float32Array(W),sp:new Float32Array(W)};for(var k=0;k<W;k++)starWindSpawn(b,k,true);}
    b.wind.visible=true;b.wind.material.color.setHex(WCOL[ty]||0xffe0b0);
    var d=b.wd,P2=b.wind.geometry.attributes.position.array,sr=effVr(b),mx=sr*30+60*DS,fast=ty===5?3:ty===2?2:1;
    for(var i=0;i<d.W;i++){d.r[i]+=d.sp[i]*dt*fast;if(d.r[i]>mx)starWindSpawn(b,i,false);var rr=Math.max(d.r[i],sr*1.05);P2[i*3]=d.dir[i*3]*rr;P2[i*3+1]=d.dir[i*3+1]*rr;P2[i*3+2]=d.dir[i*3+2]*rr;}
    b.wind.geometry.attributes.position.needsUpdate=true;});
}
function starWindSpawn(b,k,init){var d=b.wd,u=new THREE.Vector3(Math.random()-.5,(Math.random()-.5)*.8,Math.random()-.5).normalize();d.dir[k*3]=u.x;d.dir[k*3+1]=u.y;d.dir[k*3+2]=u.z;var sr=effVr(b);d.r[k]=init?sr+Math.random()*(sr*30+60*DS):sr;d.sp[k]=(8+Math.random()*14)*DS;}
function startDart(a,t,replay,Ts,t0){
  if(a.dart)return;a.homing=null;var p0=a.pivot.position.clone(),d=p0.distanceTo(t.pos);
  var minD=(effVr(a)+effVr(t))*(isBH(t)?3.5:2.2);if(d<minD){p0=t.pos.clone().add(new THREE.Vector3().subVectors(p0,t.pos).normalize().multiplyScalar(minD));d=minD;a.pivot.position.copy(p0);}
  var up=new THREE.Vector3(0,1,0),side=new THREE.Vector3().subVectors(t.pos,p0).cross(up).normalize().multiplyScalar(d*.18);
  a.dart={t:t,p0:p0,side:side,k:0,T:inspKind(a,t)?10:clamp(d/(OVD()*.18),3.5,8)};
  if(!replay){if(SPEEDS[speedIdx].d>7){speedIdx=4;speed.value=4;setSpeed();}playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');
  focusBody(t.def.id,{dist:Math.max((d*.5+Math.max(solidR(a),solidR(t)))*2.4,solidR(t)*4)});}
  var D=a.dart;D.cam=!replay;if(!replay)DCAM=true;D.t0=t0!=null?t0:simDays;D.Ts=Ts||D.T*Math.max(SPEEDS[speedIdx].d,1e-6);D.lk=Math.max(0,(simDays-D.t0)/D.Ts);
  toast(a.def.name+', '+t.def.name+' hedefine fırlatıldı'+(replay?' (tekrar oynatılıyor)':''),3500);
  return D.Ts;
}
var DV=new THREE.Vector3();
/* iki kara delik: önce birbirlerinin etrafında dönerek yaklaşır (sarmal), dönüş hızlanır ve ayrılık azalır ("chirp").
   Kütleçekim dalgası yayıldıkça ayrılık (tc−t)^(1/4) ile küçülür, açı ise (tc−t)^(5/8) ile ilerler; kalan zaman τ = 1−k. */
function isStarB(b){return !!(b&&(b.def.star||b===sunBody));}
function bhR(b){return effVr(b)*bhK(b);}
function mergeR(b){return isBH(b)?bhR(b):effVr(b);}
/* yaklaşma türü: 1 = kompakt çift (beyaz cüce / nötron yıldızı / kara delik: kütleçekim dalgasıyla sarmal), 2 = ortak zarfta sürtünmeyle sarmal,
   0 = düz dalış (kara delik + normal yıldız: gelgitle parçalanır, sarmal yok) */
function inspKind(a,t){
  if(!(isStarB(a)&&isStarB(t)))return 0;
  var ta=stType(a),tt=stType(t),ca=ta>=4&&ta<=6,ct=tt>=4&&tt<=6;
  if(ca&&ct)return 1;if(ta===6||tt===6)return 0;return 2;
}
/* ---- fırlatma yolu: iki cisim problemi ----
   Önceden yol düz bir çizgiyle yana kavisin karışımıydı, sarmal ise elle çizilmiş bir spiraldi: cisimler sabit hızla kayıyor,
   bazen geri dönüp kırık çizgiler çiziyordu. Artık göreli yol r'' = -GM r/|r|³ denkleminin sayısal çözümü (Kepler):
   cisim parabolik bir yörüngeyle düşer, yaklaştıkça hızlanır ve kütle merkezi etrafında kıvrılır.
   - düz dalış (gezegen → yıldız, yıldız → kara delik): enberi temas mesafesinin içinde, ilk geçişte çarpar
   - iki normal yıldız: ilk geçişte sıyırır, ortak zarfın sürtünmesi yörüngeyi yakalayıp birkaç turda içeri sarar
   - kompakt çift (beyaz cüce / nötron yıldızı / kara delik): kütleçekim dalgası yörüngeyi daraltır; turlar hızlanır (chirp)
   Ekranda görülebilsin diye zaman yaklaştıkça yavaşlatılır (dτ = dt·(s0/r)^1,5: her tur ekranda yaklaşık eşit süre alır); gerçekte son turlar saniyeden kısa sürer.
   Her iki cisim de ortak kütle merkezine göre hareket eder: hafif olan çok, ağır olan az (w = kütle payı). */
function dartTouch(a,t){
  var touch=effVr(a)+effVr(t);
  if(t===sunBody&&!a.def.star&&sunType!==6)touch=swallowR(a);
  if(isStarB(a)&&isStarB(t))touch=mergeR(a)+mergeR(t);
  if(isBH(t)&&!isBH(a))touch=effVr(t)*(t===sunBody?bhMassK():1)*4+effVr(a)*.6;
  return touch;
}
function dartTraj(D,a,t,H,ik){
  var r0v=new THREE.Vector3().subVectors(D.p0,H),s0=r0v.length()||1,u=r0v.clone().multiplyScalar(1/s0);
  var v=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),u);if(v.lengthSq()<1e-6)v.set(0,0,1);v.normalize();
  /* yörünge düzlemi biraz eğik: hepsi aynı düzlemde olmasın */
  v.applyAxisAngle(u,(D.tilt!=null?D.tilt:(D.tilt=(Math.random()-.5)*.8)));
  var Tn=Math.min(.6,dartTouch(a,t)/s0),q=ik===1?7:ik===2?1.6:.35,R=Math.min(.45,q*Tn);
  var x=1,y=0,vt=Math.sqrt(2*R),vx=-Math.sqrt(Math.max(0,2-vt*vt)),vy=vt*(D.spin||1),tau=0,ph=0,pa=0;
  var TT=[0],XX=[1],YY=[0],PP=[0],i,r;
  for(i=0;i<300000;i++){
    r=Math.sqrt(x*x+y*y);if(r<=Tn)break;
    var dt=Math.min(.004,.0015*Math.pow(r,1.5)),r3=r*r*r,ax=-x/r3,ay=-y/r3,om=1/Math.sqrt(r3);
    if(ik===2&&r<2.6*Tn){var g=.035*om*Math.pow(2.6*Tn/r,1.5);ax-=g*vx;ay-=g*vy;}
    if(ik===1&&r<12*Tn){var g1=.06*om*Math.pow(Tn/r,.5)*ss(12*Tn,7*Tn,r)+.012*om*Math.pow(7*Tn/r,3);ax-=g1*vx;ay-=g1*vy;}
    vx+=ax*dt;vy+=ay*dt;x+=vx*dt;y+=vy*dt;
    /* düşüş: gerçek zamana yakın (cisim yaklaştıkça hızlanır); sarmal bölgede her tur eşit süre */
    var Rb=ik===0?Tn:(ik===1?12:2.6)*Tn,wt=Math.pow(Math.max(r,Rb),-.35)*(r<Rb?Math.pow(Rb/Math.max(r,Tn*.5),1.5):1);tau+=dt*wt;
    var an=Math.atan2(y,x),da=an-pa;if(da>Math.PI)da-=TAU;if(da<-Math.PI)da+=TAU;ph+=da;pa=an;
    if(i%6===0){TT.push(tau);XX.push(x);YY.push(y);PP.push(ph);}
  }
  r=Math.sqrt(x*x+y*y);
  /* olmadıysa (çok uzun sarmal) son kısmı düz bir yaklaşmayla tamamla */
  if(r>Tn){var n2=40;for(var j=1;j<=n2;j++){var f=j/n2,k2=(r-(r-Tn)*f)/r;tau+=.02;TT.push(tau);XX.push(x*k2);YY.push(y*k2);PP.push(ph);}}
  TT.push(tau);XX.push(x*Tn/Math.max(r,1e-9));YY.push(y*Tn/Math.max(r,1e-9));PP.push(ph);
  var N=720,X=new Float32Array(N),Y=new Float32Array(N),PH=new Float32Array(N),T=TT[TT.length-1]||1,j0=0;
  for(var k=0;k<N;k++){var tt=k/(N-1)*T;while(j0<TT.length-2&&TT[j0+1]<tt)j0++;var t0=TT[j0],t1=TT[j0+1],w=t1>t0?clamp((tt-t0)/(t1-t0),0,1):0;
    X[k]=XX[j0]+(XX[j0+1]-XX[j0])*w;Y[k]=YY[j0]+(YY[j0+1]-YY[j0])*w;PH[k]=PP[j0]+(PP[j0+1]-PP[j0])*w;}
  D.trj={u:u,v:v,s0:s0,X:X,Y:Y,PH:PH,N:N};D.ins={np:0,si:s0*R,ph:0,s:s0};
}
function trjAt(D,k,H,out){
  var J=D.trj,f=clamp(k,0,1)*(J.N-1),i=Math.min(J.N-2,Math.floor(f)),w=f-i;
  var x=(J.X[i]+(J.X[i+1]-J.X[i])*w)*J.s0,y=(J.Y[i]+(J.Y[i+1]-J.Y[i])*w)*J.s0;
  out.copy(H).addScaledVector(J.u,x).addScaledVector(J.v,y);
  D.ins.ph=Math.abs(J.PH[i]+(J.PH[i+1]-J.PH[i])*w);D.ins.s=Math.sqrt(x*x+y*y);
}
function inspiralPos(D,a,t,k,out,kind){
  var touch=mergeR(a)+mergeR(t);
  if(!D.ins){var cn=D.cen||t.pos,r0=new THREE.Vector3().subVectors(D.p0,cn),s0=r0.length()||1,u0=r0.clone().multiplyScalar(1/s0),v0=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),u0);if(v0.lengthSq()<1e-6)v0.set(0,0,1);v0.normalize();
    D.ins={s0:s0,u0:u0,v0:v0,si:0,ph:0,np:0};}
  /* yarıçaplar her karede güncel temas mesafesinden hesaplanır (hedefin türü değişirken boyutu da değişir) */
  var I=D.ins;I.si=Math.min(I.s0,touch*(kind===1?14:5));var kA=I.s0>I.si*1.02?.3:0,sEnd=touch*(kind===1?.85:.8);
  if(k<kA){var q=k/kA;q=q*q*(3-2*q);out.copy(D.p0).lerp(new THREE.Vector3().copy(D.cen||t.pos).addScaledVector(I.u0,I.si),q);I.ph=0;return;}
  var tau=Math.max(0,(1-k)/(1-kA)),s,ph;
  if(kind===1){s=sEnd+(I.si-sEnd)*Math.pow(tau,.25);ph=TAU*6*(1-Math.pow(tau,.625));}   /* kütleçekim dalgası: s ∝ τ^(1/4), açı ∝ τ^(5/8) */
  else{s=sEnd+(I.si-sEnd)*Math.pow(tau,.5);ph=TAU*4*(1-Math.pow(tau,.25));}               /* ortak zarf: sürtünme, daha yumuşak sarmal */
  I.ph=ph;I.s=s;
  out.copy(D.cen||t.pos).addScaledVector(I.u0,s*Math.cos(ph)).addScaledVector(I.v0,s*Math.sin(ph));
}
/* her yarım turda ufak bir kütleçekim dalgası halkası: dönüş hızlandıkça halkalar sıklaşır */
function gwChirpFx(D,t){
  var I=D.ins;if(!I||I.np>16)return;var n=Math.floor(I.ph/Math.PI);if(n<=I.np||I.ph<TAU)return;I.np=n;
  var rg=new THREE.Mesh(new THREE.RingGeometry(.97,1,128),new THREE.MeshBasicMaterial({color:0xbfd8ff,transparent:true,opacity:.5,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  rg.rotation.x=-Math.PI/2;t.pivot.add(rg);FXL.push({o:rg,t:0,T:2.6,k:'ring',s:Math.max(I.s||0,I.si*.4)*3});
}
/* iki yıldız/kara delik de ortak kütle merkezine doğru hareket eder: hafif olan çok, ağır olan az. a = (1−w)·P + w·p0, t = H + w·(p0−P)
   (P: fırlatılanın hedefe göre hesaplanan yolu, H: hedefin kendi konumu, w = kütle payı). Gezegen fırlatılırsa w=0: hedef yerinde kalır. */
/* ---- yumuşak tür geçişi ----
   Tür değişince renk, parlaklık ve boyut bir anda sıçramaz: eski görünümden yeniye zamana yayılarak geçilir.
   Birleşmede: şişip kırmızı dev olur (5 sn), gaz dağılırken kırmızı kalır (~13 sn), sonra yavaşça küçülüp son rengine kayar. */
var MORPH=[];
function starLight(b){return b===sunBody?sunLight:b.light;}
function lookOf(b){var l=starLight(b);return {lo:b.sunU.lo.value.clone(),hi:b.sunU.hi.value.clone(),gl:b.glow1.material.color.clone(),lc:l?l.color.clone():null,I:l?l.intensity:0,sc:b.typeScale,sz:b.mod.size};}
function morphClear(b){MORPH=MORPH.filter(function(m){return m.b!==b;});b.morphing=false;}
function morphAdd(b,from,ty,dur,sz1){morphClear(b);b.morphing=true;MORPH.push({b:b,f:from,T:SUN_TYPES[ty],ty:ty,t:0,d:Math.max(.1,dur),sz1:sz1!=null?sz1:from.sz});}
var _mc=new THREE.Color();
function morphStep(dt){
  for(var i=MORPH.length-1;i>=0;i--){var m=MORPH[i],b=m.b;if(isGone(b)||!b.sunU){MORPH.splice(i,1);continue;}
    m.t+=Math.min(dt,.1);var q=clamp(m.t/m.d,0,1),e=q*q*(3-2*q),T=m.T,f=m.f,l=starLight(b);
    b.sunU.lo.value.lerpColors(f.lo,_mc.setHex(T.lo),e);b.sunU.hi.value.lerpColors(f.hi,_mc.setHex(T.hi),e);
    b.glow1.material.color.lerpColors(f.gl,_mc.setHex(T.glow),e);b.glow2.material.color.copy(b.glow1.material.color);
    if(l&&f.lc){l.color.lerpColors(f.lc,_mc.setHex(T.light),e);if(!b.exo||!b.exo.beams)l.intensity=f.I+((b===sunBody?T.I:T.I*.7)-f.I)*e;}
    b.typeScale=f.sc+(typeSc(b,m.ty)-f.sc)*e;b.mod.size=f.sz+(m.sz1-f.sz)*e;
    b.tilt.scale.setScalar(b.mod.size*b.typeScale);b.vr=effVr(b);
    if(q>=1){MORPH.splice(i,1);b.morphing=false;if(b!==sunBody)applySize(b);}}
}
var RN_SWELL=5,RN_HOLD=18,RN_END=44;
/* kırmızı nova: gaz kabuğu + kırmızı dev evresi, sonra ny türüne yumuşak geçiş (ny=null: dev kalır) */
function redNova(a,t,ny,szf){
  lrnFx(a,t);var fr=lookOf(t),sz1=fr.sz*(szf||1);
  if(!(t.starType===3&&(t!==sunBody||sunType===3)))starInto(t,3);
  t.typeScale=fr.sc;t.mod.size=fr.sz;morphAdd(t,fr,3,RN_SWELL,sz1);morphStep(0);
  /* şişme sürerken tür yazı olarak 3; asıl ikinci aşama gecikmeli */
  if(ny!=null&&ny!==3){stLater(t,ny,RN_END);
    after(RN_HOLD,function(){if(isGone(t))return;var ok=t===sunBody?SUN_PEND===ny:t.pend===ny;if(!ok)return;morphAdd(t,lookOf(t),ny,RN_END-RN_HOLD,t.mod.size);});}
}
var SETTLE=[];
function dartRelease(D,t,a,aPos){
  if(!D||!D.tp)return;
  var H=D.th,off=new THREE.Vector3().subVectors(D.tp,H);
  /* birleşen yıldız eski yörünge noktasına geri kaymaz: kalıntı birleşmenin olduğu yerden, o uzaklıktaki yörüngesiyle devam eder.
     (Önceden ilk seçilen yıldızın yerine geri süzülüyordu; momentum korunumuna aykırı ve tuhaf görünüyordu.) */
  if(off.lengthSq()>1e-10&&!isGone(t)){
    if(t!==sunBody&&t.def.star&&!t.parent){var sp=sunBody.pivot.position,rx=D.tp.x-sp.x,rz=D.tp.z-sp.z,r=Math.sqrt(rx*rx+rz*rz);
      if(r>1e-3){t.def.r=r;t.ang=Math.atan2(-rz,rx);var np=new THREE.Vector3(Math.cos(t.ang)*r,0,-Math.sin(t.ang)*r).add(sp);SETTLE.push({b:t,off:new THREE.Vector3().subVectors(D.tp,np),t:0,T:2.5,base:np,last:D.tp.clone()});t.pivot.position.copy(D.tp);
        customs.forEach(function(c){if(c.id===t.id){c.a=r/DS;}});saveCustom();}}
    else SETTLE.push({b:t,off:off,t:0,T:t===sunBody?5:1.8,base:H.clone(),last:D.tp.clone()});}
  if(a===sunBody&&aPos){var o2=aPos.clone();if(o2.lengthSq()>1e-10)SETTLE.push({b:a,off:o2,t:0,T:5,base:new THREE.Vector3(),last:aPos.clone()});}
  D.tp=null;
}
function dartSnap(D,t){if(D&&D.tp&&!isGone(t)){t.pivot.position.copy(D.th);}if(D)D.tp=null;}
function settleStep(dt){
  for(var i=SETTLE.length-1;i>=0;i--){var S=SETTLE[i];if(isGone(S.b)||!S.b.pivot){SETTLE.splice(i,1);continue;}
    var P=S.b.pivot.position;if(!(S.last&&P.distanceToSquared(S.last)<1e-10))S.base.copy(P);
    var TT=S.T||1.8;S.t+=Math.min(dt,.1);var q=clamp(S.t/TT,0,1);q=q*q*(3-2*q);
    P.copy(S.base).addScaledVector(S.off,1-q);S.last=P.clone();
    if(S.t>=TT)SETTLE.splice(i,1);}
}
/* ---- ortak zarf ----
   İki normal yıldız birbirine değecek kadar yaklaşınca dış katmanları birleşir ve ikisini de saran tek, şişkin, kızıl bir gaz zarfı oluşur
   (common envelope). Çekirdekler bu zarfın içinde sarmal çizerek birleşir; dışarıdan iki ayrı damla değil, tek bir parlayan bulut görünür.
   Birleşme bitince zarf birkaç saniyede kırmızı nova kabuğuna ve şişmiş yıldıza karışarak söner. */
var ENVS=[],_ea=new THREE.Vector3(),_eb=new THREE.Vector3();
function envMat(){return new THREE.ShaderMaterial({uniforms:{c1:{value:new THREE.Color()},c2:{value:new THREE.Color()},a:{value:0},t:{value:0},sc:{value:new THREE.Vector3(1,1,1)}},transparent:true,depthWrite:false,depthTest:false,
  vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 c1;uniform vec3 c2;uniform float a;uniform float t;uniform vec3 sc;varying vec3 vN;varying vec3 vV;varying vec3 vP;'+
    'float h(vec3 p){p=fract(p*.3183+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}'+
    /* gürültü gerçek boyutta: elipsoid uzayınca desen çizgi çizgi uzamasın */
    'void main(){float mu=clamp(dot(vN,vV),0.0,1.0);vec3 q=vP*sc/sc.y;mat3 R=mat3(.8,.6,0.0,-.48,.64,.6,.36,-.48,.8);vec3 q1=R*q*2.2+vec3(0.0,t*.2,0.0),q2=R*R*q*5.1-vec3(t*.35,0.0,0.0),q3=R*R*R*q*11.0;float n=n3(q1)*.55+n3(q2)*.3+n3(q3)*.15;'+
    /* kenara doğru incelen gaz: sert bir kabuk değil, yumuşak bir sis (merkezde kalın, kenarda saydam) */
    'vec3 col=mix(c2,c1,pow(mu,.8))*(.82+.36*n)*(.75+.45*mu);float al=a*smoothstep(0.0,.6,mu)*(.85+.25*n);gl_FragColor=vec4(col,clamp(al,0.0,.93));}'});}
/* ortak zarf: yıldızlar ilk değdiğinde dışarı saçılan gaz ikisini birden sarar ve birleşmeye kadar kalır.
   Önceden her yaklaşmada beliriyor, uzaklaşınca bir anda kayboluyordu; yıldızların içinden geçen kabuk da üstlerinde keskin çizgiler çiziyordu */
function envStep(D,a,t,dt){
  a.pivot.getWorldPosition(_ea);t.pivot.getWorldPosition(_eb);
  var ra=effVr(a),rt=effVr(t),rm=Math.max(ra,rt),d=_ea.distanceTo(_eb),sr=ra+rt;
  var c=Math.max(clamp(1-(d-sr)/(sr*.9),0,1),ss(.88,.97,D.k||0));
  D.envM=Math.max(D.envM||0,c);var cc=Math.max(c,D.envM*.8);
  if(cc<=0){if(D.env)D.env.visible=false;return;}
  if(!D.env){var m=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),envMat());m.renderOrder=3;m.frustumCulled=false;scene.add(m);D.env=m;}
  var E=D.env;E.visible=true;var dir=_eb.clone().sub(_ea);if(dir.lengthSq()<1e-9)dir.set(1,0,0);dir.normalize();
  E.position.copy(_ea).add(_eb).multiplyScalar(.5);E.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
  /* iki yıldızı (gelgitle uzamış halleriyle) rahatça içine alan, ayrıldıkça şişen bir bulut */
  var yz=rm*(1.25+.35*cc)+d*.22*cc;E.scale.set(Math.max(d*.5+rm*(1.3+.25*cc),yz),yz,yz);
  var U=E.material.uniforms;U.sc.value.copy(E.scale);U.t.value+=dt;
  var tg=Math.min(1,Math.pow(cc,1.1)*1.05);U.a.value+=(tg-U.a.value)*Math.min(1,Math.abs(dt)*3+(dt===0?0:.02));
  /* zarfın rengi: iki yıldızın renginden kızıla kayar (genişleyen gaz soğur) */
  U.c1.value.copy(a.glow1.material.color).lerp(t.glow1.material.color,.5).lerp(_mc.setHex(0xffc890),.35+.25*cc);U.c2.value.copy(U.c1.value).lerp(_mc.setHex(0xc0400f),.6);
}
function envRelease(D,t){if(!D||!D.env)return;ENVS.push({m:D.env,t:0,a0:D.env.material.uniforms.a.value,b:t,s0:Math.max(D.env.scale.y,(D.env.scale.x+D.env.scale.y)*.5)});D.env=null;}
function envKill(D){if(!D||!D.env)return;scene.remove(D.env);D.env.geometry.dispose();D.env.material.dispose();D.env=null;}
/* birleşmeden sonra zarfın gazı yeni yıldızın çevresinde küreselleşip dışarı doğru genişler ve incelir (fırlatılan kütle);
   önceden yıldızın arkasında ayrı bir top gibi kalıp üstünde keskin bir hilal çiziyordu */
function envFade(dt){for(var i=ENVS.length-1;i>=0;i--){var e=ENVS[i];e.t+=Math.abs(dt);var q=clamp(e.t/3.5,0,1);
  var sc=e.m.scale,U=e.m.material.uniforms;
  if(e.b&&!isGone(e.b)){e.b.pivot.getWorldPosition(_eb);e.m.position.copy(_eb);var r=Math.max(e.s0,effVr(e.b)*1.4)*(1+.9*q),k=Math.min(1,Math.abs(dt)*2.5);sc.x+=(r-sc.x)*k;sc.y+=(r-sc.y)*k;sc.z+=(r-sc.z)*k;}
  else{sc.multiplyScalar(1+Math.abs(dt)*.3);}
  U.sc.value.copy(sc);U.a.value=e.a0*Math.pow(1-q,2);U.t.value+=dt;
  if(q>=1){scene.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();ENVS.splice(i,1);}}}
/* Güneş fırlatılınca (ya da ağır bir yıldız onu çekince) gezegenleri, yörünge çizgileri ve asteroit kuşakları onunla birlikte gider:
   hepsi Güneş'e kütleçekimle bağlı. Önceden Güneş yerinden oynayınca gezegenler boş merkezin etrafında dönmeye devam ediyordu. */
var _so=new THREE.Vector3(),SUNOFF=false;
/* Ortak kütle merkezi görseli. Ek yıldızın yörünge çizgisi eskiden Güneş'in çevresine çiziliyordu: Güneş'ten 10 kat ağır bir kara delik
   eklenince bile "kara delik Güneş'in etrafında dönüyor" gibi görünüyordu. Oysa ikisi de ortak kütle merkezinin (sahnenin orijini) çevresinde
   döner: ağır olan küçük, hafif olan büyük çemberde. Tek bir ek yıldız varken iki çember de çizilir ve merkez işaretlenir:
   yıldızın çemberi göreli yörüngenin M☉/(M☉+m) katı, Güneş'inki m/(M☉+m) katı. Birden çok ek yıldızda yörüngeler kapalı eğri olmadığı
   için eski gösterim (Güneş'e göre çember) kalır. */
var BARY={ln:null,mk:null};
function baryViz(){
  if(!sunBody)return;
  var S=BODIES.filter(function(b){return b!==sunBody&&b.def.star&&!b.parent&&!isGone(b)&&!b.sysHide&&b.line&&b.line.parent===scene;});
  var one=S.length===1&&!SYS&&!S[0].dart&&!sunBody.dart&&!S[0].exoCol;
  S.forEach(function(st){if(!one&&st.line.scale.x!==1)st.line.scale.setScalar(1);});
  var show=one&&showOrbits&&!SURF;
  if(one){var st=S[0],ms=Math.max(.05,sunMass),m=stMass(st),M=ms+m;
    st.line.position.set(0,0,0);st.line.scale.setScalar(ms/M);
    if(show&&!BARY.ln){
      var pts=[];for(var k=0;k<=256;k++){var a=k/256*TAU;pts.push(new THREE.Vector3(Math.cos(a),0,-Math.sin(a)));}
      BARY.ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xf2b84b,transparent:true,opacity:.34,depthWrite:false}));BARY.ln.frustumCulled=false;scene.add(BARY.ln);
      var c=document.createElement('canvas');c.width=256;c.height=128;var g=c.getContext('2d');g.strokeStyle='rgba(236,238,244,.9)';g.lineWidth=3;g.beginPath();g.moveTo(128,22);g.lineTo(128,62);g.moveTo(108,42);g.lineTo(148,42);g.stroke();
      g.font='600 24px system-ui,sans-serif';g.textAlign='center';g.fillStyle='rgba(196,201,216,.9)';g.fillText('kütle merkezi',128,104);
      var tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;
      BARY.mk=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false}));BARY.mk.scale.set(.17,.085,1);BARY.mk.renderOrder=5;scene.add(BARY.mk);}
    if(BARY.ln)BARY.ln.scale.setScalar(st.def.r*m/M);}
  if(BARY.ln){BARY.ln.visible=!!show;BARY.mk.visible=!!show;}
}
function carrySun(){
  if(!sunBody)return;_so.copy(sunBody.pivot.position);var on=_so.lengthSq()>1e-8;if(!on&&!SUNOFF){baryViz();return;}SUNOFF=on;
  BODIES.forEach(function(b){if(b!==sunBody&&b.def.star&&!b.parent&&b.line&&b.line.parent===scene)b.line.position.copy(_so);});
  BODIES.forEach(function(b){if(b===sunBody||b.parent||b.def.star||isGone(b))return;
    /* fırlatılıp Güneş'e (ya da bir gezegene) düşen cisimler de Güneş merkezli koordinatta hesaplanır: onlar da taşınmalı, yoksa Güneş ortak kütle merkezinden uzaktayken boş noktaya düşüyorlardı */
    if(on&&!b.dart){b.pivot.position.add(_so);b.pivot.updateMatrixWorld(true);b.pivot.getWorldPosition(b.pos);}
    if(b.line&&b.line.parent===scene)b.line.position.copy(_so);});
  BELTS.forEach(function(o){if(o.pts.parent===scene)o.pts.position.copy(_so);});
  baryViz();
}
/* yörüngeleri kesişen cisimler birbirinin içinden geçmesin: değdiklerinde çarpışır/birleşir.
   (Örn. aynı uzaklıktaki iki ek yıldızın kütleleri farklıysa dönemleri de farklıdır; bir süre sonra biri ötekine yetişir.) */
var OVT=0;
function checkOverlaps(dt){
  OVT-=dt;if(OVT>0||dt<=0)return;OVT=.2;
  var L=BODIES.filter(function(b){return !b.parent&&!isGone(b)&&!b.def.craft&&!b.def.comet&&!b.sysHide&&!b.dart&&!b.homing&&!b.engulfed&&(b.grav||b.def.star);});
  for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){var a=L[i],c=L[j];
    if(!a.def.custom&&!c.def.custom)continue;if(gravityOn&&a.grav&&c.grav)continue;
    if(BODIES.some(function(x){return x.dart&&(x.dart.t===a||x.dart.t===c);}))continue;
    var d=a.pos.distanceTo(c.pos),tch=(a.def.star||c.def.star)?mergeR(a)+mergeR(c):effVr(a)+effVr(c);
    if(d<tch*1.05){var hv=(a===sunBody||(c!==sunBody&&(isStarB(a)?stMass(a):bodyMass(a)/333000)>=(isStarB(c)?stMass(c):bodyMass(c)/333000)))?a:c,lt=hv===a?c:a;
      toast(lt.def.name+' ile '+hv.def.name+' yörüngelerinde karşılaştı: çarpışma!',4000);
      /* iki gezegen: yerçekimi simülasyonu açılır, zaten değdikleri için çarpışma oradan doğal olarak işlenir (fırlatma gibi uzağa taşınmaz) */
      if(!a.def.star&&!c.def.star){if(!gravityOn)setGravity(true);}else launchPair(lt,hv);return;}}
}
function stepDarts(dt){
  settleStep(dt);morphStep(dt);envFade(dt);checkOverlaps(dt);
  BODIES.forEach(function(a){var D=a.dart;if(!D)return;var t=D.t;if(isGone(t)||isGone(a)){a.dart=null;envKill(D);unstretch(a);unstretch(t);return;}
    /* fırlatma simülasyon saatine bağlı: zaman durunca durur, geri sarınca yıldız geldiği yola geri döner */
    var kk=(simDays-D.t0)/D.Ts;if(kk<0){a.dart=null;envKill(D);a.pivot.position.copy(D.p0);if(a.grav){a.gx=D.p0.x;a.gy=D.p0.y;a.gz=D.p0.z;}dartSnap(D,t);unstretch(a);unstretch(t);return;}
    var fwd=kk>D.lk+1e-12;D.lk=kk;D.k=kk;var e=Math.pow(Math.min(1,D.k),1.7);
    /* hedefin kendi (ofsetsiz) konumu: pivot bizim koyduğumuz yerdeyse saklı ev konumu, yoksa (zaman akışı sıfırladıysa) pivotun kendisi */
    var tP=t.pivot.position;if(!D.th)D.th=new THREE.Vector3();if(!(D.tp&&tP.distanceToSquared(D.tp)<1e-10))D.th.copy(tP);
    var H=D.th;D.cen=H;
    if(D.w==null)D.w=(isStarB(a)&&isStarB(t))?stMass(a)/Math.max(1e-6,stMass(a)+stMass(t)):0;
    var ik=inspKind(a,t);if(!D.trj)dartTraj(D,a,t,H,ik);trjAt(D,Math.min(1,kk),H,DV);if(fwd&&ik===1)gwChirpFx(D,t);
    var P=DV.clone(),w=D.w;
    if(w>0){DV.copy(P).multiplyScalar(1-w).addScaledVector(D.p0,w);
      var tn=new THREE.Vector3().subVectors(D.p0,P).multiplyScalar(w).add(H);tP.copy(tn);if(!D.tp)D.tp=new THREE.Vector3();D.tp.copy(tP);}
    a.pivot.position.copy(DV);
    if(a.grav){a.gx=DV.x;a.gy=DV.y;a.gz=DV.z;}
    var dist=P.distanceTo(H),touch=effVr(a)+effVr(t);
    /* gelgit uzaması hafif tutulur (iki damla görüntüsü olmasın); normal yıldızlar değince ortak zarf ikisini birden sarar */
    if(isStarB(a)&&isStarB(t)&&!isBH(a)&&!isBH(t)){var sk=clamp(1-(dist-touch)/(touch*2.5),0,1)*.16,dv=new THREE.Vector3().subVectors(H,P).normalize();stretchTo(a,dv,sk);stretchTo(t,dv.clone().negate(),sk*.6);if(ik===2)envStep(D,a,t,dt);}
    if(t===sunBody&&sunType===6&&!isBH(a)){var rtd=a.def.star?Math.max(rtOf(a),effVr(a)*.9*Math.cbrt(sunMass/Math.max(.1,stMass(a)))+effVr(sunBody)*bhMassK()*3):rtOf(a);if(dist<rtd&&fwd){var Dsv=D;a.dart=null;dartRelease(D,t,a,null);var rv=new THREE.Vector3().subVectors(DV,t.pos),rl=rv.length(),tg=new THREE.Vector3(0,1,0).cross(rv).normalize(),vs=Math.sqrt(2*(a.GM||1)*sunMass/Math.max(rl,1e-3))*.97,v=tg.multiplyScalar(vs);a.gx=DV.x;a.gy=DV.y;a.gz=DV.z;a.gvx=v.x;a.gvy=v.y;a.gvz=v.z;startTDE(a,Dsv);}return;}
    if(t===sunBody&&!a.def.star&&sunType!==6)touch=swallowR(a);
    if(isStarB(a)&&isStarB(t))touch=mergeR(a)+mergeR(t);
    if(isBH(t)&&!isBH(a))touch=effVr(t)*(t===sunBody?bhMassK():1)*4+effVr(a)*.6;
    if(fwd&&(dist<=touch||D.k>=1)){a.dart=null;var aP=a===sunBody?DV.clone():null;envRelease(D,t);unstretch(a);unstretch(t);
      /* eklenen kara delik bir yıldızı/gezegeni yutuyorsa: akıntı (kara delik hangisiyse onun çerçevesinde; sonuç cismi t'dir) */
      var tdl=null;if(t!==sunBody&&a!==sunBody&&(isBH(t)!==isBH(a))){var vic=isBH(t)?a:t;tdl={vic:{def:{name:vic.def.name,star:vic.def.star,dot:vic.def.dot,vr:vic.def.vr}},vr:effVr(vic),rel:new THREE.Vector3().subVectors(a.pos,t.pos).multiplyScalar(vic===a?1:-1)};}
      resolveDart(a,t);if(tdl&&!isGone(t)&&isBH(t)){var fv={def:tdl.vic.def,mod:{size:1},typeScale:1};fv.def.vr=tdl.vr;tdeLite(t,fv,tdl.rel);}dartRelease(D,t,a,aP);}
  });
  carrySun();
}
function hideStar(b){b.dart=null;b.cust=customs.filter(function(c){return c.id===b.id;})[0]||b.cust;destroyBody(b);customs=customs.filter(function(c){return c.id!==b.id;});saveCustom();rebuildLists();}
function stretchTo(b,dir,k){if(k<=0.001){b.pivot.quaternion.identity();b.pivot.scale.set(1,1,1);return;}b.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),dir);b.pivot.scale.set(1+k,1-k*.35,1-k*.35);}
function unstretch(b){if(b&&b.pivot){b.pivot.quaternion.identity();b.pivot.scale.set(1,1,1);}}
function removeStar(b){BODIES.filter(function(x){return x.parent===b;}).forEach(disposeBody);disposeBody(b);customs=customs.filter(function(c){return c.id!==b.id;});saveCustom();rebuildLists();}
function gwRipple(host,R){for(var q=0;q<4;q++){var rg=new THREE.Mesh(new THREE.RingGeometry(.97,1,160),new THREE.MeshBasicMaterial({color:0xbfd8ff,transparent:true,opacity:.7,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));rg.rotation.x=-Math.PI/2;rg.userData.post=true;rg.userData.gw=true;host.add(rg);FXL.push({o:rg,t:-q*.45,T:5.5,k:'ring',s:R});}}
function starInto(t,ty){if(t===sunBody)setStar(ty);else setStarOn(t,ty);}
function addStarMass(t,m){if(t===sunBody){sunMass=Math.max(.05,sunMass+m);$('sMass').value=sliderFromMass(Math.max(.1,sunMass-EATEN/333000));$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();}else{t.massAbs=Math.max(.05,stMass(t)+m);}}
function gen(n){var v=(n.toLocaleLowerCase('tr-TR').match(/[aeıioöuü](?=[^aeıioöuü]*$)/)||['e'])[0],end=/[aeıioöuü]$/i.test(n),m={a:'ın',ı:'ın',e:'in',i:'in',o:'un',u:'un',ö:'ün',ü:'ün'}[v];return n+'\''+(end?'n':'')+m;}
function fallText(nm,tt,tn){
  if(tt===6)return nm+' kara deliğe düştü: gelgit kuvveti onu uzatıp parçaladı, maddesi diske karışıp olay ufkunda kayboldu.';
  if(tt===5)return nm+' nötron yıldızına çarptı: çekim Dünya\'nınkinin 100 milyar katı; gezegen saniyeler içinde parçalanıp 20 km\'lik yıldızın yüzeyine milimetrelerce ince bir tabaka olarak yayıldı. Çarpma anında güçlü bir X-ışını parlaması oldu.';
  if(tt===4)return nm+' beyaz cüceye yaklaşınca gelgit kuvvetiyle parçalandı; enkazı yıldızın yüzeyine yağdı. Gökbilimciler bazı beyaz cücelerin atmosferinde böyle yutulmuş gezegenlerin metallerini (demir, magnezyum, silisyum) gerçekten görüyor.';
  if(tt===3)return nm+' kırmızı devin seyreltik dış katmanlarına daldı; gazın sürtünmesiyle yavaşlayıp içeri doğru sarmal çizdi ve buharlaştı. Güneş 5 milyar yıl sonra kırmızı dev olunca Merkür ve Venüs\'ün başına bu gelecek.';
  if(tt===7)return nm+' boş merkezden geçip gitti; burada artık bir yıldız yok.';
  return nm+' '+(tn==='Güneş'?'Güneş\'e':'yıldıza')+' düştü ve birkaç saat içinde buharlaştı. Yıldız için bu bir damla: kütlesi neredeyse hiç değişmedi, yalnızca yüzeyinde kısa bir parlama oldu.';
}
/* ---------- yıldız–yıldız birleşmeleri ----------
   Sonuç bileşenlerin türüne, kütlesine ve kütle oranına göre seçilir. Eşikler yayımlanmış çalışmalara dayanır:
   nötron yıldızı kütle üst sınırı ~2,2 M☉ (TOV); GW170817 (2,74 M☉ → kısa süre sonra kara delik, ~0,06 M☉ madde fırlaması);
   GW200105 (8,9+1,9 M☉, nötron yıldızı bütün yutuldu) ve GW200115 (5,9+1,4 M☉); çift beyaz cüce: 1,4 M☉ sınırı, şiddetli birleşme
   (toplam ≳2,0 M☉ ve kütle oranı ≳0,8) ya da merkez dışı karbon tutuşması; parlak kırmızı novalar (V1309 Sco: ~10⁴–10⁶ L☉, plato 20–200 gün);
   SN 1987A öncülü (~15+5 M☉ birleşmesi → mavi süperdev). */
var M_TOV=2.2;
function fmM(x){var r=x<1?Math.round(x*100)/100:Math.round(x*10)/10;return String(r%1===0?r:(x<1?r.toFixed(2):r.toFixed(1))).replace('.',',');}
function setStarMass(t,m){m=Math.max(.05,m);if(t===sunBody){sunMass=m;$('sMass').value=sliderFromMass(Math.max(.1,sunMass-EATEN/333000));$('oMass').textContent=massTxt();if(focus===sunBody)updateInfo();}else t.massAbs=m;}
function feedBH(t,k){var o=bhExo(t);if(o)o.fuel=Math.min(6,(o.fuel||0)+k);}
function stLater(t,ty,delay){if(t===sunBody)SUN_PEND=ty;else t.pend=ty;after(delay,function(){if(isGone(t))return;if(t===sunBody){if(SUN_PEND===ty)setStar(ty);}else if(t.pend===ty)setStarOn(t,ty);});}
function lrnFx(a,t){var r=Math.max(effVr(t),effVr(a)),sh=nebPoints('lrn');sh.scale.setScalar(r*3);t.pivot.add(sh);PNEB.push({ts:simDays,k:'lrn',sp:sh,t:0,R:r*1.2});}
function snIa(t){snStart(t,true);if(t===sunBody)after(1.8,function(){setStar(7);});else after(1.8,function(){if(!isGone(t))hideStar(t);});}
function mergeStars(a,t,ta,tt,host){
  var mA=stMass(a),mT=stMass(t),M=mA+mT,lo=Math.min(mA,mT),hi=Math.max(mA,mT),q=lo/hi,R=Math.max(effVr(t),effVr(a)),msg='',flash=true,flK=1,flC=0xffffff;
  var one=function(x){return ta===x||tt===x;};
  var both=function(x,y){return (ta===x&&tt===y)||(ta===y&&tt===x);};
  var mOf=function(ty){return ta===ty?mA:mT;};
  if(ta===6&&tt===6){
    /* ışık yok: etrafta gaz olmadığı için kara delik çifti karanlık birleşir; tek iz kütleçekim dalgasıdır. Kütlenin ~%5'i enerji olarak yayılır */
    flash=false;var rad=M*.05,ex=(t===sunBody?EXO:t.exo);
    gwRipple(host,OVD()*.22);after(.7,function(){if(!isGone(t))gwRipple(host,OVD()*.16);});
    setStarMass(t,M-rad);if(ex)ex.rd=0;if(typeof audChirp==='function'&&AUD.on&&AUD.ctx)audChirp('gw');
    msg='İki kara delik birleşti: ışık çıkmadı, yalnızca kütleçekim dalgası.\nBirbirinin etrafında hızlanarak döndüler ve olay ufukları tek bir ufukta birleşti. Etrafta gaz olmadığı için parlama yok. Toplam kütlenin yaklaşık %5\'i ('+fmM(rad)+' Güneş kütlesi) dalga olarak yayıldı; geriye '+fmM(M-rad)+' Güneş kütleli tek kara delik kaldı. LIGO 2015\'te GW150914\'ü böyle ölçtü (62 Güneş kütlesi, ~3 tanesi dalga olarak yayıldı).';
  }
  else if(ta===5&&tt===5){
    /* nötron yıldızı çifti: kalıntının kaderi toplam kütleye bağlı (M_TOV≈2,2: dönüşsüz sınır; dönme ve farklı dönme sınırı ~%20–60 yukarı iter) */
    var ej,dl,head,det;
    if(M>3.2){ej=.002;dl=1.2;head='Nötron yıldızları birleşti: kalıntı hemen kara deliğe çöktü.';det='Toplam kütle ('+fmM(M)+' Güneş kütlesi) en hızlı dönen nötron yıldızının bile taşıyabileceği sınırın (~2,9–3,5) üstünde; çekirdek milisaniyeler içinde çöktü. Çok az madde fırladı (~0,002 Güneş kütlesi), bu yüzden kilonova sönük. Kısa gama ışını patlaması yalnızca jet bize dönükse görülür.';}
    else if(M>=2.75){ej=.05;dl=2.2;head='Nötron yıldızları birleşti: kalıntı kısa süre ayakta kalıp kara deliğe çöktü.';det='Aşırı kütleli bir nötron yıldızı oluştu; hızlı ve eşit olmayan dönüşü onu birkaç saniye ayakta tuttu, sonra kara deliğe çöktü. Gerçek örnek GW170817: toplam 2,74 Güneş kütlesi, gama patlaması 1,7 saniye sonra. ~'+fmM(ej)+' Güneş kütlesi madde fırlayıp kilonova verdi; altın ve platin gibi ağır elementlerin (r-süreci) bir kısmı böyle oluşur. Kütlenin ~%2\'i kütleçekim dalgası oldu.';}
    else if(M>=2.3){ej=.03;dl=7;head='Nötron yıldızları birleşti: kalıntı önce süperkütleli nötron yıldızı, sonra kara delik.';det='Kalıntı ('+fmM(M-.08)+' Güneş kütlesi) dönmeyen sınırı aşıyor ama hızlı dönüşle ayakta duruyor: süperkütleli bir manyetar. Dönüşü dakikalar–saatler içinde yavaşlayınca kara deliğe çöker (burada kısaltıldı). ~0,03 Güneş kütlesi madde fırlayıp kilonova verdi.';}
    else{ej=.03;dl=null;head='Nötron yıldızları birleşti: kalıntı kararlı bir manyetar.';det='Toplam kütle ('+fmM(M)+' Güneş kütlesi) sınırın altında kaldığı için kalıntı çökmedi: milisaniye dönüşlü, çok güçlü manyetik alanlı tek bir nötron yıldızı. ~0,03 Güneş kütlesi madde fırlayıp kilonova verdi. Bu tür kalıntıların X-ışını platosu ve uzun parlayan jetleri olabilir.';}
    flash=false;kilonova(t,ej);gwRipple(host,OVD()*.2);setStarMass(t,M-.05-ej);
    if(dl!=null)after(dl,function(){if(isGone(t))return;starInto(t,6);var ex=t===sunBody?EXO:t.exo;if(ex)ex.fuel=.6;});
    msg=head+'\n'+det;
  }
  else if(one(6)&&one(5)){
    /* nötron yıldızı–kara delik: kütle oranı ≳4 ise yıldız ufka varmadan parçalanmaz, bütün yutulur (GW200105); düşükse parçalanıp disk olur */
    var bh=ta===6?a:t,mb=stMass(bh),mn=ta===6?mT:mA,whole=mb/mn>=4;
    if(bh===a)starInto(t,6);
    if(whole){flash=false;gwRipple(host,OVD()*.18);setStarMass(t,M*.99);
      msg='Kara delik nötron yıldızını bütün yuttu: ışık yok.\nKütle oranı ≈'+fmM(mb/mn)+' (≥4): kara delik büyüdükçe en içteki kararlı yörünge, nötron yıldızının parçalanma yarıçapından uzak kalır; yıldız parçalanmadan ufka girer. Dışarıda madde kalmadığı için kilonova ya da gama patlaması beklenmez, yalnızca kütleçekim dalgası. Gerçek örnek: GW200105 (8,9 Güneş kütleli kara delik + 1,9 Güneş kütleli nötron yıldızı).';}
    else{feedBH(t,5);gwRipple(host,OVD()*.18);setStarMass(t,M-.01*M-.02);
      msg='Nötron yıldızı kara delik tarafından parçalandı.\nKütle oranı ≈'+fmM(mb/mn)+' (<4): gelgit kuvveti yıldızı ufka varmadan yırttı. Madde bir disk oluşturdu, ~0,02 Güneş kütlesi fırlayıp soluk bir kilonova verdi. Gerçekte bu, düşük kütleli ve hızlı dönen kara deliklerde görülür; GW200115\'te (5,9+1,4 Güneş kütlesi) parçalanma olasılığı yalnızca yüzde birkaçtı.';}
  }
  else if(one(6)){
    /* kara delik + normal yıldız ya da beyaz cüce: gelgit bozulması; gazın yaklaşık yarısı kara deliğe düşer */
    var bh2=ta===6?a:t,oth=bh2===t?a:t,to=stType(oth),mo=stMass(oth),mb2=stMass(bh2);
    if(bh2===a)starInto(t,6);
    /* disk akıntı geldikçe parlar (tdeLite besler); ilk anda yalnızca az bir artış */
    setStarMass(t,mb2+mo*.5);feedBH(t,t===sunBody?6:1.2);
    /* gelgit bozulmasında parlayan yer kara deliğe yakın küçük bölgedir (birkaç gelgit yarıçapı): ekranı kaplayan beyaz parlama yok */
    flK=.28;flC=0xffc890;
    if(to===4)msg='Kara delik beyaz cüceyi gelgitle parçaladı.\nBeyaz cüce çok yoğun olsa da gelgit yarıçapı ufuktan büyük: yaklaşık yarısı diske düşüp hızlı bir X-ışını parlaması verdi, yarısı uzaya savruldu. Kara delik '+fmM(mb2+mo*.5)+' Güneş kütlesine çıktı.';
    else if((to===2||to===3)&&mo>=5)msg='Kara delik dev bir yıldızın içine daldı.\nZarf kara deliğe doğru çekilince çekirdek çöküşüne benzeyen bir durum oluşur (collapsar): ultra-uzun gama ışını patlaması üretebilir. Yıldızın yaklaşık yarısı kara delikte kaldı, kalanı savruldu. Yeni kütle '+fmM(mb2+mo*.5)+' Güneş kütlesi.';
    else msg='Kara delik yıldızı gelgitle parçaladı (gelgit bozulması olayı).\nYıldız uzayıp sıcak gaz akıntısına dönüştü. Gazın yaklaşık yarısı diske düşüp aylarca X-ışınıyla parladı, yarısı uzaya savruldu. Kara delik '+fmM(mb2+mo*.5)+' Güneş kütlesine çıktı.';
  }
  else if(both(5,4)){
    /* nötron yıldızı + beyaz cüce: beyaz cüce gelgitle yırtılır, disk onlarca saniyede yutulur; GRB 211211A / 230307A için önerilen yol */
    var mn2=mOf(5),mw=mOf(4),mf=mn2+.3*mw,toBH=mf>=M_TOV;
    snStart(t,false);gwRipple(host,OVD()*.14);setStarMass(t,mf);
    if(toBH)after(4,function(){if(!isGone(t))starInto(t,6);});else if(t.starType!==5&&!(t===sunBody&&sunType===5))starInto(t,5);
    msg='Nötron yıldızı beyaz cüceyi parçaladı: uzun gama patlaması ve soluk kilonova.\nBeyaz cüce gelgitle yırtıldı; döküntü nötron yıldızının çevresinde ~0,2 Güneş kütlelik bir disk oldu ve onlarca saniyede yutuldu. ~0,1 Güneş kütlesi madde fırladı. GRB 211211A ve GRB 230307A\'nın böyle oluşmuş olabileceği düşünülüyor (kesin değil). '+(toBH?'Kalıntı kütlesi ('+fmM(mf)+') sınırı aştığı için kara delik oluştu.':'Geriye '+fmM(mf)+' Güneş kütleli, hızlı dönen çok manyetik bir nötron yıldızı (manyetar) kaldı.');
  }
  else if(one(5)){
    /* nötron yıldızı + normal yıldız: ortak zarf, nötron yıldızı çekirdeğe batar. Kararlı Thorne–Żytkow nesnesi pek olası değil: disk oluşur, kütle sınırı aşılırsa kara deliğe çöker */
    var nsM=mOf(5),gas=ta===5?mT:mA,fy=(nsM+gas*.3>=2.3)?6:5;
    redNova(a,t,fy);setStarMass(t,nsM+gas*.3);
    msg='Nötron yıldızı bir yıldızın içine gömüldü.\nDışarıdan kırmızı süperdev gibi görünen bir Thorne–Żytkow nesnesi (1977\'de öngörülmüş, kesin gözlenmedi) oluşur. Güncel modeller kararlı olmasının zor olduğunu gösteriyor: çekirdeğe batan nötron yıldızı disk kurar ve kütle alır; '+(fy===6?'kütlesi ~'+fmM(nsM+gas*.3)+' Güneş kütlesi sınırını aşınca kara deliğe çöker ve zarfı fırlatır (ultra-uzun gama patlaması benzeri parlama).':'yaklaşık 2,3 Güneş kütlesini aşamadığı için geriye yine bir nötron yıldızı kalır.')+' Binlerce yıl birkaç saniyeye kısaltıldı.';
  }
  else if(ta===4&&tt===4){
    /* çift beyaz cüce: bileşim kütleden (He <0,5; CO 0,5–1,1; ONe >1,1) ve toplam kütleden (1,4 sınırı; ≥2,0 + q≥0,8 şiddetli birleşme) bellidir */
    var cmp=function(m){return m<.5?'He':(m<1.1?'CO':'ONe');},cl=cmp(lo),ch=cmp(hi);
    if(cl==='He'&&ch==='He'){
      setStarMass(t,M);
      msg='İki helyum beyaz cüce birleşti: sıcak bir alt cüce (sdB) doğdu.\nHelyum çekirdeği tutuşup yaklaşık 100 milyon yıl yanar; sonra yeniden beyaz cüce olur. Tek bir alt cüce yıldızı bu tür birleşmelerden doğabilir.';
    }
    else if(cl==='He'&&ch==='CO'&&hi>=.9){
      flash=false;snIa(t);
      msg='Helyum beyaz cüce, karbon-oksijen beyaz cücenin üstüne çöktü: çift patlama süpernovası.\nYüzeyde biriken helyum önce patlar, şok dalgası çekirdeği de tutuştururken toplam kütle 1,4 sınırının altında bile olsa yıldız tamamen dağılır. Bu yolun sönük, hızlı bir Tip Ia verdiği düşünülüyor.';
    }
    else if(cl==='He'&&M<1.4){
      redNova(a,t,4);setStarMass(t,M*.99);
      msg='Helyum + karbon-oksijen beyaz cüceler birleşti: R Coronae Borealis türü bir dev doğdu.\nBirleşen yıldız helyum kabuğu yakan, toz perdeleriyle aniden sönen soluk bir dev olur; bu evre ~100 bin yıl sürer, sonra tek bir kütleli beyaz cüceye soğur. Galakside bu tür yalnızca birkaç yüz–bin nesne var.';
    }
    else if(M<1.4){
      redNova(a,t,4);setStarMass(t,M*.99);
      msg='İki beyaz cüce birleşti: kütle 1,4 sınırının altında, patlama yok.\nBirleşen madde şişkin, sıcak bir dev oluşturdu; yaklaşık bin yılda soğuyup daha kütleli ve daha küçük tek bir beyaz cüceye dönüşür (burada kısaltıldı). Bazen kısa süreli karbonca zengin bir dev evresi görülür.';
    }
    else if(cl==='CO'&&ch==='CO'&&M>=2&&q>=.8){
      flash=false;snIa(t);
      msg='İki karbon-oksijen beyaz cüce şiddetle birleşti: Tip Ia süpernova!\nToplam kütle ('+fmM(M)+' Güneş kütlesi) ve benzer kütleler: ısınan temas bölgesi birleşme sırasında karbonu tutuşturdu, yıldız birkaç yüz saniyede tamamen dağıldı; geriye hiçbir şey kalmadı. Bu "şiddetli birleşme" yolunda 1,4 sınırı aşılmadan da patlama olabilir.';
    }
    else{
      redNova(a,t,5);setStarMass(t,1.35);
      msg='İki beyaz cüce birleşti: kalıntı kütle sınırını aştı ve nötron yıldızına çöktü.\nToplam kütle ('+fmM(M)+' Güneş kütlesi) 1,4 sınırının üstünde ama birleşme patlatmadı: merkez dışında tutuşan karbon yanıp içe doğru ilerledi, kalıntı yaklaşık 10 bin yıl karbon dev olarak durup elektron yakalayarak çöker (burada kısaltıldı). Sonuç, hızlı dönen çok manyetik genç bir nötron yıldızı.';
    }
  }
  else if(one(4)){
    /* beyaz cüce + normal yıldız: yıldız hafifse beyaz cüce üstüne dökülür, ağırsa beyaz cüce yıldızın içine batar */
    var wd=ta===4?a:t,oth2=wd===a?t:a,to2=stType(oth2),mw2=stMass(wd),mo2=stMass(oth2);
    if(to2===3&&mw2+.55>=1.38){
      redNova(a,t,null);setStarMass(t,M-.25*mo2);after(RN_HOLD,function(){if(!isGone(t))snIa(t);});
      msg='Beyaz cüce bir devin içine battı: çekirdek-dejenere Tip Ia süpernova yolu.\nBeyaz cüce devin çekirdeğiyle birleşip 1,4 sınırına yaklaştı; önce zarf kırmızı nova ile savruldu, sonra çekirdek patladı. Bu, Tip Ia\'ların bir olası (tartışmalı) kaynağı; gerçekte patlama binlerce–milyarlarca yıl gecikebilir.';
    }
    else if(mo2<mw2){
      flash=false;setStarMass(t,Math.min(mw2+.5*mo2,1.37));if(t.starType!==4&&!(t===sunBody&&sunType===4))starInto(t,4);
      msg='Beyaz cüce hafif yıldızı parçaladı ve üstüne topladı.\nYıldız gelgitle yırtıldı; yaklaşık yarısı beyaz cücenin üstüne yağıp parlak bir nova patlaması verdi, yarısı savruldu. Beyaz cüce '+fmM(Math.min(mw2+.5*mo2,1.37))+' Güneş kütlesine çıktı; 1,4 sınırını aşmadığı için patlama olmadı.';
    }
    else{
      redNova(a,t,3,t!==sunBody?Math.pow(M/Math.max(mT,.1),.35):1);setStarMass(t,M-.25*mo2);
      msg='Beyaz cüce bir yıldızın içine batıp çekirdeğine yerleşti.\nOrtak zarf evresinde zarfın yaklaşık dörtte biri parlak kırmızı nova olarak savruldu; yıldız hızlı dönen, şişkin bir dev oldu ve çekirdeği artık bir beyaz cüce. Zarfın yarıdan azı atıldığı için yeni dev uzun yaşar.';
    }
  }
  else{
    /* normal yıldız + normal yıldız: ortak zarf ve parlak kırmızı nova; kütlenin yaklaşık %10'u savrulur (V1309 Sco: 1,5+0,16 Güneş kütlesi, 2008) */
    var ej2=.1*lo,Mf=M-ej2,giant=one(3),gM=giant?(ta===3&&tt===3?hi:mOf(3)):0,ny=M>=8?2:(giant?3:(M<.45?1:0));
    redNova(a,t,ny,t!==sunBody?Math.pow(M/Math.max(mT,.1),.35):1);setStarMass(t,Mf);
    var lrn=' Parlak kırmızı nova: tepe parlaklığı ~10⁴–10⁶ Güneş, plato 20–200 gün, savrulan gaz 100–500 km/s ve soğuyup toz yapar (2000–4000 K).';
    if(giant&&gM>=5&&M>=8)msg='Yıldızlar birleşti: kırmızı süperdev mavi süperdev oldu.\nDevin zarfına giren yoldaş sarmal çizip zarfla karıştı; zarf helyum ve azotça zenginleşip hızlı dönmeye başladı.'+lrn+' Kalıntı '+fmM(Mf)+' Güneş kütleli mavi süperdev: SN 1987A\'nın öncülünün (~15+5 Güneş kütleli bir birleşme) böyle oluştuğu düşünülüyor. Birkaç on bin yıl sonra çekirdek çökmesiyle süpernova olur.';
    else if(giant&&M<8)msg='Yıldızlar birleşti: hızlı dönen, şişkin bir dev doğdu.\nYoldaş devin zarfına girip sarmal çizdi.'+lrn+' Kalıntı tek yıldız ('+fmM(Mf)+' Güneş kütlesi); çift kutuplu bir toz bulutuyla çevrili, çok hızlı dönen FK Comae türü bir dev. Bu yüzden dev yıldızların bir kısmı beklenenden hızlı döner.';
    else if(M>=8)msg='Yıldızlar birleşti: tek, kütleli bir mavi dev doğdu.\nİki ağır yıldızın birleşmesi daha ağır, daha sıcak ve çoğu zaman manyetik bir yıldız verir (kütleli manyetik yıldızların bir kısmının birleşmeden doğduğu düşünülüyor).'+lrn+' Kalıntı '+fmM(Mf)+' Güneş kütleli; ömrü birkaç milyon yıl, sonunda süpernova.';
    else if(ny===1)msg='Kırmızı cüceler birleşti: daha kütleli tek bir kırmızı cüce.\nTam konvektif oldukları için kalıntı hızla karışır, çok yavaş yanar ve trilyonlarca yıl yaşar. Birleşme sönük bir parlama verir.'+lrn+' Kalıntı '+fmM(Mf)+' Güneş kütleli.';
    else msg='Yıldızlar birleşti: daha sıcak, hızlı dönen tek bir yıldız doğdu.\nÇiftin sarmal çizerek birleşmesi V1309 Scorpii\'de (2008) gözlendi: öncülü 1,4 gün dönemli değen bir çiftti.'+lrn+' Kalıntı '+fmM(Mf)+' Güneş kütleli; yıldız kümelerinde bu yolla oluşan yıldızlara "mavi başıboş" denir. Binlerce yıl birkaç saniyeye kısaltıldı.';
  }
  if(flash)flashAt(host,new THREE.Vector3(),R*14*flK,flC);
  hideStar(a);
  return msg;
}
function resolveDart(a,t){
  unstretch(a);unstretch(t);
  var ta=stType(a),tt=stType(t),aS=ta>=0,tS=tt>=0,nmA=a.def.name,nmT=t.def.name,host=t.pivot,msg='';
  var keepA=function(){var P=a.pivot.position;a.ang=Math.atan2(-P.z,P.x);if(a.def.r!=null)a.def.r=Math.max(P.length(),effVr(sunBody)*3);};
  if(!aS&&tS){ // gezegen → yıldız
    flashAt(host,new THREE.Vector3().subVectors(a.pos,t.pos),effVr(a)*6,tt===6?0xffd0a0:0xfff0d0);destroyBody(a);
    if(tt===6)feedBH(t,1.5);
    if(t===sunBody){var m=bodyMass(a);EATEN+=m;sunMass+=m/333000;$('oMass').textContent=massTxt();}
    msg=fallText(nmA,tt,nmT);
  }else if(aS&&!tS){ // yıldız → gezegen
    flashAt(t.pivot,new THREE.Vector3(),effVr(t)*7,ta===6?0xffd0a0:0xffffff);destroyBody(t);keepA();
    msg=ta===6?nmA+', '+nmT+' gezegenini gelgit kuvvetiyle uzatıp parçaladı ve yuttu.':ta===5?nmA+', '+nmT+' gezegenini parçalayıp yüzeyine yaydı; çarpmada güçlü bir X-ışını parlaması oldu.':ta===4?nmA+', '+nmT+' gezegenini gelgit kuvvetiyle parçaladı; enkazı beyaz cücenin yüzeyine yağdı.':nmA+', '+nmT+' gezegenini yuttu: gezegen yıldızın sıcak gazına dalıp birkaç saat içinde buharlaştı. Yıldız neredeyse hiç etkilenmedi.';
    if(typeof audWhoosh==='function')audWhoosh();
  }else{ // yıldız → yıldız
    msg=a===sunBody?mergeStars(t,a,tt,ta,a.pivot):mergeStars(a,t,ta,tt,host);
    if(typeof audWhoosh==='function')audWhoosh();SHAKE.t=1.4;SHAKE.amp=effVr(t)*.08;
  }
  var nf=(isGone(t)||!byId[t.def.id])?(byId[a.def.id]&&!isGone(a)?a.def.id:'sun'):t.def.id;
  if(!(focus&&focus.def.id===nf&&!isGone(focus)))focusBody(nf,{dist:Math.max(effVr(t),20)*10});
  toast(msg,9000);toastLock=performance.now()+8500;
}
function launchAt(){launchPair(focus,byId[$('lTarget').value]);}
function launchPair(b,t){
  if(!b||!t||t===b)return;
  /* Güneş'i bir gezegene fırlatmak = gezegeni Güneş'e düşürmek: Güneş en az 1000 kat ağır olduğu için ortak kütle merkezi Güneş'in içinde kalır, hareket eden gezegendir */
  if(b===sunBody&&!t.def.star){if(t.parent||!t.grav){toast('Uydular ve uzay araçları hedef olamaz');return;}launchPair(t,sunBody);toast('Güneş → '+t.def.name+': Güneş '+(t.def.id==='jupiter'?'Jüpiter\'den 1000':'gezegenden binlerce')+' kat ağır olduğu için ortak kütle merkezi Güneş\'in içinde; asıl hareket eden '+t.def.name+'.',7000);return;}
  if(b.parent){toast('Uydular fırlatılamaz; önce gezegeni seç');return;}
  if(isGone(t)){toast('Hedef artık yok');return;}
  if(t===sunBody&&sunType===7){toast('Merkezde artık bir yıldız yok; önce yıldız türünü seç.',5000);return;}
  /* gezegen → Güneş: gerçek kütleçekimle düşer (yerçekimi simülasyonu). Güneş kara delikse gezegen gelgitle uzayıp girdap çizen bir akıntıya
     dönüşür. Dün bu yol yanlışlıkla düz "fırlatma" yoluna bağlanmıştı; spagettileşme girdabı bu yüzden kaybolmuştu. */
  if(b.def.star||t.def.star||b===sunBody){var de={type:'dart',a:b.id,tg:t.id};addEvent(de);de.Ts=startDart(b,t);if(b.dart)b.dart.ev=de;return;}
  if(!b.grav){toast('Bu cisim fırlatılamaz');return;}
  if(!gravityOn)setGravity(true);
  if(isGone(t)){toast('Hedef artık yok');return;}
  addEvent({type:'launch',a:b.id,tg:t.id});
  doLaunch(b,t,false);
}
function doLaunch(b,t,replay){
  var tp=t.def.id==='sun'?new THREE.Vector3():new THREE.Vector3(t.gx,t.gy,t.gz),tv=t.def.id==='sun'?new THREE.Vector3():new THREE.Vector3(t.gvx,t.gvy,t.gvz);
  var R=effVr(b)+effVr(t),D=Math.max(R*14,25),side=tp.clone().normalize().multiplyScalar(-1);
  if(side.lengthSq()<.5)side.set(1,0,0);
  var perp=new THREE.Vector3(-side.z,0,side.x).normalize(),dir=perp.clone().multiplyScalar(.93).add(new THREE.Vector3(0,.37,0)).normalize();
  var p=tp.clone().addScaledVector(dir,D);b.gx=p.x;b.gy=p.y+R*.2;b.gz=p.z;
  var vrel=D/30;b.gvx=tv.x-dir.x*vrel;b.gvy=tv.y-dir.y*vrel;b.gvz=tv.z-dir.z*vrel;b.trailN=0;
  b.homing={t:t,rel:new THREE.Vector3(b.gx-tp.x,b.gy-tp.y,b.gz-tp.z),v:dir.clone().multiplyScalar(-vrel)};
  BODIES.forEach(function(x){if(x!==b&&x.homing&&x.homing.t===b)x.homing=null;});
  if(!replay){if(SPEEDS[speedIdx].d>7){speedIdx=4;speed.value=4;setSpeed();}playing=true;setPlayIcon();reverse=false;$('rev').setAttribute('aria-pressed','false');}
  b.pivot.position.set(b.gx,b.gy,b.gz);
  if(!replay)focusBody(t.def.id==='sun'?b.def.id:t.def.id,{dist:t.def.id==='sun'?effVr(b)*14:Math.max(effVr(t),effVr(b))*12+(effVr(t)+effVr(b))*3});
  toast(b.def.name+', '+t.def.name+' hedefine fırlatıldı'+(replay?' (tekrar oynatılıyor)':''));
}
function fillTargets(){
  var s=$('lTarget');if(!s)return;var v=s.value;s.innerHTML='';var sun=focus===sunBody;
  /* Güneş yalnızca başka bir yıldıza fırlatılabilir: listede yalnızca yıldızlar */
  BODIES.forEach(function(b){if((b.grav||b.def.star||(b===sunBody&&sunType!==7))&&!isGone(b)&&!b.sysHide&&b!==focus&&(!sun||b.def.star||(b.grav&&!b.parent))){var o=document.createElement('option');o.value=b.def.id;o.textContent=b.def.name;s.appendChild(o);}});
  if(v)s.value=v;if(!s.value&&s.options.length)s.selectedIndex=0;
  var nt=$('lNote');if(!nt){nt=document.createElement('p');nt.className='note';nt.id='lNote';$('lGo').closest('.btnrow').after(nt);}
  var empty=!s.options.length;s.closest('.frow').hidden=empty;$('lGo').closest('.btnrow').hidden=empty;
  nt.textContent=empty?(sun?'Güneş sistemin merkezi; yalnızca başka bir yıldıza fırlatılabilir. Önce Ekle sekmesinden bir yıldız ekle.':'Fırlatılacak hedef yok.'):'';nt.hidden=!empty;
}
function roche(b){
  if(!b.parent||b.destroyed||!b.def.orbit)return;
  var rr=b.mod.rr||moonRR(b),lim=moonRoche(b);
  if(rr>=lim)return;
  var p=b.parent,n=LOWQ?1400:3000,pos=new Float32Array(n*3),r=new Float32Array(n),th=new Float32Array(n),w=new Float32Array(n),y=new Float32Array(n);
  var rv=moonVisR(b),P=b.def.P*moonPScale(b),w0=TAU/P,a0=b.ang;
  for(var i=0;i<n;i++){var g=(Math.random()+Math.random()+Math.random()-1.5)*.5;r[i]=rv*(1+g*.25);th[i]=a0+(Math.random()-.5)*.25;w[i]=w0*Math.pow(r[i]/rv,-1.5);y[i]=(Math.random()-.5)*effVr(b)*.4;}
  var gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var col=b.def.dot?new THREE.Color(b.def.dot[0]):new THREE.Color(0xcccccc);
  var pts=new THREE.Points(gg,new THREE.PointsMaterial({color:col,size:1.6,sizeAttenuation:false,transparent:true,opacity:.85,depthWrite:false,map:dotTex()}));
  pts.frustumCulled=false;var grp=new THREE.Group();grp.rotation.x=(b.def.incl||0)*D2R;grp.add(pts);p.pivot.add(grp);
  p.debris=p.debris||[];p.debris.push({g:grp,pts:pts,r:r,th:th,w:w,y:y,n:n});
  var mp=b.pos.clone();p.pivot.worldToLocal(mp);flashAt(p.pivot,mp,effVr(b)*3,0xffe6c8);
  destroyBody(b);
  toast(b.def.name+' Roche sınırını geçti: '+p.def.name+' gezegeninin gelgit kuvveti onu parçaladı. Enkaz yörüngeye yayılıp bir halka oluşturuyor.',7000);
}
function updateDebrisRings(dDays){
  BODIES.forEach(function(p){if(!p.debris)return;p.debris.forEach(function(D){
    var a=D.pts.geometry.attributes.position.array;
    for(var i=0;i<D.n;i++){D.th[i]+=D.w[i]*dDays;var c=Math.cos(D.th[i]),s=Math.sin(D.th[i]);a[i*3]=c*D.r[i];a[i*3+1]=D.y[i];a[i*3+2]=-s*D.r[i];D.y[i]*=1-Math.min(1,Math.abs(dDays)*.002);}
    D.pts.geometry.attributes.position.needsUpdate=true;});});
}
function clearDestruction(){
  clearTimeline();
  BODIES.forEach(function(b){
    if(b.destroyed){b.destroyed=false;b.pivot.visible=true;if(b.treeBtn)b.treeBtn.hidden=false;if(b.dockBtn)b.dockBtn.hidden=false;}
    if(b.debris){b.debris.forEach(function(D){D.g.parent.remove(D.g);D.pts.geometry.dispose();D.pts.material.dispose();});b.debris=null;}
    b.mass=null;b.impT0=null;b.rogue=false;b.mod.rr=null;if(b.line&&b.parent&&b.def.orbit)b.line.scale.setScalar(1);
  });
  FXL.forEach(function(f){f.o.parent&&f.o.parent.remove(f.o);});FXL=[];
}
function syncMoonUI(){
  var b=focus,sec=$('moonSec');if(!sec)return;
  var ok=b&&b.parent&&b.def.orbit&&!b.destroyed&&!b.def.craft;sec.hidden=!ok;if(!ok)return;
  var rr0=moonRR(b),rr=b.mod.rr||rr0,lo=1.15,hi=rr0*2.2;
  $('sMoonD').value=Math.log(rr/lo)/Math.log(hi/lo);
  $('oMoonD').textContent=(rr<10?rr.toFixed(1):Math.round(rr)).toString().replace('.',',')+' R';
  $('moonNote').textContent=b.parent.def.name+' yarıçapının '+(rr<10?rr.toFixed(1):Math.round(rr)).toString().replace('.',',')+' katı uzaklıkta (gerçekte '+(rr0<10?rr0.toFixed(1):Math.round(rr0)).toString().replace('.',',')+'). Roche sınırı: '+moonRoche(b).toFixed(1).replace('.',',')+' kat. Bunun içine giren uydu gelgit kuvvetiyle parçalanır.';
}
$('sMoonD').addEventListener('input',function(){
  var b=focus;if(!b||!b.parent)return;var rr0=moonRR(b),lo=1.15,hi=rr0*2.2;
  var nrr=lo*Math.pow(hi/lo,+this.value);
  if(nrr<moonRoche(b)){addEvent({type:'rr',id:b.id,rr:nrr});}
  b.mod.rr=nrr;if(b.line)b.line.scale.setScalar(moonVisR(b)/b.def.orbit);
  syncMoonUI();if(b.mod.rr<moonRoche(b)){roche(b);syncMoonUI();}
  else if(b.mod.rr<moonRoche(b)*1.25&&!b.rWarn){b.rWarn=1;toast('Dikkat: Roche sınırına yaklaşıyorsun, gelgit kuvveti uyduyu esnetiyor');}
});
$('lGo').addEventListener('click',launchAt);
