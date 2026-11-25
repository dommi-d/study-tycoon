/* ---------- markets: every round lasts 5 minutes. Four repeating event markets, then BTC and Gold. ---------- */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* each event slot asks the same question every round, so its chart is one continuous line */
const EQ=[
  'Will rain fill the Terrace Reservoir again?',
  'Will the council approve the next bill?',
  'Will the Greenline tram arrive on time?',
  'Will the Canopy Co-op solar output beat the forecast?'
];
const STEP=3000,ROUND=300000,KEEP=11*60000;
/* simulated assets: annualized vol, strike increment, decimals, starting anchor, round offset */
const AS={
  btc:{n:'BTC',vol:.5,inc:25,dec:0,anchor:62650,off:0},
  gold:{n:'Gold',vol:.2,inc:1,dec:2,anchor:3549,off:120000}
};
const EOFF=[39000,99000,159000,219000];
const SIGSTEP=3.084e-4; /* sqrt(3s / one year) */
let mkRange=5;
const askY=m=>Math.min(99,m.price+1),askN=m=>Math.min(99,101-m.price);
const bidY=m=>Math.max(1,m.price-1),bidN=m=>Math.max(1,99-m.price);
/* Kalshi taker fee: round up(0.07 x contracts x P x (1-P)), P in dollars; result in cents (= chips here) */
const feeC=(n,p)=>Math.ceil(7*n*(p/100)*(1-p/100)-1e-9);
const rid=()=>Math.random().toString(36).slice(2,8);
const fmtP=(sym,v)=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:AS[sym].dec,maximumFractionDigits:AS[sym].dec});
const clock=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185*v)};
function erf(x){const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+.3275911*x);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x))}
const Phi=z=>.5*(1+erf(z/Math.SQRT2));
const endFor=(off,now)=>off+(Math.floor((now-off)/ROUND)+1)*ROUND;

/* --- BTC / Gold price engine: stochastic volatility with clustering, rare jumps, tick noise, weak pull to anchor --- */
function assetInit(sym,now){
  const a=AS[sym],lt=Math.floor(now/STEP)*STEP-KEEP,px=Math.round(a.anchor*(1+(Math.random()-.5)*.004)*100)/100;
  return{f:Math.log(px),x:0,vm:1,lt,price:px,h:[[lt,px]]};
}
function assetAdvance(sym,upTo,cut){
  const a=AS[sym],s=S.as[sym],grid=Math.floor(upTo/STEP)*STEP,sg=a.vol*SIGSTEP;
  if(s.lt<grid-3600000)s.lt=Math.floor((grid-3600000)/STEP)*STEP;
  while(s.lt+STEP<=grid){
    s.lt+=STEP;
    s.x=.995*s.x+.05*gauss();
    s.vm=Math.exp(s.x-.125);
    let r=sg*s.vm*gauss();
    if(Math.random()<.004)r+=sg*s.vm*(3+Math.random()*3)*(Math.random()<.5?-1:1);
    r-=(s.f-Math.log(a.anchor))/7200;
    s.f+=r;
    s.price=Math.round(Math.exp(s.f)*(1+.25*sg*gauss())*100)/100;
    s.h.push([s.lt,s.price]);
  }
  const c=cut!=null?cut:upTo-KEEP;
  while(s.h.length>2&&s.h[1][0]<c)s.h.shift();
}
function priceAt(sym,t){
  const h=S.as[sym].h;
  for(let i=h.length-1;i>=0;i--)if(h[i][0]<=t)return h[i][1];
  return h[0][1];
}
function ensureAssets(now){
  if(!S.as)S.as={};
  Object.keys(AS).forEach(sym=>{
    if(!S.as[sym]||!S.as[sym].h)S.as[sym]=assetInit(sym,now);
    let cut=now-KEEP;
    S.mk.forEach(m=>{if(m&&m.kind==='a'&&m.sym===sym)cut=Math.min(cut,m.start-ROUND*2-STEP*2)});
    assetAdvance(sym,now,cut);
  });
}
/* YES price of "above strike at round end" from the model: P(S_end > K | S_now, time left) */
function quote(m,now){
  const a=AS[m.sym],s=S.as[m.sym],left=Math.max(0,m.end-now)/STEP;
  let p;
  if(left<.5)p=s.price>m.K?.99:.01;
  else p=Phi((s.price-m.K)/(s.price*a.vol*SIGSTEP*Math.sqrt(left)*(.5+.5*(s.vm||1))));
  m.p=Math.max(.01,Math.min(.99,p));
  m.price=Math.max(1,Math.min(99,Math.round(m.p*100)));
}
function newAsset(sym,now){
  const a=AS[sym],end=endFor(a.off,now),start=end-ROUND;
  const K=Math.round(priceAt(sym,start)/a.inc)*a.inc;
  const m={id:rid(),kind:'a',sym,K,start,end,price:50,p:.5,rd:clock(start)+'–'+clock(end)};
  m.q='Will '+a.n+' be above '+fmtP(sym,K)+' at '+clock(end)+'?';
  quote(m,now);return m;
}

/* --- event markets: martingale price path, outcome drawn from the final price. One continuous series per slot. --- */
const evNext=(p,f)=>Math.max(.03,Math.min(.97,p+.05*(1+2*f)*Math.sqrt(p*(1-p))*(Math.random()*2-1)*1.732));
/* fill the two rounds before the current one so the chart is never blank; each ends at 100 or 0 */
function ghost(slot,curStart){
  const h=S.hist[slot]=[];
  for(let r=2;r>=1;r--){
    const st=curStart-r*ROUND;let p=.2+Math.random()*.6;
    h.push([st,Math.round(p*100)]);
    for(let t=st+STEP;t<=st+ROUND;t+=STEP){p=evNext(p,(t-st)/ROUND);h.push([t,Math.round(p*100)])}
    h.push([st+ROUND,Math.random()<p?100:0]);
  }
}
function evAdvance(m,upTo){
  const lim=Math.min(upTo,m.end),h=S.hist[m.slot];
  while(m.lt+STEP<=lim){
    m.lt+=STEP;
    m.p=evNext(m.p,(m.lt-m.start)/ROUND);
    h.push([m.lt,Math.round(m.p*100)]);
  }
  m.price=Math.max(1,Math.min(99,Math.round(m.p*100)));
  while(h.length>2&&h[1][0]<upTo-KEEP)h.shift();
}
function newEvent(slot,now){
  if(!S.hist)S.hist=[[],[],[],[]];
  const end=endFor(EOFF[slot],now),start=end-ROUND,p0=.2+Math.random()*.6;
  const h=S.hist[slot]||(S.hist[slot]=[]);
  if(!h.length||h[h.length-1][0]<start-STEP*3)ghost(slot,start);
  S.hist[slot].push([start,Math.round(p0*100)]);
  const m={id:rid(),kind:'e',slot,q:EQ[slot],rd:clock(start)+'–'+clock(end),p:p0,price:Math.round(p0*100),start,end,lt:start};
  evAdvance(m,now);return m;
}

/* --- positions and settlement --- */
const posCost=p=>p.cost!=null?p.cost:p.n*p.px;
function refundOld(m){
  const mine=S.pos.filter(p=>p.mid===m.id);if(!mine.length)return;
  let back=0;mine.forEach(p=>{back+=posCost(p)});
  S.pos=S.pos.filter(p=>p.mid!==m.id);payout(back);touch();renderPos();
  toast('A market was replaced. Your bet was refunded: '+fmt(back));
}
/* decide the round: event markets draw from the final price and the chart jumps to 100 or 0 */
function resolve(m){
  if(m.kind==='a')return priceAt(m.sym,m.end)>m.K;
  const out=Math.random()<m.p;
  S.hist[m.slot].push([m.end,out?100:0]);
  return out;
}
function settleMk(m,out){
  const mine=S.pos.filter(p=>p.mid===m.id);if(!mine.length)return;
  let detail='';
  if(m.kind==='a'){const fin=priceAt(m.sym,m.end);detail=AS[m.sym].n+' closed '+fmtP(m.sym,fin)+' vs strike '+fmtP(m.sym,m.K)+'. '}
  let tot=0,cost=0;
  mine.forEach(p=>{cost+=posCost(p);if((p.side==='Y')===out)tot+=p.n*100});
  S.pos=S.pos.filter(p=>p.mid!==m.id);
  if(tot)payout(tot);
  touch();renderPos();
  const net=tot-cost;
  toast(detail+'Settled '+(out?'YES':'NO')+': '+(net>=0?'+':'-')+fmt(Math.abs(net))+' chips');
}
function newSlot(i,now){return i<4?newEvent(i,now):newAsset(i===4?'btc':'gold',now)}
function slotOk(m,i){
  if(!m)return false;
  if(i<4)return m.kind==='e'&&m.slot===i&&m.q===EQ[i]&&!m.h;
  return m.kind==='a'&&m.sym===(i===4?'btc':'gold');
}
function mkTick(){
  const now=Date.now();
  if(!S.hist)S.hist=[[],[],[],[]];
  while(S.mk.length<6)S.mk.push(null);
  S.mk=S.mk.slice(0,6);
  S.mk.forEach((m,i)=>{if(m&&!slotOk(m,i)){refundOld(m);S.mk[i]=null}});
  ensureAssets(now);
  S.mk=S.mk.map((m,i)=>{
    if(!m)return newSlot(i,now);
    if(m.kind==='e')evAdvance(m,now);else quote(m,now);
    if(now>=m.end){settleMk(m,resolve(m));return newSlot(i,now)}
    return m;
  });
  renderMk();
}

/* --- chart: YES price for event markets, the asset price with per-round strike lines for BTC and Gold --- */
function chart(m,now){
  const W=300,H=96,range=mkRange*60000,t0=now-range,asset=m.kind==='a';
  const src=asset?S.as[m.sym].h:(S.hist[m.slot]||[]),cur=asset?S.as[m.sym].price:m.price;
  const pts=src.filter(p=>p[0]>=t0-STEP*2);
  if(pts.length<2)return null;
  let lo=Infinity,hi=-Infinity;
  pts.forEach(p=>{lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1])});
  lo=Math.min(lo,cur);hi=Math.max(hi,cur);
  const segs=[];
  if(asset){
    const inc=AS[m.sym].inc;
    for(let k=0;k<3;k++){
      const st=m.start-k*ROUND,en=Math.min(st+ROUND,now);
      if(en<=t0)continue;
      const Kk=k===0?m.K:Math.round(priceAt(m.sym,st)/inc)*inc;
      segs.push({x1:Math.max(st,t0),x2:en,K:Kk,now:k===0});
      lo=Math.min(lo,Kk);hi=Math.max(hi,Kk);
    }
  }
  let a,b;
  if(asset){const pad=Math.max((hi-lo)*.15,cur*.0002);a=lo-pad;b=hi+pad}
  else{const pad=Math.max(3,(hi-lo)*.15);a=Math.max(0,lo-pad);b=Math.min(100,hi+pad);if(b-a<12){a=Math.max(0,Math.min(a,88));b=a+12}}
  const X=t=>(t-t0)/range*W,Y=p=>H-(p-a)/(b-a)*H;
  const pl=pts.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1));
  pl.push(W+','+Y(cur).toFixed(1));
  const col=cur>=pts[0][1]?'#3fe6d2':'#ff7a66',gid='g'+esc(m.id);
  const area='M'+pl[0]+' L'+pl.slice(1).join(' L')+' L'+W+','+H+' L'+pl[0].split(',')[0]+','+H+' Z';
  let grid=[.25,.5,.75].map(f=>'<line x1="0" x2="'+W+'" y1="'+(H*f)+'" y2="'+(H*f)+'" stroke="rgba(255,255,255,.14)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>').join('');
  for(let k=0;k<3;k++){
    const xs=X(m.start-k*ROUND);
    if(xs>1&&xs<W-1)grid+='<line x1="'+xs.toFixed(1)+'" x2="'+xs.toFixed(1)+'" y1="0" y2="'+H+'" stroke="rgba(255,211,77,.45)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>';
  }
  let ky=null;
  segs.forEach(s=>{
    const y=Y(s.K).toFixed(1);
    if(s.now)ky=Y(s.K);
    grid+='<line x1="'+X(s.x1).toFixed(1)+'" x2="'+X(s.x2).toFixed(1)+'" y1="'+y+'" y2="'+y+'" stroke="#ffd34d" stroke-opacity="'+(s.now?1:.5)+'" stroke-width="'+(s.now?1.8:1.3)+'"'+(s.now?' stroke-dasharray="6 4"':'')+' vector-effect="non-scaling-stroke"/>';
  });
  const svg='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".4"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#'+gid+')"/><polyline points="'+pl.join(' ')+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  return{svg,a,b,ky};
}
const fmtMs=ms=>{ms=Math.max(0,ms);return Math.floor(ms/60000)+':'+String(Math.floor(ms%60000/1000)).padStart(2,'0')};
function renderMk(){
  const g=$('#mkGrid'),ids=new Set(S.mk.filter(Boolean).map(m=>m.id)),now=Date.now();
  [...g.children].forEach(c=>{if(!ids.has(c.dataset.id))c.remove()});
  S.mk.forEach((m,i)=>{
    if(!m||!m.kind)return;
    let c=g.querySelector('[data-id="'+m.id+'"]');
    if(!c){
      c=document.createElement('div');c.className='mk';c.dataset.id=m.id;c.style.order=i;
      c.innerHTML='<h3></h3><div class="row sp live"><span class="lp mono"></span><span class="ld mono"></span></div><div class="row sp" style="font-size:12px"><span class="mute rl"></span><span class="cd mono"></span></div><div class="px"><div class="y"></div><div class="n"></div></div><div class="chart"><div class="cv"></div><span class="yh"></span><span class="yl"></span><span class="ys"></span></div><div class="cx"><span class="c1"></span><span>now</span></div><div class="row" style="flex-wrap:nowrap"><button class="btn buy" data-buy-mk="'+esc(m.id)+'" data-side="Y"><span class="t"></span><small class="s"></small></button><button class="btn buy no" data-buy-mk="'+esc(m.id)+'" data-side="N"><span class="t"></span><small class="s"></small></button></div>';
      c.querySelector('h3').textContent=m.q;
      c.querySelector('.rl').textContent='5-min round '+(m.rd||'')+' · ends in';
      g.append(c);
    }
    const asset=m.kind==='a';
    c.querySelector('.cd').textContent=fmtMs(m.end-now);
    const live=c.querySelector('.live');live.hidden=!asset;
    if(asset){
      const s=S.as[m.sym],d=s.price-m.K;
      c.querySelector('.lp').textContent=AS[m.sym].n+' '+fmtP(m.sym,s.price);
      const ld=c.querySelector('.ld');ld.textContent=(d>=0?'+':'-')+fmtP(m.sym,Math.abs(d))+' vs strike';ld.className='ld mono '+(d>=0?'up':'dn');
    }
    const y=c.querySelector('.y'),n=c.querySelector('.n');
    y.style.width=m.price+'%';n.style.width=(100-m.price)+'%';
    y.textContent='YES '+m.price+'¢';n.textContent='NO '+(100-m.price)+'¢';
    const r=chart(m,now),ys=c.querySelector('.ys');
    if(r){
      c.querySelector('.cv').innerHTML=r.svg;
      c.querySelector('.yh').textContent=asset?fmtP(m.sym,r.b):Math.round(r.b)+'¢';
      c.querySelector('.yl').textContent=asset?fmtP(m.sym,r.a):Math.round(r.a)+'¢';
      if(asset&&r.ky!=null){ys.hidden=false;ys.textContent='strike '+fmtP(m.sym,m.K);ys.style.top=Math.max(2,Math.min(80,r.ky/96*100))+'%'}else ys.hidden=true;
    }else ys.hidden=true;
    c.querySelector('.c1').textContent='-'+mkRange+' min';
    const ay=askY(m),an=askN(m),bs=c.querySelectorAll('.buy');
    bs[0].querySelector('.t').textContent='Buy YES '+ay+'¢';
    bs[0].querySelector('.s').textContent='+'+(100-ay)+' if right, -'+ay+' if wrong';
    bs[1].querySelector('.t').textContent='Buy NO '+an+'¢';
    bs[1].querySelector('.s').textContent='+'+(100-an)+' if right, -'+an+' if wrong';
  });
  updPos();
}
const pnlTxt=v=>(v>=0?'+':'-')+fmt(Math.abs(v));
const pnlCol=v=>v>0?'#3fe6d2':v<0?'#ff7a66':'inherit';
function posWorth(p){
  const m=S.mk.find(z=>z&&z.id===p.mid);if(!m)return null;
  const bid=p.side==='Y'?bidY(m):bidN(m);return Math.max(0,p.n*bid-feeC(p.n,bid));
}
/* live numbers: what you paid, what you could sell for right now, and the difference */
function updPos(){
  let paid=0,worth=0;
  S.pos.forEach(p=>{
    const w=posWorth(p),c=posCost(p);if(w==null)return;
    paid+=c;worth+=w;
    const r=document.querySelector('[data-pr="'+p.id+'"]');if(!r)return;
    r.querySelector('.pw').textContent=fmt(w);
    const d=r.querySelector('.pp');d.textContent=pnlTxt(w-c);d.style.color=pnlCol(w-c);
  });
  const t=document.getElementById('posTot');
  if(t)t.innerHTML='Total paid <b>'+fmt(paid)+'</b> &middot; worth now <b>'+fmt(worth)+'</b> &middot; <b style="color:'+pnlCol(worth-paid)+'">'+pnlTxt(worth-paid)+'</b>';
}
function renderPos(){
  const el=$('#mkPos');
  if(!S.pos.length){el.textContent='No open positions.';return}
  el.innerHTML='<div id="posTot" class="mono" style="padding:4px 0 8px"></div>'+S.pos.map(p=>{const c=posCost(p);return'<div data-pr="'+esc(p.id)+'" style="padding:8px 0;border-bottom:1px solid var(--feltline)"><div><b>'+(p.side==='Y'?'YES':'NO')+'</b> x'+p.n+' at '+p.px+'\u00a2 &middot; '+esc(p.q)+'</div><div class="row sp" style="flex-wrap:wrap;margin-top:4px"><span class="mono" style="font-size:13px">Paid <b>'+fmt(c)+'</b> &middot; Worth now <b class="pw"></b> &middot; <b class="pp"></b> &middot; <span class="mute">pays '+fmt(p.n*100)+' if right</span></span><button class="btn sm" data-sell="'+esc(p.id)+'">Sell now</button></div></div>'}).join('');
  renderMk();
}
function renderRng(){
  const el=$('#mkRng');if(!el)return;el.textContent='';
  [2,5,10].forEach(r=>{const b=document.createElement('button');b.className='btn sm'+(r===mkRange?' primary':'');b.dataset.r=r;b.textContent=r+' min';el.append(b)});
}
$('#p-mk').addEventListener('click',e=>{
  const rb=e.target.closest('[data-r]'),bb=e.target.closest('[data-buy-mk]'),sb=e.target.closest('[data-sell]');
  if(rb){mkRange=+rb.dataset.r;renderRng();renderMk();return}
  if(bb){
    const m=S.mk.find(z=>z&&z.id===bb.dataset.buyMk),side=bb.dataset.side;
    const qty=Math.floor(+$('#mkQty').value);
    if(!m||!m.kind)return;
    if(!(qty>=1)){toast('Enter at least 1 contract');return}
    if(m.end-Date.now()<5000){toast('Trading is closed for this round');return}
    const ask=side==='Y'?askY(m):askN(m),fee=feeC(qty,ask),total=qty*ask+fee;
    if(total>Math.floor(S.chips)){toast('Not enough chips: that costs '+fmt(total));return}
    spend(total);S.pos.push({id:rid(),mid:m.id,q:m.kind==='e'?m.q+' ('+m.rd+')':m.q,side,n:qty,px:ask,fee,cost:total});
    touch();renderPos();
    toast('Bought '+qty+' '+(side==='Y'?'YES':'NO')+' at '+ask+'¢ for '+fmt(total)+' (fee '+fee+'). Right: +'+fmt(qty*100-total)+', wrong: -'+fmt(total));
  }else if(sb){
    const p=S.pos.find(z=>z.id===sb.dataset.sell),m=p&&S.mk.find(z=>z&&z.id===p.mid);
    if(!p||!m)return;
    const bid=p.side==='Y'?bidY(m):bidN(m),v=Math.max(0,p.n*bid-feeC(p.n,bid));
    S.pos=S.pos.filter(z=>z!==p);payout(v);touch();renderPos();toast('Sold for '+fmt(v)+' (paid '+fmt(posCost(p))+')');
  }
});

/* ---------- start ---------- */
$('#mkGrid').insertAdjacentHTML('beforebegin','<div class="row" style="margin:0 0 12px"><label for="mkQty" class="mute">Contracts per trade</label><input id="mkQty" type="number" min="1" value="5" style="width:84px"><span class="mute" style="margin-left:10px">Chart</span><span id="mkRng" class="row" style="gap:6px"></span></div>');
renderRng();
showTab('tycoon');renderBj();renderVp();
boot().then(()=>{mkTick();renderPos()});
setInterval(tick,1000);
setInterval(mkTick,2000);
