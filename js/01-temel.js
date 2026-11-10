/* Celestia · Temel yardımcılar, gürültü ve yüzey desenleri (prosedürel dokular).
   Dosyalar index.html'deki sırayla yüklenir ve aynı kapsamı paylaşır (derleme adımı yok): burada tanımlanan her üst düzey ad
   sonraki dosyalarda da geçerlidir. Yüklenirken çalışan kod yalnızca kendinden önceki dosyalardaki adlara dokunabilir. */
'use strict';
/* Dosyalar tek tek yüklenir; iki dosya arasında tarayıcı bekleyen zamanlayıcıları çalıştırabilir. Yüklenirken "biraz sonra" yapılacak iş
   setTimeout ile değil afterLoad ile sıraya konur: son dosya (15-baslat.js) hepsi yüklendikten sonra sırayı çalıştırır. Böylece ertelenen kod,
   henüz yüklenmemiş bir dosyadaki ada dokunamaz. */
var LOAD_Q=[];
function afterLoad(f){LOAD_Q.push(f);}
var D2R=Math.PI/180, TAU=Math.PI*2;
var clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};
var ss=function(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
var hex=function(h){return [(h>>16)&255,(h>>8)&255,h&255];};
var hexStr=function(s){var n=parseInt(s.slice(1),16);return hex(n);};
var rgbCss=function(c){return 'rgb('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+')';};
var mix=function(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
var rnd=function(a,b){return a+Math.random()*(b-a);};
var $=function(id){return document.getElementById(id);};
var esc=function(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

/* ---------- 3B değer gürültüsü (dikişsiz küre dokuları) ---------- */
function h3(x,y,z){var h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295;}
function sm(t){return t*t*(3-2*t);}
function vnoise(x,y,z){
  var xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=sm(x-xi),yf=sm(y-yi),zf=sm(z-zi);
  var l=function(a,b,t){return a+(b-a)*t;};
  return l(
    l(l(h3(xi,yi,zi),h3(xi+1,yi,zi),xf),l(h3(xi,yi+1,zi),h3(xi+1,yi+1,zi),xf),yf),
    l(l(h3(xi,yi,zi+1),h3(xi+1,yi,zi+1),xf),l(h3(xi,yi+1,zi+1),h3(xi+1,yi+1,zi+1),xf),yf),zf);
}
function fbm(x,y,z,o){var a=.5,s=0,f=1;for(var i=0;i<o;i++){s+=a*vnoise(x*f,y*f,z*f);f*=2.03;a*=.5;}return s;}

function makeTex(w,h,fn,linear){
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var g=c.getContext('2d'),im=g.createImageData(w,h),d=im.data;
  for(var j=0;j<h;j++){
    var lat=(0.5-(j+.5)/h)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
    for(var i=0;i<w;i++){
      var lon=(i/w)*TAU,o=fn(cl*Math.cos(lon),sl,cl*Math.sin(lon)),k=(j*w+i)*4;
      d[k]=o[0];d[k+1]=o[1];d[k+2]=o[2];d[k+3]=o.length>3?o[3]:255;
    }
  }
  g.putImageData(im,0,0);
  var t=new THREE.CanvasTexture(c);if(!linear)t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}

/* ---------- yüzey desenleri ---------- */
function sunFn(lo,hi){return function(x,y,z){var n=fbm(x*7,y*7,z*7,5),g=fbm(x*22,y*22,z*22,2);return mix(lo,hi,clamp(n*1.35+g*.35-.12,0,1));};}
var CITY_HS=[[50,10,11,1],[41,-78,9,1],[34,-118,4,.8],[24,80,9,1],[32,115,8,1.1],[36,138,4,1],[-23,-46,5,.9],[30,31,3.5,.9],[6.5,3.5,3.5,.7],[20,-100,5,.7],[56,37,5,.9],[-7,110,5,.9],[37,127,2.5,.9],[-26,28,3.5,.7],[-34,151,3.5,.7],[-34,-58,4,.8],[31,40,6,.6],[40,30,4,.8],[23,113,3,1],[14,100,5,.6],[55,-3,3,.9],[45,-75,4,.6],[-33,-70,2.5,.5],[28,-96,4,.5]];
var EMASK=null,EMW=1024,EMH=512;
function initEarthMask(){
  var bin=atob(window.CELESTIA_EARTH_MASK),by=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)by[i]=bin.charCodeAt(i);
  var m=new Float32Array(EMW*EMH),p=0,cur=0,k=0;
  while(p<by.length){var r=0,sh=0,c;do{c=by[p++];r|=(c&127)<<sh;sh+=7;}while(c&128);if(cur)for(var j=0;j<r;j++)m[k+j]=1;k+=r;cur^=1;}
  var tmp=new Float32Array(EMW*EMH),R=5;
  for(var pass=0;pass<2;pass++){
    for(var y=0;y<EMH;y++){var acc=0,row=y*EMW;for(var x=-R;x<=R;x++)acc+=m[row+((x+EMW)%EMW)];
      for(var x2=0;x2<EMW;x2++){tmp[row+x2]=acc/(2*R+1);acc+=m[row+((x2+R+1)%EMW)]-m[row+((x2-R+EMW)%EMW)];}}
    for(var x3=0;x3<EMW;x3++){for(var y2=0;y2<EMH;y2++){var a2=0;for(var q=-R;q<=R;q++){var yy=Math.min(EMH-1,Math.max(0,y2+q));a2+=tmp[yy*EMW+x3];}m[y2*EMW+x3]=a2/(2*R+1);}}
  }
  EMASK=m;
}
function emSample(u,v){
  var fx=u*EMW-.5,fy=clamp(v*EMH-.5,0,EMH-1.001),x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;
  var xa=((x0%EMW)+EMW)%EMW,xb=(xa+1)%EMW,m=EMASK;
  return (m[y0*EMW+xa]*(1-tx)+m[y0*EMW+xb]*tx)*(1-ty)+(m[(y0+1)*EMW+xa]*(1-tx)+m[(y0+1)*EMW+xb]*tx)*ty;
}
function geoUV(x,y,z){var lon=Math.atan2(z,x);if(lon<0)lon+=TAU;return [lon/TAU,.5-Math.asin(clamp(y,-1,1))/Math.PI];}
function earthLand(x,y,z){
  if(!EMASK)initEarthMask();
  var g=geoUV(x,y,z),L=emSample(g[0],g[1]);
  var nn=fbm(x*9+2,y*9,z*9,4)-.5,s=clamp(L+nn*.34*(1-Math.abs(2*L-1)),0,1);
  var n=.35+s*.4+(fbm(x*4+9,y*4,z*4,3)-.5)*.1*(1-s);
  n+=(fbm(x*6+7,y*6,z*6,5)-.5)*.3*s*s;
  return n;
}
function bandCol(B,l){
  if(l<=B[0][0])return hex(B[0][1]);
  for(var i=1;i<B.length;i++){if(l<=B[i][0]){var t=ss(B[i-1][0],B[i][0],l);return mix(hex(B[i-1][1]),hex(B[i][1]),t);}}
  return hex(B[B.length-1][1]);
}
var JUP_B=[[-90,0x7b746f],[-62,0x948a7f],[-48,0xbfae95],[-38,0xa98668],[-30,0xe9dcc4],[-24,0xc79a70],[-16,0x9c6038],[-8,0xd8b896],[-4,0xf1e7d3],[3,0xe8d7b9],[7,0xefe2c9],[11,0x8f5230],[17,0xa66b44],[21,0xebdec6],[27,0xb98b62],[33,0xdfcfb3],[42,0xb39a7c],[55,0x9a8d7f],[90,0x7b746f]];
var SAT_B=[[-90,0x8c8e86],[-60,0xb9a988],[-40,0xd8c49a],[-25,0xcfb27e],[-12,0xe6d3a6],[0,0xefe0b9],[10,0xe3cc98],[22,0xc9a76f],[32,0xdcc59a],[48,0xc3ad84],[65,0xa59c86],[90,0x8a948f]];
function craters(x,y,z,f,dens){
  var X=x*f,Y=y*f,Z=z*f,ix=Math.floor(X),iy=Math.floor(Y),iz=Math.floor(Z),v=0;
  for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++)for(var c=-1;c<=1;c++){
    var cx=ix+a,cy=iy+b,cz=iz+c;if(h3(cx,cy,cz)>dens)continue;
    var px=cx+h3(cx+11,cy,cz),py=cy+h3(cx,cy+13,cz),pz=cz+h3(cx,cy,cz+17),r=.12+.38*Math.pow(h3(cx+5,cy+7,cz+3),2);
    var d=Math.sqrt((X-px)*(X-px)+(Y-py)*(Y-py)+(Z-pz)*(Z-pz))/r;
    if(d<1.6){v+=d<1?-.32*(1-d*d)+.1*(d<.25?1-d/.25:0):0;v+=.22*Math.exp(-Math.pow((d-1)/.13,2));}
  }
  return v;
}
var TEX={
  mercury:function(x,y,z){var n=fbm(x*4,y*4,z*4,6),v=.36+n*.5;return [v*190,v*182,v*172];},
  venus:function(x,y,z){var t=fbm(x*2,y*5,z*2,5);return mix(hex(0xc29a58),hex(0xf2dfaa),ss(.3,.75,t));},
  earth:function(x,y,z){
    var n=earthLand(x,y,z),ay=Math.abs(y),alat=Math.asin(ay)*57.2958,g=geoUV(x,y,z),lon=g[0]*360-180,lat=Math.asin(y)*57.2958;
    var nz=vnoise(x*6,y*6,z*6)-.5,ice=ay+nz*.08;
    var land=n>=.55;
    if(land&&lat>59&&lon>-75&&lon<-12&&ice>.84-nz*.1)return mix(hex(0xe4edf4),hex(0xffffff),vnoise(x*9,y*9,z*9));
    if(ice>(land?.93:.915))return mix(hex(0xdfe8ef),hex(0xffffff),vnoise(x*9,y*9,z*9));
    if(!land)return mix(hex(0x041a40),hex(0x1f6bb5),ss(.34,.55,n));
    var e=ss(.55,.78,n),tr=1-ss(.18,.5,ay),band=Math.exp(-Math.pow((alat-24)/9,2));
    var dry=clamp(ss(.32,.58,fbm(x*3+11,y*3,z*3,4))*band*1.6+band*.62-.08,0,1)*(1-ss(.72,.9,n)*.5);
    var c=mix(hex(0x4f8a3a),hex(0x7a9650),e*.7);
    c=mix(c,hex(0x1d6330),tr*(1-dry)*.85);
    c=mix(c,hex(0x839a6e),ss(.8,.92,ay));
    c=mix(c,hex(0xc5a96b),dry);
    c=mix(c,hex(0x8a8576),ss(.82,.97,n)*.8);
    c=mix(c,hex(0xe8eef2),ss(.9,.99,n)*ss(.2,.6,ay));
    var dt=fbm(x*40,y*40,z*40,2)-.5;return [c[0]*(1+dt*.18),c[1]*(1+dt*.18),c[2]*(1+dt*.18)];
  },
  height:function(x,y,z){var v=clamp(earthLand(x,y,z),0,1)*255;return [v,v,v];},
  lights:function(x,y,z){
    var n=earthLand(x,y,z);if(n<.57||Math.abs(y)>.86)return [0,0,0];
    var g=geoUV(x,y,z),lon=g[0]*360-180,lat=Math.asin(y)*57.2958,w=0,cl=Math.cos(lat/57.2958);
    for(var i=0;i<CITY_HS.length;i++){var h=CITY_HS[i],dl=(lon-h[1]),dd=lat-h[0];if(dl>180)dl-=360;if(dl<-180)dl+=360;var d2=(dd*dd+dl*dl*cl*cl)/(h[2]*h[2]);if(d2<9)w+=h[3]*Math.exp(-d2);}
    var c=clamp(w,0,1.4)*ss(.3,.62,fbm(x*14+3,y*14,z*14,4)+.18),s=h3(Math.floor(x*170),Math.floor(y*170),Math.floor(z*170))>.55?1:.4;
    var v=c*s;return [255*v,190*v,105*v];
  },
  clouds:function(x,y,z){var c=fbm(x*2.6+20,y*3.4+2,z*2.6,6);return [255,255,255,ss(.52,.72,c)*225];},
  moon:function(x,y,z){var n=fbm(x*5,y*5,z*5,6),m=ss(.45,.6,fbm(x*1.6+4,y*1.6,z*1.6,4)),v=(.78-.42*m)*(.82+n*.36);return [v*215,v*212,v*206];},
  mars:function(x,y,z){
    var n=fbm(x*3,y*3,z*3,6),d=fbm(x*1.6+7,y*1.6,z*1.6,4),c=mix(hex(0x9b4526),hex(0xd98a52),n);
    c=mix(c,hex(0x5a2c1a),ss(.52,.38,d)*.45);
    var cr=(fbm(x*24,y*24,z*24,3)-.5)*.18;c=[c[0]*(1+cr),c[1]*(1+cr),c[2]*(1+cr)];
    var cap=Math.abs(y)+(vnoise(x*8,y*8,z*8)-.5)*.08;if(cap>.9)c=mix(c,hex(0xf4f4f4),ss(.9,.93,cap));
    return c;
  },
  jupiter:function(x,y,z){
    var lat=Math.asin(clamp(y,-1,1))*57.2958,wv=fbm(x*2.2+3,y*9,z*2.2,4)-.5,st=fbm(x*5+1,y*38,z*5,4)-.5;
    var edge=Math.abs(Math.sin(lat*.35));
    var lw=lat+wv*7*(.4+edge)+st*2.2;
    var c=bandCol(JUP_B,lw);
    c=mix(c,hex(0x5b6f86),ss(.62,.8,fbm(x*7+4,y*20,z*7,3))*Math.exp(-Math.pow((lat-8)/2.5,2))*.55);
    var k=.88+.24*(fbm(x*9,y*44,z*9,3));c=[c[0]*k,c[1]*k,c[2]*k];
    var gl=-22*D2R,gx=Math.cos(gl)*Math.cos(1.2),gy=Math.sin(gl),gz=Math.cos(gl)*Math.sin(1.2),dx=x-gx,dy=(y-gy)*2.1,dz=z-gz,gd=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(gd<.2){var sw=fbm(x*14+Math.atan2(dy,dx+dz)*1.5,y*14,z*14,3);c=mix(c,mix(hex(0xb4503a),hex(0xd98a62),sw),ss(.13,.07,gd));c=mix(c,hex(0xf2e6d2),Math.exp(-Math.pow((gd-.135)/.02,2))*.55);}
    for(var o=0;o<3;o++){var ol=-40*D2R,ph=2.4+o*.55,ox=Math.cos(ol)*Math.cos(ph),oy=Math.sin(ol),oz=Math.cos(ol)*Math.sin(ph),ex=x-ox,ey=(y-oy)*1.8,ez=z-oz,od=Math.sqrt(ex*ex+ey*ey+ez*ez);c=mix(c,hex(0xfaf4ea),ss(.045,.02,od)*.9);}
    return c;
  },
  saturn:function(x,y,z){
    var lat=Math.asin(clamp(y,-1,1))*57.2958,wv=fbm(x*2+5,y*8,z*2,4)-.5,lw=lat+wv*3+(fbm(x*4,y*50,z*4,3)-.5)*1.4;
    var c=bandCol(SAT_B,lw),k=.93+.14*Math.sin(lw*2.6)*.5+.07*fbm(x*6,y*60,z*6,2);c=[c[0]*k,c[1]*k,c[2]*k];
    if(lat>74){var a=Math.atan2(z,x),hx=Math.cos(lat*D2R)/Math.cos(Math.PI/6)*Math.cos(((a%(Math.PI/3))+Math.PI/3)%(Math.PI/3)-Math.PI/6);c=mix(c,hex(0x6f8590),ss(.27,.24,hx)*.6);}
    return c;
  },
  uranus:function(x,y,z){var lat=Math.asin(clamp(y,-1,1))*57.2958,n=fbm(x*2,y*14,z*2,3),c=mix(hex(0x7fc6d0),hex(0xb6e8ee),ss(-20,70,lat)*.6+n*.25);return mix(c,hex(0xd8f6f8),ss(55,80,lat)*.5);},
  neptune:function(x,y,z){
    var lat=Math.asin(clamp(y,-1,1))*57.2958,t=fbm(x*3,y*10,z*3,5),c=mix(hex(0x223f9e),hex(0x3f6fd6),t);
    c=mix(c,hex(0x1a2e70),ss(.55,.75,fbm(x*2+7,y*6,z*2,3))*.4);
    var s=fbm(x*5+3,y*24,z*5,3);c=mix(c,hex(0xdbe8ff),ss(.66,.8,s)*.7*(1-ss(50,70,Math.abs(lat))));
    var dl=-20*D2R,dx=x-Math.cos(dl)*Math.cos(.4),dy=(y-Math.sin(dl))*1.9,dz=z-Math.cos(dl)*Math.sin(.4),dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
    return c;
  },
  pluto:function(x,y,z){var n=fbm(x*3,y*3,z*3,6),h=ss(.5,.62,fbm(x*1.5+9,y*1.5,z*1.5,4));return mix(mix(hex(0x8a6c58),hex(0xc8b09a),n),hex(0xefe3d0),h*.8);},
  io:function(x,y,z){var n=fbm(x*4,y*4,z*4,5),p=fbm(x*9+2,y*9,z*9,3),c=mix(hex(0xd9c75a),hex(0xf0e48a),n);c=mix(c,hex(0xc2552a),ss(.62,.72,p)*.8);return mix(c,hex(0x2e2b2a),ss(.74,.8,fbm(x*12+8,y*12,z*12,2))*.9);},
  europa:function(x,y,z){var n=fbm(x*3,y*3,z*3,4),c=mix(hex(0xcfc6b6),hex(0xf0ebe0),n),cr=Math.abs(vnoise(x*7,y*7,z*7)-.5);return mix(c,hex(0x8a5a3a),ss(.04,0,cr)*.8);},
  ganymede:function(x,y,z){var n=fbm(x*5,y*5,z*5,5),b=fbm(x*2+5,y*2,z*2,3),c=mix(hex(0x5e5750),hex(0xa39a8e),n);return mix(c,hex(0xc9c2b6),ss(.55,.7,b)*.6);},
  callisto:function(x,y,z){var n=fbm(x*6,y*6,z*6,5),sp=ss(.7,.78,fbm(x*24,y*24,z*24,2));return mix(mix(hex(0x403730),hex(0x7a6c5e),n),hex(0xdad4cc),sp*.7);},
  titan:function(x,y,z){return mix(hex(0xc98a2e),hex(0xe9b657),fbm(x*3,y*5,z*3,4));},
  smallMoon:function(x,y,z){var n=fbm(x*5,y*5,z*5,5),v=.45+n*.5;return [v*190,v*180,v*170];}
};
/* yaratıcı gezegen türleri: renk seçimine göre boyanır */
function customFns(type,rgb,seed){
  var dark=mix(rgb,[0,0,0],.62),light=mix(rgb,[255,255,255],.55),s=seed;
  var em=null,fn;
  if(type==='rocky'){
    fn=function(x,y,z){var n=fbm(x*4+s,y*4,z*4,6),c=fbm(x*15+s,y*15,z*15,2);return mix(mix(dark,rgb,ss(.25,.6,n)),light,ss(.62,.85,n)*.7).map(function(v,i){return v*(1-ss(.55,.3,c)*.22);});};
  }else if(type==='earth'){
    /* Dünya benzeri: ~%30 kara (yeşil-kahverengi, enleme göre çöl/orman/tundra), mavi okyanus, kutup buzulları */
    fn=function(x,y,z){
      var n=fbm(x*1.8+s,y*1.8,z*1.8,6),la=Math.abs(y),ice=la+(vnoise(x*6,y*6,z*6)-.5)*.12;
      if(ice>.86)return [238,244,250];
      if(n<.58){var d=ss(.3,.58,n);return mix([14,40,92],[34,96,160],d);}
      var e=ss(.58,.8,n),dry=ss(.12,.32,Math.abs(la-.33))*(fbm(x*5+s,y*5,z*5,3)),forest=[52,96,44],steppe=[150,140,90],desert=[196,168,116],tundra=[130,128,110];
      var c=la>.62?mix(forest,tundra,ss(.62,.8,la)):mix(forest,mix(steppe,desert,ss(.4,.7,dry)),ss(.25,.6,dry));
      return mix(c,[150,140,130],ss(.78,.95,n)*.8).map(function(v){return v*(.85+.3*e);});
    };
  }else if(type==='ocean'){
    var land=mix(rgb,[255,255,255],.1);land=[land[1]*.7+40,land[2]*.5+80,land[0]*.4+30];
    fn=function(x,y,z){
      var n=fbm(x*2.1+s,y*2.1,z*2.1,6),ice=Math.abs(y)+(vnoise(x*6,y*6,z*6)-.5)*.1;
      if(ice>.89)return [236,244,250];
      if(n<.55)return mix(dark,rgb,ss(.3,.55,n));
      var e=ss(.55,.74,n);return mix(mix(land,mix(land,[255,255,255],.5),e),[140,135,120],ss(.76,.95,n));
    };
  }else if(type==='gas'){
    fn=function(x,y,z){
      var t=fbm(x*2.5+s,y*7,z*2.5,5),v=Math.sin(y*(11+(s%5))+t*4.5)*.5+.5,f=fbm(x*6,y*36,z*6,3);
      var c=mix(light,rgb,ss(.3,.75,v));c=mix(c,mix(rgb,[255,255,255],.8),ss(.75,.95,v)*.6);return mix(c,dark,ss(.65,.9,f)*.35);
    };
  }else if(type==='ice'){
    fn=function(x,y,z){
      var n=fbm(x*3+s,y*3,z*3,5),cr=Math.abs(vnoise(x*6+s,y*6,z*6)-.5),c=mix(mix(light,[240,248,255],.6),mix(rgb,[255,255,255],.35),n);
      return mix(c,mix(rgb,[10,20,50],.5),ss(.035,0,cr)*.8);
    };
  }else if(type==='lava'){
    fn=function(x,y,z){
      var n=fbm(x*3+s,y*3,z*3,6),cr=Math.abs(vnoise(x*5+s,y*5,z*5)-.5)+Math.abs(vnoise(x*11,y*11,z*11)-.5)*.5;
      var g=ss(.07,0,cr);return mix(mix([20,15,14],[64,44,38],n),mix(rgb,[255,230,160],.5),g);
    };
    em=function(x,y,z){
      var cr=Math.abs(vnoise(x*5+s,y*5,z*5)-.5)+Math.abs(vnoise(x*11,y*11,z*11)-.5)*.5,g=ss(.07,0,cr);
      return [rgb[0]*g,rgb[1]*g*.8,rgb[2]*g*.6];
    };
  }else{ // desert
    fn=function(x,y,z){
      var t=fbm(x*3+s,y*8,z*3,5),v=Math.sin(y*20+t*6)*.5+.5,d=fbm(x*9,y*9,z*9,3);
      return mix(mix(dark,rgb,ss(.2,.7,v)),light,ss(.6,.9,d)*.7);
    };
  }
  return {fn:fn,em:em};
}

function ringTex(){
  var c=document.createElement('canvas');c.width=1024;c.height=1;var g=c.getContext('2d'),im=g.createImageData(1024,1),d=im.data;
  for(var i=0;i<1024;i++){
    var t=i/1023,a=0;
    if(t<.14)a=.05+t*1.2;else if(t<.52)a=.82;else if(t<.58)a=.06;else a=.62;
    if(t>.9&&t<.925)a=.04;
    a*=.7+.3*Math.sin(i*.9)*Math.sin(i*.23+1)+.1*h3(i,3,7);
    a=clamp(a,0,1);
    var k=i*4,s=.78+.2*h3(i,9,1);
    d[k]=225*s;d[k+1]=205*s;d[k+2]=165*s;d[k+3]=a*255;
  }
  g.putImageData(im,0,0);
  var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
}
function glowTex(stops){
  var c=document.createElement('canvas');c.width=c.height=256;var g=c.getContext('2d'),gr=g.createRadialGradient(128,128,0,128,128,128);
  stops.forEach(function(s){gr.addColorStop(s[0],s[1]);});g.fillStyle=gr;g.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(c);
}
function dotTex(){
  var c=document.createElement('canvas');c.width=c.height=32;var g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);
  return new THREE.CanvasTexture(c);
}
