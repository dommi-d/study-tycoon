/* coins */
const coinG=CylG(.24,.24,.07,20),coinM=M(0xffc21a,{emissive:0x8a5200,emissiveIntensity:.7,noLine:true});
const coins=[];
for(let i=0;i<40;i++){const c=new T.Mesh(coinG,coinM);c.visible=false;c.userData={life:0,spin:0,v:new T.Vector3()};scene.add(c);coins.push(c)}
function spawn(up){
  const c=coins.find(k=>!k.visible);if(!c)return;
  c.visible=true;c.position.set((Math.random()-.5)*.6,4.6,-.2);c.scale.setScalar(1);
  c.userData.life=1.7;c.userData.spin=Math.random()*6;
  c.userData.v.set((Math.random()-.5)*2.6,up+Math.random()*1.6,(Math.random()-.5)*2.6);
}
function burst(n){n=Math.min(n,calm?4:24);for(let i=0;i<n;i++)spawn(3.2)}

/* camera + drag */
let dist=15,yaw=.25,targetYaw=.25,dragging=false,lx=0,running=false,acc=0,t=0,started=false,vis=true;
host.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;try{host.setPointerCapture(e.pointerId)}catch(_){}});
host.addEventListener('pointermove',e=>{if(!dragging)return;targetYaw-=(e.clientX-lx)*.008;lx=e.clientX});
['pointerup','pointercancel'].forEach(n=>host.addEventListener(n,()=>{dragging=false}));
function resize(){
  const w=host.clientWidth||600,h=host.clientHeight||320;
  renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  dist=15*Math.pow(Math.max(1,1.55/cam.aspect),.85);
}
if(window.ResizeObserver)new ResizeObserver(resize).observe(host);
resize();
if(window.IntersectionObserver)new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(host);

/* loop */
const clk=new T.Clock();
function frame(){
  requestAnimationFrame(frame);
  if(!vis||document.hidden)return;
  const dt=Math.min(clk.getDelta(),.05);t+=dt;
  if(!dragging&&!calm)targetYaw+=dt*(running?.18:.07);
  yaw+=(targetYaw-yaw)*Math.min(1,dt*6);
  cam.position.set(Math.sin(yaw)*dist,dist*.52,Math.cos(yaw)*dist);cam.lookAt(0,.2,0);
  isl.position.y=Math.sin(t*.9)*.16;isl.rotation.z=Math.sin(t*.6)*.012;isl.rotation.x=Math.cos(t*.5)*.01;
  mp.rotation.z-=dt*(running?1.6:.15);hp.rotation.z+=dt*(running?.6:.05);
  rotors.forEach((r,i)=>{r.rotation.z-=dt*(running?2.6:.7)*(i%2?.85:1)});
  airships.forEach(a=>{a.orb.rotation.y+=dt*(running?.35:.15);a.ship.position.y=Math.sin(t*1.2)*.1});
  for(const k in blds){
    const b=blds[k];
    if(b.pop>0)b.pop=Math.max(0,b.pop-dt*1.8);
    const bounce=b.pop>0?1+Math.sin((1-b.pop)*Math.PI)*.35:1;
    const target=b.own>0?.85+Math.min(b.own,12)*.045:.001;
    b.sc+=(target-b.sc)*Math.min(1,dt*8);
    b.g.scale.setScalar(Math.max(.001,b.sc*bounce));b.g.visible=b.sc>.02;
    b.mk.visible=b.own===0;
  }
  clouds.forEach(c=>{c.g.position.x+=c.v*dt*(calm?.2:1);if(c.g.position.x>14)c.g.position.x=-14});
  sparkle.rotation.y+=dt*.03;sparkle.material.opacity=.7+.2*Math.sin(t*3);
  if(running&&!calm){acc+=dt;if(acc>1.1){acc=0;spawn(2.4)}}
  coins.forEach(c=>{
    if(!c.visible)return;const u=c.userData;
    u.v.y-=7*dt;c.position.addScaledVector(u.v,dt);u.life-=dt;u.spin+=dt*8;
    c.rotation.set(0,u.spin,Math.PI/2);
    c.scale.setScalar(u.life<.4?Math.max(.01,u.life/.4):1);
    if(u.life<=0||c.position.y<-3)c.visible=false;
  });
  renderer.render(scene,cam);
}
frame();

function sync(){
  BIZ.forEach(x=>{
    const b=blds[x.id],n=S.own[x.id]||0;if(!b)return;
    if(started&&n>b.own){b.pop=1;burst(12)}
    b.own=n;
  });
  const h=document.getElementById('heroTag'),r=tyRate();
  if(h)h.textContent=(r>0?'Empire +'+fmt(r)+'/min · ':'')+'drag to look around';
  started=true;
}
return{sync,burst,setRun(r){running=!!r}};
}catch(e){
  const h=document.querySelector('.hero');if(h)h.hidden=true;
  return stub;
}
})();
