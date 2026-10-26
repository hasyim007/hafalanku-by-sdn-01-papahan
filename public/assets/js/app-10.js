
/* ===== Level 1–4 (tanpa nama) + kunci level ===== */
(function(){const M={Pemula:'1',Berkembang:'2',Lancar:'3',Mahir:'4'};let ch=false;const f=v=>{if(M[v]){ch=true;return M[v]}return v};
 students.forEach(s=>{if(s.hafalanLevel)s.hafalanLevel=f(s.hafalanLevel);Object.values(s.surahProgress||{}).forEach(r=>{if(r.level)r.level=f(r.level)});(s.levelHistory||[]).forEach(h=>{h.from=f(h.from);h.to=f(h.to)})});
 classes.forEach(c=>{if(c.level)c.level=f(c.level)});exams.forEach(e=>{e.level=f(e.level);if(e.to)e.to=f(e.to)});if(ch)save()})();
(function(){const LV=Object.keys(HAFALAN_CURRICULUM);let ch=false;students.forEach(s=>{if(!s.tamat)return;const base=s.tamatAt||'4',nx=LV[LV.indexOf(base)+1];if(nx){s.tamat=false;delete s.tamatAt;s.hafalanLevel=nx;s.levelHistory=[...(s.levelHistory||[]),{from:base,to:nx,date:today(),auto:true}];ch=true}});if(ch)save()})();
/* Aplikasi kini fokus Juz 30 saja. Bersihkan sisa data Juz 29 yang mungkin masih tersimpan di browser:
   level 5-6 dikembalikan ke level terakhir (status tamat), catatan hafalan surat Juz 29 dihapus. */
(function(){const LV=Object.keys(HAFALAN_CURRICULUM),last=LV[LV.length-1],ok=l=>LV.includes(String(l));
const J29=['Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma’arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddatstsir','Al-Qiyamah','Al-Insan','Al-Mursalat'];let ch=false;
students.forEach(s=>{if(s.hafalanLevel&&!ok(s.hafalanLevel)){s.hafalanLevel=last;s.tamat=true;s.tamatAt=last;ch=true}
if(s.tamat&&s.tamatAt&&!ok(s.tamatAt)){s.tamatAt=last;ch=true}
if(Array.isArray(s.levelHistory)){const n=s.levelHistory.filter(h=>ok(h.to)&&ok(h.from));if(n.length!==s.levelHistory.length){s.levelHistory=n;ch=true}}
if(s.surahProgress)J29.forEach(k=>{if(k in s.surahProgress){delete s.surahProgress[k];ch=true}})});
classes.forEach(c=>{if(c.level&&!ok(c.level)){c.level=last;ch=true}});
if(ch)save()})();

/* ===== Manajemen Level: UI ===== */
const LV_TONE={'1':['#e9ecfe','#3d4ef0'],'2':['#dcf7e6','#17a34a'],'3':['#fdf0d5','#b7791f'],'4':['#fde4ee','#d6457f']};
let lvHist=[],lvDrag=null,lvDrop=null;
function lvPersist(){try{HKLS.hkLevelMap=JSON.stringify(lvCurrent())}catch(e){}}
function lvCommit(next,msg){if(JSON.stringify(next)===JSON.stringify(lvCurrent()))return;lvHist.push(lvCurrent());if(lvHist.length>30)lvHist.shift();lvApply(next);lvPersist();refresh();renderLevels();if(msg)toast(msg)}
function lvMove(name,to,idx){const cur=lvCurrent(),from=Object.keys(cur).find(l=>cur[l].includes(name));if(!from)return;if(from!==to&&cur[from].length<=1){toast('Setiap level harus berisi minimal 1 surat.');return}
 const fi=cur[from].indexOf(name);cur[from].splice(fi,1);let i=idx==null?cur[to].length:idx;if(from===to&&fi<i)i--;i=Math.max(0,Math.min(i,cur[to].length));cur[to].splice(i,0,name);
 lvCommit(cur,from===to?name+' dipindah urutannya.':name+' dipindah ke Level '+to+'.')}
function lvUndo(){if(!lvHist.length)return;const prev=lvHist.pop();lvApply(prev);lvPersist();refresh();renderLevels();toast('Perubahan terakhir dibatalkan.')}
async function lvReset(){if(!await HK.confirm('Kembalikan susunan surat ke bawaan (4 level Juz 30)? Anda masih bisa menekan Urungkan.','Pulihkan'))return;const d={};Object.keys(LV_DEFAULT).forEach(l=>d[l]=LV_DEFAULT[l].slice());if(JSON.stringify(d)===JSON.stringify(lvCurrent())){toast('Susunan sudah sama dengan bawaan.');return}lvCommit(d,'Susunan level dipulihkan ke bawaan.')}
function lvPopClose(){document.getElementById('lvPop')?.remove()}
function lvPopOpen(btn){lvPopClose();const name=btn.closest('.lv-item').dataset.n,cur=lvCurrent(),from=Object.keys(cur).find(l=>cur[l].includes(name)),pos=cur[from].indexOf(name);
 const pop=document.createElement('div');pop.id='lvPop';pop.className='lv-pop';pop.setAttribute('role','menu');
 pop.innerHTML=`<div class="lv-pop-h">Pindahkan <b>${esc(name)}</b></div>`+Object.keys(cur).map(l=>`<button role="menuitem" data-to="${l}" ${l===from?'disabled':''}><i style="background:${LV_TONE[l][0]};color:${LV_TONE[l][1]}">${l}</i>Level ${l}<small>${l===from?'Level saat ini':cur[l].length+' surat'}</small></button>`).join('')+`<div class="lv-pop-sep"></div><div class="lv-pop-ord"><button data-ord="up" ${pos===0?'disabled':''}>↑ Naik</button><button data-ord="down" ${pos===cur[from].length-1?'disabled':''}>↓ Turun</button></div>`;
 document.body.appendChild(pop);const r=btn.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;let x=Math.min(Math.max(8,r.right-w),innerWidth-w-8),y=r.bottom+6;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);pop.style.left=x+'px';pop.style.top=y+'px';
 pop.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;lvPopClose();if(b.dataset.to)lvMove(name,b.dataset.to);else if(b.dataset.ord==='up')lvMove(name,from,pos-1);else lvMove(name,from,pos+2)})}
function renderLevels(){const board=$('lvBoard');if(!board)return;const cur=lvCurrent(),keys=Object.keys(cur);
 const kids={};keys.forEach(l=>kids[l]=0);students.forEach(s=>{if(s.tamat||s.status==='Nonaktif')return;const l=defaultHafalanLevel(s);if(l in kids)kids[l]++});
 const ay=l=>cur[l].reduce((a,n)=>a+LV_MASTER.get(n),0),totalS=keys.reduce((a,l)=>a+cur[l].length,0),totalA=keys.reduce((a,l)=>a+ay(l),0);
 $('lvSummary').innerHTML=[[keys.length,'Level'],[totalS,'Surat Juz 30'],[totalA,'Total ayat']].map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
 board.innerHTML=keys.map(l=>`<section class="lv-card" data-l="${l}" style="--lv-bg:${LV_TONE[l][0]};--lv-fg:${LV_TONE[l][1]}"><header><span class="lv-badge">${l}</span><div><h3>Level ${l}</h3><small>${cur[l].length} surat · ${ay(l)} ayat · ${kids[l]} anak</small></div></header><ol class="lv-list">${cur[l].map((n,i)=>`<li class="lv-item" draggable="true" data-n="${esc(n)}"><span class="lv-grip" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span><span class="lv-no">${i+1}</span><b>${esc(n)}</b><em title="${LV_MASTER.get(n)} ayat">${LV_MASTER.get(n)}</em><button type="button" class="lv-mv" aria-label="Pindahkan ${esc(n)}" title="Pindah"><svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></button></li>`).join('')}</ol></section>`).join('');
 $('lvUndo').disabled=!lvHist.length}
(function(){const B=()=>$('lvBoard');
 const clear=()=>{document.querySelectorAll('.lv-item.drop-before,.lv-item.drop-after,.lv-list.drop-end').forEach(x=>x.classList.remove('drop-before','drop-after','drop-end'));document.querySelectorAll('.lv-card.over').forEach(x=>x.classList.remove('over'))};
 document.addEventListener('dragstart',e=>{const it=e.target.closest?.('.lv-item');if(!it||!B()?.contains(it))return;lvDrag=it.dataset.n;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',lvDrag)}catch(_){}setTimeout(()=>it.classList.add('dragging'),0);B().classList.add('is-dragging');lvPopClose()});
 document.addEventListener('dragover',e=>{if(!lvDrag)return;const card=e.target.closest?.('.lv-card');if(!card||!B().contains(card))return;e.preventDefault();e.dataTransfer.dropEffect='move';clear();card.classList.add('over');const l=card.dataset.l;let it=e.target.closest('.lv-item');const list=card.querySelector('.lv-list'),cur=lvCurrent()[l];
  if(it&&it.dataset.n!==lvDrag){const r=it.getBoundingClientRect(),after=e.clientY>r.top+r.height/2,i=cur.indexOf(it.dataset.n);it.classList.add(after?'drop-after':'drop-before');lvDrop={l,idx:after?i+1:i}}
  else if(it){lvDrop=null}
  else{const items=[...list.querySelectorAll('.lv-item:not(.dragging)')];let idx=cur.length,tgt=null;for(const x of items){const r=x.getBoundingClientRect();if(e.clientY<r.top+r.height/2){tgt=x;break}}if(tgt){idx=cur.indexOf(tgt.dataset.n);tgt.classList.add('drop-before')}else list.classList.add('drop-end');lvDrop={l,idx}}});
 document.addEventListener('drop',e=>{if(!lvDrag)return;const card=e.target.closest?.('.lv-card');if(!card||!B().contains(card))return;e.preventDefault();const d=lvDrop,n=lvDrag;lvDrag=null;lvDrop=null;clear();B().classList.remove('is-dragging');if(d)lvMove(n,d.l,d.idx)});
 document.addEventListener('dragend',()=>{lvDrag=null;lvDrop=null;clear();document.querySelectorAll('.lv-item.dragging').forEach(x=>x.classList.remove('dragging'));B()?.classList.remove('is-dragging')});
 document.addEventListener('click',e=>{const mv=e.target.closest?.('.lv-mv');if(mv&&B()?.contains(mv)){e.stopPropagation();lvPopOpen(mv);return}if(!e.target.closest?.('#lvPop'))lvPopClose()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')lvPopClose()});window.addEventListener('scroll',lvPopClose,true);window.addEventListener('resize',lvPopClose)})();
const _g4=go;go=function(v,b){_g4(v,b);if(v==='level'){$('pagetitle').textContent=$('crumb').textContent='Manajemen Level';renderLevels()}};

/* ===== Manajemen Hafalan: tampilan baru (kartu rombel + daftar anak) ===== */
let mhGrade='all',mhRL='all';
const MH_ARROW='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function mhPct(s){return hfLevelStats(s,defaultHafalanLevel(s)).pct}
function mhActive(s){return s.status!=='Nonaktif'}
function mhClassStats(c){const all=students.filter(s=>String(s.classId)===String(c.id)),act=all.filter(mhActive),lv={};Object.keys(HAFALAN_CURRICULUM).forEach(l=>lv[l]=0);let sum=0,ready=0,tamat=0;
 act.forEach(s=>{const l=defaultHafalanLevel(s);if(l in lv)lv[l]++;sum+=s.tamat?100:mhPct(s);if(s.tamat)tamat++;else{try{if(ujState(s).ready)ready++}catch(e){}}});
 return{all,act,lv,avg:act.length?Math.round(sum/act.length):0,ready,tamat}}
function mhTone(i){const t=['#e9ecfe:#3d4ef0','#dcf7e6:#17a34a','#fdf0d5:#b7791f','#fde4ee:#d6457f','#e3f3fb:#0b7aa6'][(i||0)%5].split(':');return{bg:t[0],fg:t[1]}}
function cardHTML(c){const st=mhClassStats(c),g=c.grade||classGradeNum(c),tn=mhTone(Number(g)-1),total=st.act.length||1;
 const seg=Object.keys(st.lv).filter(l=>st.lv[l]).map(l=>`<i style="flex:${st.lv[l]};background:${LV_TONE[l][1]}" title="Level ${l}: ${st.lv[l]} anak"></i>`).join('')||'<i style="flex:1;background:#e6e8f2"></i>';
 const leg=Object.keys(st.lv).filter(l=>st.lv[l]).map(l=>`<span><b style="background:${LV_TONE[l][1]}"></b>L${l} · ${st.lv[l]}</span>`).join('');
 const av=st.all.slice(0,3).map((s,i)=>{const t=mhTone(s.id);return `<span style="background:${t.bg};color:${t.fg}">${esc(initials(s.name))}</span>`}).join('');
 return `<article class="mh-card" tabindex="0" role="button" aria-label="Buka rombel ${esc(c.name)}" onclick="openClassRoster(${c.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openClassRoster(${c.id})}">
 <div class="mh-card-top"><span class="mh-badge" style="background:${tn.bg};color:${tn.fg}">${esc(c.name)}</span><div class="mh-card-title"><h4>Kelas ${esc(c.name)}</h4><small>${esc(c.teacher||'Rombongan belajar')} · ${esc(c.year||settings.year||'')}</small></div><button class="mh-more" title="Ubah rombel" aria-label="Ubah rombel ${esc(c.name)}" onclick="event.stopPropagation();openClass(${c.id})"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div>
 <div class="mh-metric"><div><span>Capaian rata-rata</span><b>${st.avg}<em>%</em></b></div><div class="mh-metric-bar"><i style="width:${st.avg}%"></i></div></div>
 <div class="mh-levels"><div class="mh-cap">Sebaran level anak</div><div class="mh-levelbar">${seg}</div><div class="mh-legend">${leg||'<span>Belum ada anak aktif</span>'}</div></div>
 <div class="mh-card-foot"><div class="mh-avs">${av}${st.all.length>3?`<span class="more">+${st.all.length-3}</span>`:''}</div><span class="mh-count">${st.act.length} anak${st.ready?` · <b class="ready">${st.ready} siap ujian</b>`:''}</span><span class="mh-go">Buka${MH_ARROW}</span></div></article>`}
function renderClasses(){const q=($('classSearch')?.value||'').toLowerCase().trim(),gOf=c=>String(c.grade||classGradeNum(c));
 const grades=[...new Set(classes.map(gOf))].sort((a,b)=>a-b);if(mhGrade!=='all'&&!grades.includes(mhGrade))mhGrade='all';
 const act=students.filter(mhActive),ready=act.filter(s=>{try{return !s.tamat&&ujState(s).ready}catch(e){return false}}).length,avg=act.length?Math.round(act.reduce((a,s)=>a+(s.tamat?100:mhPct(s)),0)/act.length):0;
 $('mhStats').innerHTML=[['Rombel',classes.length,'Rombongan belajar aktif'],['Anak aktif',act.length,'Mengikuti kegiatan hafalan'],['Capaian rata-rata',avg+'%','Pada level masing-masing anak'],['Siap ujian',ready,'Menunggu ujian kenaikan level']].map((x,i)=>`<div class="mh-stat"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></div>`).join('');
 $('mhGrades').innerHTML=[['all','Semua',classes.length],...grades.map(g=>[g,'Kelas '+g,classes.filter(c=>gOf(c)===g).length])].map(([g,l,n])=>`<button class="${mhGrade===String(g)?'active':''}" role="tab" onclick="mhSetGrade('${g}')">${l}<em>${n}</em></button>`).join('');
 const arr=classes.filter(c=>(mhGrade==='all'||gOf(c)===mhGrade)&&(!q||String(c.name).toLowerCase().includes(q)||String(c.teacher||'').toLowerCase().includes(q)));
 $('allClasses').innerHTML=arr.map(cardHTML).join('')||'<div class="empty mh-empty">Tidak ada rombel yang cocok. Tambahkan rombel atau ubah pencarian.</div>'}
function mhSetGrade(g){mhGrade=String(g);renderClasses()}
function mhRosterRow(s){const l=defaultHafalanLevel(s),p=s.tamat?100:mhPct(s),t=LV_TONE[l]||LV_TONE['1'],tn=mhTone(s.id),off=!mhActive(s);
 return `<button class="mh-r-row${off?' off':''}" onclick="openRosterStudent(${s.id})"><span class="mh-av" style="background:${tn.bg};color:${tn.fg}">${esc(initials(s.name))}</span><span class="mh-r-main"><b>${esc(s.name)}</b><span class="mh-r-bar"><i style="width:${p}%;background:${t[1]}"></i></span></span><span class="mh-r-side"><span class="mh-lvpill" style="background:${t[0]};color:${t[1]}">${off?'Nonaktif':s.tamat?'Tamat':'Level '+esc(l)}</span><em>${p}%</em></span><span class="mh-chev">${MH_ARROW}</span></button>`}
function rosterStudentItems(list){return list.map(mhRosterRow).join('')||'<div class="mh-r-empty">Tidak ada anak yang cocok.</div>'}
function openClassRoster(id){selectedClass=id;const c=classes.find(x=>String(x.id)===String(id));if(!c)return;mhRL='all';closeClassRoster();const st=mhClassStats(c),g=c.grade||classGradeNum(c),tn=mhTone(Number(g)-1);
 const chips=[['all','Semua',st.all.length],...Object.keys(st.lv).map(l=>[l,'Level '+l,st.all.filter(s=>mhActive(s)&&defaultHafalanLevel(s)===l).length])];
 const bd=document.createElement('div');bd.id='classRosterBackdrop';bd.className='mh-back';bd.setAttribute('role','dialog');bd.setAttribute('aria-modal','true');bd.addEventListener('click',e=>{if(e.target===bd)closeClassRoster()});
 bd.innerHTML=`<div class="mh-modal"><header class="mh-m-head"><span class="mh-badge lg" style="background:${tn.bg};color:${tn.fg}">${esc(c.name)}</span><div><h3>Kelas ${esc(c.name)}</h3><p>${esc(c.teacher||'Rombongan belajar')} · ${esc(c.year||settings.year||'')}</p></div><button class="mh-x" onclick="closeClassRoster()" aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
 <div class="mh-m-sum"><div><b>${st.act.length}</b><span>Anak aktif</span></div><div><b>${st.avg}%</b><span>Capaian rata-rata</span></div><div><b>${st.ready}</b><span>Siap ujian</span></div><div><b>${st.tamat}</b><span>Tamat</span></div></div>
 <div class="mh-m-tools"><label class="ds-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input class="field" id="rosterSearch" placeholder="Cari nama anak..." oninput="filterClassRoster()" autocomplete="off"></label><div class="mh-chips" id="mhRChips">${chips.map(([v,l,n])=>`<button class="${v==='all'?'active':''}" data-v="${v}" onclick="mhRosterLevel('${v}')">${l}<em>${n}</em></button>`).join('')}</div></div>
 <div class="mh-r-list" id="rosterStudentList">${rosterStudentItems(st.all)}</div><footer class="mh-m-foot"><span id="rosterCount">${st.all.length} anak</span><span>Pilih anak untuk membuka catatan hafalan</span></footer></div>`;
 document.body.appendChild(bd);document.body.style.overflow='hidden';setTimeout(()=>document.getElementById('rosterSearch')?.focus({preventScroll:true}),60)}
function mhRosterLevel(v){mhRL=v;document.querySelectorAll('#mhRChips button').forEach(b=>b.classList.toggle('active',b.dataset.v===v));filterClassRoster()}
function filterClassRoster(){const q=(document.getElementById('rosterSearch')?.value||'').toLowerCase().trim();const list=students.filter(s=>String(s.classId)===String(selectedClass)&&(!q||s.name.toLowerCase().includes(q))&&(mhRL==='all'||(mhActive(s)&&defaultHafalanLevel(s)===mhRL)));document.getElementById('rosterStudentList').innerHTML=rosterStudentItems(list);document.getElementById('rosterCount').textContent=list.length+' anak'}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('classRosterBackdrop'))closeClassRoster()});
renderClasses();
const LOCKMSG='Level terkunci. Level hanya berubah lewat Ujian Kenaikan Level atau penempatan awal (scan formulir).';
function setStudentHafalanLevel(){toast(LOCKMSG)}
function hfChangeLevel(){toast(LOCKMSG)}
