
/* ===== Cadangan Data: unduh, pulihkan, pengingat ===== */
(function(){
const KEYS=window.HK_BACKUP_KEYS=window.HK_BACKUP_KEYS||['hkClasses','hkStudents','hkSurahs','hkLogs','hkSettings','hkExams','hkLevelMap','hkArchive'];
const LB='hkLastBackup',PRE='hkPreRestore',DIS='hkCdDismiss',DAYS=30;
const rd=k=>{try{return HKLS.getItem(k)}catch(e){return null}};
const wr=(k,v)=>HKLS.setItem(k,v);
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC={
 shield:'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
 down:'<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>',
 up:'<svg viewBox="0 0 24 24"><path d="M12 16V5"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>',
 warn:'<svg viewBox="0 0 24 24"><path d="M12 8v5"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
 clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'};
function snap(){const d={};KEYS.forEach(k=>{const v=rd(k);if(v!=null)d[k]=v});return d}
function parse(d,k){try{return JSON.parse(d[k]||'null')}catch(e){return null}}
function summ(d){const st=parse(d,'hkStudents')||[],cl=parse(d,'hkClasses')||[],lg=parse(d,'hkLogs')||[];
 return{anak:st.filter(x=>x&&!x.alumni).length,alumni:st.filter(x=>x&&x.alumni).length,kelas:cl.length,setoran:lg.length}}
function ago(iso){if(!iso)return null;const t=Date.parse(iso);if(isNaN(t))return null;const d=Math.floor((Date.now()-t)/864e5);return d}
function agoTxt(d){return d<=0?'hari ini':d===1?'kemarin':d+' hari lalu'}
function stamp(){const n=new Date(),p=x=>String(x).padStart(2,'0');return n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate())+'-'+p(n.getHours())+p(n.getMinutes())}
function dl(obj,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function toastS(m){try{toast(m)}catch(e){}}

window.cdBuildBackup=function(){const data=snap();return{app:'Hafalanku',versi:1,dibuat:new Date().toISOString(),ringkasan:summ(data),data}};
window.cdStamp=stamp;
window.cdDownload=function(){
 const o=window.cdBuildBackup(),data=o.data;
 dl(o,'Cadangan-Hafalanku-'+stamp()+'.json');
 try{wr(LB,o.dibuat)}catch(e){}
 toastS('Cadangan data diunduh. Simpan file di tempat yang aman.');cdRender();cdRemind();
};
let pending=null;
function cdFail(m){pending=null;const box=document.getElementById('cdPrev');if(box)box.innerHTML=`<div class="cd-prev err"><h4>File tidak dapat dipakai</h4><div style="font-size:13px;color:#7a2a2a">${E(m)}</div><div class="cd-acts"><button class="btn secondary small" onclick="cdCancel()">Tutup</button></div></div>`}
/* Validasi isi cadangan (dari file lokal atau Google Drive) lalu tampilkan pratinjau pemulihan. */
window.cdPrepare=function(o,srcLabel){
  const fail=cdFail,box=document.getElementById('cdPrev');
  if(!box)return;
  if(!o||o.app!=='Hafalanku'||!o.data||typeof o.data!=='object')return fail('Ini bukan file cadangan Hafalanku.');
  const d={};
  for(const k of KEYS){if(o.data[k]==null)continue;if(typeof o.data[k]!=='string')return fail('Struktur data "'+k+'" tidak valid.');try{JSON.parse(o.data[k])}catch(e){return fail('Data "'+k+'" rusak sehingga tidak bisa dipulihkan.')}d[k]=o.data[k]}
  {const A=parse(d,'hkStudents'),B=parse(d,'hkClasses'),ok=a=>Array.isArray(a)&&a.every(x=>x&&typeof x==='object'&&!Array.isArray(x));if(!ok(A)||!ok(B))return fail('Data anak atau kelas tidak ditemukan atau strukturnya tidak valid.');if(!A.length&&!B.length)return fail('File ini tidak berisi data anak maupun kelas.');for(const k of ['hkLogs','hkExams']){if(d[k]!=null&&!ok(parse(d,k)))return fail('Data "'+k+'" tidak valid.')}}
  pending={d,dibuat:o.dibuat};
  const a=summ(d),b=summ(snap()),tgl=o.dibuat&&!isNaN(Date.parse(o.dibuat))?new Date(o.dibuat).toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'}):'tidak diketahui';
  const row=(l,x,y)=>`<span>${l}</span><b>${x}</b><b style="color:#6b7a74">${y}</b>`;
  box.innerHTML=`<div class="cd-prev"><h4>Cadangan siap dipulihkan</h4><div style="font-size:12.5px;color:#4b5b55">Dibuat ${E(tgl)}${srcLabel?' · '+E(srcLabel):''}</div>
  <div class="cd-cmp"><i class="h"></i><i class="h">Dalam cadangan</i><i class="h">Saat ini</i>${row('Anak aktif',a.anak,b.anak)}${row('Alumni',a.alumni,b.alumni)}${row('Kelas',a.kelas,b.kelas)}${row('Catatan setoran',a.setoran,b.setoran)}</div>
  <div class="cd-note">${IC.warn}<span>Data saat ini akan diganti. Salinannya disimpan otomatis sehingga pemulihan masih bisa dibatalkan.</span></div>
  <div class="cd-acts"><button class="btn" onclick="cdApply()">Pulihkan sekarang</button><button class="btn secondary" onclick="cdCancel()">Batal</button></div></div>`;
  try{box.scrollIntoView({behavior:'smooth',block:'nearest'})}catch(e){}
};
window.cdPick=function(inp){
 const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
 if(f.size>60*1024*1024)return cdFail('Ukuran file terlalu besar untuk berkas cadangan Hafalanku.');
 const r=new FileReader();
 r.onerror=()=>cdFail('File tidak bisa dibaca.');
 r.onload=()=>{
  let o;try{o=JSON.parse(r.result)}catch(e){return cdFail('Isi file bukan format cadangan yang benar.')}
  window.cdPrepare(o,'');
 };
 r.readAsText(f);
};
window.cdCancel=function(){pending=null;const b=document.getElementById('cdPrev');if(b)b.innerHTML=''};
window.cdApply=async function(){
 if(!pending)return;
 if(!await HK.confirm('Ganti seluruh data aplikasi dengan isi file cadangan? Salinan data saat ini disimpan otomatis.','Pulihkan'))return;
 const cur=snap();
 try{wr(PRE,JSON.stringify({dibuat:new Date().toISOString(),data:cur}))}
 catch(e){
  if(!await HK.confirm('Ruang penyimpanan browser tidak cukup untuk salinan pengaman. Unduh data saat ini dulu, lalu lanjutkan?','Unduh dan lanjut'))return;
  dl({app:'Hafalanku',versi:1,dibuat:new Date().toISOString(),ringkasan:summ(cur),data:cur},'Sebelum-Pulihkan-'+stamp()+'.json');
 }
 try{
  KEYS.forEach(k=>{if(pending.d[k]!=null)wr(k,pending.d[k]);else HKLS.removeItem(k)});
 }catch(e){
  try{KEYS.forEach(k=>{if(cur[k]!=null)wr(k,cur[k]);else HKLS.removeItem(k)})}catch(_){}
  toastS('Pemulihan gagal karena penyimpanan penuh. Data semula dikembalikan.');return;
 }
 try{sessionStorage.setItem('hkCdDone','1')}catch(e){}
 HKS.flush().then(function(ok){if(ok)location.reload();else toastS("Pemulihan belum tersimpan ke server. Coba lagi.")});
};
window.cdUndo=async function(){
 const raw=rd(PRE);if(!raw)return;let o;try{o=JSON.parse(raw)}catch(e){return toastS('Salinan pengaman rusak.')}
 if(!await HK.confirm('Kembalikan data seperti sebelum pemulihan terakhir? Perubahan sesudahnya akan hilang.','Kembalikan'))return;
 try{KEYS.forEach(k=>{if(o.data[k]!=null)wr(k,o.data[k]);else HKLS.removeItem(k)});HKLS.removeItem(PRE)}catch(e){return toastS('Gagal mengembalikan data.')}
 HKS.flush().then(function(ok){if(ok)location.reload();else toastS("Pemulihan belum tersimpan ke server. Coba lagi.")});
};
window.cdDropUndo=function(){try{HKLS.removeItem(PRE)}catch(e){}cdRender()};

function cdRender(){
 const el=document.getElementById('cdBox');if(!el)return;
 const s=summ(snap()),d=ago(rd(LB)),warn=d==null||d>DAYS;
 let pre=null;try{pre=JSON.parse(rd(PRE)||'null')}catch(e){}
 const msg=d==null?['Belum pernah dicadangkan','Unduh cadangan pertama sebagai arsip tambahan di luar server.']:d>DAYS?['Cadangan terakhir '+agoTxt(d),'Sudah cukup lama. Disarankan membuat cadangan baru.']:['Data terlindungi','Cadangan terakhir '+agoTxt(d)+'.'];
 el.innerHTML=`<div class="cd-box"><div class="cd-status ${warn?'warn':''}"><span class="cd-ico">${warn?IC.clock:IC.shield}</span><div><b>${E(msg[0])}</b><small>${E(msg[1])}</small></div></div>
 <div class="cd-stats"><div class="cd-stat"><b>${s.anak}</b><span>Anak aktif</span></div><div class="cd-stat"><b>${s.alumni}</b><span>Alumni</span></div><div class="cd-stat"><b>${s.kelas}</b><span>Kelas</span></div><div class="cd-stat"><b>${s.setoran}</b><span>Catatan setoran</span></div></div>
 <div class="cd-acts"><button class="btn" onclick="cdDownload()">${IC.down}Unduh cadangan</button><button class="btn secondary" onclick="document.getElementById('cdFile').click()">${IC.up}Pulihkan dari file</button><input type="file" id="cdFile" accept=".json,application/json" hidden onchange="cdPick(this)"></div>
 <div id="cdDrive"></div>
 <div id="cdPrev"></div>
 ${pre?`<div class="cd-undo"><span>Salinan sebelum pemulihan terakhir tersedia (${E(new Date(pre.dibuat).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}))}).</span><span class="cd-acts"><button class="btn secondary small" onclick="cdUndo()">Batalkan pemulihan</button><button class="btn secondary small" onclick="cdDropUndo()">Hapus salinan</button></span></div>`:''}
 <div class="cd-note">${IC.warn}<span>File cadangan berisi data anak. Simpan di tempat yang aman dan jangan dibagikan sembarangan.</span></div></div>`;
 if(typeof window.hkDriveRender==='function')window.hkDriveRender();
}
window.cdRender=cdRender;
window.cdMarkBackup=function(iso){try{wr(LB,iso)}catch(e){}cdRender();cdRemind()};

function cdRemind(){
 let el=document.getElementById('cdRemind');
 const dh=document.querySelector('#view-dashboard .dhead');if(!dh)return;
 let dis=false;try{dis=sessionStorage.getItem(DIS)==='1'}catch(e){}
 const d=ago(rd(LB)),has=typeof students!=='undefined'&&students&&students.length>0;
 const show=has&&!dis&&(d==null||d>DAYS);
 if(!show){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='cdRemind';el.className='cd-remind';dh.insertAdjacentElement('afterend',el)}
 el.innerHTML=`<span class="cd-ico">${IC.clock}</span><div><b>${d==null?'Data belum pernah dicadangkan':'Cadangan terakhir '+agoTxt(d)}</b>Data tersimpan di server (Cloudflare D1). Tetap buat cadangan berkala sebagai arsip.</div><button class="btn small" onclick="cdDownload()">Cadangkan</button><button class="x" aria-label="Tutup" onclick="try{sessionStorage.setItem('${DIS}','1')}catch(e){}cdRemind()">×</button>`;
}
window.cdRemind=cdRemind;

function mount(){
 const card=document.querySelector('.st-card[data-key="data"]');
 if(card&&!document.getElementById('cdBox')){
  const h=card.querySelector('.st-card-head p');if(h)h.textContent='Cadangan, pemulihan, dan ekspor data hafalan.';
  const hint=card.querySelector('.hint');
  const box=document.createElement('div');box.id='cdBox';
  if(hint){hint.textContent='Data tersimpan di server (Cloudflare D1) dan bisa dibuka dari perangkat mana pun. Memulihkan cadangan akan menggantikan data di server.';hint.insertAdjacentElement('beforebegin',box)}else card.appendChild(box);
  card.classList.add('st-wide');
 }
 cdRender();cdRemind();
}
const _rd=window.renderDashboard;
if(typeof _rd==='function'){window.renderDashboard=function(){const r=_rd.apply(this,arguments);try{cdRemind()}catch(e){}return r}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
setTimeout(mount,600);
try{if(sessionStorage.getItem('hkCdDone')==='1'){sessionStorage.removeItem('hkCdDone');setTimeout(()=>toastS('Data berhasil dipulihkan dari cadangan.'),700)}}catch(e){}
})();

