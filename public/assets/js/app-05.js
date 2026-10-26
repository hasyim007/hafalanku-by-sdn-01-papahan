
/* Dashboard: ringkasan yang bisa ditindaklanjuti. Target surat, timer, dan daftar kelas dipindah ke menu masing-masing. */
renderDashboard=function(){
 const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const act=students.filter(s=>s.status!=='Nonaktif'),total=act.length,alum=students.filter(s=>s.alumni).length,avg=total?Math.round(act.reduce((a,s)=>a+pct(s),0)/total):0;
 const days=[...Array(7)].map((_,i)=>{let d=new Date();d.setDate(d.getDate()-(6-i));return d}),cnt=days.map(d=>activeLogs().filter(l=>l.date===key(d)).length),mx=Math.max(1,...cnt);
 const todayLogs=activeLogs().filter(l=>l.date===today());
 $('statStudents').textContent=total;$('dbStudentsSub').textContent=classes.length+' kelas';
 $('statToday').textContent=todayLogs.length;$('dbTodaySub').textContent=new Set(todayLogs.map(l=>l.studentId)).size+' anak menyetor';
 $('statAvg').textContent=avg+'%';
 $('weekBars').innerHTML=days.map((d,i)=>`<div class="col${i==6?' today':''}" title="${cnt[i]} setoran"><div class="track">${cnt[i]?`<div class="fill" style="height:${Math.max(22,cnt[i]/mx*100)}%"></div>`:''}</div><span>${'MSSRKJS'[d.getDay()]}</span></div>`).join('');
 $('weekTotal').textContent=cnt.reduce((a,b)=>a+b,0)+' setoran tercatat';
 /* belum setor 7 hari */
 const from=key(days[0]),last=new Map();activeLogs().forEach(l=>{if(!last.has(l.studentId)||l.date>last.get(l.studentId))last.set(l.studentId,l.date)});
 const idle=act.filter(s=>!(last.get(s.id)>=from)).sort((a,b)=>(last.get(a.id)||'')<(last.get(b.id)||'')?-1:1);
 $('dbIdle').textContent=idle.length;
 $('dbIdleList').innerHTML=idle.slice(0,5).map(s=>`<div class="kid"><span class="face">${esc(initials(s.name))}</span><div><b>${esc(s.name)}</b><small>${esc(className(s.classId))} · ${last.get(s.id)?'Terakhir '+niceDate(last.get(s.id)):'Belum pernah setor'}</small></div></div>`).join('')||'<div class="empty">Semua anak sudah menyetor dalam 7 hari terakhir.</div>';
 /* capaian per tingkat */
 const grades=[...new Set(classes.map(c=>c.grade).filter(Boolean))].sort((a,b)=>a-b);
 $('dbGrades').innerHTML=grades.map(g=>{const ids=new Set(classes.filter(c=>c.grade==g).map(c=>c.id)),l=act.filter(s=>ids.has(s.classId)),p=l.length?Math.round(l.reduce((a,s)=>a+pct(s),0)/l.length):0;return `<div class="dd-bar"><em>Kelas ${g}</em><div class="bar"><span style="width:${p}%"></span></div><b>${p}%</b></div>`}).join('')||'<div class="empty">Belum ada kelas.</div>';
 /* status hafalan */
 let n=act.length,a=act.filter(s=>pctF(s)>=100).length,b=act.filter(s=>pctF(s)>=25&&pctF(s)<100).length,m=n-a-b,off=0;
 const seg=[[a,'#3d4ef0','Tercapai'],[b,'#ff5d5d','Berkembang'],[m,'#d9dcea','Mulai']];
 $('gArcs').innerHTML=seg.map(([v,c])=>{let l=n?v/n*100:0,p=`<path d="M20 100A80 80 0 0 1 180 100" pathLength="100" fill="none" stroke="${c}" stroke-width="22" stroke-dasharray="${l} ${100-l}" stroke-dashoffset="${-off}"/>`;off+=l;return p}).join('');
 $('gNum').textContent=avg+'%';
 $('gLeg').innerHTML=seg.map(([v,c,t])=>`<span><i style="background:${c}"></i>${t} ${v}</span>`).join('');
 /* setoran terbaru */
 $('dbRecent').innerHTML=[...activeLogs()].sort((x,y)=>(y.date+String(y.id)).localeCompare(x.date+String(x.id))).slice(0,5).map(l=>`<div class="kid"><span class="face">${esc(initials(l.studentName||'?'))}</span><div><b>${esc(l.studentName)}</b><small>${esc(l.surah)} ${l.from}–${l.to} · ${niceDate(l.date)}</small></div><span class="st ${needsRepeat(l.status)?'mid':'ok'}" style="margin-left:auto">${esc(l.status)}</span></div>`).join('')||'<div class="empty">Belum ada setoran tercatat.</div>';
};
const _ddRender=renderDashboard;
renderDashboard=function(){_ddRender();
 const col={1:'#d3d7e8',2:'#9ba6fa',3:'#3d4ef0',4:'#1c2796'},actL=students.filter(s=>s.status!=='Nonaktif'),n=actL.length,sum=achievementSummary(actL);
 $('lvSub').textContent=n+' anak aktif di '+classes.length+' kelas · rata-rata capaian '+sum.avg+'%';
 $('lvBar').innerHTML=n?sum.levels.filter(l=>l.count).map(l=>`<span style="flex:${l.count};background:${col[l.n]}" title="Level ${l.n} ${l.name}: ${l.count} anak"></span>`).join(''):'<span style="flex:1;background:#eceef7"></span>';
 $('lvGrid').innerHTML=sum.levels.map(l=>{const p=n?Math.round(l.count/n*100):0;return `<button type="button" class="dd-lv" onclick="go('capaian')"><div class="dd-lv-top"><i style="background:${col[l.n]}"></i><span>Level ${l.n}</span></div><h4>${l.name}</h4><div class="dd-lv-num"><b>${l.count}</b><small>anak · ${p}%</small></div><p>${l.min}%–${l.max}% target ayat</p></button>`}).join('');
};
renderDashboard();
