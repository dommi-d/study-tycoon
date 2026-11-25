/* ---------- 3D solarpunk island: cel-shaded, inked, faceted (three.js) ---------- */
window.World=(function(){
const stub={sync(){},burst(){},setRun(){}};
const host=document.getElementById('stage');
if(!window.THREE||!host){const h=document.querySelector('.hero');if(h)h.hidden=true;return stub}
try{
const T=THREE;
const calm=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputEncoding=T.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene=new T.Scene();
const cam=new T.PerspectiveCamera(36,1,.1,200);
scene.add(new T.HemisphereLight(0xbfe9ff,0xffc27a,.55));
const sun=new T.DirectionalLight(0xfff0c8,1.05);sun.position.set(7,11,6);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
const sc=sun.shadow.camera;sc.left=-9;sc.right=9;sc.top=9;sc.bottom=-9;sc.near=1;sc.far=40;scene.add(sun);
const rim=new T.DirectionalLight(0x66e0ff,.45);rim.position.set(-8,4,-6);scene.add(rim);

/* cel shading: four hard light bands, plus an ink outline hull on every solid */
const GM=new T.DataTexture(new Uint8Array([70,130,200,255]),4,1,T.LuminanceFormat);
GM.minFilter=GM.magFilter=T.NearestFilter;GM.needsUpdate=true;
const LINE=new T.MeshBasicMaterial({color:0x0e2a2a,side:T.BackSide});
const M=(c,o)=>{o=Object.assign({},o||{});const nl=o.noLine;delete o.noLine;delete o.metalness;delete o.roughness;
  const m=new T.MeshToonMaterial(Object.assign({color:c,gradientMap:GM},o));m.userData.noLine=!!nl;return m};
function mesh(p,g,m,x,y,z,rx,ry,rz){
  const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);
  o.castShadow=true;o.receiveShadow=true;
  if(!m.userData.noLine){const l=new T.Mesh(g,LINE);l.scale.setScalar(1.07);o.add(l)}
  p.add(o);return o;
}
const BoxG=(w,h,d)=>new T.BoxGeometry(w,h,d),CylG=(a,b,h,s)=>new T.CylinderGeometry(a,b,h,s||16),ConeG=(r,h,s)=>new T.ConeGeometry(r,h,s||16),SphG=(r,s)=>new T.SphereGeometry(r,s||16,12),TorG=(r,t,s)=>new T.TorusGeometry(r,t,8,s||24),IcoG=r=>new T.IcosahedronGeometry(r,0);
const BRASS=()=>M(0xe0a020,{emissive:0x5a3500,emissiveIntensity:.35});
const GOLD=()=>M(0xffc21a,{emissive:0x7a4a00,emissiveIntensity:.5});
const GLOW=(c,e)=>M(c,{emissive:e,emissiveIntensity:.9});
const GLASS=()=>M(0x7ff0e0,{transparent:true,opacity:.42,side:T.DoubleSide,noLine:true});
const PANEL=()=>M(0x1d4fd8,{emissive:0x0a1f6a,emissiveIntensity:.4});
const rotors=[],airships=[];

/* island: faceted terrain, warm rock, glowing crystals */
const isl=new T.Group();scene.add(isl);
mesh(isl,CylG(5.2,5.5,.8,14),M(0x22c55e,{flatShading:true}),0,0,0);
mesh(isl,CylG(5.5,4.8,.55,14),M(0x9a4a22,{flatShading:true}),0,-.67,0);
mesh(isl,ConeG(4.8,4.4,7),M(0xc2562a,{flatShading:true}),0,-3.15,0,Math.PI,0,0);
for(let i=0;i<6;i++){
  const a=i*1.05+.3,y=-2.5-(i%2)*.7,r=4.8*(1-(-.95-y)/4.4)+.1;
  mesh(isl,ConeG(.26,.95,5),M(0x19e6d0,{emissive:0x19e6d0,emissiveIntensity:.85,flatShading:true}),Math.cos(a)*r,y-.2,Math.sin(a)*r,Math.PI+Math.sin(a)*.35,0,Math.cos(a)*.35);
}
mesh(isl,CylG(1.3,1.3,.06,24),M(0x2fb7ff,{emissive:0x0a5aa0,emissiveIntensity:.5}),-1.2,.42,3.2);
mesh(isl,BoxG(.5,.05,1.4),M(0x2fb7ff,{emissive:0x0a5aa0,emissiveIntensity:.5}),-1.2,.43,4.6);
mesh(isl,BoxG(.5,3.4,.12),M(0x7fdcff,{transparent:true,opacity:.85,emissive:0x2aa0e0,emissiveIntensity:.5,noLine:true}),-1.2,-1.3,5.3).castShadow=false;

function tree(x,z,s,gold){
  const g=new T.Group();g.position.set(x,.4,z);g.scale.setScalar(s);
  mesh(g,CylG(.1,.14,.5,6),M(0x7a3f1a),0,.25,0);
  if(gold){mesh(g,IcoG(.5),M(0xff9a1f,{flatShading:true}),0,.85,0);mesh(g,IcoG(.3),M(0xffc21a,{flatShading:true}),.3,.62,.1)}
  else{mesh(g,ConeG(.52,.9,6),M(0x1fae5a,{flatShading:true}),0,.85,0);mesh(g,ConeG(.38,.7,6),M(0x34d474,{flatShading:true}),0,1.3,0)}
  isl.add(g);
}
[[-4,.5,1,0],[3.9,-.4,1.1,1],[4,2.2,.8,0],[-1.6,-4.2,1,0],[-2.4,-3.6,.7,1],[2,-4,.9,0],[-4.2,2.2,.8,1],[.3,4.2,.7,1]].forEach(a=>tree(a[0],a[1],a[2],a[3]));

function makeTurbine(parent,x,y,z,s){
  const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);parent.add(g);
  mesh(g,CylG(.07,.13,2.6,8),M(0x14b8a6),0,1.3,0);
  mesh(g,SphG(.17,10),GOLD(),0,2.65,0);
  const r=new T.Group();r.position.set(0,2.65,.2);g.add(r);
  for(let i=0;i<3;i++){const b=new T.Group();b.rotation.z=i*2.0944;r.add(b);mesh(b,BoxG(.13,1.05,.04),M(0xffe066),0,.55,0)}
  mesh(r,CylG(.09,.09,.1,8),M(0xff5a4a),0,0,0,Math.PI/2,0,0);
  rotors.push(r);return g;
}
makeTurbine(isl,-3.8,.4,-1.4,1);makeTurbine(isl,3.5,.4,-3.2,.9);

/* centerpiece: grows with total businesses bought (no fixed tower). Six stages, from a sapling to a floating sun-spire. */
const spin=[];
const cg=new T.Group();cg.position.set(0,.4,-.2);isl.add(cg);
const stages=[0,1,2,3,4,5].map(()=>{const g=new T.Group();g.scale.setScalar(.001);g.visible=false;cg.add(g);return g});
mesh(cg,CylG(1.5,1.65,.3,16),M(0xc4481f,{flatShading:true}),0,.1,0);
mesh(cg,TorG(1.5,.06,28),GOLD(),0,.27,0,Math.PI/2,0,0);
function ringDeco(g,y,r,n){
  mesh(g,TorG(r,.12),M(0x22d46a),0,y,0,Math.PI/2,0,0);
  for(let i=0;i<n;i++){const a=i/n*6.283;mesh(g,IcoG(.14),M(i%2?0x1fae5a:0xff3d6e,{flatShading:true}),Math.cos(a)*r,y+.1,Math.sin(a)*r)}
}
function sunFlower(g,y,s,fast){
  const f=new T.Group();f.position.set(0,y,0);f.rotation.x=-.3;f.scale.setScalar(s);g.add(f);
  const a=new T.Group(),b=new T.Group();f.add(a,b);
  for(let i=0;i<12;i++){const t=i/12*6.283;mesh(a,BoxG(.16,.52,.05),M(i%2?0xffd23f:0xff8a1f),Math.sin(t)*.88,Math.cos(t)*.88,0,0,0,-t)}
  mesh(b,CylG(.5,.5,.12,12),PANEL(),0,0,0,Math.PI/2,0,0);
  mesh(b,TorG(.52,.05),GOLD(),0,0,0);
  spin.push([a,-1.6,-.15],[b,.6,.05]);
}
/* 0: a sapling and a glowing seed */
(()=>{const g=stages[0];
  mesh(g,CylG(.07,.12,.9,7),M(0xb5651d),0,.55,0);
  [[0,1.15,0,.38],[.28,.95,.1,.26],[-.26,.9,-.1,.24]].forEach(p=>mesh(g,IcoG(p[3]),M(0x22d46a,{flatShading:true}),p[0],p[1],p[2]));
  mesh(g,SphG(.09,8),M(0xff3d6e),.12,1.3,.1);
})();
/* 1: a little cabin with a green roof */
(()=>{const g=stages[1];
  mesh(g,BoxG(1.3,.8,1),M(0xffa63d),0,.7,0);
  mesh(g,BoxG(1.5,.14,1.2),M(0x13a55a),0,1.18,0);
  for(let i=0;i<5;i++)mesh(g,ConeG(.07,.24,5),M(0x22d46a),-.5+i*.25,1.36,(i%2?.2:-.2));
  mesh(g,BoxG(.32,.5,.04),M(0x6a2f12),-.25,.55,.51);
  mesh(g,BoxG(.35,.3,.04),GLOW(0xfff2a8,0xffcc33),.3,.78,.51);
})();
/* 2: two floors, a solar panel and a small turbine */
(()=>{const g=stages[2];
  mesh(g,BoxG(1.5,.9,1.15),M(0xffa63d),0,.75,0);
  mesh(g,BoxG(1.1,.7,.9),M(0xffc65c),0,1.55,0);
  mesh(g,BoxG(1.7,.14,1.35),M(0x13a55a),0,1.15,0);
  mesh(g,BoxG(1.3,.14,1.1),M(0x13a55a),0,1.95,0);
  mesh(g,BoxG(.9,.05,.6),PANEL(),0,2.06,0,-.35,0,0);
  [-.35,.35].forEach(x=>mesh(g,BoxG(.3,.3,.04),GLOW(0x7ff7ff,0x17d6c0),x,.85,.59));
  makeTurbine(g,.9,.25,.9,.6);
})();
/* 3: a terraced tower */
(()=>{const g=stages[3];
  [[1.7,0xff8a3d],[1.45,0xffa94d],[1.2,0xffc65c],[.95,0x2ee6c8]].forEach((t,i)=>{
    const w=t[0],y=.7+i*.8;
    mesh(g,BoxG(w,.75,w),M(t[1]),0,y,0);
    mesh(g,BoxG(w*.65,.4,.03),GLOW(0x7ff7ff,0x17d6c0),0,y,w/2+.01);
    mesh(g,BoxG(w+.25,.1,w+.25),M(0x22d46a),0,y+.42,0);
  });
  mesh(g,CylG(.08,.1,.8,8),BRASS(),0,4.3,0);makeTurbine(g,0,4.5,0,.5);
})();
/* 4: the sun tower with its solar flower */
(()=>{const g=stages[4];
  mesh(g,CylG(.65,1.05,3.4,10),M(0xff9a3d,{flatShading:true}),0,1.9,0);
  ringDeco(g,.9,1.05,9);ringDeco(g,1.8,.9,8);ringDeco(g,2.7,.75,7);
  mesh(g,CylG(.18,.3,.6,8),BRASS(),0,3.9,0);
  sunFlower(g,4.4,1,0);
})();
/* 5: the advanced island core: a tall spire, a big flower, orbiting rings and a floating crystal */
(()=>{const g=stages[5];
  mesh(g,CylG(.55,1.1,4.2,10),M(0xff9a3d,{flatShading:true}),0,2.3,0);
  ringDeco(g,.9,1.15,10);ringDeco(g,2,.95,9);ringDeco(g,3.1,.78,8);
  mesh(g,CylG(.2,.34,.8,8),BRASS(),0,4.8,0);
  sunFlower(g,5.6,1.35,0);
  const core=new T.Group();core.position.set(0,7.3,0);g.add(core);
  mesh(core,IcoG(.42),GLOW(0x9dffb0,0x3fe070),0,0,0);
  const r1=new T.Group(),r2=new T.Group();core.add(r1,r2);
  mesh(r1,TorG(.95,.05,28),GOLD(),0,0,0);mesh(r1,IcoG(.13),M(0xff3d6e,{flatShading:true}),.95,0,0);
  mesh(r2,TorG(1.3,.04,32),BRASS(),0,0,0);mesh(r2,IcoG(.13),M(0x17d6c0,{flatShading:true}),-1.3,0,0);
  r1.rotation.x=1.2;r2.rotation.x=.4;r2.rotation.y=.8;
  spin.push([r1,0,0,'y',1.2,.4],[r2,0,0,'y',-.9,-.3]);
  [[2.4,0],[-2.4,.6],[0,2.4],[0,-2.4]].forEach((p,i)=>{
    const pn=new T.Group();pn.position.set(p[0],3.2+(i%2)*.5,p[1]);g.add(pn);
    mesh(pn,BoxG(.9,.06,.6),PANEL(),0,0,0,-.3,i*.8,0);mesh(pn,SphG(.12,8),GOLD(),0,-.2,0);
  });
})();
const center={stage:-1,pop:0,sc:[.001,.001,.001,.001,.001,.001],th:[0,2,5,9,14,22]};

/* businesses */
const BLD={
  cart(){const g=new T.Group();
    mesh(g,BoxG(1.05,.5,.7),M(0xb5651d),0,.5,0);
    mesh(g,BoxG(1.3,.08,.95),M(0x16c25a),0,1.1,0,.08,0,0);
    [-.55,.55].forEach(x=>mesh(g,CylG(.03,.03,.55,6),BRASS(),x,.8,.38));
    [-.3,0,.3].forEach(x=>{mesh(g,IcoG(.17),M(0x1fae5a,{flatShading:true}),x,1.25,0);mesh(g,SphG(.07,8),M(0xff3d6e),x+.08,1.36,.06)});
    [-.35,.05].forEach(x=>{mesh(g,BoxG(.3,.22,.3),M(0xe08a2e),x,.11,.58);mesh(g,SphG(.1,8),M(0xe8281b),x,.28,.58)});return g},
  copy(){const g=new T.Group();
    mesh(g,BoxG(1.4,1,1.1),M(0xffa63d),0,.5,0);
    mesh(g,BoxG(1.55,.16,1.25),M(0x13a55a),0,1.08,0);
    [[-.5,.3],[-.1,-.3],[.4,.2],[.55,-.35],[-.55,-.2],[.1,.4],[-.2,.1]].forEach((p,i)=>{mesh(g,ConeG(.07,.25,5),M(0x22d46a),p[0],1.28,p[1]);if(i%3==0)mesh(g,SphG(.06,8),M(0xff3d6e),p[0]+.1,1.22,p[1])});
    mesh(g,TorG(.18,.06,12),GOLD(),-.4,.7,.56);
    mesh(g,BoxG(.35,.55,.05),M(0x6a2f12),0,.28,.56);
    mesh(g,BoxG(.4,.3,.05),GLOW(0xfff2a8,0xffcc33),.45,.62,.56);return g},
  arcade(){const g=new T.Group();
    [-1,0,1].forEach(i=>{
      mesh(g,CylG(.04,.04,.7,6),BRASS(),i*.62,.35,0);
      mesh(g,BoxG(.6,.04,.9),M(0x7fc4ff),i*.62,.78,0,-.5,0,0);
      mesh(g,BoxG(.55,.05,.85),PANEL(),i*.62,.8,0,-.5,0,0);
    });
    mesh(g,BoxG(.5,.4,.4),M(0x17d6c0),0,.2,-.6);
    mesh(g,BoxG(.1,.1,.04),GLOW(0x9dffb0,0x3fe070),.12,.28,-.39);return g},
  tutor(){const g=new T.Group();
    mesh(g,CylG(.95,1,.3,16),M(0xe8742b,{flatShading:true}),0,.15,0);
    const d=new T.Mesh(new T.SphereGeometry(.9,18,12,0,6.283,0,1.5708),GLASS());d.position.y=.3;g.add(d);
    mesh(g,TorG(.9,.04,28),GOLD(),0,.3,0,Math.PI/2,0,0);
    mesh(g,TorG(.78,.035,28),GOLD(),0,.75,0,Math.PI/2,0,0);
    mesh(g,TorG(.57,.03,24),GOLD(),0,1.0,0,Math.PI/2,0,0);
    mesh(g,IcoG(.26),M(0x22d46a,{flatShading:true}),0,.55,0);mesh(g,IcoG(.19),M(0x1fae5a,{flatShading:true}),.35,.45,.2);mesh(g,IcoG(.17),M(0x22d46a,{flatShading:true}),-.35,.42,-.2);
    mesh(g,SphG(.09,8),M(0xff3d6e),0,.85,0);mesh(g,SphG(.08,8),M(0xffd23f),.35,.66,.2);return g},
  tower(){const g=new T.Group();
    [[1.3,0xff8a3d],[1.1,0xffa94d],[.9,0xffc65c],[.7,0x2ee6c8]].forEach((t,i)=>{
      const w=t[0],y=.35+i*.75;
      mesh(g,BoxG(w,.7,w),M(t[1]),0,y,0);
      mesh(g,BoxG(w*.7,.4,.03),GLOW(0x7ff7ff,0x17d6c0),0,y,w/2+.01);
      mesh(g,BoxG(w+.25,.1,w+.25),M(0x22d46a),0,y+.4,0);
      [[1,1],[-1,1],[1,-1],[-1,-1]].forEach((c,j)=>mesh(g,IcoG(.12),M(j%2?0xff3d6e:0x1fae5a,{flatShading:true}),c[0]*(w/2+.05),y+.52,c[1]*(w/2+.05)));
    });
    makeTurbine(g,0,3.05,0,.5);return g},
  bank(){const g=new T.Group();
    mesh(g,CylG(1,1.1,.25,12),M(0xb5651d,{flatShading:true}),0,.12,0);
    mesh(g,CylG(.06,.08,2.3,8),BRASS(),0,1.3,0);
    const orb=new T.Group();orb.position.y=2.45;g.add(orb);
    const ship=new T.Group();ship.position.x=.9;ship.rotation.y=Math.PI/2;orb.add(ship);
    const body=mesh(ship,SphG(.55,16),M(0xff5a3d),0,0,0);body.scale.set(1.5,.62,.62);
    mesh(ship,BoxG(.7,.03,.3),PANEL(),0,.36,0);
    mesh(ship,BoxG(.5,.16,.22),M(0x6a2f12),0,-.42,0);
    mesh(ship,BoxG(.3,.4,.04),M(0x17d6c0),-.8,.12,0);mesh(ship,BoxG(.3,.04,.4),M(0x17d6c0),-.8,.12,0);
    airships.push({orb,ship});return g}
};
const SLOT={cart:[-3,.9],copy:[3,1.4],arcade:[2.7,-2],tutor:[-2.6,-2.2],tower:[1.4,3.1],bank:[-.2,-3]};
const blds={};
Object.keys(SLOT).forEach(k=>{
  const s=SLOT[k],g=BLD[k]();
  g.position.set(s[0],.4,s[1]);g.rotation.y=Math.atan2(s[0],s[1]);g.scale.setScalar(.001);g.visible=false;isl.add(g);
  const mk=mesh(isl,TorG(.55,.06,24),GLOW(0xffe27a,0xffc933),s[0],.46,s[1],Math.PI/2,0,0);
  const H={cart:1.5,copy:1.6,arcade:1.2,tutor:1.5,tower:3.7,bank:3.4}[k];
  const t2=new T.Group(),t3=new T.Group(),t4=new T.Group();[t2,t3,t4].forEach(t=>{t.scale.setScalar(.001);t.visible=false;g.add(t)});
  [-1,1].forEach(sx=>{mesh(t2,CylG(.04,.05,.9,6),BRASS(),sx*1.05,.45,.75);mesh(t2,SphG(.13,10),GLOW(0xfff2a8,0xffcc33),sx*1.05,.98,.75)});
  makeTurbine(t3,-1.25,0,-.7,.42);mesh(t3,BoxG(.8,.05,.5),PANEL(),1.15,.35,-.6,-.4,0,0);
  const halo=new T.Group();halo.position.y=H+.5;t4.add(halo);
  mesh(halo,TorG(.8,.05,28),GOLD(),0,0,0,Math.PI/2,0,0);mesh(halo,IcoG(.15),M(0xff3d6e,{flatShading:true}),.8,0,0);mesh(halo,IcoG(.15),M(0x17d6c0,{flatShading:true}),-.8,0,0);
  spin.push([halo,0,0,'y',1,.3]);
  blds[k]={g,mk,own:0,pop:0,sc:.001,tiers:[t2,t3,t4],ts:[.001,.001,.001]};
});

/* sky: sunset-tinted clouds and fireflies */
const clouds=[];
function cloud(x,y,z,s,c){
  const g=new T.Group(),mt=M(c,{noLine:true});
  [[0,0,0,.9],[.9,-.1,.1,.7],[-.9,-.1,0,.7],[.4,.45,0,.6],[-.4,.35,.1,.55]].forEach(p=>mesh(g,SphG(p[3],12),mt,p[0],p[1],p[2]));
  g.traverse(o=>{o.castShadow=false;o.receiveShadow=false});
  g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);clouds.push({g,v:.15+Math.random()*.2});
}
cloud(-9,2.5,-4,1.2,0xffc79a);cloud(8,4,-6,1.5,0xffb48a);cloud(-7,-3,2,1,0xffd7a8);cloud(10,-2,1,.9,0xffc79a);cloud(1,6.5,-8,1.3,0xffb48a);cloud(-3,-5.5,-3,.8,0xffd7a8);
const NS=140,sp=new Float32Array(NS*3);
for(let i=0;i<NS;i++){const a=Math.random()*6.283,r=3+Math.random()*8;sp[i*3]=Math.cos(a)*r;sp[i*3+1]=-2+Math.random()*8;sp[i*3+2]=Math.sin(a)*r}
const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));
const sparkle=new T.Points(sg,new T.PointsMaterial({color:0xfff7b0,size:.16,transparent:true,opacity:.9,depthWrite:false}));
scene.add(sparkle);
