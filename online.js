/* Chơi online 2 máy qua WebRTC (PeerJS). Người tạo phòng cầm Đỏ, người vào cầm Đen */
const Net={peer:null,conn:null,color:'r',
  sendMove(m){if(this.conn)this.conn.send({t:'move',from:m.from,to:m.to})},
  sendNew(){if(this.conn)this.conn.send({t:'new'})},
  close(){
    try{this.conn&&this.conn.close()}catch(e){}
    try{this.peer&&this.peer.destroy()}catch(e){}
    this.conn=this.peer=null;
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
    }else if(d.t==='new')newGame();
  });
  c.on('close',()=>{netMsg('⚠️ Đối thủ đã thoát.');Net.conn=null;render()});
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
