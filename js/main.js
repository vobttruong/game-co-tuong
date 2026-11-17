/* Khởi động: nối các nút điều khiển với game */
const HINTS={
  pve:'Đấu với máy tính. Chọn quân bạn cầm và độ khó.',
  pvp:'Hai người thay phiên nhau đi trên cùng một thiết bị.',
  online:'Mỗi người một máy: tạo phòng rồi gửi link cho bạn bè, hoặc nhập mã phòng.'
};
/* Tô sáng các nút đang chọn + cập nhật dòng gợi ý */
function sync(){
  document.querySelectorAll('.seg').forEach(g=>{
    const v=$(g.dataset.for).value;
    g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  });
  $('hint').textContent=HINTS[$('mode').value];
}

/* Các nhóm nút chọn (chế độ, quân, độ khó, kiểu quân) */
document.querySelectorAll('.seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  const el=$(g.dataset.for);el.value=b.dataset.v;el.onchange();
}));

$('mode').onchange=()=>{
  const m=$('mode').value;
  $('pveOpts').style.display=m==='pve'?'':'none';
  $('onlineOpts').style.display=m==='online'?'block':'none';
  $('undo').style.display=m==='online'?'none':'';
  if(m!=='online'){Net.close();netMsg('')}else netMsg('Tạo phòng hoặc nhập mã phòng để chơi.');
  newGame();
};
$('side').onchange=$('lvl').onchange=newGame;
$('skin').onchange=()=>{
  try{localStorage.setItem('skin',$('skin').value)}catch(e){}
  sync();render();
};
$('new').onclick=()=>{if(mode==='online')Net.sendNew();newGame()};
$('undo').onclick=undoMove;
$('flip').onclick=()=>{flip=!flip;render()};
$('toast').onclick=hideToast;

/* Online */
$('mk').onclick=hostRoom;
$('jn').onclick=()=>{if($('code').value.trim())joinRoom($('code').value)};
$('cp').onclick=()=>{
  $('roomLink').select();
  try{navigator.clipboard.writeText($('roomLink').value)}catch(e){document.execCommand('copy')}
  netMsg('Đã sao chép link mời!');
};

/* Bắt đầu */
try{$('skin').value=localStorage.getItem('skin')||'han'}catch(e){}
drawLines();
const room=new URLSearchParams(location.search).get('room');
if(room){$('mode').value='online';$('mode').onchange();joinRoom(room)}else newGame();
