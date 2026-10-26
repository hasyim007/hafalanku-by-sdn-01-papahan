/* ===== Tahun ajaran: naik kelas dan kelulusan ===== */
(function(){
const AK='hkArchive',UK='hkUndo',CONFIRM='NAIK KELAS';
const rd=(k,d)=>{try{return JSON.parse(HKLS.getItem(k)||'null')||d}catch(e){return d}};
const gradeOf=c=>Number(c&&c.grade)||parseInt(c&&c.name)||0;
const letterOf=c=>String((c&&c.name)||'').replace(/^\s*\d+\s*/,'').trim().toUpperCase();
const byName=(a,b)=>String(a.name).localeCompare(String(b.name),'id');
const maxGrade=()=>Math.max(0,...classes.map(gradeOf));
const nextYear=y=>{const m=String(y||'').match(/(\d{4})\s*\/\s*(\d{4})/);return m?(+m[1]+1)+'/'+(+m[2]+1):''};
const activeList=()=>students.filter(s=>s.status!=='Nonaktif'&&classes.some(c=>c.id==s.classId));
const targetsFor=c=>classes.filter(x=>gradeOf(x)===gradeOf(c)+1).sort(byName);
const sortedClasses=()=>classes.slice().sort((a,b)=>gradeOf(a)-gradeOf(b)||byName(a,b));
const LABEL={naik:'Naik kelas',stay:'Tinggal kelas',grad:'Lulus',out:'Pindah/keluar'};
let TA=null;

function defaultPlan(){const plan=new Map();activeList().forEach(s=>{const c=classes.find(x=>x.id==s.classId);let p;if(gradeOf(c)>=maxGrade())p={a:'grad'};else{const t=targetsFor(c),same=t.find(x=>letterOf(x)===letterOf(c))||t[0];p=same?{a:'naik',to:same.id}:{a:'stay'}}plan.set(s.id,p)});return plan}

window.taOpen=function(){
  if(!classes.length||!students.length){toast('Belum ada kelas atau anak yang bisa diproses.');return}
  TA={step:1,mode:'tetap',newYear:nextYear(settings.year)||'',plan:null};taRender();
};
window.taClose=function(){const b=document.getElementById('taBack');if(b)b.remove();document.body.style.overflow='';TA=null};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&TA&&TA.step!==4)taClose()});
window.taSetMode=function(m){TA.mode=m;taRender()};
window.taYear=function(v){TA.newYear=v};
window.taNext=function(){
  if(TA.step===1){
    const y=String(TA.newYear||'').trim();
    if(!/^\d{4}\/\d{4}$/.test(y)){toast('Isi tahun ajaran baru dengan format 2027/2028.');return}
    if(y===String(settings.year||'').trim()){toast('Tahun ajaran baru harus berbeda dari tahun ajaran sekarang.');return}
    TA.newYear=y;TA.plan=defaultPlan();if(!TA.plan.size){toast('Tidak ada anak aktif yang bisa diproses.');return}
  }
  TA.step++;taRender();
};
window.taPrev=function(){TA.step--;taRender()};
window.taSet=function(id,v){let p;if(v.startsWith('c:'))p={a:'naik',to:+v.slice(2)};else p={a:v};TA.plan.set(id,p);taSums()};
function sumText(c){const list=activeList().filter(s=>s.classId==c.id),m={},k={stay:0,grad:0,out:0};list.forEach(s=>{const p=TA.plan.get(s.id);if(!p)return;if(p.a==='naik'){const n=className(p.to);m[n]=(m[n]||0)+1}else k[p.a]++});const parts=Object.entries(m).map(([n,v])=>n+' '+v);if(k.grad)parts.push('lulus '+k.grad);if(k.stay)parts.push('tinggal '+k.stay);if(k.out)parts.push('keluar '+k.out);return list.length+' anak → '+parts.join(' · ')}
function taSums(){sortedClasses().forEach(c=>{const e=document.getElementById('taSum'+c.id);if(e)e.textContent=sumText(c)})}
function syncSelects(){document.querySelectorAll('.ta-sel').forEach(sel=>{const p=TA.plan.get(+sel.dataset.sid);if(p)sel.value=p.a==='naik'?'c:'+p.to:p.a});taSums()}
window.taDistribute=function(g,how){
  const src=activeList().filter(s=>gradeOf(classes.find(c=>c.id==s.classId))===g&&(TA.plan.get(s.id)||{}).a==='naik');
  const t=classes.filter(c=>gradeOf(c)===g+1).sort(byName);if(!t.length||!src.length)return;
  if(how==='same'){src.forEach(s=>{const c=classes.find(x=>x.id==s.classId),m=t.find(x=>letterOf(x)===letterOf(c))||t[0];TA.plan.set(s.id,{a:'naik',to:m.id})})}
  else{let arr=src.slice();if(how==='rand'){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}}else arr.sort(byName);arr.forEach((s,i)=>TA.plan.set(s.id,{a:'naik',to:t[i%t.length].id}))}
  syncSelects();
};
window.taBackup=function(){
  const keys=['hkClasses','hkStudents','hkSurahs','hkLogs','hkSettings','hkExams','hkLevelMap',AK],o={app:'Hafalanku',dibuat:new Date().toISOString(),data:{}};
  keys.forEach(k=>{const v=HKLS.getItem(k);if(v!=null)o.data[k]=v});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='hafalanku-cadangan-'+today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Cadangan data diunduh.');
};
function counts(){const r={naik:0,stay:0,grad:0,out:0},size={};TA.plan.forEach((p,id)=>{r[p.a]++;const s=students.find(x=>x.id===id);const dest=p.a==='naik'?p.to:(p.a==='stay'?s.classId:null);if(dest!=null)size[dest]=(size[dest]||0)+1});return{r,size}}
function groupsHtml(){
  return sortedClasses().map(c=>{const list=activeList().filter(s=>s.classId==c.id).sort(byName);if(!list.length)return'';
    const last=gradeOf(c)>=maxGrade(),tg=targetsFor(c);
    const opts=(last?[['grad','Lulus']]:tg.map(t=>['c:'+t.id,'Naik ke '+t.name])).concat([['stay','Tinggal kelas (tetap di '+c.name+')'],['out','Pindah / keluar sekolah']]);
    const rows=list.map(s=>{const p=TA.plan.get(s.id)||{a:'stay'},cur=p.a==='naik'?'c:'+p.to:p.a;return `<div class="ta-row"><span>${esc(s.name)}</span><select class="ta-sel" data-sid="${s.id}" onchange="taSet(${s.id},this.value)">${opts.map(([v,l])=>`<option value="${v}"${v===cur?' selected':''}>${esc(l)}</option>`).join('')}</select></div>`}).join('');
    return `<details class="ta-grp"${TA.mode==='pilih'?' open':''}><summary><b>Kelas ${esc(c.name)}</b><span class="ta-sum" id="taSum${c.id}">${esc(sumText(c))}</span></summary>${rows}</details>`}).join('');
}
function taRender(){
  let bd=document.getElementById('taBack');
  if(!bd){bd=document.createElement('div');bd.id='taBack';bd.className='ta-back';document.body.appendChild(bd);document.body.style.overflow='hidden'}
  const old=settings.year||'—',st=TA.step;let body='',foot='',title='Naik Kelas dan Tahun Ajaran Baru',sub='Proses ini dijalankan sekali setahun. Tidak ada yang berubah sebelum Anda mengonfirmasi di langkah terakhir.';
  if(st===1){
    const act=activeList(),mg=maxGrade(),grad=act.filter(s=>gradeOf(classes.find(c=>c.id==s.classId))>=mg).length,orphan=students.filter(s=>s.status!=='Nonaktif').length-act.length;
    body=`<div class="ta-field"><label>Tahun ajaran sekarang</label><b style="font-size:15px">${esc(old)}</b></div><div class="ta-field"><label for="taYearIn">Tahun ajaran baru</label><input id="taYearIn" value="${esc(TA.newYear)}" oninput="taYear(this.value)" placeholder="2027/2028" inputmode="numeric"></div>
    <div class="ta-field" style="margin-bottom:6px"><label>Rombel (A/B/C) anak saat naik kelas</label></div>
    <div class="ta-modes"><button type="button" class="ta-mode ${TA.mode==='tetap'?'on':''}" onclick="taSetMode('tetap')"><b>Rombel tetap<em>Cepat</em></b><small>1A menjadi 2A, 1B menjadi 2B, dan seterusnya. Anda tinggal mengecualikan anak yang tinggal kelas atau pindah.</small></button><button type="button" class="ta-mode ${TA.mode==='pilih'?'on':''}" onclick="taSetMode('pilih')"><b>Pilih rombel tujuan</b><small>Rombel dibagi ulang. Tersedia tombol bagi rata (urut abjad), acak merata, dan pilihan per anak.</small></button></div>
    <div class="ta-facts"><span><b>${act.length}</b>anak aktif diproses</span><span><b>${grad}</b>kelas ${mg} akan lulus</span><span><b>${act.length-grad}</b>naik atau tetap</span>${orphan>0?`<span><b>${orphan}</b>tanpa kelas (dilewati)</span>`:''}</div>
    <div class="ta-box"><h4>Yang terjadi pada data</h4><small style="line-height:1.7;color:#586d66;display:block">Level dan capaian hafalan tetap ikut anak, karena level ditentukan Ujian Kenaikan Level, bukan kelas. Anak yang lulus tidak dihapus: mereka disimpan sebagai alumni. Ringkasan tahun ${esc(old)} diarsipkan otomatis, dan tombol batalkan tersedia setelah proses.</small></div>
    <div class="ta-box"><h4>Cadangan (disarankan)</h4><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn secondary small" onclick="taBackup()">Unduh cadangan data (JSON)</button><button type="button" class="btn light small" onclick="exportExcel()">Ekspor data hafalan (Excel)</button></div></div>`;
    foot=`<button type="button" class="btn light" onclick="taClose()">Batal</button><button type="button" class="btn" onclick="taNext()">Lanjut: tentukan tujuan anak →</button>`;
  }
  if(st===2){
    title='Tentukan Tujuan Setiap Anak';sub=TA.mode==='tetap'?'Semua anak sudah diatur naik ke rombel yang sama. Buka kelas untuk mengecualikan anak tertentu.':'Atur rombel tujuan per anak, atau pakai tombol bagi rata dan acak untuk tiap tingkat.';
    let tools='';
    if(TA.mode==='pilih'){const gs=[...new Set(classes.map(gradeOf))].filter(g=>g&&g<maxGrade()&&classes.filter(c=>gradeOf(c)===g+1).length>1&&activeList().some(s=>gradeOf(classes.find(c=>c.id==s.classId))===g)).sort((a,b)=>a-b);
      tools=`<div class="ta-tools">${gs.map(g=>`<div class="ta-tool"><b>Kelas ${g} → ${g+1}</b><button type="button" class="btn light small" onclick="taDistribute(${g},'abc')">Bagi rata (A–Z)</button><button type="button" class="btn light small" onclick="taDistribute(${g},'rand')">Acak merata</button><button type="button" class="btn light small" onclick="taDistribute(${g},'same')">Samakan rombel</button></div>`).join('')}</div>`}
    const miss=sortedClasses().filter(c=>gradeOf(c)<maxGrade()&&activeList().some(s=>s.classId==c.id)&&!targetsFor(c).length);
    const warn=miss.length?`<div class="ta-warn">Kelas tujuan belum ada untuk: ${miss.map(c=>esc(c.name)).join(', ')}. Anak di kelas itu diatur tinggal kelas. Tambahkan kelas tingkat berikutnya lebih dulu bila perlu.</div>`:'';
    body=tools+warn+groupsHtml();
    foot=`<button type="button" class="btn light" onclick="taPrev()">← Kembali</button><button type="button" class="btn" onclick="taNext()">Lanjut: konfirmasi →</button>`;
  }
  if(st===3){
    title='Konfirmasi';sub='Periksa ringkasan di bawah. Proses ini mengubah kelas dan status anak.';
    const {r,size}=counts();
    body=`<div class="ta-facts"><span><b>${r.naik}</b>naik kelas</span><span><b>${r.stay}</b>tinggal kelas</span><span><b>${r.grad}</b>lulus</span><span><b>${r.out}</b>pindah/keluar</span></div>
    <div class="ta-field" style="margin-bottom:4px"><label>Jumlah anak per kelas setelah proses</label></div><div class="ta-sizes">${sortedClasses().map(c=>`<div>${esc(c.name)}<b>${size[c.id]||0}</b></div>`).join('')}</div>
    <div class="ta-box"><h4>Tahun ajaran berganti ${esc(old)} → ${esc(TA.newYear)}</h4><small style="color:#586d66;line-height:1.7;display:block">Kelas 1 baru dimulai kosong, anak baru ditambahkan setelah ini. Footer formulir dan kop laporan mengikuti tahun ajaran baru.</small></div>
    <div class="ta-field" style="margin-top:14px"><label for="taType">Ketik <b>${CONFIRM}</b> untuk melanjutkan</label><input id="taType" autocomplete="off" oninput="document.getElementById('taGo').disabled=this.value.trim().toUpperCase()!=='${CONFIRM}'" placeholder="${CONFIRM}"></div>`;
    foot=`<button type="button" class="btn light" onclick="taPrev()">← Kembali</button><button type="button" class="btn" id="taGo" disabled onclick="taCommit()">Proses naik kelas</button>`;
  }
  if(st===4){
    const R=TA.result;title='Selesai';sub='';
    const g1=classes.find(c=>gradeOf(c)===1);
    body=`<div class="ta-done"><div class="ok">✓</div><h3 style="margin:0 0 6px">Tahun ajaran ${esc(R.to)} dimulai</h3><p style="color:#6d7f78;font-size:13px;margin:0 0 16px">${R.naik} naik kelas · ${R.stay} tinggal kelas · ${R.grad} lulus · ${R.out} pindah/keluar</p></div>
    <div class="ta-box"><h4>Langkah berikutnya untuk kelas 1 baru</h4><div style="display:flex;gap:8px;flex-wrap:wrap">${g1?`<button type="button" class="btn" onclick="taClose();go('siswa');openBulk(${g1.id})">Tambah anak kelas 1</button>`:''}<button type="button" class="btn secondary" onclick="taClose();go('scan')">Cetak formulir capaian awal</button></div><small style="display:block;margin-top:10px;color:#6d7f78;line-height:1.6">Anak baru mungkin sudah hafal beberapa surat. Cetak formulir awal, isi, lalu scan agar level penempatannya tepat. Guru PAI dan BP per kelas di Profil Pengelola sebaiknya diperiksa juga.</small></div>`;
    foot=`<span></span><button type="button" class="btn" onclick="taClose()">Tutup</button>`;
  }
  bd.innerHTML=`<div class="ta-modal" role="dialog" aria-modal="true"><header class="ta-head"><div><h3>${title}</h3>${sub?`<p>${sub}</p>`:''}</div>${st!==4?`<button type="button" class="ta-x" onclick="taClose()" aria-label="Tutup">×</button>`:''}</header>${st!==4?`<div class="ta-steps">${['Persiapan','Tujuan anak','Konfirmasi'].map((t,i)=>`<span class="${st>=i+1?'on':''}">${i+1}. ${t}</span>`).join('')}</div>`:''}<div class="ta-body">${body}</div><footer class="ta-foot">${foot}</footer></div>`;
  const b=bd.querySelector('.ta-body');if(b)b.scrollTop=0;
}
window.taCommit=async function(){
  if(!TA||TA.step!==3)return;
  const oldY=settings.year||'',newY=TA.newYear,plan=TA.plan,tmpName=s=>className(s.classId);
  const snap={date:today(),from:oldY,to:newY,students:JSON.parse(JSON.stringify(students)),classes:JSON.parse(JSON.stringify(classes))};
  const rows=[],tot={naik:0,stay:0,grad:0,out:0};
  plan.forEach((p,id)=>{const s=students.find(x=>x.id===id);if(!s)return;let lv='',d='',t='';try{lv=defaultHafalanLevel(s);const u=ujState(s);d=u.done;t=u.total}catch(e){}rows.push([s.name,className(s.classId),lv,d,t,LABEL[p.a]])});
  const entryId=Date.now();snap.arch=entryId;
  try{HKLS.setItem(UK,JSON.stringify(snap))}catch(e){if(!await HK.confirm('Ruang penyimpanan browser tidak cukup untuk menyimpan cadangan pembatalan. Lanjutkan tanpa tombol batalkan?','Lanjutkan'))return;try{HKLS.removeItem(UK)}catch(_){}}
  const byId=new Map(students.map(s=>[s.id,s]));
  plan.forEach((p,id)=>{const s=byId.get(id);if(!s)return;const c=classes.find(x=>x.id==s.classId),cn=c?c.name:'';
    s.hafalanLevel=s.hafalanLevel||defaultHafalanLevel(s);
    (s.classHistory=s.classHistory||[]).push({tahun:oldY,kelas:cn,hasil:LABEL[p.a]});
    if(p.a==='naik')s.classId=p.to;
    else if(p.a==='grad'){s.status='Nonaktif';s.alumni={tahun:oldY,kelas:cn,date:today()};s.classId=null}
    else if(p.a==='out'){s.status='Nonaktif';s.keluar={tahun:oldY,kelas:cn,date:today()}}
    tot[p.a]++});
  classes.forEach(c=>{c.year=newY;if(oldY&&c.desc)c.desc=String(c.desc).split(oldY).join(newY)});
  settings.year=newY;
  const arch=rd(AK,[]);arch.push({id:entryId,year:oldY,date:today(),total:rows.length,grad:tot.grad,rows});
  try{HKLS.setItem(AK,JSON.stringify(arch))}catch(e){toast('Arsip tahun lama tidak muat di penyimpanan. Data tetap aman.')}
  try{save()}catch(e){toast('Penyimpanan hampir penuh, tetapi proses selesai.')}
  refresh();const yi=document.getElementById('settingYear');if(yi)yi.value=newY;
  TA.result={to:newY,...tot};TA.step=4;taRender();
};
window.taUndo=async function(){
  const u=rd(UK,null);if(!u)return;
  if(!await HK.confirm('Batalkan naik kelas ke tahun ajaran '+u.to+'? Data anak dan kelas dikembalikan seperti sebelum proses. Setoran atau perubahan yang dicatat sesudah naik kelas akan hilang.','Batalkan naik kelas'))return;
  students=u.students;classes=u.classes;settings.year=u.from;
  const arch=rd(AK,[]).filter(a=>a.id!==u.arch);try{HKLS.setItem(AK,JSON.stringify(arch));HKLS.removeItem(UK)}catch(e){}
  save();refresh();const yi=document.getElementById('settingYear');if(yi)yi.value=settings.year;taRenderCard();toast('Naik kelas dibatalkan. Data dikembalikan.');
};
window.taDownload=function(id){
  const a=rd(AK,[]).find(x=>x.id===id);if(!a)return;
  const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const csv='\ufeff'+['Nama','Kelas','Level','Surat hafal','Total surat level','Hasil'].map(q).join(',')+'\n'+a.rows.map(r=>r.map(q).join(',')).join('\n');
  const el=document.createElement('a');el.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));el.download='arsip-hafalanku-'+String(a.year).replace('/','-')+'.csv';document.body.appendChild(el);el.click();setTimeout(()=>{URL.revokeObjectURL(el.href);el.remove()},500);
};
window.taRenderCard=function(){
  const box=document.getElementById('taBody');if(!box)return;
  const arch=rd(AK,[]).slice().reverse(),u=rd(UK,null),act=students.filter(s=>s.status!=='Nonaktif').length;
  box.innerHTML=`<div class="ta-now"><div><small>Tahun ajaran berjalan</small><b>${esc(settings.year||'—')}</b></div><div><small>Anak aktif</small><b>${act}</b></div></div>`
   +(u?`<div class="ta-box warn"><h4>Naik kelas terakhir: ${esc(u.from)} → ${esc(u.to)} (${esc(niceDate(u.date))})</h4><small style="display:block;color:#7a5a14;line-height:1.6;margin-bottom:10px">Salah proses? Anda bisa membatalkannya. Setoran yang dicatat sesudah naik kelas ikut hilang, jadi lakukan segera.</small><button type="button" class="btn light small" onclick="taUndo()">Batalkan naik kelas terakhir</button></div>`:'')
   +`<div class="ta-box"><h4>Arsip tahun ajaran</h4>${arch.length?arch.map(a=>`<div class="ta-arc"><div><b>${esc(a.year||'—')}</b><small>Diarsipkan ${esc(niceDate(a.date))} · ${a.total} anak · ${a.grad} lulus</small></div><button type="button" class="btn light small" onclick="taDownload(${a.id})">Unduh CSV</button></div>`).join(''):'<small style="color:#8b9d98">Belum ada arsip. Arsip dibuat otomatis saat naik kelas dijalankan.</small>'}</div>`
   +`<div class="ta-box" id="taLogBox"><h4>Arsip setoran lama</h4><small style="display:block;color:#586d66;line-height:1.7;margin-bottom:10px">Setoran lama dipindah ke arsip supaya aplikasi tetap ringan dan cepat dibuka. Data tidak dihapus, hanya tidak ikut dimuat lagi. Capaian hafalan anak tidak berubah. Riwayat setoran, grafik perkembangan, dan rekap hanya menghitung setoran yang belum diarsipkan, jadi unduh arsipnya lebih dulu bila perlu.</small><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><label for="taLogCut" style="font-size:13px">Arsipkan setoran sebelum</label><select id="taLogCut" onchange="taLogInfo()"><option value="90">3 bulan terakhir</option><option value="180" selected>6 bulan terakhir</option><option value="year">awal tahun ajaran berjalan (1 Juli)</option></select></div><div class="ta-warn" style="margin-bottom:10px;font-size:12.5px;line-height:1.6"><b>Catatan:</b> bila angka total dan grafik perkembangan penting untuk rapor atau laporan akhir semester, arsipkan setelah laporan dicetak. Pakai batas 6 bulan atau awal tahun ajaran, jangan 3 bulan, supaya satu semester penuh masih lengkap.</div><div id="taLogInfo" style="font-size:13px;color:#586d66;margin-bottom:10px">Memeriksa…</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn small" id="taLogGo" disabled onclick="taLogMove()">Arsipkan sekarang</button><button type="button" class="btn light small" id="taLogDl" onclick="taLogDownload()">Unduh arsip setoran (CSV)</button></div></div>`;
  taLogInfo();
};

/* ===== Arsip setoran lama (dipindah ke tabel progress_archive di server) ===== */
function logCut(){
  const v=(document.getElementById('taLogCut')||{}).value,d=new Date();
  if(v==='year'){const y=d.getMonth()>=6?d.getFullYear():d.getFullYear()-1;return y+'-07-01'}
  d.setDate(d.getDate()-(+v||180));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
let logBusy=false;const LOG_CAP=9000;/* maks. catatan dipindah sekali tekan: tiap catatan memakai ±4 baris tulis D1 (plan gratis 100.000/hari) */
window.taLogInfo=async function(){
  const box=document.getElementById('taLogInfo'),go=document.getElementById('taLogGo');if(!box)return;
  go.disabled=true;box.textContent='Memeriksa…';
  try{
    const cut=logCut(),r=await HKS.api('GET','/api/archive/info?before='+cut);
    box.innerHTML='Batas: setoran sebelum <b>'+esc(niceDate(cut))+'</b>. Aktif sekarang <b>'+r.active+'</b> catatan, sudah diarsipkan <b>'+r.archived+'</b>. '+(r.movable?'<b>'+r.movable+'</b> catatan akan dipindah.'+(r.movable>LOG_CAP?' Dipindah bertahap, maksimal '+LOG_CAP+' catatan sekali tekan. Ulangi pada hari berikutnya sampai selesai.':''):'Belum ada yang perlu dipindah.');
    go.disabled=!r.movable;
  }catch(e){box.textContent=e.message||'Gagal memeriksa data.'}
};
window.taLogMove=async function(){
  if(logBusy)return;
  const cut=logCut();
  if(!await HK.confirm('Pindahkan setoran sebelum '+niceDate(cut)+' ke arsip? Setoran itu tidak lagi tampil di riwayat, grafik, dan rekap aplikasi. Data tetap tersimpan di server dan bisa diunduh sebagai CSV.','Arsipkan'))return;
  logBusy=true;const box=document.getElementById('taLogInfo'),go=document.getElementById('taLogGo');go.disabled=true;
  try{
    box.textContent='Menyimpan perubahan yang tertunda…';
    if(!await HKS.flush())throw new Error('Ada perubahan yang belum tersimpan. Coba lagi setelah status simpan hijau.');
    let total=0,left=1;
    while(left>0&&total<LOG_CAP){
      const r=await HKS.api('POST','/api/archive/move',{before:cut});
      total+=r.moved;left=r.left;box.textContent='Memindahkan… '+total+' catatan';
      if(!r.moved)break;
    }
    box.textContent=left>0?'Sesi ini selesai: '+total+' catatan dipindah, sisa '+left+'. Ulangi besok supaya batas tulis harian Cloudflare tetap tersedia untuk input setoran. Memuat ulang…':'Selesai: '+total+' catatan dipindah. Memuat ulang…';
    setTimeout(()=>location.reload(),left>0?4500:1200);
  }catch(e){
    logBusy=false;box.textContent=(e.message||'Gagal memindahkan.')+' Yang sudah dipindah tetap aman. Tekan tombol lagi untuk melanjutkan (bila batas harian Cloudflare tercapai, lanjutkan besok).';go.disabled=false;
  }
};
window.taLogDownload=async function(){
  const btn=document.getElementById('taLogDl');if(logBusy)return;logBusy=true;btn.disabled=true;
  try{
    const rows=[];let after='';
    do{const r=await HKS.api('GET','/api/archive/read?after='+encodeURIComponent(after));r.rows.forEach(x=>rows.push(x));after=r.next;btn.textContent='Mengunduh… '+rows.length}while(after);
    if(!rows.length){toast('Arsip setoran masih kosong.');return}
    rows.sort((a,b)=>String(a.date).localeCompare(String(b.date))||(Number(a.id)-Number(b.id)));
    const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
    const csv='\ufeff'+['Tanggal','Nama Anak','Surat','Dari Ayat','Sampai Ayat','Hasil','Catatan'].map(q).join(',')+'\n'+rows.map(l=>[l.date,l.studentName,l.surah,l.from,l.to,l.status,l.note||''].map(q).join(',')).join('\n');
    const el=document.createElement('a');el.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));el.download='arsip-setoran-hafalanku-'+today()+'.csv';document.body.appendChild(el);el.click();setTimeout(()=>{URL.revokeObjectURL(el.href);el.remove()},500);
    toast('Arsip setoran diunduh ('+rows.length+' catatan).');
  }catch(e){toast(e.message||'Gagal mengunduh arsip.')}
  finally{logBusy=false;btn.disabled=false;btn.textContent='Unduh arsip setoran (CSV)'}
};
const _so=window.shOpen;window.shOpen=function(k){_so(k);if(k==='tahun')taRenderCard()};
const _sr=window.shRefresh;window.shRefresh=function(){_sr&&_sr();const e=document.getElementById('shChip-tahun');if(e)e.textContent=settings.year||'—'};
/* tampilan alumni di Data Anak */
const _rs=renderStudents;renderStudents=function(){_rs();try{document.querySelectorAll('#dsRows tr[onclick]').forEach(tr=>{const m=(tr.getAttribute('onclick')||'').match(/dsEdit\((\d+)\)/);if(!m)return;const s=students.find(x=>x.id===+m[1]);if(!s||!s.alumni)return;const c=tr.querySelector('.ds-class'),p=tr.querySelector('.ds-c-status .pill');if(c)c.textContent='Alumni '+(s.alumni.kelas||'');if(p)p.textContent='Lulus '+(s.alumni.tahun||'')})}catch(e){}};
renderStudents();
})();
