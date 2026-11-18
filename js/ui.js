/* Giao diện bàn cờ: vẽ bàn, chọn quân, đi quân, hiệu ứng */
const $=id=>document.getElementById(id);
const who=c=>c==='r'?'Đỏ':'Đen';
const ICO={K:'♚',A:'♛',E:'♝',H:'♞',R:'♜',C:'◎',P:'♟\uFE0E'};
/* Chữ hiển thị trên quân theo kiểu đang chọn (han / vi / ico) */
const lab=p=>{const k=$('skin').value;return k==='vi'?VN[p[1]]:k==='ico'?ICO[p[1]]:CH[p[0]][p[1]]};

let S,hist,sel,cur,lastM,mode,human,lvl,flip,over,busy,log;
/* Vị trí hiển thị (hàng, cột) của ô logic i, có tính xoay bàn */
const disp=i=>{const r=(i/9)|0,c=i%9;return flip?[9-r,8-c]:[r,c]};

function drawLines(){
  let h='';const L=(x1,y1,x2,y2)=>h+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  for(let r=0;r<10;r++)L(.5,r+.5,8.5,r+.5);
  L(.5,.5,.5,9.5);L(8.5,.5,8.5,9.5);
  for(let c=1;c<8;c++){L(c+.5,.5,c+.5,4.5);L(c+.5,5.5,c+.5,9.5)}
  L(3.5,.5,5.5,2.5);L(5.5,.5,3.5,2.5);L(3.5,7.5,5.5,9.5);L(5.5,7.5,3.5,9.5);
  $('lines').innerHTML=`<g stroke="#5a3a1a" stroke-width=".045" stroke-linecap="round">${h}</g>
  <g fill="#5a3a1a" font-size=".5" text-anchor="middle" dominant-baseline="middle" font-family="KaiTi,STKaiti,serif">
  <text x="2.5" y="5.02">楚 河</text><text x="6.5" y="5.02">漢 界</text></g>`;
}

/* ---------- Ván mới / vẽ lại ---------- */
function newGame(){
  sync();
  $('new').classList.remove('hot');
  mode=$('mode').value;human=$('side').value;lvl=+$('lvl').value;
  S=startState();hist=[];sel=null;lastM=null;over=false;busy=false;log=[];
  flip=(mode==='pve'&&human==='b')||(mode==='online'&&Net.color==='b');
  hideToast();
  cur=legal(S);render();
  if(mode==='pve'&&S.turn!==human)aiTurn();
}
function render(){
  const bd=$('board');bd.dataset.skin=$('skin').value;
  bd.querySelectorAll('.cell').forEach(e=>e.remove());
  const chk=inCheckB(S.board,S.turn)?S.board.indexOf(S.turn+'K'):-1;
  const tg=sel===null?[]:cur.filter(m=>m.from===sel);
  for(let rr=0;rr<10;rr++)for(let cc=0;cc<9;cc++){
    const r=flip?9-rr:rr,c=flip?8-cc:cc,i=r*9+c,p=S.board[i];
    const d=document.createElement('div');d.className='cell';
    d.style.left=(cc*100/9)+'%';d.style.top=(rr*10)+'%';
    if(lastM&&(i===lastM.from||i===lastM.to))d.innerHTML+='<i class="lm"></i>';
    if(p){
      const e=document.createElement('div');
      const can=!over&&p[0]===S.turn&&cur.some(m=>m.from===i);
      e.className='pc '+p[0]+(can?' can':'')+(i===sel?' sel':'')+(i===chk?' chk':'');
      e.textContent=lab(p);d.appendChild(e);
    }
    if(tg.some(m=>m.to===i))d.innerHTML+=p?'<i class="ring"></i>':'<i class="dot"></i>';
    d.onclick=()=>click(i);bd.appendChild(d);
  }
  const L=$('log');L.innerHTML='';
  log.forEach((t,n)=>{
    if(n%2===0){const x=document.createElement('span');x.textContent=(n/2+1)+'.';L.appendChild(x)}
    const y=document.createElement('span');y.textContent=t;L.appendChild(y);
  });
  L.scrollTop=L.scrollHeight;
  renderCaps();
  $('status').textContent=over||(busy?'Máy đang suy nghĩ…':`Lượt: ${who(S.turn)}`
    +(inCheckB(S.board,S.turn)?' — CHIẾU TƯỚNG!':'')
    +(mode==='online'&&Net.conn?(S.turn===Net.color?' (đến lượt bạn)':' (chờ đối thủ)'):''));
}

/* Quân bị ăn của mỗi bên: lấy số quân ban đầu trừ số quân còn trên bàn */
const INIT={K:1,A:2,E:2,H:2,R:2,C:2,P:5};
function lost(col){
  const have={};
  for(const p of S.board)if(p&&p[0]===col)have[p[1]]=(have[p[1]]||0)+1;
  const out=[];
  for(const t of Object.keys(INIT).sort((a,b)=>VAL[b]-VAL[a]))
    for(let n=have[t]||0;n<INIT[t];n++)out.push(t);
  return out;
}
function renderCaps(){
  const top=flip?'r':'b',bot=flip?'b':'r';
  [['capTop',top],['capBot',bot]].forEach(([id,col])=>{
    const el=$(id),l=lost(col),prev=renderCaps.prev||(renderCaps.prev={}),n0=prev[col]||0;
    prev[col]=l.length;
    el.dataset.skin=$('skin').value;
    el.innerHTML=`<span class="lb">${who(col)} bị ăn:</span>`
      +(l.length?l.map((t,i)=>`<span class="mp ${col}${i>=n0&&l.length>n0?' new':''}">${lab(col+t)}</span>`).join(''):'<span class="none">chưa có</span>');
  });
}

/* ---------- Thao tác ---------- */
function click(i){
  if(over||busy)return;
  if(mode==='pve'&&S.turn!==human)return;
  if(mode==='online'&&(!Net.conn||S.turn!==Net.color))return;
  if(sel!==null){
    const m=cur.find(m=>m.from===sel&&m.to===i);
    if(m)return play(m);
  }
  const p=S.board[i];
  sel=(p&&p[0]===S.turn&&cur.some(m=>m.from===i))?i:null;
  render();
}
function play(m,remote){
  hist.push({S,lastM,log:log.slice()});
  const p=S.board[m.from],cap=S.board[m.to];
  let txt=VN[p[1]]+' '+nm(m.from)+(cap?'x':'-')+nm(m.to);
  S=apply(S,m);lastM=m;sel=null;cur=legal(S);
  const chk=inCheckB(S.board,S.turn);
  if(!cur.length){
    txt+='#';
    over=`${chk?'Chiếu bí':'Hết nước đi'}! ${who(S.turn==='r'?'b':'r')} thắng 🎉`;
  }else if(chk)txt+='+';
  log.push(txt);render();animateMove(m,cap);
  if(mode==='online'&&!remote&&Net.conn)Net.sendMove(m);
  if(over){setTimeout(()=>toast(over,0),500);if(mode==='online')$('new').classList.add('hot')}
  else if(chk)setTimeout(()=>toast('Chiếu tướng!',1200),380);
  if(!over&&mode==='pve'&&S.turn!==human)aiTurn();
}
function aiTurn(){
  busy=true;render();
  /* chờ hiệu ứng nước đi của người chơi xong rồi máy mới tính */
  setTimeout(()=>{busy=false;if(!over)play(bestMove(S,lvl))},450);
}
function undoMove(){
  if(busy||!hist.length||mode==='online')return;
  let h=hist.pop();
  if(mode==='pve'&&h.S.turn!==human&&hist.length)h=hist.pop();
  S=h.S;lastM=h.lastM;log=h.log;sel=null;over=false;hideToast();cur=legal(S);render();
}

/* ---------- Hiệu ứng ---------- */
function animateMove(m,cap){
  const bd=$('board'),cw=bd.clientWidth/9,chh=bd.clientHeight/10;
  const [tr,tc]=disp(m.to),[fr,fc]=disp(m.from);
  const cell=bd.querySelectorAll('.cell')[tr*9+tc];
  const el=cell&&cell.querySelector('.pc');if(!el)return;
  const dx=(fc-tc)*cw,dy=(fr-tr)*chh,dist=Math.hypot(fr-tr,fc-tc);
  const dur=Math.min(560,240+dist*50);
  el.style.zIndex=6;
  /* quân nhấc lên, lướt theo đường cong rồi đặt xuống */
  el.animate([
    {transform:`translate(${dx}px,${dy}px) scale(1)`},
    {transform:`translate(${dx/2}px,${dy/2}px) scale(1.22)`,boxShadow:'0 16px 14px rgba(0,0,0,.4)',offset:.5},
    {transform:'translate(0,0) scale(1)'}
  ],{duration:dur,easing:'cubic-bezier(.3,.7,.3,1)'}).onfinish=()=>{
    el.style.zIndex='';
    burst(cell,cap?'cap':'land');
    if(cap)shake();
  };
  if(cap){ /* quân bị ăn nằm đó đến khi quân kia đáp xuống rồi mới vỡ ra */
    const g=document.createElement('div');
    g.className='pc '+cap[0];g.textContent=lab(cap);
    g.style.cssText='position:absolute;z-index:1';cell.appendChild(g);
    g.animate([
      {opacity:1,transform:'scale(1) rotate(0)'},
      {opacity:1,transform:'scale(1) rotate(0)',offset:.85},
      {opacity:0,transform:'scale(.4) rotate(45deg)'}
    ],{duration:dur+260}).onfinish=()=>g.remove();
  }
}
function burst(cell,kind){
  const b=document.createElement('i');b.className='burst '+kind;
  cell.appendChild(b);setTimeout(()=>b.remove(),700);
}
function shake(){
  $('board').animate([
    {transform:'translate(0,0)'},{transform:'translate(-3px,2px)'},
    {transform:'translate(3px,-2px)'},{transform:'translate(-2px,0)'},{transform:'translate(0,0)'}
  ],{duration:220});
}
function toast(text,ms){
  const t=$('toast');t.textContent=text;t.classList.add('show');
  t.classList.toggle('end',!ms);
  clearTimeout(toast.t);
  if(ms)toast.t=setTimeout(()=>t.classList.remove('show'),ms);
}
function hideToast(){clearTimeout(toast.t);$('toast').classList.remove('show','end')}
