/* ---------- Sun Guard: tower defense. Towers cost chips, every shot costs ammo (also bought with chips). ---------- */
const TDW=640,TDH=400,TDLIVES=40,TDWAVES=10;
const TDP=[[-20,60],[540,60],[540,150],[100,150],[100,240],[540,240],[540,330],[660,330]];
const TDLEN=[0];for(let i=1;i<TDP.length;i++)TDLEN.push(TDLEN[i-1]+Math.hypot(TDP[i][0]-TDP[i-1][0],TDP[i][1]-TDP[i-1][1]));
const TDTOT=TDLEN[TDLEN.length-1];
const TDSPD=[0,48,60,74,90,106,124];
const TDCOL=['','#ff6b6b','#4cc3ff','#5be68a','#ffd23f','#ff7ad9','#b79bff'];
const TDK={
  sprout:{n:'Sprout Shooter',c:40,am:1,lvl:'Easy',col:'#3fd16a',d:'Cheap seed shots at one target. Reliable all game.'},
  frost:{n:'Frost Fan',c:90,am:1,lvl:'Easy',col:'#6fd8ff',d:'Pulses cold air that slows every smog in range. Shoots nothing at first, so pair it with shooters.'},
  cannon:{n:'Sun Cannon',c:140,am:4,lvl:'Medium',col:'#ff9a3d',d:'Slow shells that explode and hit a crowd. Burns ammo fast.'},
  sniper:{n:'Dawn Sniper',c:180,am:3,lvl:'Advanced',col:'#b79bff',d:'Reaches the whole map and hits hard. Best against the big airship.'},
  coil:{n:'Chain Coil',c:240,am:3,lvl:'Advanced',col:'#ffe066',d:'Lightning that jumps between several smog blobs.'}
};
const TDAMMO=[[50,10],[200,38],[500,90]];
function tdStat(t){const l=t.lv;
  switch(t.k){
    case'sprout':return{rng:105+10*(l-1),cd:1/(1.8*(1+.3*(l-1))),dmg:1+(l>=3?1:0)};
    case'frost':return{rng:85+8*(l-1),cd:1.4-.2*(l-1),slow:[0,.5,.4,.3][l],dmg:l>=3?1:0};
    case'cannon':return{rng:130+10*(l-1),cd:1.6-.2*(l-1),dmg:l>=2?2:1,spl:l>=3?58:42};
    case'sniper':return{rng:9999,cd:2-.3*(l-1),dmg:3+2*(l-1)};
    default:return{rng:115+10*(l-1),cd:.9,n:3+l,dmg:l>=3?2:1};
  }
}
const tdUpCost=t=>t.lv>=3?0:Math.floor(TDK[t.k].c*(t.lv===1?.7:1.3));
const tdDesc=t=>{const s=tdStat(t);
  switch(t.k){
    case'sprout':return'dmg '+s.dmg+' · '+(1/s.cd).toFixed(1)+' shots/s · range '+s.rng;
    case'frost':return'slows to '+Math.round(s.slow*100)+'% · pulse every '+s.cd.toFixed(1)+'s · range '+s.rng+(s.dmg?' · pops 1':'');
    case'cannon':return'dmg '+s.dmg+' · blast '+s.spl+' · every '+s.cd.toFixed(1)+'s · range '+s.rng;
    case'sniper':return'dmg '+s.dmg+' · every '+s.cd.toFixed(1)+'s · whole map';
    default:return'chains '+s.n+' targets · dmg '+s.dmg+' · range '+s.rng;
  }};
const R={phase:'idle',wave:0,lives:TDLIVES,q:[],en:[],pr:[],fx:[],spawnT:0,speed:1,auto:false,sel:null,place:null,autoT:0,paused:false,nid:1,dry:false,msg:''};
function tdPos(d){d=Math.max(0,Math.min(TDTOT,d));let i=1;while(i<TDLEN.length-1&&TDLEN[i]<d)i++;const a=TDP[i-1],b=TDP[i],f=(d-TDLEN[i-1])/(TDLEN[i]-TDLEN[i-1]);return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]}
function tdPathDist(x,y){let m=1e9;for(let i=1;i<TDP.length;i++){const a=TDP[i-1],b=TDP[i],dx=b[0]-a[0],dy=b[1]-a[1];let f=((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy);f=Math.max(0,Math.min(1,f));m=Math.min(m,Math.hypot(x-a[0]-dx*f,y-a[1]-dy*f))}return m}
function tdGen(r,w){
  const n=8+3*w+(r-1)*(10+2*r),tm=Math.min(6,1+Math.floor((w+4*(r-1))/2)),gap=Math.max(.16,.85-.04*w-.07*r),q=[];let t=0;
  for(let i=0;i<n;i++){const x=Math.random();const tr=x<.5?Math.max(1,tm-1):x<.8?Math.max(1,tm-2):tm;q.push({t,tier:Math.max(1,tr)});t+=gap*(.7+Math.random()*.6)}
  if(r>=2&&w===5)q.push({t:t/2,boss:1,mini:1});
  if(w===TDWAVES)q.push({t:t+2,boss:1});
  q.sort((a,b)=>a.t-b.t);
  return q;
}
function tdSpawn(o,d){
  const e={id:R.nid++,d:d||0,tier:o.tier||1,boss:!!o.boss,slow:1,slowT:0,dead:false,x:0,y:0};
  if(e.boss){const r=S.td.round;e.hp=e.max=Math.round((70+60*(r-1))*(o.mini?.5:1));e.tier=7}
  const p=tdPos(e.d);e.x=p[0];e.y=p[1];R.en.push(e);return e;
}
const tdSp=e=>e.boss?34:TDSPD[e.tier];
function tdHit(e,dm){
  if(e.dead)return;
  if(e.boss){e.hp-=dm;if(e.hp<=0){e.dead=true;for(let i=0;i<4;i++)tdSpawn({tier:Math.min(5,3+S.td.round)},Math.max(0,e.d-i*16))}}
  else{e.tier-=dm;if(e.tier<=0)e.dead=true}
  R.fx.push({k:'pop',x:e.x,y:e.y,t:.25,c:e.dead?'#fff':TDCOL[e.tier]||'#fff'});
}
function tdPickTarget(t,rng){
  let best=null,bs=-1e9;
  for(const e of R.en){
    if(e.dead)continue;
    if(Math.hypot(e.x-t.x,e.y-t.y)>rng)continue;
    const sc=t.tg==='last'?-e.d:t.tg==='strong'?(e.boss?e.hp+50:e.tier)*1000+e.d*.01:e.d;
    if(sc>bs){bs=sc;best=e}
  }
  return best;
}
function tdFire(t,e,s){
  const ammo=TDK[t.k].am;
  if(S.td.ammo<ammo){R.dry=true;return false}
  S.td.ammo-=ammo;touch();t.a=Math.atan2(e.y-t.y,e.x-t.x);
  switch(t.k){
    case'sprout':R.pr.push({k:'s',x:t.x,y:t.y,tg:e,dm:s.dmg});break;
    case'cannon':{const l=tdPos(e.d+tdSp(e)*.5*e.slow);R.pr.push({k:'c',x:t.x,y:t.y,tx:l[0],ty:l[1],dm:s.dmg,sp:s.spl,t:.5,x0:t.x,y0:t.y,tt:.5})}break;
    case'sniper':tdHit(e,s.dmg);R.fx.push({k:'ln',x:t.x,y:t.y,x2:e.x,y2:e.y,t:.18,c:'#e7d8ff',w:3});break;
    case'coil':{
      const hit=[e];let last=e;
      while(hit.length<s.n){let nx=null,nd=85;for(const o of R.en){if(o.dead||hit.includes(o))continue;const dd=Math.hypot(o.x-last.x,o.y-last.y);if(dd<nd){nd=dd;nx=o}}if(!nx)break;hit.push(nx);last=nx}
      let px=t.x,py=t.y;hit.forEach(h=>{R.fx.push({k:'ln',x:px,y:py,x2:h.x,y2:h.y,t:.16,c:'#fff3a0',w:2.5});px=h.x;py=h.y;tdHit(h,s.dmg)});
    }break;
  }
  return true;
}
function tdStep(dt){
  R.spawnT+=dt;
  while(R.q.length&&R.q[0].t<=R.spawnT)tdSpawn(R.q.shift());
  for(const e of R.en){
    if(e.dead)continue;
    if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slow=1}
    e.d+=tdSp(e)*e.slow*dt;
    const p=tdPos(e.d);e.x=p[0];e.y=p[1];
    if(e.d>=TDTOT){e.dead=true;e.leak=true;R.lives-=e.boss?25:e.tier;R.fx.push({k:'leak',x:e.x,y:e.y,t:.5})}
  }
  for(const t of S.td.towers){
    t.cd=(t.cd||0)-dt;if(t.cd>0)continue;
    const s=tdStat(t);
    if(t.k==='frost'){
      const near=R.en.filter(e=>!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<=s.rng);
      if(!near.length)continue;
      if(S.td.ammo<TDK.frost.am){R.dry=true;continue}
      S.td.ammo-=TDK.frost.am;touch();t.cd=s.cd;
      near.forEach(e=>{if(e.boss){e.slow=Math.min(e.slow,Math.max(s.slow,.6))}else e.slow=Math.min(e.slow,s.slow);e.slowT=1.8;if(s.dmg)tdHit(e,s.dmg)});
      R.fx.push({k:'ring',x:t.x,y:t.y,r:s.rng,t:.45,c:'#9fe8ff'});continue;
    }
    const e=tdPickTarget(t,s.rng);
    if(!e)continue;
    if(tdFire(t,e,s))t.cd=s.cd;
  }
  for(const p of R.pr){
    if(p.k==='s'){
      if(p.tg.dead){p.gone=true;continue}
      const dx=p.tg.x-p.x,dy=p.tg.y-p.y,dd=Math.hypot(dx,dy),st=420*dt;
      if(dd<=st+4){tdHit(p.tg,p.dm);p.gone=true}else{p.x+=dx/dd*st;p.y+=dy/dd*st}
    }else{
      p.t-=dt;const f=1-Math.max(0,p.t)/p.tt;p.x=p.x0+(p.tx-p.x0)*f;p.y=p.y0+(p.ty-p.y0)*f;
      if(p.t<=0){p.gone=true;R.fx.push({k:'boom',x:p.tx,y:p.ty,r:p.sp,t:.35});for(const e of R.en)if(!e.dead&&Math.hypot(e.x-p.tx,e.y-p.ty)<=p.sp+(e.boss?10:0))tdHit(e,p.dm)}
    }
  }
  R.pr=R.pr.filter(p=>!p.gone);
  R.en=R.en.filter(e=>!e.dead);
  for(const f of R.fx)f.t-=dt;
  R.fx=R.fx.filter(f=>f.t>0);
  if(R.lives<=0){R.lives=0;tdEnd(false);return}
  if(R.phase==='wave'&&!R.q.length&&!R.en.length){
    R.wave++;R.phase='idle';R.pr=[];
    if(R.wave>=TDWAVES)tdEnd(true);else tdWaveDone();
  }
}
/* ---- end of simulation core ---- */
const tdFee=r=>50+50*r;
const tdPrize=r=>250+150*r,tdSolar=r=>r%5===0;
const tdVal=t=>t.val!=null?t.val:(t.sp||0);
const tdTowerVal=()=>S.td.towers.reduce((a,t)=>a+tdVal(t),0);
function tdSave(){
  const td=S.td;if(!td||!td.live)return;
  td.run={wave:R.wave,lives:R.lives,phase:R.phase,spawnT:R.spawnT,q:R.q,en:R.en.filter(e=>!e.dead).map(e=>({d:e.d,tier:e.tier,boss:e.boss,hp:e.hp,max:e.max,slow:e.slow,slowT:e.slowT}))};
  touch();localSave();
}
function tdWaveDone(){tdSave();flush();R.msg='Wave '+R.wave+' cleared.';tdRender();if(R.auto)R.autoT=1.4}
function tdEnd(win){
  const td=S.td,r=td.round;
  R.paused=false;R.phase='idle';R.q=[];R.en=[];R.pr=[];R.wave=0;R.lives=TDLIVES;R.autoT=0;R.sel=null;R.place=null;
  if(win){
    const prize=tdPrize(r),solar=tdSolar(r),spent=td.spent||0,tw=solar?tdTowerVal():0,pot=prize+spent+tw;
    td.live=false;td.run=null;td.round=r+1;td.wins=(td.wins||0)+1;td.spent=0;td.towers.forEach(t=>{t.sp=0});payout(pot,'td');
    R.msg=(solar?'SOLAR-PRIZE ROUND! ':'')+'Round '+r+' finished. Winning pot: round prize '+fmt(prize)+' + '+fmt(spent)+' you spent on towers and ammo'+(solar?' + '+fmt(tw)+' for the towers on your map':'')+' = +'+fmt(pot)+' chips. Your towers and leftover ammo carry on to round '+td.round+'.';
    toast((solar?'Solar prize: +':'Winning pot: +')+fmt(pot)+' chips');
  }else{
    const lost=td.towers.length,am=td.ammo;
    td.towers=[];td.ammo=0;td.live=false;td.run=null;td.spent=0;td.losses=(td.losses||0)+1;touch();
    R.msg='Defeat. The smog broke through: you lost all '+lost+' towers and '+fmt(am)+' ammo, and there is no round prize.';
    toast('Defeat: towers and ammo lost');
  }
  touch();tdRender();
}

/* ---- screen: canvas drawing, shop and controls ---- */
const tdCv=document.getElementById('tdCv'),tdCx=tdCv.getContext('2d');
let tdScale=1,tdHover=null;
function tdSize(){const w=tdCv.clientWidth||640,d=Math.min(2,window.devicePixelRatio||1);tdCv.width=Math.round(w*d);tdCv.height=Math.round(w*d*TDH/TDW);tdScale=tdCv.width/TDW}
if(window.ResizeObserver)new ResizeObserver(tdSize).observe(tdCv);tdSize();
const tdDeco=[];for(let i=0;i<46;i++){const x=(i*97%640),y=(i*181%400);if(tdPathDist(x,y)>34)tdDeco.push([x,y,i%3])}
function tdBase(t,sel){
  const c=tdCx,K=TDK[t.k];
  c.save();c.translate(t.x,t.y);
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(0,6,15,8,0,0,6.3);c.fill();
  c.fillStyle=K.col;c.strokeStyle=sel?'#fff':'#033';c.lineWidth=sel?3:2;c.beginPath();c.arc(0,0,14,0,6.3);c.fill();c.stroke();
  c.rotate(t.a||0);c.fillStyle='#07363a';
  if(t.k==='sprout'){c.fillRect(0,-3,18,6)}
  else if(t.k==='cannon'){c.fillRect(0,-6,19,12);c.fillStyle='#ffd23f';c.fillRect(15,-6,4,12)}
  else if(t.k==='sniper'){c.fillRect(0,-2,25,4)}
  else if(t.k==='coil'){c.strokeStyle='#07363a';c.lineWidth=3;c.beginPath();c.arc(0,0,8,0,6.3);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(0,0,3,0,6.3);c.fill()}
  else{for(let i=0;i<3;i++){c.rotate(2.094);c.fillRect(0,-2,12,4)}}
  c.restore();
  c.fillStyle='#fff';for(let i=0;i<t.lv;i++){c.beginPath();c.arc(t.x-6+i*6,t.y+19,2.3,0,6.3);c.fill()}
}
function tdDraw(){
  const c=tdCx;c.setTransform(tdScale,0,0,tdScale,0,0);
  const g=c.createLinearGradient(0,0,0,TDH);g.addColorStop(0,'#46d27b');g.addColorStop(1,'#1c9a5c');c.fillStyle=g;c.fillRect(0,0,TDW,TDH);
  tdDeco.forEach(d=>{c.fillStyle=d[2]===0?'#ff6a8a':d[2]===1?'#ffe066':'#17b36a';c.beginPath();c.arc(d[0],d[1],d[2]===2?5:3,0,6.3);c.fill()});
  c.lineCap='round';c.lineJoin='round';
  [[40,'#8a4b12'],[32,'#f5c14e']].forEach(a=>{c.strokeStyle=a[1];c.lineWidth=a[0];c.beginPath();TDP.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()});
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.setLineDash([8,10]);c.beginPath();TDP.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.setLineDash([]);
  /* range ring for selected tower or the one being placed */
  const sel=S.td.towers.find(t=>t.id===R.sel);
  if(sel){const s=tdStat(sel);c.strokeStyle='rgba(255,255,255,.7)';c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(sel.x,sel.y,Math.min(s.rng,700),0,6.3);c.fill();c.stroke()}
  S.td.towers.forEach(t=>tdBase(t,t.id===R.sel));
  if(R.place&&tdHover){
    const ok=tdCanPlace(tdHover.x,tdHover.y),s=tdStat({k:R.place,lv:1});
    c.strokeStyle=ok?'rgba(255,255,255,.8)':'rgba(255,90,70,.9)';c.fillStyle=ok?'rgba(255,255,255,.14)':'rgba(255,60,40,.2)';
    c.beginPath();c.arc(tdHover.x,tdHover.y,Math.min(s.rng,700),0,6.3);c.fill();c.stroke();
    c.globalAlpha=.7;tdBase({k:R.place,x:tdHover.x,y:tdHover.y,lv:1,a:0});c.globalAlpha=1;
  }
  for(const e of R.en){
    const r=e.boss?22:8+e.tier*1.3;
    c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(e.x,e.y+r*.7,r,r*.45,0,0,6.3);c.fill();
    c.fillStyle=e.boss?'#6b5a7a':TDCOL[e.tier];c.strokeStyle='#2a1736';c.lineWidth=2;
    c.beginPath();c.arc(e.x,e.y,r,0,6.3);c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.arc(e.x-r*.3,e.y-r*.35,r*.28,0,6.3);c.fill();
    if(e.slow<1){c.strokeStyle='#bff0ff';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,r+3,0,6.3);c.stroke()}
    if(e.boss){c.fillStyle='#300';c.fillRect(e.x-22,e.y-r-9,44,5);c.fillStyle='#5be68a';c.fillRect(e.x-22,e.y-r-9,44*Math.max(0,e.hp/e.max),5)}
  }
  for(const p of R.pr){c.fillStyle=p.k==='s'?'#fff7a0':'#ff7a1f';c.beginPath();c.arc(p.x,p.y,p.k==='s'?3:6,0,6.3);c.fill()}
  for(const f of R.fx){
    if(f.k==='ln'){c.strokeStyle=f.c;c.lineWidth=f.w;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x2,f.y2);c.stroke()}
    else if(f.k==='ring'){c.strokeStyle=f.c;c.lineWidth=3;c.globalAlpha=Math.max(0,f.t/.45);c.beginPath();c.arc(f.x,f.y,f.r*(1-f.t/.45*.3),0,6.3);c.stroke();c.globalAlpha=1}
    else if(f.k==='boom'){c.fillStyle='rgba(255,170,40,'+Math.max(0,f.t/.35*.6)+')';c.beginPath();c.arc(f.x,f.y,f.r,0,6.3);c.fill()}
    else if(f.k==='pop'){c.strokeStyle=f.c;c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,6+(.25-f.t)*40,0,6.3);c.stroke()}
    else if(f.k==='leak'){c.fillStyle='rgba(255,60,40,'+f.t+')';c.fillRect(TDW-24,0,24,TDH)}
  }
  if(R.paused){c.fillStyle='rgba(3,34,54,.7)';c.fillRect(0,0,TDW,TDH);c.fillStyle='#ffe066';c.font='bold 30px sans-serif';c.textAlign='center';c.fillText(R.why==='ammo'?'Out of ammo':'Paused',TDW/2,TDH/2-8);c.font='16px sans-serif';c.fillStyle='#fff';c.fillText(R.why==='ammo'?'Buy ammo (top bar) and press Resume':'Study to earn chips, then spend them and press Resume',TDW/2,TDH/2+22);c.textAlign='left'}
  else if(R.phase==='wave'&&S.td.ammo<=0){c.fillStyle='rgba(120,0,0,.65)';c.fillRect(0,0,TDW,34);c.fillStyle='#fff';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('Out of ammo! Buy more below.',TDW/2,23);c.textAlign='left'}
}
function tdCanPlace(x,y){
  if(x<16||y<16||x>TDW-16||y>TDH-16)return false;
  if(tdPathDist(x,y)<26)return false;
  return !S.td.towers.some(t=>Math.hypot(t.x-x,t.y-y)<30);
}
const tdXY=e=>{const r=tdCv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*TDW,y:(e.clientY-r.top)/r.height*TDH}};
tdCv.addEventListener('pointermove',e=>{tdHover=tdXY(e)});
tdCv.addEventListener('pointerleave',()=>{tdHover=null});
tdCv.addEventListener('click',e=>{
  const p=tdXY(e);tdHover=p;
  const hit=S.td.towers.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<18);
  if(R.place&&!hit){
    const K=TDK[R.place];
    if(!tdCanPlace(p.x,p.y)){toast('Not here: keep towers off the path and apart');return}
    if(Math.floor(S.chips)<K.c){toast('Not enough chips: '+K.n+' costs '+K.c);return}
    spend(K.c,'td');S.td.spent=(S.td.spent||0)+K.c;const t={id:R.nid++,k:R.place,x:p.x,y:p.y,lv:1,tg:'first',sp:K.c,val:K.c,cd:0,a:0};
    S.td.towers.push(t);R.sel=t.id;
    if(S.chips<K.c)R.place=null;
    touch();tdRender();return;
  }
  R.place=null;R.sel=hit?hit.id:null;tdRender();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&R.place){R.place=null;tdRender()}});
function tdStart(){
  if(R.phase==='wave')return;
  const td=S.td;
  if(!td.towers.length){toast('Place at least one tower first');return}
  if(!td.live){
    const fee=tdFee(td.round);
    if(Math.floor(S.chips)<fee){toast('Starting round '+td.round+' costs '+fee+' chips');return}
    spend(fee,'td');td.live=true;R.lives=TDLIVES;R.wave=0;flush()
  }
  R.paused=false;R.why='';R.phase='wave';R.q=tdGen(td.round,R.wave+1);R.spawnT=0;R.msg='';R.autoT=0;R.dry=false;tdSave();flush();tdRender();
}
function tdForfeit(){
  if(!S.td.live)return;
  if(!R._ff){R._ff=1;$('#tdForfeit').textContent='Tap again to give up and lose everything';setTimeout(()=>{R._ff=0;tdRender()},3000);return}
  R._ff=0;tdEnd(false);
}
$('#p-td').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const d=b.dataset;
  if(d.tdShop){R.place=R.place===d.tdShop?null:d.tdShop;R.sel=null;tdRender()}
  else if(d.tdAmmo){const o=TDAMMO[+d.tdAmmo];if(Math.floor(S.chips)<o[1]){toast('Not enough chips');return}spend(o[1],'td');S.td.spent=(S.td.spent||0)+o[1];S.td.ammo+=o[0];touch();R.dry=false;tdRender()}
  else if(d.tdUp){const t=S.td.towers.find(z=>z.id===R.sel);if(!t)return;const c=tdUpCost(t);if(!c)return;if(Math.floor(S.chips)<c){toast('Not enough chips');return}spend(c,'td');S.td.spent=(S.td.spent||0)+c;t.lv++;t.sp+=c;t.val=tdVal(t)+c;touch();tdRender()}
  else if(d.tdSell){
    const t=S.td.towers.find(z=>z.id===R.sel);if(!t||S.td.live)return;
    const v=Math.floor(t.sp*.6);S.td.spent=Math.max(0,(S.td.spent||0)-t.sp);S.td.towers=S.td.towers.filter(z=>z!==t);R.sel=null;payout(v,'td');touch();tdRender();toast('Sold for '+fmt(v))
  }
  else if(d.tdTg){const t=S.td.towers.find(z=>z.id===R.sel);if(!t)return;t.tg=t.tg==='first'?'strong':t.tg==='strong'?'last':'first';touch();tdRender()}
  else if(d.tdGo)tdStart();
  else if(d.tdPause){if(R.phase==='wave'){R.paused=!R.paused;R.why='';if(!R.paused)R.dry=false;tdSave();tdRender()}}
  else if(d.tdSpeed){R.speed=R.speed>=3?1:R.speed+1;tdRender()}
  else if(d.tdAuto){R.auto=!R.auto;if(R.auto&&R.phase==='idle'&&R.wave>0)R.autoT=.8;tdRender()}
  else if(d.tdFf)tdForfeit();
});
function tdRender(){
  const td=S.td;if(!td)return;
  $('#tdShop').innerHTML=Object.keys(TDK).map(k=>{const K=TDK[k];return'<button class="tdcard'+(R.place===k?' on':'')+'" data-td-shop="'+k+'" style="--c:'+K.col+'"><b>'+K.n+'</b><span class="mono">'+K.c+' chips &middot; '+K.am+' ammo/shot</span><em>'+K.lvl+'</em><small>'+K.d+'</small></button>'}).join('');
  $('#tdAmmoBtns').innerHTML=TDAMMO.map((o,i)=>'<button class="btn sm" data-td-ammo="'+i+'">+'+o[0]+' ammo for '+o[1]+'</button>').join('');
  const t=td.towers.find(z=>z.id===R.sel),box=$('#tdSel');
  if(t){
    const K=TDK[t.k],c=tdUpCost(t);
    box.hidden=false;
    box.innerHTML='<div class="row sp"><b>'+K.n+' &middot; level '+t.lv+'/3</b><span class="mono">'+tdDesc(t)+'</span></div><div class="row" style="margin-top:8px">'+
      (c?'<button class="btn sm primary" data-td-up="1">Upgrade '+fmt(c)+' chips</button>':'<span class="mute">Max level</span>')+
      (t.k==='frost'?'':'<button class="btn sm" data-td-tg="1">Aims at: '+t.tg+'</button>')+
      (td.live?'<span class="mute">Selling is locked during a round</span>':'<button class="btn sm" data-td-sell="1">Sell for '+fmt(t.sp*.6)+'</button>')+'</div>';
  }else{box.hidden=true;box.innerHTML=''}
  const go=$('#tdGo');
  go.textContent=R.phase==='wave'?'Wave '+(R.wave+1)+' running...':(td.live?'Send wave '+(R.wave+1):'Start round '+td.round+' \u00b7 '+fmt(tdFee(td.round))+' chips');
  go.disabled=R.phase==='wave';
  const pb=$('#tdPause');pb.hidden=R.phase!=='wave';pb.textContent=R.paused?'\u25B6 Resume':'\u23F8 Pause';tdHudS='';
  $('#tdSpeed').textContent='Speed x'+R.speed;
  $('#tdAuto').textContent='Auto-send: '+(R.auto?'on':'off');
  const ff=$('#tdForfeit');ff.hidden=!td.live;if(!R._ff)ff.textContent='Give up';
  $('#tdMsg').textContent=R.msg||(td.live?'':'Buy towers and ammo, then start the round. '+(td.towers.length?'':'You have no towers yet.'));
  tdHud();
}
let tdHudS='';
function tdHud(){
  const td=S.td,spent=td.spent||0,tw=tdSolar(td.round)?tdTowerVal():0,pr=tdPrize(td.round),pot=pr+spent+tw,wv=Math.min(TDWAVES,R.wave+(R.phase==='wave'?1:0));
  const key=[td.round,wv,R.lives,td.ammo,Math.floor(S.chips)>=TDAMMO[0][1],pot,R.phase,R.paused,td.live].join('|');
  if(key===tdHudS)return;tdHudS=key;
  const solar=tdSolar(td.round),nextSolar=Math.ceil(td.round/5)*5;
  $('#tdStats').innerHTML=
    '<div class="tdt life"><span class="k">\u2764\uFE0F Lives</span><span class="v">'+R.lives+'</span>'+(R.phase==='wave'?'<button class="buy" data-td-pause="1">'+(R.paused?'\u25B6 Resume':'\u23F8 Pause')+'</button>':'')+'<div class="tb"><i style="width:'+Math.round(R.lives/TDLIVES*100)+'%"></i></div></div>'+
    '<div class="tdt ammo'+(td.ammo<30?' low':'')+'"><span class="k">\uD83C\uDF30 Ammo</span><span class="v">'+fmt(td.ammo)+'</span><span class="s">'+(td.ammo<30?'Running low!':'Every shot uses ammo')+'</span><button class="buy" data-td-ammo="0">+'+TDAMMO[0][0]+' for '+TDAMMO[0][1]+'</button></div>'+
    '<div class="tdt prize'+(solar?' solar':'')+'"><span class="k">\uD83E\uDE99 Winning pot'+(solar?' \u00b7 \u2600 Solar':'')+'</span><span class="v">'+fmt(pot)+'</span><span class="s">Prize '+fmt(pr)+' + '+fmt(spent)+' spent'+(solar?' + '+fmt(tw)+' towers':'')+(solar?'':' \u00b7 solar round at '+nextSolar)+'</span></div>'+
    '<div class="tdt wave"><span class="k">\uD83C\uDF0A Round '+td.round+'</span><span class="v">'+wv+'<small style="font-size:18px">/'+TDWAVES+'</small></span>'+(td.live?'':'<span class="s">Entry fee '+fmt(tdFee(td.round))+'</span>')+'<div class="tb"><i style="width:'+Math.round(wv/TDWAVES*100)+'%;background:linear-gradient(90deg,#4cc3ff,#b5ecff)"></i></div></div>';
  document.querySelectorAll('[data-td-ammo]').forEach(b=>{b.disabled=Math.floor(S.chips)<TDAMMO[+b.dataset.tdAmmo][1]});
}
let tdLast=0;
function tdLoop(ts){
  requestAnimationFrame(tdLoop);
  const dt=Math.min(.05,(ts-tdLast)/1000||0);tdLast=ts;
  const pane=document.getElementById('p-td');
  if(!pane||pane.hidden||document.hidden||!S.td)return;
  if(R.phase==='wave'&&!R.paused){const n=Math.max(1,Math.ceil(dt*R.speed/.033)),h=dt*R.speed/n;for(let i=0;i<n;i++)if(R.phase==='wave')tdStep(h)}
  /* out of ammo: freeze the round until you restock */
  if(R.phase==='wave'&&!R.paused&&(R.dry||S.td.ammo<=0)){R.paused=true;R.why='ammo';R.dry=false;R.msg='Out of ammo, so the game paused. Buy ammo, then press Resume.';tdSave();tdRender()}
  else if(R.autoT>0){R.autoT-=dt;if(R.autoT<=0&&R.auto)tdStart()}
  R.saveT=(R.saveT||0)+dt;if(R.saveT>1){R.saveT=0;tdSave()}
  tdDraw();tdHud();
}
requestAnimationFrame(tdLoop);
document.addEventListener('visibilitychange',()=>{if(document.hidden){tdSave();flush()}});
window.addEventListener('pagehide',()=>{tdSave();flush()});
/* a round in progress is saved, so reloads and updates pick up where you left off (paused until you press Resume) */
function tdInit(){
  const td=S.td,run=td.run;
  if(td.live&&run){
    R.wave=run.wave;R.lives=run.lives;R.q=run.q||[];R.spawnT=run.spawnT||0;R.phase=run.phase||'idle';
    R.en=(run.en||[]).map(o=>{const e=Object.assign({id:R.nid++,dead:false,x:0,y:0,slow:1,slowT:0},o);const p=tdPos(e.d);e.x=p[0];e.y=p[1];return e});
    R.pr=[];R.fx=[];R.paused=R.phase==='wave';
    R.msg=R.phase==='wave'?'Welcome back. Your round was saved and is paused. Press Resume when you are ready.':'Welcome back. Your round was saved. Send the next wave when you are ready.';
  }else if(td.live){td.live=false;touch()}
  tdRender();
}
