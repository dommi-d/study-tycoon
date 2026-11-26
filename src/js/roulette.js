/* ---------- Roulette: European wheel, one zero. Straight-up pays 35 to 1, dozens and columns 2 to 1, even-money bets 1 to 1. ---------- */
const ROW=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const ROED=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const roRed=n=>ROED.includes(n);
const roCol=n=>n===0?'#1fae5a':roRed(n)?'#e0344f':'#15283a';
/* every bet key: the pockets it covers and the multiple of the stake it returns on a win (stake included) */
const ROB={};
for(let n=0;n<=36;n++)ROB['n'+n]={f:x=>x===n,m:36,l:String(n)};
[1,2,3].forEach(c=>{ROB['c'+c]={f:x=>x>0&&x%3===c%3,m:3,l:'2 to 1'};ROB['d'+c]={f:x=>x>(c-1)*12&&x<=c*12,m:3,l:['1st 12','2nd 12','3rd 12'][c-1]}});
Object.assign(ROB,{low:{f:x=>x>=1&&x<=18,m:2,l:'1-18'},even:{f:x=>x>0&&x%2===0,m:2,l:'Even'},red:{f:x=>x>0&&roRed(x),m:2,l:'Red'},black:{f:x=>x>0&&!roRed(x),m:2,l:'Black'},odd:{f:x=>x%2===1,m:2,l:'Odd'},high:{f:x=>x>=19,m:2,l:'19-36'}});
function roPay(n,bets){let w=0;for(const k in bets)if(ROB[k].f(n))w+=bets[k]*ROB[k].m;return w}
let roBets={},roLast={},roChip=10,roBusy=false,roStack=[],roAng=0,roHist=[];
const roTotal=()=>Object.keys(roBets).reduce((a,k)=>a+roBets[k],0);
function roBuild(){
  const cell=(k,cls,txt,st)=>'<button class="rc '+cls+'" data-k="'+k+'"'+(st?' style="'+st+'"':'')+'><span>'+txt+'</span><i class="rb"></i></button>';
  let h=cell('n0','rz','0','grid-column:1/4');
  for(let r=0;r<12;r++)for(let c=1;c<=3;c++){const n=r*3+c;h+=cell('n'+n,roRed(n)?'rr':'rk',n)}
  h+=cell('c1','ro2','2 to 1')+cell('c2','ro2','2 to 1')+cell('c3','ro2','2 to 1');
  $('#roTable').innerHTML=h;
  $('#roOut').innerHTML=['d1','d2','d3','low','even','red','black','odd','high'].map(k=>cell(k,'rout'+(k==='red'?' rr':k==='black'?' rk':''),ROB[k].l)).join('');
  $('#roChips').innerHTML=[10,50,100,500,1000].map(v=>'<button class="btn sm'+(v===roChip?' primary':'')+'" data-chip="'+v+'">'+v+'</button>').join('');
}
function roRender(){
  document.querySelectorAll('#p-ro .rc').forEach(b=>{const a=roBets[b.dataset.k]||0,r=b.querySelector('.rb');r.textContent=a?fmt(a):'';r.style.display=a?'block':'none'});
  $('#roTot').textContent=fmt(roTotal());
  document.querySelectorAll('#roChips [data-chip]').forEach(b=>b.classList.toggle('primary',+b.dataset.chip===roChip));
  $('#roHist').innerHTML=roHist.slice(0,14).map(n=>'<b class="rh" style="background:'+roCol(n)+'">'+n+'</b>').join('');
}
const roCv=$('#roWheel'),roCx=roCv.getContext('2d'),RW=37,RS=Math.PI*2/RW;
function roDraw(ang,ball,br){
  const d=Math.min(2,window.devicePixelRatio||1),W=roCv.clientWidth||260;
  if(roCv.width!==Math.round(W*d)){roCv.width=Math.round(W*d);roCv.height=Math.round(W*d)}
  const c=roCx,s=roCv.width/300;c.setTransform(s,0,0,s,0,0);c.clearRect(0,0,300,300);
  c.save();c.translate(150,150);
  c.fillStyle='#6a3a12';c.beginPath();c.arc(0,0,148,0,6.3);c.fill();
  c.rotate(ang);
  for(let i=0;i<RW;i++){
    const n=ROW[i],a0=-Math.PI/2+i*RS;
    c.fillStyle=roCol(n);c.beginPath();c.moveTo(0,0);c.arc(0,0,134,a0,a0+RS);c.closePath();c.fill();
    c.strokeStyle='rgba(255,215,120,.7)';c.lineWidth=1;c.stroke();
    c.save();c.rotate(a0+RS/2+Math.PI/2);c.fillStyle='#fff';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(n,0,-116);c.restore();
  }
  c.fillStyle='#3a2208';c.beginPath();c.arc(0,0,86,0,6.3);c.fill();
  c.fillStyle='#ffc21a';c.beginPath();c.arc(0,0,22,0,6.3);c.fill();
  c.restore();
  c.save();c.translate(150,150);c.rotate(ball);c.fillStyle='#fff';c.strokeStyle='#999';c.beginPath();c.arc(0,-br,6,0,6.3);c.fill();c.stroke();c.restore();
  c.fillStyle='#ffc21a';c.beginPath();c.moveTo(150,2);c.lineTo(140,-8);c.lineTo(160,-8);c.closePath();c.fill();
}
function roSpin(){
  if(roBusy)return;
  const tot=roTotal();
  if(!tot){toast('Tap the table to place a bet first');return}
  if(tot>Math.floor(S.chips)){toast('Not enough chips: your bets total '+fmt(tot));return}
  const n=Math.floor(Math.random()*37),win=roPay(n,roBets),bets=Object.assign({},roBets);
  spend(tot,'ro');
  if(!S.pend)S.pend={sl:0,ro:0};
  S.pend.ro=win;touch();flush();
  roLast=bets;roBets={};roStack=[];roBusy=true;roRender();$('#roMsg').textContent='No more bets. The ball is rolling...';
  const i=ROW.indexOf(n),a0=roAng%(Math.PI*2),target=-(i+.5)*RS;
  let delta=((target-a0)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);const total=Math.PI*2*5+delta,t0=performance.now(),DUR=4600;
  (function frame(now){
    const t=Math.min(1,(now-t0)/DUR),e=1-Math.pow(1-t,3);
    roDraw(a0+total*e,-(1-e)*Math.PI*2*9,128-14*e*e);
    if(t<1){requestAnimationFrame(frame);return}
    roAng=a0+total;
    roHist.unshift(n);
    if(win)payout(win,'ro');S.pend.ro=0;touch();flush();
    const net=win-tot;
    $('#roMsg').innerHTML='<b style="color:#fff;background:'+roCol(n)+';padding:2px 10px;border-radius:10px">'+n+'</b> '+(n===0?'Green':roRed(n)?'Red':'Black')+'. '+(win?'You win '+fmt(win)+' (net '+(net>=0?'+':'-')+fmt(Math.abs(net))+').':'No win. You lost '+fmt(tot)+'.');
    if(win&&window.World)World.burst(10);
    roBusy=false;roRender();
  })(t0);
}
$('#p-ro').addEventListener('click',e=>{
  const cb=e.target.closest('[data-chip]'),cell=e.target.closest('.rc'),id=e.target.closest('button');
  if(cb){roChip=+cb.dataset.chip;roRender();return}
  if(cell&&!roBusy){
    if(roTotal()+roChip>Math.floor(S.chips)){toast('Not enough chips for another '+roChip+' chip');return}
    roBets[cell.dataset.k]=(roBets[cell.dataset.k]||0)+roChip;roStack.push(cell.dataset.k);roRender();return;
  }
  if(!id||roBusy)return;
  if(id.id==='roSpin')roSpin();
  else if(id.id==='roUndo'){const k=roStack.pop();if(k){roBets[k]-=roChip>roBets[k]?roBets[k]:roChip;if(roBets[k]<=0)delete roBets[k];roRender()}}
  else if(id.id==='roClear'){roBets={};roStack=[];roRender()}
  else if(id.id==='roAgain'){const t=Object.keys(roLast).reduce((a,k)=>a+roLast[k],0);if(!t){toast('No previous bets');return}if(t>Math.floor(S.chips)){toast('Not enough chips to repeat: '+fmt(t));return}roBets=Object.assign({},roLast);roStack=Object.keys(roBets);roRender()}
});
roBuild();roRender();roDraw(0,0,128);
if(window.ResizeObserver)new ResizeObserver(()=>{if(!roBusy)roDraw(roAng,0,128)}).observe(roCv);
