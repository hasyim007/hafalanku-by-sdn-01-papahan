
(function(){
const $=id=>document.getElementById(id);
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const EYE_ON='<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF='<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 6 10 6a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
const api=(m,p,b)=>HKS.api(m,p,b);
let me=window.__HK_USER||{id:'',name:'Guru',u:'',role:'guru',must:false};
let accounts=[me];
const current=()=>me;
const isAdmin=()=>me.role==='admin';
HK.getAuth=()=>me;
const ini=n=>String(n||'?').split(/[\s,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
const vUser=(u,ex)=>u.length<3||/\s/.test(u)?'Username minimal 3 karakter dan tanpa spasi.':accounts.some(a=>a.id!==ex&&a.u.toLowerCase()===u.toLowerCase())?'Username sudah dipakai akun lain.':'';
const vPw=(p,p2)=>p.length<6?'Kata sandi minimal 6 karakter.':p!==p2?'Ulangi kata sandi dengan sama persis.':'';
async function loadAccounts(){try{const r=await api('GET','/api/users');accounts=r.users;const m=accounts.find(a=>a.id===me.id);if(m)me=Object.assign(me,m)}catch(e){}}
function applyUser(){const c=current(),pr=document.querySelector('.profile');if(!pr)return;
 const av=pr.querySelector('.avatar'),b=pr.querySelector('b'),sm=pr.querySelector('small');
 if(av)av.textContent=ini(c.name);if(b)b.textContent=c.name;if(sm)sm.textContent=c.role==='admin'?'Administrator':'Guru PAI dan BP';
 const gn=document.querySelector('#dashGreet .ph-name');if(gn)gn.textContent=String(c.name||'').trim()||'Guru'}
/* ===== ikon mata di semua input kata sandi ===== */
function eyeify(){document.querySelectorAll('input[type=password]:not([data-eye])').forEach(i=>{
 i.dataset.eye='1';const w=document.createElement('span');w.className='pw-wrap';i.parentNode.insertBefore(w,i);w.appendChild(i);
 const b=document.createElement('button');b.type='button';b.className='pw-eye';b.tabIndex=0;b.setAttribute('aria-label','Tampilkan kata sandi');b.innerHTML=EYE_OFF;
 b.addEventListener('click',()=>{const show=i.type==='password';i.type=show?'text':'password';b.innerHTML=show?EYE_ON:EYE_OFF;b.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');i.focus()});
 w.appendChild(b)})}
let raf=0;new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(eyeify)}).observe(document.body,{childList:true,subtree:true});

/* ===== modal ===== */
function modal(o){const b=document.createElement('div');b.className='ak-back';
 b.innerHTML=`<div class="ak-modal" role="dialog" aria-modal="true"><h3>${o.title}</h3><p class="ak-desc">${o.desc||''}</p><form autocomplete="off">${o.body}<div class="ak-err" role="alert"></div><div class="ak-foot">${o.dismiss?'<button type="button" class="btn light" data-x>Batal</button>':'<button type="button" class="btn light" onclick="HK.logout()">Keluar</button>'}<button class="btn">${o.ok}</button></div></form></div>`;
 document.body.appendChild(b);const f=b.querySelector('form'),er=b.querySelector('.ak-err');
 const fail=m=>{er.textContent=m;er.classList.add('on')};
 f.addEventListener('submit',e=>{e.preventDefault();const g=n=>f.querySelector('[name='+n+']').value;const r=o.submit(g,fail);if(r!==false)b.remove()});
 if(o.dismiss){b.querySelector('[data-x]').addEventListener('click',()=>b.remove());b.addEventListener('mousedown',e=>{if(e.target===b)b.remove()})}
 const first=f.querySelector('input');if(first)first.focus();return b}
const field=(l,n,v,t,ph,ac)=>`<div class="formrow"><label>${l}</label><input name="${n}" type="${t||'text'}" value="${E(v||'')}" placeholder="${E(ph||'')}" autocomplete="${ac||'off'}"></div>`;


function checkMust(){const c=current();if(!c||!c.must||document.querySelector('.ak-back[data-force]'))return;
 const b=modal({title:'Buat kata sandi baru',desc:'Akun Anda baru dibuat atau disetel ulang oleh admin. Lengkapi nama dan buat kata sandi baru untuk melanjutkan.',
  body:field('Nama lengkap beserta gelar','nm',c.name,'text','Contoh: Hasyim Asy’ari, M.Pd.')+field('Username','un',c.u,'text','Minimal 3 karakter, tanpa spasi','username')+field('Kata sandi baru','p1','','password','Minimal 6 karakter','new-password')+field('Ulangi kata sandi baru','p2','','password','','new-password'),
  ok:'Simpan dan Lanjutkan',
  submit(g,fail){const nm=g('nm').trim(),un=g('un').trim(),p1=g('p1'),p2=g('p2');
   if(nm.length<3){fail('Nama lengkap wajib diisi.');return false}
   let m=vUser(un,c.id);if(m){fail(m);return false}
   m=vPw(p1,p2);if(m){fail(m);return false}
   api('PUT','/api/me',{name:nm,username:un,password:p1}).then(r=>{me=Object.assign(me,r.user);return loadAccounts()}).then(()=>{b.remove();applyUser();renderAkun();if(window.shRefresh)shRefresh();toast('Akun berhasil diperbarui. Selamat datang, '+nm+'.')}).catch(e=>fail(e.message));
   return false}});
 b.dataset.force='1'}
/* ===== kartu Akun Login di Pengaturan ===== */
function card(){let a=document.querySelector('#stGrid [data-key=akun]');
 if(!a){a=document.createElement('article');a.className='st-card';a.dataset.key='akun';a.dataset.title='Akun Login';const g=$('stGrid');if(g)g.appendChild(a)}return a}
function renderAkun(){const a=card(),c=current(),adm=isAdmin();
 const rows=accounts.map(x=>`<div class="ak-row"><span class="ak-av">${E(ini(x.name))}</span><div class="ak-info"><b>${E(x.name)}</b><small>@${E(x.u)} · ${x.role==='admin'?'Administrator':'Guru PAI dan BP'}${x.id===c.id?' · akun Anda':''}</small></div>${x.must?'<span class="sh-chip">Wajib ganti sandi</span>':''}<div class="ak-acts"><button type="button" class="btn light small" onclick="HK.akEdit(\''+x.id+'\')">Ubah</button>${x.id!==c.id?'<button type="button" class="btn danger small" onclick="HK.akDel(\''+x.id+'\')">Hapus</button>':''}</div></div>`).join('');
 a.innerHTML=`<header class="st-card-head"><span class="st-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><div><h3>Akun Login</h3><p>Akun yang dipakai untuk masuk ke aplikasi. Setiap guru PAI dapat memiliki akun sendiri.</p></div><button type="button" class="btn light small" onclick="HK.logout()">Keluar dari akun</button></header>
<div class="ak-sec">Akun saya</div>
<form class="st-form" autocomplete="off" onsubmit="HK.akSaveMine(event)"><div class="formgrid">
<div class="formrow"><label>Nama lengkap beserta gelar</label><input id="akMyName" value="${E(c.name)}"></div>
<div class="formrow"><label>Username</label><input id="akMyUser" value="${E(c.u)}" autocomplete="username" autocapitalize="none"></div>
<div class="formrow"><label>Kata sandi saat ini *</label><input id="akMyOld" type="password" autocomplete="current-password" required></div>
<div class="formrow"><label>Kata sandi baru</label><input id="akMyNew" type="password" autocomplete="new-password" placeholder="Kosongkan jika tidak diganti"></div>
<div class="formrow"><label>Ulangi kata sandi baru</label><input id="akMyNew2" type="password" autocomplete="new-password"></div>
</div><div class="st-actions"><button class="btn">Simpan Akun</button></div></form>
${adm?`<div class="st-sub" style="margin-top:22px">Akun guru</div>
<div class="ak-list">${rows}</div>
<div class="ak-sec">Tambah akun guru</div>
<form class="st-form" autocomplete="off" onsubmit="HK.akAdd(event)"><div class="formgrid">
<div class="formrow"><label>Nama lengkap beserta gelar</label><input id="akName" placeholder="Contoh: Siti Aminah, S.Pd.I."></div>
<div class="formrow"><label>Username</label><input id="akUser" placeholder="Minimal 3 karakter, tanpa spasi" autocapitalize="none"></div>
<div class="formrow"><label>Kata sandi awal</label><input id="akPass" type="password" autocomplete="new-password" placeholder="Minimal 6 karakter"></div>
</div><p class="hint">Guru diminta membuat kata sandi sendiri saat pertama kali masuk.</p><div class="st-actions"><button class="btn">Tambah Akun</button></div></form>`:''}
<p class="hint" style="margin-top:14px">Akun tersimpan di server dan bisa dipakai dari perangkat mana pun. Kata sandi disimpan dalam bentuk hash, bukan teks asli.</p>`;
 eyeify()}

HK.akSaveMine=function(e){e.preventDefault();const c=current(),nm=$('akMyName').value.trim(),un=$('akMyUser').value.trim(),old=$('akMyOld').value,n1=$('akMyNew').value,n2=$('akMyNew2').value;
 if(!old){toast('Isi kata sandi saat ini.');return}
 if(nm.length<3){toast('Nama lengkap wajib diisi.');return}
 let m=vUser(un,c.id);if(m){toast(m);return}
 if(n1||n2){m=vPw(n1,n2);if(m){toast(m);return}}
 api('PUT','/api/me',{name:nm,username:un,current:old,password:n1}).then(r=>{me=Object.assign(me,r.user);return loadAccounts()}).then(()=>{applyUser();renderAkun();if(window.shRefresh)shRefresh();toast('Akun berhasil diperbarui.')}).catch(err=>toast(err.message))};
HK.akAdd=function(e){e.preventDefault();const nm=$('akName').value.trim(),un=$('akUser').value.trim(),pw=$('akPass').value;
 if(nm.length<3){toast('Nama lengkap wajib diisi.');return}
 let m=vUser(un,'');if(m){toast(m);return}
 m=vPw(pw,pw);if(m){toast(m);return}
 api('POST','/api/users',{name:nm,username:un,password:pw}).then(()=>loadAccounts()).then(()=>{renderAkun();if(window.shRefresh)shRefresh();toast('Akun '+nm+' berhasil ditambahkan.')}).catch(err=>toast(err.message))};
HK.akEdit=function(id){const x=accounts.find(a=>a.id===id);if(!x)return;
 modal({title:'Ubah akun',desc:id===current().id?'Mengubah akun Anda sendiri.':'Isi kata sandi baru hanya jika ingin menyetel ulang. Guru akan diminta membuat kata sandi sendiri saat masuk berikutnya.',dismiss:true,ok:'Simpan',
  body:field('Nama lengkap beserta gelar','nm',x.name)+field('Username','un',x.u,'text','','off')+field('Kata sandi baru (opsional)','pw','','password','Kosongkan jika tidak diganti','new-password'),
  submit(g,fail){const nm=g('nm').trim(),un=g('un').trim(),pw=g('pw');
   if(nm.length<3){fail('Nama lengkap wajib diisi.');return false}
   let m=vUser(un,x.id);if(m){fail(m);return false}
   if(pw){m=vPw(pw,pw);if(m){fail(m);return false}}
   api('PUT','/api/users/'+encodeURIComponent(id),{name:nm,username:un,password:pw}).then(()=>loadAccounts()).then(()=>{document.querySelectorAll('.ak-back').forEach(z=>z.remove());applyUser();renderAkun();if(window.shRefresh)shRefresh();toast('Akun berhasil diperbarui.')}).catch(e=>fail(e.message));
   return false}})};
HK.akDel=async function(id){const x=accounts.find(a=>a.id===id);if(!x||id===current().id)return;
 if(!await HK.confirm('Hapus akun '+x.name+' (@'+x.u+')? Akun ini tidak bisa lagi dipakai untuk masuk.','Hapus'))return;
 try{await api('DELETE','/api/users/'+encodeURIComponent(id));await loadAccounts();renderAkun();if(window.shRefresh)shRefresh();toast('Akun dihapus.')}catch(e){toast(e.message)}};
const g0=window.go;window.go=function(v,b){g0(v,b);if(v==='pengaturan')renderAkun()};
const r0=window.shRefresh;window.shRefresh=function(){if(r0)r0();const c=$('shChip-akun');if(c)c.textContent=accounts.length+' akun'};
renderAkun();eyeify();applyUser();
loadAccounts().then(()=>{applyUser();renderAkun();if(window.shRefresh)shRefresh();checkMust()});
})();
