
let hfModalStudentId=null,hfModalLevel=null,hfModalSurah=null,hfModalStatus='Hafal';
function openStudentHafalan(id){hfModalStudentId=id;let s=students.find(x=>String(x.id)===String(id));if(!s)return;hfModalLevel=defaultHafalanLevel(s);hfModalSurah=null;renderHafalanModal();}
function closeStudentHafalan(){let el=document.getElementById('hfModalBackdrop');if(el)el.remove();hfModalStudentId=null;hfModalSurah=null;}
function renderHafalanModal(){let s=students.find(x=>String(x.id)===String(hfModalStudentId));if(!s)return;let catalog=HAFALAN_CURRICULUM[hfModalLevel]||HAFALAN_CURRICULUM['1'],progress=s.surahProgress||{},records=Object.values(progress),done=records.filter(x=>x.status==='Hafal').length,notDone=records.filter(x=>x.status==='Belum hafal').length;let backdrop=document.getElementById('hfModalBackdrop');if(!backdrop){backdrop=document.createElement('div');backdrop.id='hfModalBackdrop';backdrop.className='hf-modal-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeStudentHafalan()});document.body.appendChild(backdrop)}
let listHtml=catalog.map(([name,maxAyat],i)=>{let r=progress[name]||{},status=r.status||'',tag=status==='Hafal'?'Hafal ✓':status==='Belum hafal'?'Belum hafal':'Belum dicatat';return `<button class="hf-surah-card" onclick="hfOpenSurah(${i})"><span class="hf-surah-num">${i+1}</span><span class="hf-surah-info"><b>${esc(name)}</b><small>${maxAyat} ayat${r.date?' · Diperbarui '+niceDate(r.date):''}${r.from?` · Ayat ${r.from}–${r.to}`:''}</small></span><span class="hf-status-tag ${status==='Hafal'?'done':status==='Belum hafal'?'pending':''}">${tag}</span><span class="hf-card-arrow">›</span></button>`}).join('');
let formHtml='';if(hfModalSurah!==null){let [name,maxAyat]=catalog[hfModalSurah],r=progress[name]||{};formHtml=`<div class="hf-form-head"><button class="hf-back" onclick="hfBackToList()">← Daftar surat</button><div class="hf-form-title"><h4>${esc(name)}</h4><p>Level ${esc(hfModalLevel)} · ${maxAyat} ayat</p></div></div><div class="hf-form-box"><div class="hf-form-grid"><div class="hf-field full"><label>Rentang ayat yang disetorkan</label><div class="hf-range"><input id="hfModalFrom" type="number" min="1" max="${maxAyat}" value="${r.from||1}" aria-label="Ayat awal"><span>sampai</span><input id="hfModalTo" type="number" min="1" max="${maxAyat}" value="${r.to||maxAyat}" aria-label="Ayat akhir"></div><small style="color:#849187;font-size:10px">Isi ayat awal dan akhir. Boleh satu ayat atau rentang panjang.</small></div><div class="hf-field full"><label>Status setoran</label><div class="hf-status-options"><button type="button" class="hf-status-option ${r.status==='Hafal'||!r.status?'active':''}" data-status="Hafal" onclick="hfChooseStatus('Hafal')">✓ Hafal</button><button type="button" class="hf-status-option ${r.status==='Belum hafal'?'active':''}" data-status="Belum hafal" onclick="hfChooseStatus('Belum hafal')">◷ Belum hafal</button></div></div><div class="hf-field full"><label>Catatan guru (opsional)</label><textarea id="hfModalNote" rows="3" placeholder="Contoh: lancar, perlu murajaah, atau lanjut ayat berikutnya">${esc(r.note||'')}</textarea></div></div><div class="hf-form-actions"><button class="hf-cancel" onclick="hfBackToList()">Batal</button><button class="hf-save" onclick="hfSaveCurrent()">Simpan setoran</button></div></div>`}
backdrop.innerHTML=`<div class="hf-modal"><header class="hf-modal-top"><div class="hf-modal-person"><div class="hf-modal-avatar">${initials(s.name)}</div><div><h3>Catatan Hafalan Anak</h3><p>${esc(s.name)} · ${esc(className(s.classId))} · Pilih surat lalu catat setoran</p></div></div><button class="hf-modal-close" onclick="closeStudentHafalan()" aria-label="Tutup">×</button></header><div class="hf-modal-content"><div class="hf-slider ${hfModalSurah!==null?'show-form':''}"><section class="hf-slide"><div class="hf-level-tabs">${Object.keys(HAFALAN_CURRICULUM).map(l=>`<button class="hf-level-btn ${l===hfModalLevel?'active':'locked'}" onclick="hfChangeLevel('${l}')">${lvLabel(l)}</button>`).join('')}</div><div class="hf-summary"><span>Surat level ini: <b>${catalog.length}</b></span><span>Sudah hafal: <b>${done}</b></span><span>Belum hafal: <b>${notDone}</b></span></div><div class="hf-list-title"><h4>Daftar surat hafalan</h4><small>Pilih surat untuk catat setoran →</small></div><div class="hf-surah-cards">${listHtml}</div></section><section class="hf-slide">${formHtml}</section></div></div><footer class="hf-modal-foot"><span>Data catatan untuk ${esc(s.name)}</span><span>Level ${esc(hfModalLevel)}</span></footer></div>`;}
function hfChangeLevel(level){hfModalLevel=level;hfModalSurah=null;let s=students.find(x=>String(x.id)===String(hfModalStudentId));if(s)s.hafalanLevel=level;save();renderHafalanModal()}
function hfOpenSurah(i){hfModalSurah=i;hfModalStatus='Hafal';renderHafalanModal()}
function hfBackToList(){hfModalSurah=null;renderHafalanModal()}
function hfChooseStatus(status){hfModalStatus=status;document.querySelectorAll('.hf-status-option').forEach(b=>b.classList.toggle('active',b.dataset.status===status))}
function hfSaveCurrent(){let s=students.find(x=>String(x.id)===String(hfModalStudentId));if(!s||hfModalSurah===null)return;let catalog=HAFALAN_CURRICULUM[hfModalLevel]||HAFALAN_CURRICULUM['1'],[name,maxAyat]=catalog[hfModalSurah],from=Number(document.getElementById('hfModalFrom').value),to=Number(document.getElementById('hfModalTo').value),note=document.getElementById('hfModalNote').value.trim();if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to>maxAyat){toast(`Rentang ayat ${name} harus antara 1–${maxAyat}.`);return}s.hafalanLevel=hfModalLevel;s.surahProgress=s.surahProgress||{};s.surahProgress[name]={level:hfModalLevel,surah:name,from,to,status:hfModalStatus,date:today(),note};logs.push({id:Date.now(),studentId:s.id,studentName:s.name,classId:s.classId,date:today(),surah:name,from,to,status:hfModalStatus,note:`Level ${hfModalLevel}${note?' · '+note:''}`});save();refresh();renderHafalanModal();toast(`Setoran ${name} untuk ${s.name} berhasil disimpan.`)}

/* Perbaikan alur: Detail rombel membuka popup daftar anak, tanpa scroll halaman. */
(function(){
 const style=document.createElement('style');
 style.textContent=`
 .roster-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(18,35,27,.48);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:22px}
 .roster-modal{width:min(820px,100%);max-height:min(86vh,820px);display:flex;flex-direction:column;background:#ffffff;border:1px solid #e4ece6;border-radius:22px;box-shadow:0 24px 80px #13291d35;overflow:hidden}
 .roster-head{display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #edf1ee;background:#fbfdfb}
 .roster-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#e8f5ec;color:#16734b;font-size:20px;flex-shrink:0}
 .roster-head h3{margin:0;color:#234331;font-size:18px}.roster-head p{margin:5px 0 0;color:#829087;font-size:12px}.roster-close{margin-left:auto;width:38px;height:38px;border-radius:11px;background:#f0f4f1;color:#5e7165;font-size:23px;flex-shrink:0}
 .roster-tools{padding:16px 24px 10px;display:flex;gap:12px;align-items:center}.roster-search{flex:1;min-width:0;border:1px solid #dfe8e1;border-radius:11px;padding:11px 13px;font-size:13px}.roster-count{color:#78877d;font-size:11px;white-space:nowrap}
 .roster-list{padding:6px 24px 22px;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;overscroll-behavior:contain}
 .roster-student{display:flex;align-items:center;gap:11px;min-width:0;border:1px solid #e7ede8;background:#ffffff;border-radius:13px;padding:11px;text-align:left;transition:.15s}.roster-student:hover{border-color:#8cc9a5;background:#f8fcf9}.roster-student .face{flex-shrink:0}.roster-student-info{min-width:0;flex:1}.roster-student-info b{display:block;color:#2d4938;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.roster-student-info small{display:block;color:#859188;font-size:10px;margin-top:4px}.roster-student-arrow{color:#7c9a86;font-size:20px}
 .roster-empty{grid-column:1/-1;padding:28px;text-align:center;color:#849187;font-size:13px}
 @media(max-width:600px){.roster-backdrop{padding:0;align-items:stretch}.roster-modal{width:100%;height:100dvh;max-height:100dvh;border-radius:0}.roster-head{padding:16px}.roster-tools{padding:12px 16px;align-items:stretch;flex-direction:column;gap:8px}.roster-list{padding:6px 16px 18px;grid-template-columns:1fr}.roster-count{white-space:normal}}
 `;document.head.appendChild(style);
})();
function cardHTML(c){let list=students.filter(s=>s.classId===c.id),avg=list.length?Math.round(list.reduce((a,s)=>a+pct(s),0)/list.length):0;let colors=['#e8f4ef','#e9fbf4','#fff4e3','#f1fbf8','#fff0f1'];let ix=(c.id-1)%colors.length;return `<article class="class-card"><div class="class-head"><div class="class-emblem" style="background:${colors[ix]}">▤</div><div><h4>${esc(c.name)}</h4><small>${esc(c.year||settings.year)} · ${esc(c.teacher||c.level||'Rombongan belajar')} · ${list.length} anak</small></div><button class="more" onclick="openClass(${c.id})">···</button></div><div class="class-progress"><span>Rata-rata capaian</span><b style="color:#3d4ef0">${avg}%</b></div><div class="bar"><span style="width:${avg}%"></span></div><div class="class-foot"><div class="faces">${list.slice(0,4).map(s=>`<span class="face">${initials(s.name)}</span>`).join('')||'<span class="face">＋</span>'}</div><small>${list.length} anak terdaftar</small><button class="linkbtn" onclick="openClassRoster(${c.id})">Detail →</button></div></article>`}
function openClassRoster(id){selectedClass=id;let c=classes.find(x=>String(x.id)===String(id));if(!c)return;let list=students.filter(s=>String(s.classId)===String(id));let old=document.getElementById('classRosterBackdrop');if(old)old.remove();let backdrop=document.createElement('div');backdrop.id='classRosterBackdrop';backdrop.className='roster-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeClassRoster()});backdrop.innerHTML=`<div class="roster-modal"><header class="roster-head"><div class="roster-icon">▤</div><div><h3>${esc(c.name)} — Daftar Anak</h3><p>${esc(c.year||settings.year)} · ${esc(c.teacher||'Rombongan belajar')} · Pilih anak untuk membuka catatan hafalan</p></div><button class="roster-close" onclick="closeClassRoster()" aria-label="Tutup">×</button></header><div class="roster-tools"><input class="roster-search" id="rosterSearch" placeholder="Cari nama anak..." oninput="filterClassRoster()"><span class="roster-count" id="rosterCount">${list.length} anak terdaftar</span></div><div class="roster-list" id="rosterStudentList">${rosterStudentItems(list)}</div></div>`;document.body.appendChild(backdrop);document.body.style.overflow='hidden'}
function rosterStudentItems(list){return list.map(s=>`<button class="roster-student" onclick="openRosterStudent(${s.id})"><span class="face" style="background:#e9ecfe">${initials(s.name)}</span><span class="roster-student-info"><b>${esc(s.name)}</b><small>${esc(className(s.classId))} · Level ${esc(defaultHafalanLevel(s))}</small></span><span class="roster-student-arrow">›</span></button>`).join('')||'<div class="roster-empty">Belum ada anak pada rombel ini.</div>'}
function filterClassRoster(){let q=(document.getElementById('rosterSearch')?.value||'').toLowerCase();let list=students.filter(s=>String(s.classId)===String(selectedClass)&&s.name.toLowerCase().includes(q));document.getElementById('rosterStudentList').innerHTML=rosterStudentItems(list);document.getElementById('rosterCount').textContent=`${list.length} anak ditemukan`}
function closeClassRoster(){document.getElementById('classRosterBackdrop')?.remove();document.body.style.overflow=''}
function openRosterStudent(id){closeClassRoster();openStudentHafalan(id)}

// Pastikan tombol detail yang ada memakai popup baru; detail tidak lagi disisipkan ke dalam tabel.

/* Pembaruan alur HafalanKu: progres per ayat, level tersimpan, dan kembali ke daftar setelah simpan. */
function hfRangesFor(student, surahName){
  const old=(student.surahProgress||{})[surahName];
  if(!old) return [];
  if(Array.isArray(old.ranges)) return old.ranges;
  if(Number.isInteger(Number(old.from)) && Number.isInteger(Number(old.to)) && old.status)
    return [{from:Number(old.from),to:Number(old.to),status:old.status,date:old.date||'',note:old.note||''}];
  return [];
}
function hfAyatStates(student, surahName, maxAyat){
  const states=Array(maxAyat).fill('');
  hfRangesFor(student,surahName).forEach(r=>{
    for(let n=Math.max(1,Number(r.from)||1);n<=Math.min(maxAyat,Number(r.to)||0);n++) states[n-1]=r.status;
  });
  return states;
}
function hfPct(h,t){return !t?0:h>=t?100:Math.min(99,Math.round(h/t*100))}
function hfSurahStats(student, surahName, maxAyat){
  const states=hfAyatStates(student,surahName,maxAyat),hafal=states.filter(x=>x==='Hafal').length;
  const ranges=hfRangesFor(student,surahName);
  return {states,hafal,total:maxAyat,pct:hfPct(hafal,maxAyat),ranges,latest:ranges.length?ranges[ranges.length-1]:null};
}
function hfLevelStats(student, level){
  const catalog=HAFALAN_CURRICULUM[level]||[],total=catalog.reduce((a,x)=>a+x[1],0);
  const hafal=catalog.reduce((a,[name,max])=>a+hfSurahStats(student,name,max).hafal,0);
  return {total,hafal,pct:hfPct(hafal,total)};
}
function hfNextRange(student,name,maxAyat){
  const states=hfAyatStates(student,name,maxAyat);let start=states.findIndex(x=>!x);
  if(start<0) return {from:1,to:maxAyat};
  let end=start;while(end+1<maxAyat&&!states[end+1])end++;
  return {from:start+1,to:end+1};
}
function renderHafalanModal(){
 const s=students.find(x=>String(x.id)===String(hfModalStudentId));if(!s)return;
 const catalog=HAFALAN_CURRICULUM[hfModalLevel]||HAFALAN_CURRICULUM['1'];
 const levelStats=hfLevelStats(s,hfModalLevel);
 let done=0,notDone=0;
 catalog.forEach(([name,max])=>{const st=hfSurahStats(s,name,max);if(st.pct===100)done++;else if(st.ranges.length)notDone++;});
 let backdrop=document.getElementById('hfModalBackdrop');
 if(!backdrop){backdrop=document.createElement('div');backdrop.id='hfModalBackdrop';backdrop.className='hf-modal-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeStudentHafalan()});document.body.appendChild(backdrop)}
 const listHtml=catalog.map(([name,maxAyat],i)=>{
   const st=hfSurahStats(s,name,maxAyat),last=st.latest;
   const tag=st.pct===100?'Hafal ✓':st.ranges.length?'Dalam proses':'Belum dicatat';
   const rangeText=st.ranges.length?`${st.ranges.length} rentang dicatat`:'Belum ada setoran';
   return `<button class="hf-surah-card" onclick="hfOpenSurah(${i})"><span class="hf-surah-num">${i+1}</span><span class="hf-surah-info"><b>${esc(name)}</b><small>${st.hafal}/${maxAyat} ayat hafal · ${st.pct}% · ${rangeText}${last&&last.date?' · '+niceDate(last.date):''}</small><span class="hf-mini-progress"><i style="width:${st.pct}%"></i></span></span><span class="hf-status-tag ${st.pct===100?'done':st.ranges.length?'pending':''}">${tag}</span><span class="hf-card-arrow">›</span></button>`;
 }).join('');
 let formHtml='';
 if(hfModalSurah!==null){
   const [name,maxAyat]=catalog[hfModalSurah],st=hfSurahStats(s,name,maxAyat),next=hfNextRange(s,name,maxAyat),latest=st.latest;
   formHtml=`<div class="hf-form-head"><button class="hf-back" onclick="hfBackToList()">← Daftar surat</button><div class="hf-form-title"><h4>${esc(name)}</h4><p>Level ${esc(hfModalLevel)} · ${maxAyat} ayat · ${st.hafal} ayat hafal (${st.pct}%)</p></div></div><div class="hf-form-box"><div class="hf-current-ranges"><b>Riwayat rentang saat ini</b>${st.ranges.length?st.ranges.map((r,j)=>`<span>Ayat ${r.from}–${r.to}: <strong class="${r.status==='Hafal'?'range-done':'range-pending'}">${esc(r.status)}</strong></span>`).join(''):'<span>Belum ada rentang yang dicatat.</span>'}<small>Jika rentang yang sama dinilai ulang, status terbarunya yang berlaku. Riwayat setoran tetap tersimpan.</small></div><div class="hf-form-grid"><div class="hf-field full"><label>Rentang ayat yang disetorkan</label><div class="hf-range"><input id="hfModalFrom" type="number" min="1" max="${maxAyat}" value="${next.from}" aria-label="Ayat awal"><span>sampai</span><input id="hfModalTo" type="number" min="1" max="${maxAyat}" value="${next.to}" aria-label="Ayat akhir"></div><small>Ayat 1 sampai ${maxAyat}. Rentang boleh sebagian surat.</small></div><div class="hf-field full"><label>Status setoran</label><div class="hf-status-options"><button type="button" class="hf-status-option ${hfModalStatus==='Hafal'?'active':''}" data-status="Hafal" onclick="hfChooseStatus('Hafal')">✓ Hafal</button><button type="button" class="hf-status-option ${hfModalStatus==='Belum hafal'?'active':''}" data-status="Belum hafal" onclick="hfChooseStatus('Belum hafal')">◷ Belum hafal</button></div></div><div class="hf-field full"><label>Catatan guru (opsional)</label><textarea id="hfModalNote" rows="3" placeholder="Contoh: lancar, perlu murajaah, atau lanjut ayat berikutnya">${esc(latest&&latest.note||'')}</textarea></div></div><div class="hf-form-actions"><button class="hf-cancel" onclick="hfBackToList()">Batal</button><button class="hf-save" onclick="hfSaveCurrent()">Simpan setoran</button></div></div>`;
 }
 backdrop.innerHTML=`<div class="hf-modal"><header class="hf-modal-top"><div class="hf-modal-person"><div class="hf-modal-avatar">${initials(s.name)}</div><div><h3>Catatan Hafalan Anak</h3><p>${esc(s.name)} · ${esc(className(s.classId))} · pilih level dan surat</p></div></div><button class="hf-modal-close" onclick="closeStudentHafalan()" aria-label="Tutup">×</button></header><div class="hf-modal-content"><div class="hf-slider ${hfModalSurah!==null?'show-form':''}"><section class="hf-slide"><div class="hf-level-tabs">${Object.keys(HAFALAN_CURRICULUM).map(l=>`<button class="hf-level-btn ${l===hfModalLevel?'active':'locked'}" onclick="hfChangeLevel('${l}')">${lvLabel(l)}</button>`).join('')}</div><div class="hf-level-progress"><div><span>Capaian level ${esc(hfModalLevel)}</span><b>${levelStats.pct}%</b></div><div class="hf-level-track"><i style="width:${levelStats.pct}%"></i></div><small>${levelStats.hafal} dari ${levelStats.total} ayat sudah hafal</small></div><div class="hf-summary"><span>Surat level ini: <b>${catalog.length}</b></span><span>Surat tuntas: <b>${done}</b></span><span>Surat mulai dicatat: <b>${notDone}</b></span></div><div class="hf-list-title"><h4>Daftar surat hafalan</h4><small>Pilih surat untuk mencatat setoran →</small></div><div class="hf-surah-cards">${listHtml}</div></section><section class="hf-slide">${formHtml}</section></div></div><footer class="hf-modal-foot"><span>Catatan hafalan ${esc(s.name)}</span><span>Level ${esc(hfModalLevel)}</span></footer></div>`;
}
function hfChangeLevel(level){hfModalLevel=level;hfModalSurah=null;let s=students.find(x=>String(x.id)===String(hfModalStudentId));if(s){s.hafalanLevel=level;save()}hfModalStatus='Hafal';renderHafalanModal()}
function hfOpenSurah(i){hfModalSurah=i;const s=students.find(x=>String(x.id)===String(hfModalStudentId));const [name,max]=((HAFALAN_CURRICULUM[hfModalLevel]||HAFALAN_CURRICULUM['1'])[i]||[]);const next=s&&name?hfNextRange(s,name,max):{from:1,to:max};hfModalStatus='Hafal';renderHafalanModal();}
function hfSaveCurrent(){
 const s=students.find(x=>String(x.id)===String(hfModalStudentId));if(!s||hfModalSurah===null)return;
 const catalog=HAFALAN_CURRICULUM[hfModalLevel]||HAFALAN_CURRICULUM['1'],[name,maxAyat]=catalog[hfModalSurah];
 const from=Number(document.getElementById('hfModalFrom').value),to=Number(document.getElementById('hfModalTo').value),note=document.getElementById('hfModalNote').value.trim();
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to>maxAyat){toast(`Rentang ayat ${name} harus antara 1–${maxAyat}.`);return}
 if(!['Hafal','Belum hafal'].includes(hfModalStatus)){toast('Pilih status Hafal atau Belum hafal.');return}
 s.hafalanLevel=hfModalLevel;s.surahProgress=s.surahProgress||{};
 const existing=s.surahProgress[name]||{},ranges=hfRangesFor(s,name);
 ranges.push({from,to,status:hfModalStatus,date:today(),note});
 s.surahProgress[name]={level:hfModalLevel,surah:name,ranges,from,to,status:hfModalStatus,date:today(),note};
 logs.push({id:Date.now(),studentId:s.id,studentName:s.name,classId:s.classId,date:today(),surah:name,from,to,status:hfModalStatus,note:`Level ${hfModalLevel}${note?' · '+note:''}`});
 save();selectedClass=null;selectedHafalanStudent=null;const classDetailEl=document.getElementById('classDetail');if(classDetailEl)classDetailEl.style.display='none';refresh();hfModalSurah=null;renderHafalanModal();toast(`Setoran ${name} tersimpan. Kembali ke daftar surat.`);
}

