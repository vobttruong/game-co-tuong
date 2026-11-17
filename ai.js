/* Máy tính toán nước đi (minimax + alpha-beta). Độ khó = độ sâu tìm kiếm */
function evalS(s){
  let v=0;
  for(let i=0;i<90;i++){
    const p=s.board[i];if(!p)continue;
    const t=p[1],r=(i/9)|0,c=i%9;let x=VAL[t];
    if(t==='P'){if(p[0]==='r'?r<=4:r>=5)x+=100;x+=(4-Math.abs(c-4))*5}
    else if(t==='H'||t==='R'||t==='C')x+=(4-Math.abs(c-4))*6+(4.5-Math.abs(r-4.5))*3;
    v+=p[0]===s.turn?x:-x;
  }
  return v;
}
function order(s,ms){
  return ms.map(m=>({m,k:s.board[m.to]?VAL[s.board[m.to][1]]*10-VAL[s.board[m.from][1]]+1000:0}))
    .sort((a,b)=>b.k-a.k).map(o=>o.m);
}
function search(s,d,a,b){
  if(d===0)return evalS(s);
  const ms=legal(s);
  if(!ms.length)return -99999-d;
  for(const m of order(s,ms)){
    const v=-search(apply(s,m),d-1,-b,-a);
    if(v>=b)return b;if(v>a)a=v;
  }
  return a;
}
function bestMove(s,lvl){
  let best=null,bv=-Infinity;
  for(const m of order(s,legal(s))){
    const v=-search(apply(s,m),lvl-1,-Infinity,Infinity)+Math.random()*(lvl===1?250:10);
    if(v>bv){bv=v;best=m}
  }
  return best;
}

