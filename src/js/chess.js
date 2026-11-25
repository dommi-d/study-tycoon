/* ---------- Chess: you play White against the house. Every move you make costs chips. ---------- */
const CHLV=[
  {n:'Sprout (easy)',d:1,buy:400,fee:100,prize:1500,rnd:60},
  {n:'Gardener (medium)',d:2,buy:250,fee:75,prize:4000,rnd:8},
  {n:'Sage (hard)',d:3,buy:100,fee:50,prize:10000,rnd:0}
];
const CHV={P:100,N:320,B:330,R:500,Q:900,K:0};
const CHG={P:'♟',N:'♞',B:'♝',R:'♜',Q:'♛',K:'♚'};
function chNew(){
  const b=Array(64).fill(null),back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){b[c]='b'+back[c];b[8+c]='bP';b[48+c]='wP';b[56+c]='w'+back[c]}
  return{b,turn:'w',cs:{wK:1,wQ:1,bK:1,bQ:1},ep:-1,half:0,last:null};
}
const chOpp=c=>c==='w'?'b':'w';
function chAtt(b,sq,by){
  const r=sq>>3,c=sq&7;
  const pr=by==='w'?r+1:r-1;
  for(const dc of[-1,1]){if(pr>=0&&pr<8&&c+dc>=0&&c+dc<8&&b[pr*8+c+dc]===by+'P')return true}
  for(const[dr,dc]of[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===by+'N')return true}
  for(const[dr,dc]of[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]){
    const diag=dr&&dc;let rr=r+dr,cc=c+dc,first=true;
    while(rr>=0&&rr<8&&cc>=0&&cc<8){
      const p=b[rr*8+cc];
      if(p){if(p[0]===by){const t=p[1];if(t==='Q'||(diag&&t==='B')||(!diag&&t==='R')||(first&&t==='K'))return true}break}
      first=false;rr+=dr;cc+=dc;
    }
  }
  return false;
}
const chKing=(b,col)=>b.indexOf(col+'K');
function chPseudo(g,col){
  const b=g.b,out=[];
  for(let s=0;s<64;s++){
    const p=b[s];if(!p||p[0]!==col)continue;
    const t=p[1],r=s>>3,c=s&7;
    if(t==='P'){
      const dir=col==='w'?-1:1,start=col==='w'?6:1,last=col==='w'?0:7;
      const r1=r+dir;
      if(r1>=0&&r1<8){
        if(!b[r1*8+c]){out.push({f:s,t:r1*8+c,pr:r1===last});if(r===start&&!b[(r+2*dir)*8+c])out.push({f:s,t:(r+2*dir)*8+c,dbl:1})}
        for(const dc of[-1,1]){const cc=c+dc;if(cc<0||cc>7)continue;const q=b[r1*8+cc];
          if(q&&q[0]!==col)out.push({f:s,t:r1*8+cc,pr:r1===last,cap:1});
          else if(!q&&g.ep===r1*8+cc)out.push({f:s,t:r1*8+cc,ep:1,cap:1})}
      }
    }else if(t==='N'||t==='K'){
      const d=t==='N'?[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for(const[dr,dc]of d){const rr=r+dr,cc=c+dc;if(rr<0||rr>7||cc<0||cc>7)continue;const q=b[rr*8+cc];if(!q||q[0]!==col)out.push({f:s,t:rr*8+cc,cap:q?1:0})}
      if(t==='K'){
        const home=col==='w'?60:4,opp=chOpp(col);
        if(s===home&&!chAtt(b,s,opp)){
          if(g.cs[col+'K']&&!b[s+1]&&!b[s+2]&&b[s+3]===col+'R'&&!chAtt(b,s+1,opp)&&!chAtt(b,s+2,opp))out.push({f:s,t:s+2,cas:1});
          if(g.cs[col+'Q']&&!b[s-1]&&!b[s-2]&&!b[s-3]&&b[s-4]===col+'R'&&!chAtt(b,s-1,opp)&&!chAtt(b,s-2,opp))out.push({f:s,t:s-2,cas:-1});
        }
      }
    }else{
      const d=t==='B'?[[1,1],[1,-1],[-1,1],[-1,-1]]:t==='R'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for(const[dr,dc]of d){let rr=r+dr,cc=c+dc;while(rr>=0&&rr<8&&cc>=0&&cc<8){const q=b[rr*8+cc];if(!q)out.push({f:s,t:rr*8+cc,cap:0});else{if(q[0]!==col)out.push({f:s,t:rr*8+cc,cap:1});break}rr+=dr;cc+=dc}}
    }
  }
  return out;
}
function chApply(g,m){
  const b=g.b.slice(),p=b[m.f],col=p[0],cs=Object.assign({},g.cs);
  let ep=-1,half=g.half+1;
  if(p[1]==='P'||b[m.t])half=0;
  b[m.t]=m.pr?col+'Q':p;b[m.f]=null;
  if(m.ep)b[m.t+(col==='w'?8:-8)]=null;
  if(m.dbl)ep=(m.f+m.t)/2;
  if(m.cas){const rf=m.cas>0?m.f+3:m.f-4,rt=m.cas>0?m.f+1:m.f-1;b[rt]=b[rf];b[rf]=null}
  if(p[1]==='K'){cs[col+'K']=0;cs[col+'Q']=0}
  [[0,'bQ'],[7,'bK'],[56,'wQ'],[63,'wK']].forEach(a=>{if(m.f===a[0]||m.t===a[0])cs[a[1]]=0});
  return{b,turn:chOpp(g.turn),cs,ep,half,last:[m.f,m.t]};
}
function chLegal(g,col){
  col=col||g.turn;
  return chPseudo(g,col).filter(m=>{const n=chApply(g,m);return!chAtt(n.b,chKing(n.b,col),chOpp(col))});
}
function chStatus(g){
  const mv=chLegal(g),inCheck=chAtt(g.b,chKing(g.b,g.turn),chOpp(g.turn));
  if(!mv.length)return inCheck?'mate':'stale';
  if(g.half>=100)return'draw';
  const pcs=g.b.filter(x=>x&&x[1]!=='K');
  if(!pcs.length||(pcs.length===1&&(pcs[0][1]==='N'||pcs[0][1]==='B')))return'draw';
  return inCheck?'check':'ok';
}
const chPST=s=>{const r=s>>3,c=s&7;return 6-(Math.abs(3.5-r)+Math.abs(3.5-c))*1.2};
function chEval(g){
  let v=0;
  for(let s=0;s<64;s++){const p=g.b[s];if(!p)continue;
    let x=CHV[p[1]];
    if(p[1]==='P'){const adv=p[0]==='w'?6-(s>>3):(s>>3)-1;x+=adv*6+chPST(s)*.6}
    else if(p[1]!=='K'&&p[1]!=='R'&&p[1]!=='Q')x+=chPST(s)*2.5;
    v+=p[0]==='w'?x:-x;}
  return v;
}
function chOrder(g,ms){return ms.map(m=>{const t=g.b[m.t];return[m,(t?CHV[t[1]]*10-CHV[g.b[m.f][1]]:0)+(m.pr?800:0)]}).sort((a,b)=>b[1]-a[1]).map(a=>a[0])}
function chSearch(g,d,al,be,col){
  /* negamax from the point of view of col (the side to move) */
  const ms=chLegal(g);
  if(!ms.length){return chAtt(g.b,chKing(g.b,g.turn),chOpp(g.turn))?-99999-d:0}
  if(d===0)return(col==='w'?1:-1)*chEval(g);
  let best=-1e9;
  for(const m of chOrder(g,ms)){
    const v=-chSearch(chApply(g,m),d-1,-be,-al,chOpp(col));
    if(v>best)best=v;if(v>al)al=v;if(al>=be)break;
  }
  return best;
}
function chPick(g,lv){
  const ms=chLegal(g),col=g.turn;let best=null,bv=-1e9;
  for(const m of chOrder(g,ms)){
    const v=-chSearch(chApply(g,m),lv.d-1,-1e9,1e9,chOpp(col))+Math.random()*lv.rnd;
    if(v>bv){bv=v;best=m}
  }
  return best;
}
/* ---- screen ---- */
let chSel=-1,chBusy=false,chPicking=false;
function chInit(){
  const ch=S.chess;
  if(ch.live&&ch.g){
    /* a game in progress is restored; if the page closed while the house was thinking, it plays its move now */
    if(ch.g.turn==='b'){chHouse()}
    else{ch.msg='Welcome back. Your game was saved. Your move.';chRender()}
  }else chRender();
}
/* the win prize is fixed until your move fees pass half of it, then it grows to repay every extra move */
function chPrize(){const L=CHLV[S.chess.lv||0];return L.prize+Math.max(0,(S.chess.fees||0)-L.prize/2)}
function chFee(){return CHLV[S.chess.lv||0].fee}
function chRender(){
  const ch=S.chess;if(!ch)return;
  const g=ch.g,bd=$('#chBoard');
  /* difficulty buttons until a game is chosen; then the board takes their place */
  const picking=!ch.live&&(!g||chPicking);
  $('#chPick').hidden=!picking;$('#chPlay').hidden=picking;
  if(picking){
    const icons=['\uD83C\uDF31','\uD83C\uDF3B','\uD83D\uDD25'];
    $('#chPick').innerHTML=CHLV.map((l,i)=>{const ok=Math.floor(S.chips)>=l.buy+l.fee;return'<button class="chlv l'+i+'" data-lv="'+i+'"'+(ok?'':' disabled')+'><span class="chi">'+icons[i]+'</span><b>'+l.n.split(' (')[0]+'</b><em>'+l.n.split('(')[1].replace(')','').toUpperCase()+' OPPONENT</em><span>Buy-in <b style="font-size:19px">'+l.buy+'</b></span><span>Each move <b style="font-size:19px">'+l.fee+'</b></span><span>Win prize <b style="font-size:19px">'+l.prize.toLocaleString('en-US')+'</b></span><span class="go">'+(ok?'Play':'Need '+fmt(l.buy+l.fee-Math.floor(S.chips))+' more chips')+'</span></button>'}).join('');
  }
  $('#chRes').hidden=!ch.live;$('#chAgain').hidden=ch.live;
  if(!ch._rc)$('#chRes').textContent='Resign';
  $('#chStats').innerHTML=(ch.live?'Paid so far <b>'+fmt(ch.paid)+'</b> &middot; Move fee <b>'+chFee()+'</b> &middot; Win pays <b>'+fmt(chPrize())+'</b> &middot; ':'')+'Wins <b>'+(ch.wins||0)+'</b>';
  $('#chMsg').textContent=ch.msg||(picking?'Pick an opponent to start. You play White. The buy-in is charged when you press Play.':'');
  if(!g||picking){bd.innerHTML='';return}
  const targets={};
  if(chSel>=0&&ch.live&&g.turn==='w')chLegal(g).filter(m=>m.f===chSel).forEach(m=>{targets[m.t]=m.cap?'cap':'mv'});
  let h='';
  for(let s=0;s<64;s++){
    const p=g.b[s],r=s>>3,c=s&7;
    const cls='chsq '+((r+c)%2?'d':'l')+(s===chSel?' sel':'')+(targets[s]?' '+targets[s]:'')+(g.last&&(g.last[0]===s||g.last[1]===s)?' last':'');
    h+='<div class="'+cls+'" data-sq="'+s+'" role="button" aria-label="square '+'abcdefgh'[c]+(8-r)+(p?' '+(p[0]==='w'?'white ':'black ')+p[1]:'')+'">'+(p?'<span class="'+(p[0]==='w'?'chw':'chb')+'">'+CHG[p[1]]+'</span>':'')+'</div>';
  }
  bd.innerHTML=h;
}
function chFinish(res){
  const ch=S.chess;ch.live=false;chSel=-1;
  if(res==='win'){const pz=chPrize();ch.wins=(ch.wins||0)+1;payout(pz,'ch');ch.msg='Checkmate, you win! +'+fmt(pz)+' chips.'}
  else if(res==='draw'){const back=Math.floor(ch.paid/2);if(back)payout(back,'ch');ch.msg='Draw. Half of everything you paid comes back: +'+fmt(back)+' chips.'}
  else if(res==='resign')ch.msg='You resigned. The buy-in and move fees ('+fmt(ch.paid)+' chips) are gone.';
  else ch.msg='Checkmate, the house wins. The buy-in and move fees ('+fmt(ch.paid)+' chips) are gone.';
  touch();flush();chRender();
}
function chAfter(){
  const ch=S.chess,g=ch.g,st=chStatus(g);
  if(st==='mate'){chFinish(g.turn==='b'?'win':'loss');return true}
  if(st==='stale'||st==='draw'){chFinish('draw');return true}
  ch.msg=st==='check'?(g.turn==='w'?'You are in check.':'Check!'):'';return false;
}
function chHouse(){
  const ch=S.chess;chBusy=true;ch.msg='The house is thinking...';chRender();
  setTimeout(()=>{
    try{
      const m=chPick(ch.g,CHLV[ch.lv||0]);
      if(m)ch.g=chApply(ch.g,m);
    }catch(e){}
    chBusy=false;touch();flush();
    if(!chAfter())chRender();
  },60);
}
$('#chBoard').addEventListener('click',e=>{
  const sq=e.target.closest('[data-sq]');if(!sq)return;
  const ch=S.chess,g=ch.g;if(!g||!ch.live||g.turn!=='w'||chBusy)return;
  const s=+sq.dataset.sq,p=g.b[s];
  if(chSel>=0){
    const m=chLegal(g).find(x=>x.f===chSel&&x.t===s);
    if(m){
      const fee=chFee();
      if(Math.floor(S.chips)<fee){toast('Not enough chips: each move costs '+fee);return}
      spend(fee,'ch');ch.paid+=fee;ch.fees=(ch.fees||0)+fee;ch.g=chApply(g,m);chSel=-1;touch();flush();
      if(!chAfter())chHouse();
      return;
    }
  }
  chSel=(p&&p[0]==='w'&&s!==chSel)?s:-1;chRender();
});
$('#chPick').addEventListener('click',e=>{
  const b=e.target.closest('[data-lv]');if(!b||chBusy)return;
  const ch=S.chess,nl=+b.dataset.lv,L=CHLV[nl];
  if(Math.floor(S.chips)<L.buy+L.fee){toast('You need '+(L.buy+L.fee)+' chips: '+L.buy+' buy-in plus your first move ('+L.fee+')');return}
  spend(L.buy,'ch');ch.lv=nl;ch.g=chNew();ch.live=true;ch.paid=L.buy;ch.fees=0;chPicking=false;
  ch.msg='Buy-in paid ('+L.buy+'). Your move; each move costs '+L.fee+' chips.';chSel=-1;touch();flush();chRender();
});
$('#chAgain').addEventListener('click',()=>{chPicking=true;S.chess.msg='';chRender()});
$('#chRes').addEventListener('click',()=>{
  const ch=S.chess;if(chBusy||!ch.live)return;
  if(!ch._rc){ch._rc=1;$('#chRes').textContent='Tap again to resign';setTimeout(()=>{ch._rc=0;chRender()},3000);return}
  ch._rc=0;chFinish('resign');
});
