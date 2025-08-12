/* Full logic: auth, users, history, filters, menu, tai xiu 3d integration (Three.js + cannon-es)
   Admin default: Jxv40bi / phongle2710
   Storage keys:
     users -> sw_full_users_v1
     history per user -> sw_full_hist_<username>
*/

const USERS_KEY = 'sw_full_users_v1'
const $ = id => document.getElementById(id)
const numberWithCommas = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")

function usersLoad(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch(e){ return {} } }
function usersSave(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)) }
function histKey(user){ return 'sw_full_hist_' + user }
function loadHist(user){ try { return JSON.parse(localStorage.getItem(histKey(user)) || '[]') } catch(e){ return [] } }
function saveHist(user, arr){ localStorage.setItem(histKey(user), JSON.stringify(arr)) }
function pushHist(user, entry){ if(!user) return; const a = loadHist(user); a.unshift(entry); saveHist(user, a.slice(0,500)) }
function formatTS(ts){ return new Date(ts).toLocaleString() }

// default admin
const defaultAdmin = { username:'Jxv40bi', pass:'phongle2710', balance:0, name:'Admin', isAdmin:true }
let users = usersLoad()
if(!users[defaultAdmin.username]){ users[defaultAdmin.username] = defaultAdmin; usersSave(users); users = usersLoad() }

// session
let current = null
function setCurrent(u){ current = u; if(u){ $('displayName').textContent = u.name || u.username; $('displayBalance').textContent = numberWithCommas(u.balance||0); $('avatar').textContent = (u.username||'KN').slice(0,2).toUpperCase(); $('btnLogin').style.display='none'; $('btnRegister').style.display='none'; $('infoName').textContent = u.name || u.username; $('infoBalance').textContent = numberWithCommas(u.balance||0); if(u.isAdmin) $('adminPanel').style.display='block'; else $('adminPanel').style.display='none'; renderUserHistoryFiltered(u.username) } else { $('displayName').textContent='Khách'; $('displayBalance').textContent='0'; $('avatar').textContent='KN'; $('btnLogin').style.display='inline-block'; $('btnRegister').style.display='inline-block'; $('infoName').textContent='Khách'; $('infoBalance').textContent='0'; $('adminPanel').style.display='none'; $('history').innerHTML='' } }
setCurrent(null)

function sanitizeNick(raw){ let s = raw || ''; try{ s = s.normalize('NFD').replace(/\p{Diacritic}/gu,'') }catch(e){ s = s.replace(/[\u0300-\u036f]/g,'') } s = s.replace(/[^A-Za-z0-9_-]/g,'').slice(0,12); return s }

/* Menu tiles */
const tiles = [ { id:'tai-xiu', name:'Tài Xỉu', hot:true }, { id:'mini-poker', name:'Mini Poker' }, { id:'slot', name:'Slot' }, { id:'ban-ca', name:'Bắn Cá' }, { id:'xoc-dia', name:'Xóc Đĩa' }, { id:'lo-de', name:'Lô Đề' } ]
const grid = $('gameGrid')
tiles.forEach(t=>{ const d = document.createElement('div'); d.className='tile'; d.dataset.id=t.id; d.innerHTML = `<div class="icon"></div><div class="name">${t.name}</div>${t.hot?'<div class="tag">HOT</div>':''}`; d.addEventListener('click', ()=> openGame(t.id)); grid.appendChild(d) })

/* Modal helpers */
function showModal(id){ $(id).style.display='flex' }
function hideModal(id){ $(id).style.display='none' }
$('btnLogin').addEventListener('click', ()=>{ $('loginUser').value=''; $('loginPass').value=''; showModal('modalLogin') })
$('closeLogin').addEventListener('click', ()=> hideModal('modalLogin'))
$('btnRegister').addEventListener('click', ()=>{ $('regUser').value=''; $('regPass').value=''; showModal('modalRegister') })
$('closeReg').addEventListener('click', ()=> hideModal('modalRegister'))

/* Register / Login */
$('doRegister').addEventListener('click', ()=>{ const r = sanitizeNick($('regUser').value.trim()), p = $('regPass').value; if(!r||!p){ alert('Nhập thông tin hợp lệ'); return } users = usersLoad(); if(users[r]){ alert('Tài khoản đã tồn tại'); return } users[r] = { username:r, pass:p, balance:0, name:r, isAdmin:false }; usersSave(users); saveHist(r, []); hideModal('modalRegister'); alert('Đăng ký thành công: ' + r) })
$('doLogin').addEventListener('click', ()=>{ const u = sanitizeNick($('loginUser').value.trim()), p = $('loginPass').value; users = usersLoad(); if(!users[u] || users[u].pass !== p){ alert('Sai tài khoản hoặc mật khẩu'); return } setCurrent(users[u]); hideModal('modalLogin'); pushHist(u, { t:Date.now(), type:'login', text:'Đăng nhập', change:0 }); renderUserHistoryFiltered(u) })

/* Topup demo */
$('btnTopup').addEventListener('click', ()=>{ if(!current){ alert('Đăng nhập để nạp (demo)'); return } users = usersLoad(); users[current.username].balance = (users[current.username].balance||0) + 100000; usersSave(users); setCurrent(users[current.username]); pushHist(current.username, { t:Date.now(), type:'nap', text:'Nạp tiền (demo) +100000', change:+100000 }); renderUserHistoryFiltered(current.username) })

/* History filter UI */
function getFilterParams(){ const type = $('filterType').value; const from = $('filterFrom').value; const to = $('filterTo').value; const fromTs = from ? new Date(from + 'T
