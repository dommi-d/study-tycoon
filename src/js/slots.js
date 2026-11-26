/* ---------- Sun Slots: three reels, centre line pays. Chips are spent up front and any win is saved as pending until the reels stop. ---------- */
const SLS=[
  {e:'🌱',w:30,p:8,pair:0,n:'Sprout'},
  {e:'🍃',w:24,p:11,pair:0,n:'Leaf'},
  {e:'💧',w:18,p:22,pair:0,n:'Droplet'},
  {e:'🌻',w:14,p:45,pair:1,n:'Sunflower'},
  {e:'⚡',w:9,p:130,pair:2,n:'Spark'},
  {e:'☀️',w:5,p:600,pair:5,n:'Sun'}
];
const slPick=()=>{let r=Math.random()*100;for(const s of SLS){if((r-=s.w)<0)return s}return SLS[0]};
/* multiplier of the bet returned for a centre line of three symbols (0 = loss) */
function slEval(a){
  if(a[0]===a[1]&&a[1]===a[2])return{mult:a[0].p,desc:'Three '+a[0].n+'s'};
  for(const s of SLS){if(s.pair&&a.filter(x=>x===s).length===2)return{mult:s.pair,desc:'Two '+s.n+'s'}}
  return{mult:0,desc:''};
}
function pendInit(){
  if(!S.pend)S.pend={sl:0,ro:0};
  ['sl','ro'].forEach(k=>{const v=S.pend[k]||0;if(v>0){payout(v,k);S.pend[k]=0;toast('Your '+(k==='sl'?'slot':'roulette')+' win was paid after the reload: +'+fmt(v))}});
  touch();
}
let slBusy=false;
const slCells=[0,1,2].map(i=>[...document.querySelectorAll('#slReels .reel')[i].children]);
function slShow(i,top,mid,bot){[top,mid,bot].forEach((s,k)=>{slCells[i][k].textContent=s.e});}
slCells.forEach((_,i)=>slShow(i,SLS[0],SLS[3],SLS[1]));
$('#slSpin').addEventListener('click',()=>{
  if(slBusy)return;
  const bet=getBet('slBet');if(!bet)return;
  spend(bet,'sl');
  const res=[slPick(),slPick(),slPick()],ev=slEval(res),win=bet*ev.mult;
  if(!S.pend)S.pend={sl:0,ro:0};
  S.pend.sl=win;touch();flush();
  slBusy=true;$('#slSpin').disabled=true;$('#slMsg').textContent='Spinning...';
  document.querySelectorAll('#slReels .reel').forEach(r=>{r.classList.remove('win');r.classList.add('spin')});
  const stopped=[false,false,false];
  const iv=setInterval(()=>{stopped.forEach((s,i)=>{if(!s)slShow(i,slPick(),slPick(),slPick())})},70);
  [800,1300,1800].forEach((t,i)=>setTimeout(()=>{
    stopped[i]=true;slShow(i,slPick(),res[i],slPick());
    const r=document.querySelectorAll('#slReels .reel')[i];r.classList.remove('spin');
    if(i===2){
      clearInterval(iv);
      if(win){payout(win,'sl');S.pend.sl=0;document.querySelectorAll('#slReels .reel').forEach(x=>x.classList.add('win'))}
      else S.pend.sl=0;
      touch();flush();
      $('#slMsg').textContent=win?ev.desc+'! You win '+fmt(win)+' chips ('+ev.mult+'x)':'No win this time.';
      if(win&&window.World)World.burst(10);
      slBusy=false;$('#slSpin').disabled=false;
    }
  },t));
});
$('#slPay').innerHTML=SLS.slice().reverse().map(s=>'<tr><td style="font-size:22px">'+s.e+s.e+s.e+'</td><td>'+s.n+'s in a row</td><td class="mono">'+s.p+'x</td></tr>').join('')+SLS.filter(s=>s.pair).reverse().map(s=>'<tr><td style="font-size:22px">'+s.e+s.e+'</td><td>Any two '+s.n+'s</td><td class="mono">'+s.pair+'x</td></tr>').join('');
