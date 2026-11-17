/* Luật cờ tướng: sinh nước đi, kiểm tra chiếu, nước đi hợp lệ */
const CH={r:{K:'帥',A:'仕',E:'相',H:'傌',R:'俥',C:'炮',P:'兵'},b:{K:'將',A:'士',E:'象',H:'馬',R:'車',C:'砲',P:'卒'}};
const VN={K:'Tướng',A:'Sĩ',E:'Tượng',H:'Mã',R:'Xe',C:'Pháo',P:'Tốt'};
const VAL={K:0,A:200,E:200,H:400,R:900,C:450,P:100};
const ORTH=[[1,0],[-1,0],[0,1],[0,-1]],DIAG=[[1,1],[1,-1],[-1,1],[-1,-1]];
const KN=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const inb=(r,c)=>r>=0&&r<10&&c>=0&&c<9;
const pal=(r,c,col)=>c>=3&&c<=5&&(col==='r'?r>=7&&r<=9:r>=0&&r<=2);
const nm=i=>'abcdefghi'[i%9]+(10-((i/9)|0));

function startState(){
  const b=Array(90).fill(null),back='RHEAKAEHR';
  for(let c=0;c<9;c++){b[c]='b'+back[c];b[81+c]='r'+back[c]}
  b[19]=b[25]='bC';b[64]=b[70]='rC';
  for(let c=0;c<9;c+=2){b[27+c]='bP';b[54+c]='rP'}
  return{board:b,turn:'r'};
}
function pseudo(b,col){
  const out=[],opp=col==='r'?'b':'r';
  for(let i=0;i<90;i++){
    const p=b[i];if(!p||p[0]!==col)continue;
    const t=p[1],r=(i/9)|0,c=i%9;
    const add=(rr,cc)=>{const q=b[rr*9+cc];if(!q||q[0]===opp)out.push({from:i,to:rr*9+cc})};
    if(t==='K'){for(const[dr,dc]of ORTH)if(pal(r+dr,c+dc,col))add(r+dr,c+dc)}
    else if(t==='A'){for(const[dr,dc]of DIAG)if(pal(r+dr,c+dc,col))add(r+dr,c+dc)}
    else if(t==='E'){
      for(const[dr,dc]of DIAG){
        const rr=r+2*dr,cc=c+2*dc;
        if(inb(rr,cc)&&(col==='r'?rr>=5:rr<=4)&&!b[(r+dr)*9+c+dc])add(rr,cc);
      }
    }else if(t==='H'){
      for(const[dr,dc]of KN){
        const lr=Math.abs(dr)===2?r+dr/2:r,lc=Math.abs(dr)===2?c:c+dc/2,rr=r+dr,cc=c+dc;
        if(inb(rr,cc)&&!b[lr*9+lc])add(rr,cc);
      }
    }else if(t==='R'){
      for(const[dr,dc]of ORTH){
        let rr=r+dr,cc=c+dc;
        while(inb(rr,cc)){
          const q=b[rr*9+cc];
          if(!q)out.push({from:i,to:rr*9+cc});
          else{if(q[0]===opp)out.push({from:i,to:rr*9+cc});break}
          rr+=dr;cc+=dc;
        }
      }
    }else if(t==='C'){
      for(const[dr,dc]of ORTH){
        let rr=r+dr,cc=c+dc,jumped=false;
        while(inb(rr,cc)){
          const q=b[rr*9+cc];
          if(!jumped){if(!q)out.push({from:i,to:rr*9+cc});else jumped=true}
          else if(q){if(q[0]===opp)out.push({from:i,to:rr*9+cc});break}
          rr+=dr;cc+=dc;
        }
      }
    }else if(t==='P'){
      const d=col==='r'?-1:1,crossed=col==='r'?r<=4:r>=5;
      if(inb(r+d,c))add(r+d,c);
      if(crossed){if(inb(r,c-1))add(r,c-1);if(inb(r,c+1))add(r,c+1)}
    }
  }
  return out;
}
function kingsFace(b){
  const a=b.indexOf('rK'),k=b.indexOf('bK');
  if(a<0||k<0||a%9!==k%9)return false;
  for(let i=k+9;i<a;i+=9)if(b[i])return false;
  return true;
}
function inCheckB(b,col){
  if(kingsFace(b))return true;
  const k=b.indexOf(col+'K');
  return pseudo(b,col==='r'?'b':'r').some(m=>m.to===k);
}
function apply(s,m){
  const b=s.board.slice();b[m.to]=b[m.from];b[m.from]=null;
  return{board:b,turn:s.turn==='r'?'b':'r'};
}
function legal(s){
  return pseudo(s.board,s.turn).filter(m=>!inCheckB(apply(s,m).board,s.turn));
}

