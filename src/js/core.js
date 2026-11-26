const $=s=>document.querySelector(s);
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>ds(new Date());
const yesterday=()=>ds(new Date(Date.now()-864e5));
const DEF=()=>({chips:100,earned:0,secs:0,since:0,day:today(),todaySecs:0,goal:120,streak:0,lastGoalDay:'',tasks:[],own:{},bj:{w:0,l:0},mk:[],pos:[],td:{round:1,ammo:0,spent:0,towers:[],live:false,wins:0,losses:0},chess:{g:null,live:false,paid:0,wins:0,lv:0,msg:""},st:{by:{},back:{}},lastSess:0,savedAt:0});
let S=DEF(),dirty=false;
const touch=()=>{dirty=true};
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- chips ---------- */
function renderBal(up){
  $('#chips').textContent=fmt(S.chips);
  if(typeof statsRender==='function')statsRender();
  if(up){const b=$('#bal');b.classList.remove('up');void b.offsetWidth;b.classList.add('up')}
  document.querySelectorAll('[data-buy]').forEach(b=>{const x=BIZ.find(z=>z.id===b.dataset.buy);b.disabled=cost(x)>Math.floor(S.chips)});
}
function earn(n,loud){S.chips+=n;S.earned+=n;touch();renderBal(loud);if(loud&&window.World)World.burst(14)}
const CATS={tycoon:'Tycoon',bj:'Blackjack',vp:'Video poker',mk:'Markets',td:'Sun Guard',ch:'Chess'};
const stat=()=>S.st||(S.st={by:{},back:{}});
function spend(n,c){S.chips-=n;if(c){const o=stat().by;o[c]=(o[c]||0)+n}touch();renderBal()}
function payout(n,c){S.chips+=n;if(c){const o=stat().back;o[c]=(o[c]||0)+n}touch();renderBal(true);if(n>0&&window.World)World.burst(Math.min(24,5+Math.floor(n/60)))}
function getBet(id){
  const v=Math.floor(+$('#'+id).value);
  if(!(v>=1)){toast('Enter a bet of at least 1');return 0}
  if(v>Math.floor(S.chips)){toast('Not enough chips. Go put in some work.');return 0}
  return v;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-bet]');if(!b)return;
  const i=$('#'+b.dataset.bet),f=b.dataset.f;let v=+i.value||1;
  v=f==='max'?Math.floor(S.chips):Math.floor(v*+f);i.value=Math.max(1,v);
});

/* ---------- work timer ---------- */
const RANKS=['Seedling','Sprout','Gardener','Cultivator','Steward','Grove Keeper','Forest Warden','Canopy Sage','Sunbearer'];
const level=()=>Math.min(RANKS.length,1+Math.floor(Math.sqrt(S.secs/3600*2)));
/* the session is timed against the real clock (runT0 = the moment it started), so a minimized or throttled tab
   never loses time: every tick credits everything between the last tick and now */
let run=false,last=0,sess=0,runT0=0;
function mult(){if(!run)return 1;return sess<1500?1:sess<3000?1.25:sess<5400?1.5:2}
const BASE=10; /* chips per minute of focus */
/* beating the immediately previous session pays a bonus that grows with how much longer this one is */
function recBonus(){
  const L=S.lastSess||0;if(!run||L<90||sess<=L)return 0;
  const ex=sess-L,r=Math.min(5,ex/Math.max(L,60));
  return Math.round(BASE*(ex/60)*(.5+r));
}
function recUpdate(){
  const n=$('#recNote'),L=S.lastSess||0,b=recBonus();
  if(L>0&&L<90)n.textContent='Last session was '+fmtT(L)+', under 1:30, so there is no record bonus this time.';
  else if(!run||L<=0){n.textContent=L>0?'Last session: '+fmtT(L)+'. Beat it for a bonus.':'Your first session sets the time to beat.';}
  else if(b>0)n.innerHTML='Beating your last session ('+fmtT(L)+') by <b>'+fmtT(sess-L)+'</b>: bonus <b style="color:#ffe066">+'+fmt(b)+'</b> and growing.';
  else n.textContent='Last session: '+fmtT(L)+'. '+fmtT(L-sess)+' to go before the bonus starts.';
  if(!$('#recAsk').hidden){if(b>0)$('#recAskT').textContent='You are '+fmtT(sess-L)+' past your last session ('+fmtT(L)+'). Cash out +'+fmt(b)+' chips now and stop, or keep studying? The longer you go, the faster the bonus grows.';else $('#recAsk').hidden=true}
}
/* chips for the session seconds s0..s1, following the focus-multiplier tiers (x1, x1.25, x1.5, x2) */
function chipsFor(s0,s1){
  const T=[0,1500,3000,5400,Infinity],M=[1,1.25,1.5,2];let tot=0;
  for(let i=0;i<4;i++){const a=Math.max(s0,T[i]),b=Math.min(s1,T[i+1]);if(b>a)tot+=(BASE*M[i]+tyRate())*(b-a)/60}
  return tot;
}
function tick(){
  if(!run)return;
  const now=Date.now(),s1=(now-runT0)/1000,d=s1-sess;
  if(d<=0){renderDesk();return}
  const midnight=new Date(now).setHours(0,0,0,0),dToday=Math.min(d,(now-midnight)/1000);
  if(S.day!==today()){S.day=today();S.todaySecs=0}
  const c=chipsFor(sess,s1);
  sess=s1;last=now;S.runBeat=now;S.secs+=d;S.todaySecs+=dToday;S.since+=d;
  earn(c,false);
  if(S.todaySecs>=S.goal*60&&S.lastGoalDay!==today()){
    S.streak=S.lastGoalDay===yesterday()?S.streak+1:1;S.lastGoalDay=today();
    const bonus=100+25*S.streak;earn(bonus,true);
    toast('Daily goal hit! +'+bonus+' chips, streak '+S.streak);
  }
  renderDesk();
}
function streakNow(){return(S.lastGoalDay===today()||S.lastGoalDay===yesterday())?S.streak:0}
const fmtT=s=>{s=Math.floor(s);return[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const dur=s=>{const m=Math.floor(s/60);return m>=60?(s/3600).toFixed(1)+'h':m+'m'};
function renderDesk(){
  const m=mult();
  $('#clock').textContent=fmtT(sess);
  $('#mult').textContent='x'+m.toFixed(2);
  $('#rate').textContent=run?'+'+Math.round(BASE*m+tyRate())+' chips/min':'Timer paused';
  $('#goalBar').style.width=Math.min(100,S.todaySecs/(S.goal*60)*100)+'%';
  $('#sToday').textContent=dur(S.todaySecs);$('#sAll').textContent=dur(S.secs);$('#sStreak').textContent=streakNow();
  const b=$('#startBtn');b.textContent=run?'Stop session':'Start working';b.className='btn '+(run?'stop':'primary');
  if(window.World)World.setRun(run);
  recUpdate();
  const lv=level();$('#rank').textContent='Rank '+lv+' · '+RANKS[lv-1];
  $('#taskNote').textContent='Each finished task pays '+taskPay()+' chips'+(tyCount()?' (tycoon bonus x'+tyBonus().toFixed(1)+').':'.');
}
$('#startBtn').onclick=()=>{
  if(run){
    tick();/* credit everything up to the real clock before stopping */
    const b=recBonus();
    if(b>0){$('#recAsk').hidden=false;recUpdate();return}
    run=false;S.runT0=null;S.lastSess=Math.floor(sess);toast('Session over: '+dur(sess)+' logged');touch();flush();$('#recAsk').hidden=true
  }
  else{run=true;runT0=last=Date.now();sess=0;S.runT0=runT0;S.runBeat=runT0;toast('Clock is running. Chips are accruing.');touch();flush()}
  renderDesk();
};
$('#recKeep').onclick=()=>{$('#recAsk').hidden=true};
$('#recCash').onclick=()=>{
  tick();const b=recBonus();$('#recAsk').hidden=true;if(!run)return;
  run=false;S.runT0=null;if(b>0)earn(b,true);S.lastSess=Math.floor(sess);touch();flush();
  toast('Session over: '+dur(sess)+' logged'+(b>0?'. Record bonus +'+fmt(b)+' chips':''));renderDesk();
};
$('#goalIn').onchange=e=>{S.goal=Math.max(10,Math.min(900,Math.floor(+e.target.value)||120));e.target.value=S.goal;touch();renderDesk()};

/* ---------- tasks ---------- */
$('#taskForm').onsubmit=e=>{
  e.preventDefault();const v=$('#taskIn').value.trim();if(!v)return;
  S.tasks.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:v,done:false});
  $('#taskIn').value='';touch();renderTasks();
};
function renderTasks(){
  const ul=$('#tasks');ul.textContent='';
  S.tasks.slice(0,40).forEach(k=>{
    const li=document.createElement('li');if(k.done)li.className='done';
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=k.done;cb.disabled=k.done;cb.setAttribute('aria-label','Finish task');
    cb.onchange=()=>{
      const r=taskPay();k.done=true;earn(r,true);toast('Task done! +'+r+' chips');renderTasks();renderDesk();
    };
    const sp=document.createElement('span');sp.textContent=k.t;
    const x=document.createElement('button');x.className='btn sm';x.textContent='×';x.setAttribute('aria-label','Remove task');
    x.onclick=()=>{S.tasks=S.tasks.filter(z=>z!==k);touch();renderTasks()};
    li.append(cb,sp,x);ul.append(li);
  });
  if(!S.tasks.length){const li=document.createElement('li');li.className='mute';li.textContent='Add what you plan to finish. Each completed task pays chips.';ul.append(li)}
}

/* ---------- tycoon ---------- */
const BIZ=[
  {id:'cart',n:'Seed Stall',d:'Heirloom seeds and warm tea for passing gardeners.',c:150,r:2},
  {id:'copy',n:'Repair Caf\u00e9',d:'Fix it, never toss it. Neighbors line up.',c:600,r:8},
  {id:'arcade',n:'Solar Array',d:'Panels soaking up sun and selling power to the grid.',c:2500,r:30},
  {id:'tutor',n:'Greenhouse Dome',d:'Glass-roofed classrooms where seeds and ideas grow.',c:10000,r:120},
  {id:'tower',n:'Vertical Farm',d:'Terraced towers of greens above the rooftops.',c:50000,r:550},
  {id:'bank',n:'Airship Dock',d:'Cargo blimps carry harvests across the archipelago.',c:250000,r:2800}
];
const cost=b=>Math.floor(b.c*Math.pow(1.15,S.own[b.id]||0));
const tyRate=()=>BIZ.reduce((a,b)=>a+(S.own[b.id]||0)*b.r,0);
/* every business you build raises what finished tasks pay by 10% */
const tyCount=()=>BIZ.reduce((a,b)=>a+(S.own[b.id]||0),0);
const tyBonus=()=>1+.1*tyCount();
const taskPay=()=>Math.round(60*mult()*tyBonus());
function renderTycoon(){
  const el=$('#p-tycoon');
  el.innerHTML='<div class="row sp"><h2>Tycoon</h2><span class="tag">+'+fmt(tyRate())+' chips/min while you work</span></div>'+
  '<p class="mute" style="margin:0 0 14px">Your businesses only run while the work timer does. Idle empires earn nothing. Every business you build also raises what finished tasks pay by 10% (now <b>x'+tyBonus().toFixed(1)+'</b>, so a task pays '+fmt(taskPay())+').</p><div class="biz-grid">'+
  BIZ.map(b=>'<div class="biz"><div class="row sp"><h3>'+b.n+'</h3><span class="own">'+(S.own[b.id]||0)+'</span></div><span class="mute">'+b.d+'</span><span class="mono" style="font-size:13px">+'+fmt(b.r)+'/min each</span><button class="btn primary" data-buy="'+b.id+'">Buy for '+fmt(cost(b))+'</button></div>').join('')+'</div>';
  renderBal();if(window.World)World.sync();
}
$('#p-tycoon').addEventListener('click',e=>{
  const b=e.target.closest('[data-buy]');if(!b)return;
  const x=BIZ.find(z=>z.id===b.dataset.buy),c=cost(x);
  if(c>Math.floor(S.chips)){toast('Not enough chips');return}
  spend(c,'tycoon');S.own[x.id]=(S.own[x.id]||0)+1;toast(x.n+' purchased');renderTycoon();renderDesk();
});

/* ---------- tabs ---------- */
function showTab(t){
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.t===t)));
  ['tycoon','bj','vp','mk','td','ch'].forEach(k=>{$('#p-'+k).hidden=k!==t});
}
$('#tabs').onclick=e=>{const b=e.target.closest('.tab');if(b)showTab(b.dataset.t)};

/* ---------- saving ---------- */
let dbDoc=null,saving=false;
function localSave(){try{S.savedAt=Date.now();localStorage.setItem('studystakes',JSON.stringify(S))}catch(e){}}
async function cloudSave(){
  if(!dbDoc||saving)return;saving=true;
  try{await dbDoc.set({state:JSON.stringify(S)})}catch(e){}
  saving=false;
}
function flush(){if(!dirty)return;localSave();if(saving)return;dirty=false;cloudSave()}
setInterval(flush,6000);
document.addEventListener('visibilitychange',()=>{tick();if(document.hidden)flush()});
window.addEventListener('pagehide',()=>{tick();flush()});
window.addEventListener('focus',tick);
/* a session that was running when the page reloaded (an update, say) picks up again if it was only a short gap */
function timerResume(){
  if(!S.runT0||!S.runBeat)return;
  const gap=Date.now()-S.runBeat;
  if(gap<=5*60000){run=true;runT0=S.runT0;sess=(S.runBeat-runT0)/1000;last=S.runBeat;tick();toast('Welcome back: your session kept running.')}
  else{const len=Math.floor((S.runBeat-S.runT0)/1000);if(len>0)S.lastSess=len;S.runT0=null;touch()}
  renderDesk();
}
const adopt=o=>{S=Object.assign(DEF(),o);if(!S.bj)S.bj={w:0,l:0};if(!S.td)S.td=DEF().td;if(!S.chess)S.chess=DEF().chess;if(!S.st)S.st={by:{},back:{}};if(!S.lastSess)S.lastSess=0};
function renderAll(){renderBal();renderDesk();renderTasks();renderTycoon();$('#goalIn').value=S.goal;renderMk();renderPos();if(typeof tdRender==='function')tdRender();if(typeof chRender==='function')chRender()}
async function boot(){
  let local=null;try{local=JSON.parse(localStorage.getItem('studystakes'))}catch(e){}
  if(local&&typeof local==='object')adopt(local);
  renderAll();
  try{
    const C=window.claude;if(!C||!C.use)return;
    const [db,user]=await Promise.all([C.use('db'),C.use('user')]);
    const id=user?await user.id():null;
    if(db&&id){
      dbDoc=db.doc('data/users/'+id+'/save');
      const snap=await dbDoc.get();
      if(snap.exists){
        const r=JSON.parse(snap.data().state);
        if(r&&r.savedAt>(local?local.savedAt:0)&&!run){adopt(r);renderAll()}
      }else dirty=true;
    }
  }catch(e){}
}

/* ---------- side stats menu (starts closed) ---------- */
const sideBody=$('#sideBody'),sideBtn=$('#sideBtn');
function statsRender(){
  if(sideBody.hidden)return;
  const st=stat(),by=st.by||{},back=st.back||{};
  const spent=Object.keys(by).reduce((a,k)=>a+by[k],0),won=Object.keys(back).reduce((a,k)=>a+back[k],0);
  const max=Math.max(1,...Object.keys(CATS).map(k=>by[k]||0));
  const row=(a,b,c)=>'<div class="row sp" style="padding:3px 0"><span>'+a+'</span><b class="mono"'+(c?' style="color:'+c+'"':'')+'>'+b+'</b></div>';
  sideBody.innerHTML='<h3>Chip stats</h3>'+
    row('Earned from working',fmt(S.earned))+
    row('Won back from games',fmt(won))+
    row('Total earned',fmt(S.earned+won),'#3fe6d2')+
    row('Total spent',fmt(spent),'#ffb199')+
    row('Balance now',fmt(S.chips))+
    '<h3 style="margin-top:14px">Where it went</h3>'+
    Object.keys(CATS).map(k=>{const sp=by[k]||0,bk=back[k]||0,net=bk-sp;
      return'<div class="st-row"><span>'+CATS[k]+'</span><b class="mono">'+fmt(sp)+' spent</b><span class="mute" style="font-size:12px">returned '+fmt(bk)+'</span><span class="mono" style="font-size:12px;color:'+(net>=0?'#3fe6d2':'#ff9a8a')+'">'+(net>=0?'+':'-')+fmt(Math.abs(net))+' net</span><div class="st-bar"><i style="width:'+Math.round((sp/max)*100)+'%"></i></div></div>'}).join('')+
    '<p class="mute" style="font-size:12px;margin:10px 0 0">Spending is tracked from this feature on, so earlier purchases are not included.</p>';
}
sideBtn.addEventListener('click',()=>{
  sideBody.hidden=!sideBody.hidden;sideBtn.setAttribute('aria-expanded',String(!sideBody.hidden));
  statsRender();
});
