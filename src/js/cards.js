/* ---------- cards ---------- */
const SU=['♠','♥','♦','♣'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function newDeck(){
  const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r});
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
  return d;
}
function cardEl(c,hidden,tag){
  const e=document.createElement(tag||'div');
  e.className='pc'+(hidden?' back':(c.s===1||c.s===2?' r':''));
  if(!hidden){e.textContent=RK[c.r];const s=document.createElement('small');s.textContent=SU[c.s];e.append(s)}
  return e;
}

/* ---------- blackjack ---------- */
const B={deck:[],p:[],d:[],bet:0,live:false};
function bjVal(h){let t=0,a=0;h.forEach(c=>{if(c.r===0){a++;t+=11}else t+=Math.min(c.r+1,10)});while(t>21&&a){t-=10;a--}return t}
function renderBj(){
  const dh=$('#bjD'),ph=$('#bjP');dh.textContent='';ph.textContent='';
  B.d.forEach((c,i)=>dh.append(cardEl(c,B.live&&i===1)));
  B.p.forEach(c=>ph.append(cardEl(c)));
  $('#bjDV').textContent=B.d.length?(B.live?'showing '+Math.min(bjVal([B.d[0]]),11):bjVal(B.d)):'';
  $('#bjPV').textContent=B.p.length?bjVal(B.p):'';
  $('#bjDeal').disabled=B.live;$('#bjHit').disabled=!B.live;$('#bjStand').disabled=!B.live;
  $('#bjDbl').disabled=!(B.live&&B.p.length===2&&Math.floor(S.chips)>=B.bet);
}
function bjMsg(t,cls){const m=$('#bjMsg');m.textContent=t;m.className='msg '+(cls||'')}
function bjEnd(kind){
  B.live=false;let back=0,t,cls;
  if(kind==='bj'){back=Math.floor(B.bet*2.5);t='Blackjack! +'+fmt(back-B.bet);cls='win'}
  else if(kind==='win'){back=B.bet*2;t='You win +'+fmt(B.bet);cls='win'}
  else if(kind==='push'){back=B.bet;t='Push. Bet returned.'}
  else if(kind==='bust'){t='Bust. -'+fmt(B.bet);cls='loss'}
  else{t='Dealer wins. -'+fmt(B.bet);cls='loss'}
  if(back)payout(back,'bj');
  if(cls==='win')S.bj.w++;else if(cls==='loss')S.bj.l++;
  touch();bjMsg(t,cls);renderBj();
}
function bjDraw(h){h.push(B.deck.pop())}
function bjDeal(){
  if(B.live)return;const bet=getBet('bjBet');if(!bet)return;
  spend(bet,'bj');B.bet=bet;B.deck=newDeck();B.p=[];B.d=[];
  bjDraw(B.p);bjDraw(B.d);bjDraw(B.p);bjDraw(B.d);B.live=true;bjMsg('');
  const pb=bjVal(B.p)===21,db=bjVal(B.d)===21;
  if(pb||db){renderBj();bjEnd(pb&&db?'push':pb?'bj':'lose');return}
  renderBj();
}
function bjStand(){
  if(!B.live)return;
  while(bjVal(B.d)<17)bjDraw(B.d);
  const p=bjVal(B.p),d=bjVal(B.d);B.live=false;
  bjEnd(d>21||p>d?'win':p===d?'push':'lose');
}
function bjHit(){
  if(!B.live)return;bjDraw(B.p);
  const v=bjVal(B.p);
  if(v>21){B.live=false;renderBj();bjEnd('bust')}
  else if(v===21)bjStand();
  else renderBj();
}
function bjDouble(){
  if(!(B.live&&B.p.length===2&&Math.floor(S.chips)>=B.bet))return;
  spend(B.bet,'bj');B.bet*=2;bjDraw(B.p);
  if(bjVal(B.p)>21){B.live=false;renderBj();bjEnd('bust')}else bjStand();
}
$('#bjDeal').onclick=bjDeal;$('#bjHit').onclick=bjHit;$('#bjStand').onclick=bjStand;$('#bjDbl').onclick=bjDouble;

/* ---------- video poker ---------- */
const VP=[['Royal flush',250],['Straight flush',50],['Four of a kind',25],['Full house',9],['Flush',6],['Straight',4],['Three of a kind',3],['Two pair',2],['Jacks or better',1]];
const V={deck:[],hand:[],held:[],bet:0,phase:0,hit:-1};
function vpEval(h){
  const rs=h.map(c=>c.r).sort((a,b)=>a-b),flush=h.every(c=>c.s===h[0].s),cnt={};
  rs.forEach(r=>{cnt[r]=(cnt[r]||0)+1});
  const cv=Object.values(cnt).sort((a,b)=>b-a),uniq=Object.keys(cnt).length===5;
  const royal=uniq&&rs.join()==='0,9,10,11,12';
  const straight=royal||(uniq&&rs[4]-rs[0]===4);
  if(straight&&flush)return royal?0:1;
  if(cv[0]===4)return 2;
  if(cv[0]===3&&cv[1]===2)return 3;
  if(flush)return 4;
  if(straight)return 5;
  if(cv[0]===3)return 6;
  if(cv[0]===2&&cv[1]===2)return 7;
  if(cv[0]===2){const pr=+Object.keys(cnt).find(k=>cnt[k]===2);if(pr===0||pr>=10)return 8}
  return -1;
}
function renderVp(){
  const el=$('#vpHand');el.textContent='';
  for(let i=0;i<5;i++){
    const w=document.createElement('div');
    const c=V.hand[i];
    const b=c?cardEl(c,false,'button'):cardEl(null,true,'button');
    if(c&&V.held[i])b.classList.add('held');
    b.disabled=V.phase!==1;b.setAttribute('aria-label',c?'Card '+RK[c.r]+SU[c.s]:'Face down card');
    b.onclick=()=>{if(V.phase!==1)return;V.held[i]=!V.held[i];renderVp()};
    const h=document.createElement('div');h.className='hold';h.textContent=c&&V.held[i]?'HOLD':'';
    w.append(b,h);el.append(w);
  }
  $('#vpGo').textContent=V.phase===1?'Draw':'Deal';
  $('#vpPay').innerHTML=VP.map((r,i)=>'<span class="'+(i===V.hit?'hit':'')+'">'+r[0]+'</span><span class="'+(i===V.hit?'hit':'')+'">'+r[1]+'x</span>').join('');
}
function vpMsg(t,cls){const m=$('#vpMsg');m.textContent=t;m.className='msg '+(cls||'')}
function vpGo(){
  if(V.phase===0){
    const bet=getBet('vpBet');if(!bet)return;
    spend(bet,'vp');V.bet=bet;V.deck=newDeck();V.hand=V.deck.splice(0,5);V.held=[false,false,false,false,false];V.phase=1;V.hit=-1;
    vpMsg('Tap the cards you want to keep, then draw.');
  }else{
    for(let i=0;i<5;i++)if(!V.held[i])V.hand[i]=V.deck.pop();
    V.phase=0;V.hit=vpEval(V.hand);
    if(V.hit>=0){const w=V.bet*VP[V.hit][1];payout(w,'vp');vpMsg(VP[V.hit][0]+'! '+(w>V.bet?'+'+fmt(w-V.bet):'Bet returned'),'win')}
    else vpMsg('No winning hand. -'+fmt(V.bet),'loss');
    V.held=[false,false,false,false,false];
  }
  renderVp();
}
$('#vpGo').onclick=vpGo;
