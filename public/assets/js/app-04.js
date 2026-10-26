
/* Data Anak: tampilan tabel modern. Hanya data induk anak; hafalan ada di Manajemen Hafalan. */
let dsGrade='all',dsClass='all',dsPage=1,dsStatus='all';const DS_PER=12;
const IC_TRASH='<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
function parentCfg(){return Object.assign({on:true,needDob:true,needNis:false},settings.parent||{})}
function nisNorm(v){return String(v==null?'':v).replace(/[^0-9a-z]/gi,'').toLowerCase()}
function verMethods(s){const p=parentCfg(),m=[];if(p.needDob&&s&&s.dob)m.push('dob');if(p.needNis&&s&&nisNorm(s.nis))m.push('nis');return m}
function verOn(){const p=parentCfg();return !!(p.needDob||p.needNis)}
function nisTaken(nis,exceptId){const k=nisNorm(nis);if(!k)return null;return students.find(x=>x.id!==exceptId&&nisNorm(x.nis)===k)||null}
window.HKVER={cfg:parentCfg,norm:nisNorm,methods:verMethods,on:verOn};
const DOB_MON=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function dobOpts(kind,cur){const Y=new Date().getFullYear();let a=[];
 if(kind==='D'){for(let i=1;i<=31;i++)a.push([i,i])}
 else if(kind==='M'){DOB_MON.forEach((m,i)=>a.push([i+1,m]))}
 else{for(let y=Y-2;y>=Y-20;y--)a.push([y,y])}
 const ph={D:'Tanggal',M:'Bulan',Y:'Tahun'}[kind];
 return '<option value="">'+ph+'</option>'+a.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${l}</option>`).join('')}
function dobParse(v){if(v==null||v==='')return'';let y,m,d;
 if(typeof v==='number'||/^\d{5}$/.test(String(v).trim())){const n=+v;if(n<20000||n>80000)return'';const t=new Date(Math.round((n-25569)*864e5));y=t.getUTCFullYear();m=t.getUTCMonth()+1;d=t.getUTCDate()}
 else{const t=String(v).trim();let a=t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);if(a){y=+a[1];m=+a[2];d=+a[3]}else{a=t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);if(!a)return'';d=+a[1];m=+a[2];y=+a[3]}}
 const t=new Date(Date.UTC(y,m-1,d));if(t.getUTCFullYear()!==y||t.getUTCMonth()!==m-1||t.getUTCDate()!==d||y<1990||y>new Date().getFullYear())return'';
 return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
window.HKDOB={mon:DOB_MON,opts:dobOpts,parse:dobParse};
function dsDone(s){return !!s.gender&&(!verOn()||verMethods(s).length>0)}
function dsActive(s){return s.status!=='Nonaktif'}
function dsSetGrade(g){dsGrade=g;dsClass='all';dsPage=1;renderStudents()}
function dsSetClass(c){dsClass=c;dsPage=1;renderStudents()}
function dsSetStatus(v){dsStatus=v;dsPage=1;renderStudents()}
function dsGo(p){dsPage=p;renderStudents();let t=document.getElementById('dsTop');if(t)t.scrollIntoView({behavior:'smooth',block:'start'})}
function dsFormHtml(s,classId){s=s||{};const seg=(n,opts,cur)=>`<div class="ds-seg" role="radiogroup">${opts.map(([v,l])=>`<label><input type="radio" name="${n}" value="${v}" ${cur===v?'checked':''}><span>${l}</span></label>`).join('')}</div>`;return `<div class="formgrid ds-form"><div class="formrow full"><label>Nama lengkap *</label><input name="name" required autocomplete="off" placeholder="Nama anak" value="${esc(s.name||'')}"></div><div class="formrow full"><label>Kelas *</label><select name="classId" required>${classOptions(s.classId||classId||classes[0]?.id)}</select></div><div class="formrow full"><label>NIS</label><input name="nis" autocomplete="off" inputmode="text" placeholder="Nomor Induk Siswa" value="${esc(s.nis||'')}"><small class="dob-hint">Bisa dipakai orang tua untuk membuka laporan hafalan anak (sesuai pengaturan Portal Orang Tua). Tidak boleh sama dengan anak lain.</small></div><div class="formrow full"><label>Tanggal lahir</label><div class="dob-row"><select name="dobD" aria-label="Tanggal lahir">${dobOpts('D',(s.dob||'').split('-')[2]*1||'')}</select><select name="dobM" aria-label="Bulan lahir">${dobOpts('M',(s.dob||'').split('-')[1]*1||'')}</select><select name="dobY" aria-label="Tahun lahir">${dobOpts('Y',(s.dob||'').split('-')[0]*1||'')}</select></div><small class="dob-hint">Bisa dipakai orang tua untuk membuka laporan hafalan anak (sesuai pengaturan Portal Orang Tua).</small></div><div class="formrow"><label>Jenis kelamin</label>${seg('gender',[['L','Laki-laki'],['P','Perempuan']],s.gender||'')}</div><div class="formrow"><label>Status</label>${seg('status',[['Aktif','Aktif'],['Nonaktif','Nonaktif']],s.status==='Nonaktif'?'Nonaktif':'Aktif')}</div></div>`}
openStudent=function(classId){if(!classes.length){toast('Tambahkan kelas terlebih dahulu.');openClass();return}openModal('Tambah Data Anak',dsFormHtml(null,(typeof classId==='number'?classId:null)||(dsClass!=='all'?dsClass:null)),'dsStudent');$('modalSubmit').textContent='Simpan Data'};
function dsEdit(id){let s=students.find(x=>x.id===id);if(!s)return;openModal('Edit Data Anak',dsFormHtml(s),'dsStudent',id);$('modalSubmit').textContent='Simpan Data'}
async function dsDelete(id){let s=students.find(x=>x.id===id);if(!s)return;
 const mine=l=>l&&String(l.studentId)===String(id),own=logs.filter(mine),ownEx=exams.filter(mine);let arch=0;
 try{arch=(await HKS.api('GET','/api/archive/count?student='+encodeURIComponent(id))).n||0}catch(e){}
 const parts=[own.length+' setoran aktif'];if(arch)parts.push(arch+' setoran di arsip');parts.push(ownEx.length+' hasil ujian');
 let msg='Hapus '+s.name+' beserta seluruh setoran dan hasil ujiannya ('+parts.join(', ')+')? Untuk anak yang lulus atau pindah, gunakan status alumni atau Nonaktif agar datanya tetap tersimpan.';
 if(arch)msg+=' Setoran di arsip dihapus permanen dan tidak bisa dikembalikan lewat Batalkan.';
 if(!await HK.confirm(msg,'Hapus'))return;
 if(arch){try{await HKS.api('POST','/api/archive/delete-student',{student:String(id)})}catch(e){toast('Setoran di arsip gagal dihapus: '+(e.message||'coba lagi')+' Anak belum dihapus.');return}}
 const at=students.findIndex(x=>x.id===id);students.splice(at,1);logs=logs.filter(l=>!mine(l));exams=exams.filter(e=>!mine(e));refresh();
 HKFB.undoable('Data anak dihapus.',()=>{if(!students.some(x=>x.id===id)){students.splice(Math.min(at,students.length),0,s);own.forEach(l=>{if(!logs.some(x=>x&&x.id===l.id))logs.push(l)});ownEx.forEach(e=>{if(!exams.some(x=>x&&x.id===e.id))exams.push(e)})}refresh()})}

function dsCloseMenu(){const m=document.getElementById('dsMenu');if(m){m.classList.remove('open');m.querySelector('#dsMenuBtn')?.setAttribute('aria-expanded','false')}}
function dsToggleMenu(e){e.stopPropagation();const m=document.getElementById('dsMenu'),o=!m.classList.contains('open');m.classList.toggle('open',o);m.querySelector('#dsMenuBtn').setAttribute('aria-expanded',String(o))}
document.addEventListener('click',e=>{if(!e.target.closest?.('#dsMenu'))dsCloseMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape')dsCloseMenu()});
const _dsSubmit=submitModal;
submitModal=function(e){if(modalMode!=='dsStudent')return _dsSubmit(e);e.preventDefault();let v=Object.fromEntries(new FormData(e.target).entries()),name=(v.name||'').replace(/\s+/g,' ').trim();if(!name){toast('Nama anak wajib diisi.');return}let cid=+v.classId;if(students.some(s=>s.id!==editingId&&s.classId==cid&&s.name.trim().toLowerCase()===name.toLowerCase())){toast('Nama tersebut sudah ada di kelas ini.');return}let dob='';if(v.dobD||v.dobM||v.dobY){dob=(v.dobD&&v.dobM&&v.dobY)?dobParse(v.dobY+'-'+v.dobM+'-'+v.dobD):'';if(!dob){toast('Tanggal lahir belum lengkap atau tidak valid.');return}}let nis=String(v.nis||'').replace(/\s+/g,' ').trim();let tk=nisTaken(nis,editingId);if(tk){toast('NIS tersebut sudah dipakai oleh '+tk.name+'.');return}let data={name,classId:cid,nis,gender:v.gender||'',dob,status:v.status||'Aktif'};if(editingId){Object.assign(students.find(s=>s.id===editingId),data)}else{let sr=surahs[0]||{name:'',start:1,end:5};students.push(Object.assign({id:Date.now(),surah:sr.name,start:sr.start,target:sr.end,done:0},data))}closeModal();refresh();toast('Data anak berhasil disimpan.')};
const DS_TONES=['#e9ecfe:#3d4ef0','#dcf7e6:#17a34a','#fdf0d5:#b7791f','#fde4e5:#e5484d','#e3f3fb:#0b7aa6'];
renderStudents=function(){
 let q=($('studentSearch')?.value||'').toLowerCase().trim(),cmap=new Map(classes.map(c=>[String(c.id),c]));
 let grades=[...new Set(classes.map(c=>c.grade).filter(Boolean))].sort((a,b)=>a-b);
 if(dsGrade!=='all'&&!grades.includes(+dsGrade))dsGrade='all';
 let inGrade=s=>dsGrade==='all'||String(cmap.get(String(s.classId))?.grade)===String(dsGrade);
 let SS=nonAlumni(),total=SS.length,act=SS.filter(dsActive).length,outN=total-act,inc=SS.filter(s=>dsActive(s)&&!dsDone(s)).length;
 let st=[['hero','Anak Aktif',act,'Di '+classes.length+' kelas · '+total+' tersimpan'],['','Pindah/Keluar',outN,'Pindah, berhenti, atau keluar'],['','Data Belum Lengkap',inc,'Jenis kelamin / data verifikasi portal (tgl lahir, NIS) belum lengkap']];
 $('dsStats').innerHTML=st.map(x=>`<div class="stat ${x[0]}"><div class="stat-top"><small>${x[1]}</small></div><h3>${x[2]}</h3><div class="sub"><i class="mini"></i>${x[3]}</div></div>`).join('');
 $('dsGrades').innerHTML=[['all','Semua',total],...grades.map(g=>[g,'Kelas '+g,SS.filter(s=>String(cmap.get(String(s.classId))?.grade)===String(g)).length])].map(([g,l,n])=>`<button class="${String(dsGrade)===String(g)?'active':''}" role="tab" onclick="dsSetGrade('${g}')">${l}<em>${n}</em></button>`).join('');
 let cl=dsGrade==='all'?[]:classes.filter(c=>String(c.grade)===String(dsGrade));
 $('dsClasses').style.display=cl.length?'flex':'none';
 $('dsClasses').innerHTML=cl.length?[`<button class="${dsClass==='all'?'active':''}" onclick="dsSetClass('all')">Semua rombel</button>`,...cl.map(c=>`<button class="${String(dsClass)===String(c.id)?'active':''}" onclick="dsSetClass(${c.id})">${esc(c.name)}<em>${students.filter(s=>s.classId==c.id).length}</em></button>`)].join(''):'';
 if($('dsStatusSel')&&$('dsStatusSel').value!==dsStatus)$('dsStatusSel').value=dsStatus;
 let list=SS.filter(s=>inGrade(s)&&(dsClass==='all'||String(s.classId)===String(dsClass))&&(dsStatus==='all'||(dsStatus==='aktif'&&dsActive(s))||(dsStatus==='nonaktif'&&!dsActive(s))||(dsStatus==='alumni'&&!!s.alumni)||(dsStatus==='keluar'&&!dsActive(s)&&!s.alumni)||(dsStatus==='belum'&&!dsDone(s)))&&(!q||[s.name,s.nis,className(s.classId)].some(x=>String(x||'').toLowerCase().includes(q))));
 let pages=Math.max(1,Math.ceil(list.length/DS_PER));if(dsPage>pages)dsPage=pages;if(dsPage<1)dsPage=1;
 let from=(dsPage-1)*DS_PER,slice=list.slice(from,from+DS_PER);
 $('dsRows').innerHTML=slice.map(s=>{let t=DS_TONES[(s.id||0)%DS_TONES.length].split(':'),g=s.gender==='L'?'Laki-laki':s.gender==='P'?'Perempuan':'';
  return `<tr onclick="dsEdit(${s.id})"><td class="ds-c-name"><div class="ds-person"><span class="ds-av" style="background:${t[0]};color:${t[1]}">${esc(initials(s.name))}</span><div><b>${esc(s.name)}</b>${s.nis?`<small class="ds-nis">NIS ${esc(s.nis)}</small>`:''}<small class="ds-sub-m">${g||'Jenis kelamin belum diisi'}</small></div></div></td><td class="ds-c-class"><span class="ds-class">${esc(className(s.classId))}</span></td><td class="ds-c-gender">${g?`<span class="ds-gender ${s.gender==='L'?'l':'p'}">${g}</span>`:'<span class="ds-nil">Belum diisi</span>'}</td><td class="ds-c-status"><span class="pill ${dsActive(s)?'':'ds-off'}">${dsActive(s)?'Aktif':'Nonaktif'}</span></td><td class="ds-c-act"><button class="ds-btn" title="Edit data" aria-label="Edit ${esc(s.name)}" onclick="event.stopPropagation();dsEdit(${s.id})">${IC_EDIT}</button><button class="ds-btn del" title="Hapus" aria-label="Hapus ${esc(s.name)}" onclick="event.stopPropagation();dsDelete(${s.id})">${IC_TRASH}</button></td></tr>`}).join('')||`<tr class="ds-empty"><td colspan="5">${total?'Tidak ada anak yang cocok dengan filter ini.':'Belum ada data anak. Tambahkan anak atau impor lewat Tambah Anak Massal.'}</td></tr>`;
 $('studentCountLabel').textContent=list.length?`Menampilkan ${from+1}–${from+slice.length} dari ${list.length} anak`:'0 anak';
 let pg=[];for(let p=1;p<=pages;p++)if(p===1||p===pages||Math.abs(p-dsPage)<=1)pg.push(p);else if(pg[pg.length-1]!=='…')pg.push('…');
 $('dsPager').innerHTML=pages>1?`<button class="ds-pg" ${dsPage<=1?'disabled':''} onclick="dsGo(${dsPage-1})" aria-label="Sebelumnya">‹</button>`+pg.map(p=>p==='…'?'<span class="ds-dots">…</span>':`<button class="ds-pg ${p===dsPage?'active':''}" onclick="dsGo(${p})">${p}</button>`).join('')+`<button class="ds-pg" ${dsPage>=pages?'disabled':''} onclick="dsGo(${dsPage+1})" aria-label="Berikutnya">›</button>`:'';
};
renderStudents();
