
(function(){
const $=id=>document.getElementById(id),H=HK.hash;
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ini=n=>String(n||'?').split(/[\s,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
const P=parentCfg;let view='search',fails=0,lockUntil=0,vmode='dob';
const active=()=>students.filter(s=>s.status!=='Nonaktif');
const cls=s=>classes.find(c=>String(c.id)===String(s.classId));
const dt=d=>{try{return niceDate(d)}catch(e){return d}};
const IC={search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',back:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',print:'<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>',fam:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M16 14.2c.5-.1 1-.2 1.5-.2 2.2 0 4 1.8 4 4"/></svg>',lock:'<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'};

/* ---------- kerangka overlay ---------- */
const root=document.createElement('div');root.id='ppRoot';root.className='pp-root';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Portal orang tua');
root.innerHTML='<div class="pp-top"><button type="button" class="pp-btn ghost" id="ppClose">'+IC.back+'Kembali</button></div><div id="ppBody"></div>';
document.body.appendChild(root);
const body=()=>$('ppBody');
function open(){const p=P();if(!p.on){toast('Portal orang tua sedang dinonaktifkan oleh sekolah.');return}
 root.hidden=false;document.body.style.overflow='hidden';root.scrollTop=0;vSearch()}
function close(){root.hidden=true;document.body.style.overflow='';body().innerHTML=''}
$('ppClose').addEventListener('click',()=>{view==='report'?vSearch():close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});
HK.openParent=open;

/* ---------- 1. pilih kelas dan nama anak (kartu sama dengan halaman masuk) ---------- */
const PP_CSS=`h1{text-wrap:balance}
.field select{width:100%;padding:16px 46px 16px 46px;border:1.5px solid transparent;border-radius:14px;background:var(--field);font:inherit;font-size:.9rem;color:var(--ink);cursor:pointer;-webkit-appearance:none;appearance:none;text-overflow:ellipsis;transition:border-color .25s,box-shadow .25s,background .25s}
.field select.ph{color:#9aa9a4}.field select option{color:#10302a}
.field select:focus{outline:none;background:#fff;border-color:var(--g500);box-shadow:0 0 0 4px rgba(47,145,116,.14)}
.field select:disabled{cursor:not-allowed;opacity:.6}
.field .chev{position:absolute;right:16px;top:50%;width:18px;height:18px;margin-top:-9px;pointer-events:none;fill:none;stroke:var(--muted);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
.acts .btn{padding:0 10px}.acts .s{white-space:nowrap}
.acts .btn svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn.ghost{background:#fff;color:var(--g700);border:1.5px solid #cfe3db;box-shadow:none}
.btn.ghost:hover{background:#f1f8f5;box-shadow:none;border-color:var(--g500)}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.btn:disabled::after{display:none}
.nonote{font-size:.78rem;color:var(--muted);text-align:center;margin:10px 0 0}
.dobl{font-size:.76rem;color:var(--muted);margin:0 4px 8px;line-height:1.5}
.dobrow{display:grid;grid-template-columns:.8fr 1.5fr 1fr;gap:8px}
.dobrow .field select{padding-left:14px;padding-right:30px}.dobrow .chev{right:10px;width:16px;height:16px;margin-top:-8px}
.dobwrap{animation:drop .35s cubic-bezier(.2,.8,.2,1) both}.dobwrap[hidden],.ferr[hidden]{display:none}
.field input.nisin{width:100%;padding:16px 18px 16px 46px;border:1.5px solid transparent;border-radius:14px;background:var(--field);font:inherit;font-size:.9rem;color:var(--ink);transition:border-color .25s,box-shadow .25s,background .25s}
.field input.nisin::placeholder{color:#9aa9a4}
.field input.nisin:focus{outline:none;background:#fff;border-color:var(--g500);box-shadow:0 0 0 4px rgba(47,145,116,.14)}
.vseg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;background:var(--field);border-radius:14px;margin:0 0 12px}
.vseg button{border:0;background:transparent;padding:10px 8px;border-radius:11px;font:inherit;font-size:.82rem;font-weight:700;color:var(--muted);cursor:pointer;transition:background .2s,color .2s,box-shadow .2s}
.vseg button.on{background:#fff;color:var(--g700);box-shadow:0 1px 6px rgba(15,107,84,.16)}
.vseg[hidden],.vb[hidden]{display:none}
@media (max-width:840px){.field select,.field input.nisin{font-size:16px}}
@media (max-width:380px){.acts{grid-template-columns:1fr}}
@media (max-width:840px){.hero{display:none!important}}`;
const IK={idc:'<svg class="ico" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.5-1.6 1.6-2.4 2.5-2.4s2 .8 2.5 2.4M14 10h4M14 13h3"/></svg>',cls:'<svg class="ico" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 kid:'<svg class="ico" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
 chev:'<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
 doc:'<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 14.5l2 2 3.5-4"/></svg>',
 prn:'<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>',
 bk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>'};
function vSearch(){
 view='search';root.classList.remove('pp-over');root.classList.add('pp-login');
 body().innerHTML='<div id="ppLg"></div>';root.scrollTop=0;
 const sr=$('ppLg').attachShadow({mode:'open'});
 sr.appendChild($('loginTpl').content.cloneNode(true));
 const st=document.createElement('style');st.textContent=PP_CSS;sr.appendChild(st);
 const q=id=>sr.getElementById(id),form=sr.querySelector('.form'),back=form.querySelector('.back'),logo=form.querySelector('.logo'),foot=form.querySelector('.foot');
 const swp=q('swipe');swp.firstChild.textContent='Geser untuk mencari anak ';
 foot.textContent='© '+new Date().getFullYear()+' '+(settings.school||'SDN 01 Papahan');
 const kelas=classes.filter(c=>active().some(s=>String(s.classId)===String(c.id))).sort((a,b)=>((a.grade||0)-(b.grade||0))||String(a.name).localeCompare(String(b.name),'id',{numeric:true}));
 const w=document.createElement('div');
 w.innerHTML=`<h1>Selamat Datang, Orang Tua / Wali</h1><p class="lead">Silakan cari capaian hafalan putra putri Anda</p>
 <button type="button" class="rolebk" id="ppExit">${IK.bk}Kembali ke halaman masuk</button>
 <form id="ppForm" novalidate>
  <div class="grp"><div class="field">${IK.cls}<select id="ppCls" class="ph" aria-label="Pilih kelas"><option value="">Pilih kelas</option>${kelas.map(c=>`<option value="${E(c.id)}">Kelas ${E(c.name)}</option>`).join('')}</select>${IK.chev}</div></div>
  <div class="grp"><div class="field">${IK.kid}<select id="ppStu" class="ph" aria-label="Pilih nama anak" disabled><option value="">Pilih nama anak</option></select>${IK.chev}</div></div>
  <div class="grp dobwrap" id="ppVerW" hidden><div class="vseg" id="ppVSeg" role="radiogroup" aria-label="Pilih cara verifikasi" hidden><button type="button" role="radio" data-m="dob">Tanggal lahir</button><button type="button" role="radio" data-m="nis">NIS</button></div><div class="vb" id="ppDobB"><p class="dobl">Untuk memastikan laporan dibuka oleh orang tua atau wali, pilih tanggal lahir anak.</p><div class="dobrow">${['D','M','Y'].map(k=>`<div class="field"><select id="ppDob${k}" class="ph" aria-label="${{D:'Tanggal',M:'Bulan',Y:'Tahun'}[k]} lahir">${HKDOB.opts(k,'')}</select>${IK.chev}</div>`).join('')}</div></div><div class="vb" id="ppNisB" hidden><p class="dobl">Untuk memastikan laporan dibuka oleh orang tua atau wali, masukkan Nomor Induk Siswa (NIS) anak.</p><div class="field">${IK.idc}<input id="ppNis" class="nisin" type="text" inputmode="text" autocomplete="off" aria-label="NIS anak" placeholder="Masukkan NIS anak"></div></div></div>
  <p class="ferr" id="ppErr" role="alert" hidden></p>
  <div class="acts"><button class="btn" id="ppCek" type="submit" disabled><span class="s s-idle">${IK.doc}Cek Laporan</span></button><button class="btn ghost" id="ppCetak" type="button" disabled><span class="s s-idle">${IK.prn}Cetak Laporan</span></button></div>
 </form>`;
 form.innerHTML='';form.append(back,logo);while(w.firstChild)form.appendChild(w.firstChild);form.appendChild(foot);
 const cs=q('ppCls'),ss=q('ppStu'),b1=q('ppCek'),b2=q('ppCetak'),dw=q('ppVerW'),vs=q('ppVSeg'),dB=q('ppDobB'),nB=q('ppNisB'),ni=q('ppNis'),er=q('ppErr'),dd=['D','M','Y'].map(k=>q('ppDob'+k));
 const tone=el=>el.classList.toggle('ph',!el.value);
 const pick=()=>students.find(x=>String(x.id)===ss.value);
 const need=()=>verOn();
 const msg=t=>{er.textContent=t||'';er.hidden=!t};
 const sync=()=>{const s=pick();let ok=!!s;
  if(s&&need()){const av=verMethods(s);
   if(!av.length){ok=false;dw.hidden=true;msg('Data verifikasi anak belum diisi oleh sekolah. Silakan hubungi guru kelas.')}
   else{if(!av.includes(vmode))vmode=av[0];dw.hidden=false;vs.hidden=av.length<2;
    vs.querySelectorAll('button').forEach(b=>{const on=b.dataset.m===vmode;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);b.hidden=!av.includes(b.dataset.m)});
    dB.hidden=vmode!=='dob';nB.hidden=vmode!=='nis';
    ok=vmode==='nis'?!!ni.value.trim():dd.every(x=>x.value);
    if(er.textContent.indexOf('belum diisi')>-1)msg('')}}
  else dw.hidden=true;
  b1.disabled=b2.disabled=!ok};
 cs.addEventListener('change',()=>{tone(cs);msg('');ni.value='';dd.forEach(x=>{x.value='';tone(x)});
  const list=active().filter(s=>String(s.classId)===cs.value).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'));
  ss.innerHTML='<option value="">Pilih nama anak</option>'+list.map(s=>`<option value="${E(s.id)}">${E(s.name)}</option>`).join('');
  ss.disabled=!cs.value;ss.value='';tone(ss);sync();if(cs.value)setTimeout(()=>ss.focus(),30)});
 ss.addEventListener('change',()=>{tone(ss);msg('');ni.value='';dd.forEach(x=>{x.value='';tone(x)});sync();if(need()&&pick()&&verMethods(pick()).length)setTimeout(()=>{(vmode==='nis'?ni:dd[0]).focus()},60)});
 dd.forEach(x=>x.addEventListener('change',()=>{tone(x);msg('');sync()}));
 ni.addEventListener('input',()=>{msg('');sync()});
 vs.addEventListener('click',e=>{const b=e.target.closest('button[data-m]');if(!b)return;vmode=b.dataset.m;msg('');sync();setTimeout(()=>{(vmode==='nis'?ni:dd[0]).focus()},30)});
 const verify=()=>{const s=pick();if(!s)return null;if(!need())return s;
  if(Date.now()<lockUntil){msg('Terlalu banyak percobaan. Coba lagi sebentar lagi.');return null}
  const av=verMethods(s);if(!av.length)return null;
  const md=av.includes(vmode)?vmode:av[0];let ok=false;
  if(md==='nis'){const k=nisNorm(ni.value);ok=!!k&&k===nisNorm(s.nis)}
  else{const v=HKDOB.parse(dd[2].value+'-'+dd[1].value+'-'+dd[0].value);ok=!!v&&v===s.dob}
  if(ok){fails=0;return s}
  fails++;if(fails>=5){lockUntil=Date.now()+60000;fails=0;msg('Terlalu banyak percobaan. Coba lagi dalam 1 menit.')}else msg(md==='nis'?'NIS belum sesuai. Silakan periksa kembali.':'Tanggal lahir belum sesuai. Silakan periksa kembali.');
  dw.classList.remove('shake');void dw.offsetWidth;dw.classList.add('shake');return null};
 q('ppForm').addEventListener('submit',e=>{e.preventDefault();if(b1.disabled)return;const s=verify();if(s)vReport(s)});
 b2.addEventListener('click',()=>{if(b2.disabled)return;const s=verify();if(s)vReport(s,{print:true})});
 q('ppExit').addEventListener('click',close);
 const shell=q('shell'),rm=matchMedia('(prefers-reduced-motion:reduce)').matches,to=x=>shell.scrollTo({left:x*shell.clientWidth,behavior:rm?'auto':'smooth'});
 swp.addEventListener('click',()=>to(1));back.addEventListener('click',close);
 if(matchMedia('(min-width:841px)').matches)setTimeout(()=>cs.focus(),80)}

/* ---------- 3. rapor hafalan anak (format sama dengan menu Cetak Laporan) ---------- */
function vReport(s,opt){
 view='report';root.classList.remove('pp-login','pp-over');root.classList.add('pp-rep');
 RPCACHE=new Map();RPCACHE.set(String(s.id),rpStat(s));
 let html=rpDoc('Rapor Hafalan · '+s.name,rpPageAnak(s),1);
 html=html.replace(/<span>1 laporan[^<]*<\/span>/,'<span>Rapor hafalan anak</span>').replace('</head>','<style>@media screen and (max-width:820px){.rp-sec{overflow-x:auto}.rp-t{min-width:470px}.rp-toolbar{padding:10px 14px}}</style></head>')
  .replace('onclick="window.close()">Tutup','onclick="parent.postMessage(\'hk-pp-back\',\'*\')">Kembali');
 body().innerHTML='<iframe id="ppDoc" class="pp-doc" title="Rapor hafalan '+E(s.name)+'"></iframe>';
 const fr=$('ppDoc');
 if(opt&&opt.print)fr.addEventListener('load',()=>setTimeout(()=>{try{fr.contentWindow.focus();fr.contentWindow.print()}catch(e){}},700),{once:true});
 fr.srcdoc=html}
window.addEventListener('message',e=>{if(e.data==='hk-pp-back'&&!root.hidden)vSearch()});

/* ---------- kartu pengaturan: Portal Orang Tua ---------- */
function card(){let a=document.querySelector('#stGrid [data-key=portal]');if(!a){a=document.createElement('article');a.className='st-card';a.dataset.key='portal';a.dataset.title='Portal Orang Tua';const g=$('stGrid');if(g)g.appendChild(a)}return a}
function renderPortal(){const a=card(),p=P(),ak=active(),nD=ak.filter(x=>x.dob).length,nN=ak.filter(x=>nisNorm(x.nis)).length,both=p.needDob&&p.needNis,none=!p.needDob&&!p.needNis,miss=ak.filter(x=>!verMethods(x).length).length;
 a.innerHTML=`<header class="st-card-head"><span class="st-ico">${IC.fam}</span><div><h3>Portal Orang Tua</h3><p>Orang tua memilih kelas dan nama anak dari halaman masuk, lalu mengecek atau mencetak laporan capaiannya.</p></div></header>
 <label class="pt-sw"><input type="checkbox" id="ptOn" ${p.on?'checked':''}><span><b>Aktifkan portal orang tua</b><small>Jika dimatikan, tombol Orang Tua / Wali di halaman masuk tidak membuka laporan.</small></span></label>
 <label class="pt-sw"><input type="checkbox" id="ptDob" ${p.needDob?'checked':''}><span><b>Verifikasi dengan tanggal lahir</b><small>Orang tua memilih tanggal, bulan, dan tahun lahir anak sebelum laporan dibuka.</small></span></label>
 <label class="pt-sw"><input type="checkbox" id="ptNis" ${p.needNis?'checked':''}><span><b>Verifikasi dengan NIS</b><small>Orang tua mengetik Nomor Induk Siswa (NIS) anak sebelum laporan dibuka.</small></span></label>
 <p class="hint">${none?'<b>Peringatan:</b> kedua verifikasi dimatikan, jadi siapa pun bisa membuka laporan anak hanya dengan memilih kelas dan nama. Aktifkan minimal satu cara.':both?'Kedua cara aktif: orang tua bisa memilih membuka laporan dengan <b>tanggal lahir</b> atau <b>NIS</b>.':p.needDob?'Orang tua hanya akan melihat isian <b>tanggal lahir</b>.':'Orang tua hanya akan melihat isian <b>NIS</b>.'}</p>
 <p class="hint">Tanggal lahir terisi untuk <b>${nD} dari ${ak.length}</b> anak aktif, NIS terisi untuk <b>${nN} dari ${ak.length}</b>.${!none&&miss?` Ada <b>${miss}</b> anak yang belum punya data untuk cara verifikasi yang aktif, sehingga laporannya belum bisa dibuka. Lengkapi di menu Data Anak atau lewat impor Excel.`:''}</p>`;
 $('ptOn').addEventListener('change',save2);$('ptDob').addEventListener('change',save2);$('ptNis').addEventListener('change',save2);
 function save2(){settings.parent={on:$('ptOn').checked,needDob:$('ptDob').checked,needNis:$('ptNis').checked};save();renderPortal();if(window.shRefresh)shRefresh();try{renderStudents()}catch(e){}toast('Pengaturan portal disimpan.')}}
const hub=$('shHub');
if(hub){const d=hub.querySelector('[onclick*="shOpen(\'data\')"]');
 const t='<button type="button" class="sh-tile" onclick="shOpen(\'portal\')"><span class="st-ico">'+IC.fam+'</span><span class="sh-t"><b>Portal Orang Tua</b><small>Orang tua memilih kelas dan nama anak, lalu verifikasi dengan tanggal lahir atau NIS.</small></span><span class="sh-foot"><span class="sh-chip" id="shChip-portal">—</span><span class="sh-go"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></span></button>';
 if(d)d.insertAdjacentHTML('beforebegin',t);else hub.insertAdjacentHTML('beforeend',t)}
const r0=window.shRefresh;window.shRefresh=function(){if(r0)r0();const c=$('shChip-portal');if(c){const p=P();c.textContent=p.on?(p.needDob&&p.needNis?'Aktif · tanggal lahir / NIS':p.needDob?'Aktif · verifikasi tanggal lahir':p.needNis?'Aktif · verifikasi NIS':'Aktif · tanpa verifikasi'):'Nonaktif'}};
const g0=window.go;window.go=function(v,b){g0(v,b);if(v==='pengaturan')renderPortal()};
renderPortal();if(window.shRefresh)shRefresh();
})();
