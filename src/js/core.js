const $=s=>document.querySelector(s);
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>ds(new Date());
const yesterday=()=>ds(new Date(Date.now()-864e5));
const DEF=()=>({chips:100,earned:0,secs:0,since:0,day:today(),todaySecs:0,goal:120,streak:0,lastGoalDay:'',tasks:[],own:{},bj:{w:0,l:0},mk:[],pos:[],td:{round:1,ammo:0,spent:0,towers:[],live:false,wins:0,losses:0},chess:{g:null,live:false,paid:0,wins:0,lv:0,msg:""},savedAt:0});
let S=DEF(),dirty=false;
const touch=()=>{dirty=true};
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- chips ---------- */
function renderBal(up){
  $('#chips').textContent=fmt(S.chips);
  if(up){const b=$('#bal');b.classList.remove('up');void b.offsetWidth;b.classList.add('up')}
  document.querySelectorAll('[data-buy]').forEach(b=>{const x=BIZ.find(z=>z.id===b.dataset.buy);b.disabled=cost(x)>Math.floor(S.chips)});
}
function earn(n,loud){S.chips+=n;S.earned+=n;touch();renderBal(loud);if(loud&&window.World)World.burst(14)}
function spend(n){S.chips-=n;touch();renderBal()}
function payout(n){S.chips+=n;touch();renderBal(true);if(n>0&&window.World)World.burst(Math.min(24,5+Math.floor(n/60)))}
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
let run=false,last=0,sess=0;
function mult(){if(!run)return 1;return sess<1500?1:sess<3000?1.25:sess<5400?1.5:2}
const BASE=10; /* chips per minute of focus */
function tick(){
  if(!run)return;
  const now=Date.now();let d=Math.min((now-last)/1000,90);last=now;
  if(S.day!==today()){S.day=today();S.todaySecs=0}
  sess+=d;S.secs+=d;S.todaySecs+=d;S.since+=d;
  earn((BASE*mult()+tyRate())*d/60,false);
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
  const lv=level();$('#rank').textContent='Rank '+lv+' · '+RANKS[lv-1];
  $('#taskNote').textContent=S.since>=300?'Next finished task pays '+Math.round(60*m)+' chips.':'Work '+Math.ceil((300-S.since)/60)+' more min before the next finished task pays.';
}
$('#startBtn').onclick=()=>{
  if(run){run=false;toast('Session over: '+dur(sess)+' logged');touch()}
  else{run=true;last=Date.now();sess=0;toast('Clock is running. Chips are accruing.')}
  renderDesk();
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
      if(S.since<300){toast('Put in 5 minutes of work before this one pays.');cb.checked=false;return}
      const r=Math.round(60*mult());S.since=0;k.done=true;earn(r,true);toast('Task done! +'+r+' chips');renderTasks();renderDesk();
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
function renderTycoon(){
  const el=$('#p-tycoon');
  el.innerHTML='<div class="row sp"><h2>Tycoon</h2><span class="tag">+'+fmt(tyRate())+' chips/min while you work</span></div>'+
  '<p class="mute" style="margin:0 0 14px">Your businesses only run while the work timer does. Idle empires earn nothing.</p><div class="biz-grid">'+
  BIZ.map(b=>'<div class="biz"><div class="row sp"><h3>'+b.n+'</h3><span class="own">'+(S.own[b.id]||0)+'</span></div><span class="mute">'+b.d+'</span><span class="mono" style="font-size:13px">+'+fmt(b.r)+'/min each</span><button class="btn primary" data-buy="'+b.id+'">Buy for '+fmt(cost(b))+'</button></div>').join('')+'</div>';
  renderBal();if(window.World)World.sync();
}
$('#p-tycoon').addEventListener('click',e=>{
  const b=e.target.closest('[data-buy]');if(!b)return;
  const x=BIZ.find(z=>z.id===b.dataset.buy),c=cost(x);
  if(c>Math.floor(S.chips)){toast('Not enough chips');return}
  spend(c);S.own[x.id]=(S.own[x.id]||0)+1;toast(x.n+' purchased');renderTycoon();renderDesk();
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
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
window.addEventListener('pagehide',flush);
const adopt=o=>{S=Object.assign(DEF(),o);if(!S.bj)S.bj={w:0,l:0};if(!S.td)S.td=DEF().td;if(!S.chess)S.chess=DEF().chess};
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
