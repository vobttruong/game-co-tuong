/* Chơi online 2 máy qua WebRTC (PeerJS). Người tạo phòng cầm Đỏ, người vào cầm Đen */
const Net={peer:null,conn:null,color:'r',pending:false,undoPending:false,
  send(o){if(this.conn)this.conn.send(o)},
  sendMove(m){this.send({t:'move',from:m.from,to:m.to})},
  close(){
    try{this.conn&&this.conn.close()}catch(e){}
    try{this.peer&&this.peer.destroy()}catch(e){}
    this.conn=this.peer=null;this.pending=this.undoPending=false;
  }
};
const netMsg=t=>$('net').textContent=t;
const PREFIX='cotuong-vn-';

function setupConn(c){
  Net.conn=c;
  c.on('open',()=>{netMsg('✅ Đã kết nối. Bạn cầm quân '+who(Net.color)+'.');newGame()});
  c.on('data',d=>{
    if(d.t==='move'){ /* kiểm tra lại tính hợp lệ trước khi đi */
      const m=cur.find(x=>x.from===d.from&&x.to===d.to);
      if(m&&!over&&S.turn!==Net.color)play(m,true);
    }else if(d.t==='rematch'){
      if(Net.pending){Net.send({t:'accept'});startRematch()} /* hai bên cùng xin: tự đồng ý */
      else $('rmBox').style.display='flex';
    }else if(d.t==='accept'){
      if(Net.pending)startRematch();
    }else if(d.t==='undoReq'){ /* đối thủ xin đi lại: chỉ hợp lệ nếu nước cuối là của họ */
      if(!over&&hist.length&&S.turn===Net.color)$('unBox').style.display='flex';
      else Net.send({t:'undoNo'});
    }else if(d.t==='undoYes'){
      if(Net.undoPending){Net.undoPending=false;undoOne();toast('Đối thủ đồng ý, bạn đi lại nhé.',1800)}
    }else if(d.t==='undoNo'){
      Net.undoPending=false;toast('Đối thủ không đồng ý cho đi lại.',2000);
    }else if(d.t==='decline'){
      Net.pending=false;netMsg('Đối thủ chưa muốn đánh lại.');
    }
  });
  c.on('close',()=>{netMsg('⚠️ Đối thủ đã thoát.');Net.conn=null;Net.pending=Net.undoPending=false;$('rmBox').style.display=$('unBox').style.display='none';render()});
}
function hostRoom(){
  if(typeof Peer==='undefined')return netMsg('Không tải được thư viện PeerJS (kiểm tra mạng).');
  Net.close();Net.color='r';newGame();
  const code=Math.random().toString(36).slice(2,8);
  Net.peer=new Peer(PREFIX+code);
  Net.peer.on('open',()=>{
    $('roomLink').value=location.href.split('?')[0].split('#')[0]+'?room='+code;
    $('roomLink').style.display=$('cp').style.display='block';
    netMsg('Mã phòng: '+code+' — gửi link cho bạn bè và chờ họ vào…');
  });
  Net.peer.on('connection',c=>{if(Net.conn){c.on('open',()=>c.close());return}setupConn(c)});
  Net.peer.on('error',e=>netMsg('Lỗi: '+e.type));
}
function joinRoom(code){
  if(typeof Peer==='undefined')return netMsg('Không tải được thư viện PeerJS (kiểm tra mạng).');
  Net.close();Net.color='b';newGame();
  Net.peer=new Peer();
  Net.peer.on('open',()=>{
    netMsg('Đang kết nối…');
    setupConn(Net.peer.connect(PREFIX+code.trim().toLowerCase(),{reliable:true}));
  });
  Net.peer.on('error',e=>netMsg(e.type==='peer-unavailable'?'Không tìm thấy phòng.':'Lỗi: '+e.type));
}

/* ---------- Đánh lại ---------- */
function askRematch(){
  if(!Net.conn)return newGame();
  Net.pending=true;Net.send({t:'rematch'});
  netMsg('Đã gửi lời mời đánh lại, chờ đối thủ đồng ý…');
}
/* Ván mới: hai bên đổi quân cho công bằng */
function startRematch(){
  Net.pending=false;$('rmBox').style.display='none';
  Net.color=Net.color==='r'?'b':'r';
  newGame();
  netMsg('🔄 Ván mới! Bạn cầm quân '+who(Net.color)+'.');
}
$('rmYes').onclick=()=>{Net.send({t:'accept'});startRematch()};
$('rmNo').onclick=()=>{Net.send({t:'decline'});$('rmBox').style.display='none'};

/* ---------- Xin đi lại ---------- */
function askUndo(){
  if(!Net.conn)return toast('Chưa kết nối với đối thủ.',1800);
  if(over||!hist.length||S.turn===Net.color)return toast('Chỉ xin đi lại được ngay sau nước vừa đi của bạn.',2400);
  if(Net.undoPending)return toast('Đang chờ đối thủ trả lời…',1500);
  Net.undoPending=true;Net.send({t:'undoReq'});
  toast('Đã xin đi lại, chờ đối thủ…',1800);
}
$('unYes').onclick=()=>{Net.send({t:'undoYes'});$('unBox').style.display='none';undoOne()};
$('unNo').onclick=()=>{Net.send({t:'undoNo'});$('unBox').style.display='none'};
