
/* ===== Tahap 3: Pesan untuk Orang Tua & Grafik Perkembangan =====
   Pesan disimpan di hkMessages: satu baris per anak, berisi teks, status edit, dan tanggal.
   Strukturnya sederhana agar mudah dipindah ke server nanti.
   Grafik dihitung dari catatan setoran (hkLogs). Tidak ada pembanding antaranak. */
(function(){
const PM_KEY='hkMessages',PM_MAX=600,PM_MIN=10,PG_MIN=3;
const PG_MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const PM_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12z"/></svg>';
const PG_CSS=`
.pm-note{position:relative;margin:0;padding:22px 26px 20px 30px;background:linear-gradient(180deg,#fffdf7,#fbf5e7);border:1px solid #eee0bd;border-left:3px solid #e0a84f;border-radius:18px;box-shadow:0 10px 30px #205c4c0a;overflow:hidden;break-inside:avoid}
.pm-note-mark{position:absolute;right:18px;top:-10px;font-family:Amiri,Georgia,serif;font-size:72px;line-height:1;color:#e0a84f;opacity:.4;pointer-events:none}
.pm-note p{position:relative;margin:0;font-size:14.5px;line-height:1.9;color:#1d2d29;white-space:pre-line}
.pm-note figcaption{position:relative;margin-top:14px;font-size:12px;font-weight:600;color:#6f8580}
.pg-wrap{margin:0;padding:18px 18px 14px;background:#fff;border:1px solid #e3ece9;border-radius:18px;box-shadow:0 10px 30px #205c4c0a;break-inside:avoid}
.pg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.pg-svg{display:block;width:100%;height:auto;min-width:520px}
.pg-grid{stroke:#e3ece9;stroke-width:1;stroke-dasharray:3 4}
.pg-tick,.pg-x,.pg-end,.pg-endu{font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif}
.pg-tick,.pg-x{fill:#7d8f8a}
.pg-tick{font-size:11px}
.pg-x{font-size:11.5px;font-weight:600}
.pg-line{stroke:#0f6b54;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.pg-mark{fill:#fff;stroke:#0f6b54;stroke-width:2.2}
.pg-end-dot{fill:#0f6b54;stroke:#fff;stroke-width:2.5}
.pg-end{font-size:24px;font-weight:800;fill:#0a4237}
.pg-endu{font-size:11px;font-weight:600;fill:#6f8580}
.pg-foot{display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;margin:12px 0 0;padding:0;font-size:12px;color:#6f8580}
.pg-foot span{display:inline-flex;align-items:center;gap:7px}
.pg-span{margin-left:auto;font-weight:700;color:#4b5f5a}
.pg-k{display:inline-block;flex:none}
.pg-k-dot{width:10px;height:10px;border-radius:50%;border:2.2px solid #0f6b54;background:#fff}
.pg-k-line{width:18px;height:0;border-top:2.6px solid #0f6b54}
.pg-cap{margin:10px 0 0;font-size:12.5px;line-height:1.6;color:#4b5f5a}
.pg-empty{padding:24px 20px;border:1.5px dashed #cfe3db;border-radius:16px;background:#fafcfb;text-align:center;font-size:13.5px;line-height:1.7;color:#6f8580}
@media print{.pg-wrap,.pm-note{box-shadow:none}}
.pm-back{position:fixed;inset:0;z-index:9000;background:rgba(10,40,33,.38);display:grid;place-items:center;padding:20px;animation:pmFade .18s ease both}
@keyframes pmFade{from{opacity:0}to{opacity:1}}
.pm-modal{width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 30px 80px rgba(10,66,55,.28);display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1d2d29;text-align:left}
.pm-head{display:flex;align-items:center;gap:14px;padding:22px 22px 18px;border-bottom:1px solid #ecf2f1}
.pm-av{width:46px;height:46px;border-radius:15px;background:linear-gradient(145deg,#18a580,#128164);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px;flex:none;box-shadow:0 8px 18px #0f6b5433}
.pm-av.soft{background:#f4d9a0;color:#7a5410;box-shadow:none}
.pm-av svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pm-who{flex:1;min-width:0}
.pm-who small{display:block;font-size:11px;font-weight:700;color:#a8741f;letter-spacing:.6px;text-transform:uppercase}
.pm-who h3{margin:3px 0 0;font-size:18px;letter-spacing:-.3px;color:#0d3b30}
.pm-who p{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#8b9d98}
.pm-x{width:34px;height:34px;border-radius:50%;background:#f3f7f6;color:#5b6f69;font-size:20px;line-height:1;flex:none}
.pm-body{padding:20px 22px 6px;display:grid;gap:12px}
.pm-stat{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:#8b9d98}
.pm-badge{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;font-size:11.5px;font-weight:700}
.pm-badge.auto{background:#e8f4ef;color:#0f6b54}
.pm-badge.edit{background:#fbf1dc;color:#8a5a12}
.pm-badge.none{background:#f1f4f3;color:#66807a}
.pm-lbl{font-size:13px;font-weight:700;color:#1d2d29}
.pm-ta{width:100%;border:1.5px solid #e1ebe8;border-radius:16px;padding:14px 16px;font:inherit;font-size:14.5px;line-height:1.75;color:#1d2d29;background:#fbfdfc;resize:vertical;min-height:132px;transition:border-color .2s,box-shadow .2s,background .2s}
.pm-ta:focus{outline:none;border-color:#2f9174;background:#fff;box-shadow:0 0 0 4px rgba(47,145,116,.14)}
.pm-count{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#8b9d98}
.pm-count b{color:#4b5f5a;font-weight:700;white-space:nowrap}
.pm-hint{margin:0;font-size:12px;line-height:1.6;color:#6f8580;background:#f6fbf9;border-radius:12px;padding:10px 12px}
.pm-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:16px 22px 20px}
.pm-l,.pm-r{display:flex;gap:8px;flex-wrap:wrap}
.pm-btn{height:42px;padding:0 16px;border-radius:13px;border:1.5px solid #cfe3db;background:#fff;color:#0f6b54;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s}
.pm-btn:hover{background:#f3faf7;border-color:#2f9174}
.pm-btn.primary{background:#0f6b54;border-color:#0f6b54;color:#fff;box-shadow:0 8px 18px #0f6b5433}
.pm-btn.primary:hover{background:#0d5645}
.pm-btn.light{background:#f6f9f8;border-color:#e3ece9;color:#4b5f5a}
.pm-btn.danger{color:#b4232f;border-color:#f1c7cb}
.pm-btn.danger:hover{background:#fdf1f2;border-color:#e89aa2}
.pm-btn:disabled{opacity:.45;cursor:not-allowed}
.pm-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;background:#f1f6f4;border-radius:14px}
.pm-seg label{position:relative;cursor:pointer}
.pm-seg input{position:absolute;opacity:0;pointer-events:none}
.pm-seg span{display:block;text-align:center;padding:10px 8px;border-radius:11px;font-size:13px;font-weight:700;color:#6f8580}
.pm-seg input:checked+span{background:#fff;color:#0f6b54;box-shadow:0 1px 6px rgba(15,107,84,.16)}
.pm-seg input:focus-visible+span{outline:2px solid #2f9174;outline-offset:2px}
.pm-sel{width:100%;height:46px;border:1.5px solid #e1ebe8;border-radius:14px;padding:0 14px;font:inherit;font-size:14px;color:#1d2d29;background:#fff}
.pm-sum{font-size:13px;line-height:1.6;color:#4b5f5a;background:#fbf6ea;border:1px solid #f1e4c4;border-radius:14px;padding:12px 14px}
.pm-link{background:none;border:0;color:#b4232f;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;padding:4px 6px}
.pm-hf{display:inline-flex;align-items:center;height:36px;padding:0 14px;margin-right:8px;border-radius:999px;border:1.5px solid #cfe3db;background:#fff;color:#0f6b54;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap}
.pm-hf:hover{background:#f3faf7;border-color:#2f9174}
.ds-btn.pm-rowbtn[data-st="edit"]{color:#a8741f}
.ds-btn.pm-rowbtn[data-st="none"]{opacity:.5}
@media (max-width:600px){.pm-back{place-items:end center;padding:0}.pm-modal{width:100%;max-height:92vh;border-radius:24px 24px 0 0}}
`;
const pmId=x=>String(x);
let pmStore=pmLoad(),PG_UID=0,pmPrevOverflow='';

function pmLoad(){
  try{const o=JSON.parse(HKLS.getItem(PM_KEY)||'null');
    if(o&&o.v===1&&Array.isArray(o.items)&&Array.isArray(o.generated))return o;
  }catch(e){}
  return{v:1,items:[],generated:[]};
}
function pmPersist(){
  try{HKLS.setItem(PM_KEY,JSON.stringify(pmStore));return true}
  catch(e){toast('Pesan belum tersimpan.');return false}
}
function pmItem(id){return pmStore.items.find(x=>pmId(x.studentId)===pmId(id))||null}
function pmGenSet(){return new Set(pmStore.generated.map(pmId))}
function pmNow(){return new Date().toISOString()}
function pmDays(d){const t=Date.parse(String(d||'')+'T00:00:00');return isNaN(t)?9999:Math.floor((Date.now()-t)/864e5)}
function pmName(s){const f=String(s.name||'').trim().split(/\s+/)[0];return f?'Ananda '+f:'Ananda'}
function pmEligible(s){return !s.alumni&&s.status!=='Nonaktif'}

/* Pesan otomatis: dibuat dari capaian anak saat itu. Hanya dipakai sekali per anak
   (atau bila guru meminta "Buat ulang dari data"). */
function pmAutoText(s){
  const x=rpStat(s),f=pmName(s),P=s.surahProgress||{};
  const mine=logs.filter(l=>pmId(l.studentId)===pmId(s.id));
  const lastOf=n=>{let d='';mine.forEach(l=>{if(l.surah===n&&String(l.date)>d)d=String(l.date)});return d||String((P[n]||{}).date||'')};
  const done=x.surahs.filter(z=>z.status==='Tuntas').map(z=>z.name);
  const part=x.surahs.filter(z=>z.status==='Sebagian');
  const out=[];
  if(x.tamat)out.push(`${f} telah menamatkan seluruh surat pada level terakhir. Alhamdulillah.`);
  else if(done.length){
    const recent=done.slice().sort((a,b)=>lastOf(b).localeCompare(lastOf(a)));
    out.push(done.length===1?`${f} telah menuntaskan surat ${recent[0]}.`:`${f} telah menuntaskan ${done.length} surat, terakhir surat ${recent[0]}.`);
  }else if(part.length){const p=part[0];out.push(`${f} sedang menghafal surat ${p.name}, ${p.hafal} dari ${p.max} ayat.`)}
  else out.push(`${f} sedang memulai hafalan di Level ${x.level}.`);
  if(!x.tamat&&x.ready)out.push(`Ananda sudah siap mengikuti ujian kenaikan level.`);
  else if(done.length){
    const oldest=done.slice().sort((a,b)=>lastOf(a).localeCompare(lastOf(b)))[0];
    if(pmDays(lastOf(oldest))>=14)out.push(`Mohon bantu Ananda mengulang surat ${oldest} di rumah agar hafalannya tetap terjaga.`);
  }
  out.push('Terima kasih atas dukungan Bapak/Ibu di rumah.');
  return out.join(' ');
}
function pmGenFor(s){
  const t=pmAutoText(s),now=pmNow();
  const row={studentId:s.id,text:t,autoText:t,edited:false,createdAt:now,updatedAt:now};
  pmStore.items.push(row);
  if(!pmGenSet().has(pmId(s.id)))pmStore.generated.push(s.id);
  return row;
}
/* Buat pesan otomatis untuk anak aktif yang belum pernah punya pesan. Anak yang pesannya
   pernah dihapus guru tidak dibuatkan lagi. Pesan milik anak yang sudah dihapus dibersihkan. */
function pmEnsure(){
  const ids=new Set(students.map(s=>pmId(s.id)));
  const n0=pmStore.items.length,g0=pmStore.generated.length;
  pmStore.items=pmStore.items.filter(x=>ids.has(pmId(x.studentId)));
  pmStore.generated=pmStore.generated.filter(g=>ids.has(pmId(g)));
  let changed=pmStore.items.length!==n0||pmStore.generated.length!==g0;
  const gen=pmGenSet();
  students.forEach(s=>{
    if(!pmEligible(s)||gen.has(pmId(s.id)))return;
    const t=pmAutoText(s),now=pmNow();
    pmStore.items.push({studentId:s.id,text:t,autoText:t,edited:false,createdAt:now,updatedAt:now});
    gen.add(pmId(s.id));pmStore.generated.push(s.id);changed=true;
  });
  if(changed)pmPersist();
}
function pmEnsureOne(s){
  if(!pmItem(s.id)&&pmEligible(s)&&!pmGenSet().has(pmId(s.id))){pmGenFor(s);pmPersist()}
  return pmItem(s.id);
}

/* ---------- Grafik perkembangan ---------- */
function pgSmooth(P){
  const n=P.length,f=v=>v.toFixed(1);
  let p=`M${f(P[0][0])},${f(P[0][1])}`;
  if(n<2)return p;
  const dx=[],d=[],m=[];
  for(let i=0;i<n-1;i++){dx.push(P[i+1][0]-P[i][0]);d.push((P[i+1][1]-P[i][1])/dx[i])}
  m[0]=d[0];m[n-1]=d[n-2];
  for(let i=1;i<n-1;i++)m[i]=(d[i-1]*d[i]<=0)?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){ /* Fritsch–Carlson: kurva tidak melewati nilai ekstrem */
    if(d[i]===0){m[i]=0;m[i+1]=0;continue}
    const a=m[i]/d[i],b=m[i+1]/d[i],s2=a*a+b*b;
    if(s2>9){const t=3/Math.sqrt(s2);m[i]=t*a*d[i];m[i+1]=t*b*d[i]}
  }
  for(let i=0;i<n-1;i++){
    const h=dx[i]/3;
    p+=` C${f(P[i][0]+h)},${f(P[i][1]+m[i]*h)} ${f(P[i+1][0]-h)},${f(P[i+1][1]-m[i+1]*h)} ${f(P[i+1][0])},${f(P[i+1][1])}`;
  }
  return p;
}
/* Urutan bulan dan total ayat hafal diambil dari catatan setoran, diputar ulang per tanggal.
   Hanya status "Hafal"/"Lancar" yang menambah ayat; "Belum hafal" menguranginya; murajaah tidak mengubah total. */
function pgSeries(s){
  const L=logs.filter(l=>pmId(l.studentId)===pmId(s.id)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(L.length<PG_MIN)return{n:L.length,months:[],comps:[],total:0};
  const cur=new Map(),done=new Set(),byMon=new Map(),comps=[];
  let total=0;
  L.forEach(l=>{
    const mk=String(l.date).slice(0,7),max=LV_MASTER.get(l.surah);
    if(max){
      const v=(l.status==='Hafal'||l.status==='Lancar')?1:(l.status==='Belum hafal'||l.status==='Belum lancar')?0:-1;
      if(v>=0){
        let arr=cur.get(l.surah);if(!arr){arr=new Uint8Array(max);cur.set(l.surah,arr)}
        const a=Math.max(1,Number(l.from)||1),b=Math.min(max,Number(l.to)||0);
        for(let n=a;n<=b;n++){if(arr[n-1]!==v){arr[n-1]=v;total+=v?1:-1}}
        if(v===0&&done.has(l.surah)&&!arr.every(z=>z===1)){done.delete(l.surah);for(let q=comps.length-1;q>=0;q--)if(comps[q].name===l.surah)comps.splice(q,1)}
        if(v===1&&!done.has(l.surah)&&arr.every(z=>z===1)){done.add(l.surah);comps.push({month:mk,name:l.surah})}
      }
    }
    byMon.set(mk,total);
  });
  const keys=[...byMon.keys()].sort();
  let [y,m]=keys[0].split('-').map(Number);
  const [yl,ml]=keys[keys.length-1].split('-').map(Number);
  const seq=[];
  while(y<yl||(y===yl&&m<=ml)){seq.push(y+'-'+String(m).padStart(2,'0'));if(++m>12){m=1;y++}}
  if(seq.length<2){let [y0,m0]=keys[0].split('-').map(Number);if(--m0<1){m0=12;y0--}seq.unshift(y0+'-'+String(m0).padStart(2,'0'))}
  let carry=0;
  const months=seq.map(k=>{if(byMon.has(k))carry=byMon.get(k);return{key:k,value:carry,label:PG_MON[Number(k.slice(5))-1],year:k.slice(0,4)}});
  const cs=comps.map(c=>({name:c.name,idx:months.findIndex(z=>z.key===c.month)}));
  return{n:L.length,months,comps:cs,total:months[months.length-1].value};
}
function pgSvg(se){
  const W=640,H=272,pl=52,pr=92,pt=24,pb=44,pw=W-pl-pr,ph=H-pt-pb;
  const M=se.months,n=M.length,vmax=Math.max(0,...M.map(z=>z.value));
  const want=vmax*1.12,steps=[5,10,20,25,50,100,200,250,500,1000,2000,2500,5000];
  const ystep=steps.find(q=>q>=want/4)||5000;
  const top=Math.max(ystep*2,Math.ceil(want/ystep)*ystep);
  const ticksV=[];for(let v=0;v<=top+1e-9;v+=ystep)ticksV.push(v);
  const X=i=>n<2?pl+pw/2:pl+i*pw/(n-1),Y=v=>pt+ph*(1-v/top);
  const P=M.map((z,i)=>[X(i),Y(z.value)]);
  const f=v=>v.toFixed(1),base=pt+ph;
  const path=pgSmooth(P);
  const area=`${path} L${f(P[n-1][0])},${f(base)} L${f(P[0][0])},${f(base)} Z`;
  const gid='pgg'+(++PG_UID);
  const grid=ticksV.map(v=>`<line class="pg-grid" x1="${pl}" x2="${W-pr}" y1="${f(Y(v))}" y2="${f(Y(v))}"/><text class="pg-tick" x="${pl-12}" y="${f(Y(v)+4)}" text-anchor="end">${v}</text>`).join('');
  const step=n<=8?1:Math.ceil(n/7);
  const xl=M.map((z,i)=>{if(i%step&&i!==n-1)return'';const t=(i===0||z.key.slice(5)==='01')?`${z.label} ${z.year}`:z.label;return `<text class="pg-x" x="${f(X(i))}" y="${H-14}" text-anchor="middle">${t}</text>`}).join('');
  const marks=M.map((z,i)=>{const c=se.comps.filter(q=>q.idx===i);if(!c.length)return'';return `<circle class="pg-mark" cx="${f(P[i][0])}" cy="${f(P[i][1])}" r="5.5"><title>${esc('Surah tuntas: '+c.map(q=>q.name).join(', ')+' ('+z.label+' '+z.year+')')}</title></circle>`}).join('');
  const L=P[n-1];
  const endLbl=`<text class="pg-end" x="${f(L[0]+14)}" y="${f(L[1]+5)}">${se.total}</text><text class="pg-endu" x="${f(L[0]+14)}" y="${f(L[1]+21)}">ayat</text>`;
  const a0=M[0],a1=M[n-1];
  const aria=`Grafik total ayat hafal dari ${a0.label} ${a0.year} sampai ${a1.label} ${a1.year}, total ${se.total} ayat`;
  return `<svg class="pg-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f6b54" stop-opacity=".2"/><stop offset="1" stop-color="#0f6b54" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#${gid})"/><path class="pg-line" d="${path}" fill="none"/>${marks}<circle class="pg-end-dot" cx="${f(L[0])}" cy="${f(L[1])}" r="6"/>${endLbl}${xl}</svg>`;
}
function pgCaption(se){
  const c=se.comps;
  if(!c.length)return 'Surah yang tuntas akan tercatat di grafik ini.';
  const recent=c.slice(-3).map(q=>q.name).reverse();
  return `${c.length} surah tuntas · terbaru: ${recent.join(', ')}`;
}
function pgRaporSec(s){
  const se=pgSeries(s),meta='Total ayat hafal per bulan';
  if(se.n<PG_MIN)return rpSec('Perkembangan hafalan',meta,'<div class="pg-empty">Grafik akan muncul setelah ada beberapa catatan setoran.</div>');
  const a=se.months[0],b=se.months[se.months.length-1];
  const span=a.key===b.key?`${a.label} ${a.year}`:`${a.label} ${a.year} – ${b.label} ${b.year}`;
  return rpSec('Perkembangan hafalan',meta,`<figure class="pg-wrap"><div class="pg-scroll">${pgSvg(se)}</div><figcaption class="pg-foot"><span><i class="pg-k pg-k-dot"></i>Surah tuntas</span><span><i class="pg-k pg-k-line"></i>Total ayat hafal</span><span class="pg-span">${esc(span)}</span></figcaption><p class="pg-cap">${esc(pgCaption(se))}</p></figure>`);
}

/* ---------- Pesan di rapor ---------- */
function pmRaporSec(s){
  const it=pmEnsureOne(s);
  if(!it||!String(it.text||'').trim())return'';
  const by=rpTahfidz()||'Guru Tahfidz';
  const when=it.updatedAt?niceDate(String(it.updatedAt).slice(0,10)):'';
  return rpSec('Pesan untuk orang tua','',`<figure class="pm-note"><span class="pm-note-mark" aria-hidden="true">“</span><p>${esc(it.text)}</p><figcaption>${esc(by)}${when?' · '+esc(when):''}</figcaption></figure>`);
}

/* ---------- Penampil modal ---------- */
function pmClose(){
  const b=document.getElementById('pmBack');if(b)b.remove();
  document.removeEventListener('keydown',pmKey);
  document.body.style.overflow=pmPrevOverflow;
}
function pmKey(e){if(e.key==='Escape')pmClose()}
function pmShow(html){
  pmClose();
  const bd=document.createElement('div');
  bd.className='pm-back';bd.id='pmBack';
  bd.setAttribute('role','dialog');bd.setAttribute('aria-modal','true');
  bd.innerHTML=html;
  document.body.appendChild(bd);
  pmPrevOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  bd.addEventListener('click',e=>{if(e.target===bd)pmClose()});
  document.addEventListener('keydown',pmKey);
  return bd;
}
function pmOn(root,sel,fn){const el=root.querySelector(sel);if(el)el.addEventListener('click',fn);return el}
function pmRefreshUi(){try{pmDecorateRows()}catch(e){}}

/* Pesan satu anak */
function pmOpen(id){
  const s=students.find(x=>pmId(x.id)===pmId(id));if(!s)return;
  const it=pmEnsureOne(s);
  const edited=!!(it&&it.edited);
  const badge=!it?'<span class="pm-badge none">Belum ada pesan</span>':edited?'<span class="pm-badge edit">Sudah diedit</span>':'<span class="pm-badge auto">Pesan otomatis</span>';
  const when=it&&it.updatedAt?'Diubah '+niceDate(String(it.updatedAt).slice(0,10)):'';
  const bd=pmShow(`<div class="pm-modal" role="document">
    <header class="pm-head"><span class="pm-av">${esc(initials(s.name))}</span><div class="pm-who"><small>Pesan untuk orang tua</small><h3>${esc(s.name)}</h3><p>${esc(className(s.classId))} · Level ${esc(defaultHafalanLevel(s))}</p></div><button class="pm-x" type="button" data-act="close" aria-label="Tutup">×</button></header>
    <div class="pm-body">
      <div class="pm-stat">${badge}<span>${esc(when)}</span></div>
      <label class="pm-lbl" for="pmText">Isi pesan</label>
      <textarea id="pmText" class="pm-ta" rows="6" maxlength="${PM_MAX}" placeholder="Tulis pesan untuk orang tua..."></textarea>
      <div class="pm-count"><span>Tampil di rapor orang tua sampai Anda menghapusnya.</span><b id="pmCnt"></b></div>
      <p class="pm-hint" id="pmHint">Pesan otomatis dibuat sekali dari capaian anak. Kalimat yang Anda ubah tidak akan tertimpa otomatis. "Buat ulang dari data" mengisi kalimat dengan capaian terbaru.</p>
      <p class="pm-hint">Pesan langsung tampil di portal orang tua setelah tersimpan.</p>
    </div>
    <footer class="pm-foot">
      <div class="pm-l">${it?'<button type="button" class="pm-btn danger" data-act="remove">Hapus pesan</button>':''}<button type="button" class="pm-btn light" data-act="regen">Buat ulang dari data</button></div>
      <div class="pm-r"><button type="button" class="pm-btn light" data-act="close">Batal</button><button type="button" class="pm-btn primary" data-act="save">Simpan Pesan</button></div>
    </footer></div>`);
  const ta=bd.querySelector('#pmText'),cnt=bd.querySelector('#pmCnt'),hint=bd.querySelector('#pmHint');
  ta.value=it?it.text:'';
  const upd=()=>{cnt.textContent=ta.value.length+'/'+PM_MAX};
  upd();
  ta.addEventListener('input',upd);
  bd.querySelectorAll('[data-act="close"]').forEach(b=>b.addEventListener('click',pmClose));
  pmOn(bd,'[data-act="save"]',()=>{
    const v=ta.value.trim();
    if(!v){toast('Isi pesan belum diisi. Gunakan Hapus pesan untuk menghapusnya.');return}
    if(v.length<PM_MIN){toast('Pesan terlalu pendek. Tulis minimal '+PM_MIN+' karakter.');return}
    const cur=pmItem(s.id),fresh=pmAutoText(s);
    const isAuto=v===fresh||!!(cur&&v===cur.autoText);
    const autoText=v===fresh?fresh:(cur?cur.autoText:fresh);
    const now=pmNow();
    if(cur){cur.text=v;cur.edited=!isAuto;cur.autoText=autoText;cur.updatedAt=now}
    else pmStore.items.push({studentId:s.id,text:v,autoText,edited:!isAuto,createdAt:now,updatedAt:now});
    if(!pmGenSet().has(pmId(s.id)))pmStore.generated.push(s.id);
    if(pmPersist()){pmClose();toast('Pesan untuk orang tua tersimpan.');pmRefreshUi()}
  });
  pmOn(bd,'[data-act="regen"]',async()=>{
    const cur=pmItem(s.id);
    if(cur&&cur.edited&&!(await HK.confirm('Kalimat yang sudah Anda ubah akan diganti dengan pesan otomatis terbaru. Lanjutkan?','Buat Ulang')))return;
    ta.value=pmAutoText(s);upd();
    hint.textContent='Pesan diisi ulang dari capaian terbaru. Klik Simpan Pesan untuk menyimpannya.';
  });
  pmOn(bd,'[data-act="remove"]',async()=>{
    if(!pmItem(s.id))return;
    if(!(await HK.confirm('Hapus pesan untuk '+s.name+'? Pesan tidak lagi tampil di rapor orang tua.','Hapus')))return;
    const gone=pmItem(s.id);pmStore.items=pmStore.items.filter(x=>pmId(x.studentId)!==pmId(s.id));
    if(pmPersist()){pmClose();pmRefreshUi();HKFB.undoable('Pesan dihapus.',()=>{if(gone&&!pmItem(s.id))pmStore.items.push(gone);pmPersist();pmRefreshUi()})}
  });
  ta.focus();
}

/* Hapus semua pesan: satu kelas atau seluruh sekolah */
function pmOpenBulk(scope,cid){
  const list=rpSortedClasses();
  const cur=cid!=null&&cid!==''?pmId(cid):(list[0]?pmId(list[0].id):'');
  const opts=list.map(c=>`<option value="${esc(c.id)}"${pmId(c.id)===cur?' selected':''}>Kelas ${esc(c.name)}</option>`).join('');
  const isSchool=scope==='school';
  const bd=pmShow(`<div class="pm-modal" role="document">
    <header class="pm-head"><span class="pm-av soft">${PM_ICON}</span><div class="pm-who"><small>Pesan untuk orang tua</small><h3>Hapus Semua Pesan</h3><p>Pesan yang dihapus tidak tampil lagi di rapor orang tua.</p></div><button class="pm-x" type="button" data-act="close" aria-label="Tutup">×</button></header>
    <div class="pm-body">
      <div class="pm-seg" role="radiogroup" aria-label="Cakupan penghapusan">
        <label><input type="radio" name="pmScope" value="class"${isSchool?'':' checked'}><span>Satu kelas</span></label>
        <label><input type="radio" name="pmScope" value="school"${isSchool?' checked':''}><span>Seluruh sekolah</span></label>
      </div>
      <div id="pmClsWrap"><label class="pm-lbl" for="pmCls">Pilih kelas</label><select id="pmCls" class="pm-sel">${opts}</select></div>
      <div class="pm-sum" id="pmSum"></div>
      <p class="pm-hint">Pesan tidak dibuat ulang otomatis. Anda tetap bisa menulis pesan baru untuk anak yang pesannya dihapus.</p>
    </div>
    <footer class="pm-foot"><span></span><div class="pm-r"><button class="pm-btn light" type="button" data-act="close">Batal</button><button class="pm-btn danger" type="button" id="pmBulkGo">Hapus Pesan</button></div></footer>
  </div>`);
  const scopeOf=()=>{const r=bd.querySelector('input[name="pmScope"]:checked');return r?r.value:'class'};
  const classOf=()=>bd.querySelector('#pmCls').value;
  const inScope=(it,scope,c)=>{
    if(scope==='school')return true;
    const st=students.find(x=>pmId(x.id)===pmId(it.studentId));
    return !!st&&pmId(st.classId)===pmId(c);
  };
  const whereOf=(scope,c)=>scope==='school'?'seluruh sekolah':'kelas '+((classes.find(x=>pmId(x.id)===pmId(c))||{}).name||'');
  const sync=()=>{
    const scope=scopeOf(),c=classOf();
    bd.querySelector('#pmClsWrap').style.display=scope==='class'?'':'none';
    const n=pmStore.items.filter(it=>inScope(it,scope,c)).length;
    bd.querySelector('#pmSum').textContent=n?`${n} pesan untuk orang tua akan dihapus dari ${whereOf(scope,c)}.`:`Tidak ada pesan untuk orang tua di ${whereOf(scope,c)}.`;
    const go=bd.querySelector('#pmBulkGo');
    go.disabled=!n;go.textContent=n?`Hapus ${n} Pesan`:'Hapus Pesan';
  };
  bd.querySelectorAll('input[name="pmScope"]').forEach(r=>r.addEventListener('change',sync));
  bd.querySelector('#pmCls').addEventListener('change',sync);
  bd.querySelectorAll('[data-act="close"]').forEach(b=>b.addEventListener('click',pmClose));
  pmOn(bd,'#pmBulkGo',async()=>{
    const scope=scopeOf(),c=classOf();
    const n=pmStore.items.filter(it=>inScope(it,scope,c)).length;
    if(!n)return;
    if(!(await HK.confirm(`Hapus ${n} pesan untuk orang tua di ${whereOf(scope,c)}? Tindakan ini tidak bisa dibatalkan, kecuali dengan memulihkan cadangan yang dibuat sebelumnya.`,'Hapus Pesan')))return;
    const gone=pmStore.items.filter(it=>inScope(it,scope,c));pmStore.items=pmStore.items.filter(it=>!inScope(it,scope,c));
    if(pmPersist()){pmClose();pmRefreshUi();HKFB.undoable(n+' pesan dihapus.',()=>{gone.forEach(g=>{if(!pmItem(g.studentId))pmStore.items.push(g)});pmPersist();pmRefreshUi()})}
  });
  sync();
}

/* Buat / perbarui pesan massal: satu kelas atau seluruh sekolah */
function pmOpenBulkGen(scope,cid){
  const list=rpSortedClasses();
  const cur=cid!=null&&cid!==''?pmId(cid):(list[0]?pmId(list[0].id):'');
  const opts=list.map(c=>`<option value="${esc(c.id)}"${pmId(c.id)===cur?' selected':''}>Kelas ${esc(c.name)}</option>`).join('');
  const isSchool=scope==='school';
  const bd=pmShow(`<div class="pm-modal" role="document">
    <header class="pm-head"><span class="pm-av soft">${PM_ICON}</span><div class="pm-who"><small>Pesan untuk orang tua</small><h3>Buat Pesan Massal</h3><p>Pesan dibuat dari capaian terbaru tiap anak, lalu tampil di rapor orang tua.</p></div><button class="pm-x" type="button" data-act="close" aria-label="Tutup">×</button></header>
    <div class="pm-body">
      <div class="pm-seg" role="radiogroup" aria-label="Cakupan pesan">
        <label><input type="radio" name="pmGScope" value="class"${isSchool?'':' checked'}><span>Satu kelas</span></label>
        <label><input type="radio" name="pmGScope" value="school"${isSchool?' checked':''}><span>Seluruh sekolah</span></label>
      </div>
      <div id="pmGClsWrap"><label class="pm-lbl" for="pmGCls">Pilih kelas</label><select id="pmGCls" class="pm-sel">${opts}</select></div>
      <label class="pm-hint" style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="pmGOver" style="margin-top:3px"><span>Timpa juga pesan yang sudah saya edit sendiri</span></label>
      <div class="pm-sum" id="pmGSum"></div>
      <p class="pm-hint">Anak yang belum punya pesan akan dibuatkan. Pesan otomatis diperbarui dengan capaian terbaru. Pesan yang sudah Anda edit dilewati, kecuali kotak di atas dicentang.</p>
    </div>
    <footer class="pm-foot"><span></span><div class="pm-r"><button class="pm-btn light" type="button" data-act="close">Batal</button><button class="pm-btn primary" type="button" id="pmGGo">Buat Pesan</button></div></footer>
  </div>`);
  const scopeOf=()=>{const r=bd.querySelector('input[name="pmGScope"]:checked');return r?r.value:'class'};
  const classOf=()=>bd.querySelector('#pmGCls').value;
  const overOf=()=>bd.querySelector('#pmGOver').checked;
  const whereOf=(sc,c)=>sc==='school'?'seluruh sekolah':'kelas '+((classes.find(x=>pmId(x.id)===pmId(c))||{}).name||'');
  const plan=(sc,c,over)=>{
    const ks=students.filter(x=>pmEligible(x)&&(sc==='school'||pmId(x.classId)===pmId(c)));
    const acts=[];let skip=0,same=0;
    ks.forEach(x=>{const it=pmItem(x.id),t=pmAutoText(x);
      if(!it)acts.push({s:x,t,k:'make'});
      else if(it.edited){if(over)acts.push({s:x,t,k:'edit'});else skip++}
      else if(it.text!==t)acts.push({s:x,t,k:'upd'});
      else same++});
    return{ks,acts,skip,same};
  };
  const sync=()=>{
    const sc=scopeOf(),c=classOf(),over=overOf(),P=plan(sc,c,over);
    bd.querySelector('#pmGClsWrap').style.display=sc==='class'?'':'none';
    const cnt=k=>P.acts.filter(a=>a.k===k).length,make=cnt('make'),upd=cnt('upd'),edit=cnt('edit');
    let t;
    if(!P.ks.length)t=`Tidak ada anak aktif di ${whereOf(sc,c)}.`;
    else{
      const parts=[];
      if(make)parts.push(`${make} pesan baru dibuat`);
      if(upd)parts.push(`${upd} pesan otomatis diperbarui`);
      if(edit)parts.push(`${edit} pesan hasil edit ditimpa`);
      if(P.skip)parts.push(`${P.skip} pesan hasil edit dilewati`);
      if(P.same)parts.push(`${P.same} sudah terbaru`);
      t=`${P.ks.length} anak aktif di ${whereOf(sc,c)}: ${parts.join(', ')||'tidak ada perubahan'}.`;
    }
    bd.querySelector('#pmGSum').textContent=t;
    const go=bd.querySelector('#pmGGo');
    go.disabled=!P.acts.length;go.textContent=P.acts.length?`Buat / Perbarui ${P.acts.length} Pesan`:'Tidak Ada Perubahan';
  };
  bd.querySelectorAll('input[name="pmGScope"]').forEach(r=>r.addEventListener('change',sync));
  bd.querySelector('#pmGCls').addEventListener('change',sync);
  bd.querySelector('#pmGOver').addEventListener('change',sync);
  bd.querySelectorAll('[data-act="close"]').forEach(b=>b.addEventListener('click',pmClose));
  pmOn(bd,'#pmGGo',async()=>{
    const sc=scopeOf(),c=classOf(),over=overOf(),P=plan(sc,c,over);
    if(!P.acts.length)return;
    const nEdit=P.acts.filter(a=>a.k==='edit').length;
    if(nEdit&&!(await HK.confirm(`${nEdit} pesan yang sudah Anda edit akan diganti dengan pesan otomatis terbaru. Lanjutkan?`,'Timpa Pesan')))return;
    const now=pmNow(),gen=pmGenSet();
    P.acts.forEach(({s:x,t,k})=>{
      const it=pmItem(x.id);
      if(it){it.text=t;it.autoText=t;it.edited=false;it.updatedAt=now}
      else pmStore.items.push({studentId:x.id,text:t,autoText:t,edited:false,createdAt:now,updatedAt:now});
      if(!gen.has(pmId(x.id))){gen.add(pmId(x.id));pmStore.generated.push(x.id)}
    });
    if(pmPersist()){pmClose();toast(P.acts.length+' pesan untuk orang tua dibuat/diperbarui.');pmRefreshUi()}
  });
  sync();
}

/* ---------- Titik masuk di menu yang sudah ada ---------- */
function pmDecorateRows(){
  document.querySelectorAll('#dsRows tr').forEach(tr=>{
    const m=(tr.getAttribute('onclick')||'').match(/dsEdit\((\d+)\)/);if(!m)return;
    const act=tr.querySelector('.ds-c-act');if(!act)return;
    const s=students.find(x=>pmId(x.id)===m[1]);if(!s)return;
    const it=pmItem(s.id),st=!it?'none':it.edited?'edit':'auto';
    let btn=act.querySelector('.pm-rowbtn');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';btn.className='ds-btn pm-rowbtn';
      btn.innerHTML=PM_ICON;
      btn.addEventListener('click',e=>{e.stopPropagation();pmOpen(s.id)});
      act.insertBefore(btn,act.firstChild);
    }
    btn.dataset.st=st;
    btn.title=it?'Pesan untuk orang tua':'Belum ada pesan untuk orang tua';
    btn.setAttribute('aria-label','Pesan untuk orang tua '+s.name);
  });
}
function pmRosterFoot(){
  const bd=document.getElementById('classRosterBackdrop');if(!bd)return;
  const foot=bd.querySelector('.mh-m-foot');if(!foot||bd.querySelector('#pmRosterBulk'))return;
  foot.insertAdjacentHTML('beforeend','<button type="button" class="pm-link" id="pmRosterGen" style="color:#0f6b54">Buat pesan kelas ini</button><button type="button" class="pm-link" id="pmRosterBulk">Hapus pesan kelas ini</button>');
  const g=document.getElementById('pmRosterGen');
  if(g)g.addEventListener('click',()=>pmOpenBulkGen('class',selectedClass));
  const b=document.getElementById('pmRosterBulk');
  if(b)b.addEventListener('click',()=>pmOpenBulk('class',selectedClass));
}
function pmHafalanBtn(){
  const top=document.querySelector('#hfModalBackdrop .hf-modal-top');
  if(!top||top.querySelector('.pm-hf'))return;
  const b=document.createElement('button');
  b.type='button';b.className='pm-hf';b.textContent='Pesan orang tua';
  b.addEventListener('click',()=>{if(hfModalStudentId!=null)pmOpen(hfModalStudentId)});
  const close=top.querySelector('.hf-modal-close');
  if(close)top.insertBefore(b,close);else top.appendChild(b);
}
function pmMount(){
  const st=document.createElement('style');
  st.id='pm-pg-css';st.textContent=PG_CSS;document.head.appendChild(st);
  if(Array.isArray(window.HK_BACKUP_KEYS)&&window.HK_BACKUP_KEYS.indexOf(PM_KEY)<0)window.HK_BACKUP_KEYS.push(PM_KEY);
  const pop=document.querySelector('#dsMenu .ds-pop');
  if(pop&&!document.getElementById('pmMenuBulk')){
    pop.insertAdjacentHTML('beforeend','<button role="menuitem" type="button" id="pmMenuGen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12z"/><path d="M12 9v6M9 12h6"/></svg><span><b>Buat Pesan Orang Tua</b><small>Satu kelas atau seluruh sekolah</small></span></button>');
    const g=document.getElementById('pmMenuGen');
    if(g)g.addEventListener('click',()=>{try{dsCloseMenu()}catch(e){}const dc=(typeof dsClass!=='undefined'&&dsClass!=='all')?dsClass:null;pmOpenBulkGen(dc!=null?'class':'school',dc)});
    pop.insertAdjacentHTML('beforeend','<button role="menuitem" type="button" id="pmMenuBulk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12z"/><path d="M9 12h6M9 9h4"/></svg><span><b>Hapus Pesan Orang Tua</b><small>Satu kelas atau seluruh sekolah</small></span></button>');
    const b=document.getElementById('pmMenuBulk');
    if(b)b.addEventListener('click',()=>{try{dsCloseMenu()}catch(e){}const dc=(typeof dsClass!=='undefined'&&dsClass!=='all')?dsClass:null;pmOpenBulk(dc!=null?'class':'school',dc)});
  }
  const mh=document.querySelector('#view-kelas .ds-actions');
  if(mh&&!document.getElementById('pmMhBulk')){
    mh.insertAdjacentHTML('beforeend','<button class="ds-act" type="button" id="pmMhGen">Buat Pesan Orang Tua</button><button class="ds-act ghost" type="button" id="pmMhBulk">Hapus Pesan Orang Tua</button>');
    const g=document.getElementById('pmMhGen');
    if(g)g.addEventListener('click',()=>pmOpenBulkGen('school',null));
    const b=document.getElementById('pmMhBulk');
    if(b)b.addEventListener('click',()=>pmOpenBulk('class',null));
  }
}

/* ---------- Sambungkan ke fungsi yang sudah ada (pola pembungkus yang dipakai di berkas ini) ---------- */
window.pmOpen=pmOpen;window.pmOpenBulk=pmOpenBulk;window.pmOpenBulkGen=pmOpenBulkGen;window.pmClose=pmClose;
window.pmRaporSec=pmRaporSec;window.pgRaporSec=pgRaporSec;window.pmDecorateRows=pmDecorateRows;
window.pmReload=function(){pmStore=pmLoad();pmEnsure()};
(function(){
  const _rs=window.renderStudents;
  window.renderStudents=function(){const r=_rs.apply(this,arguments);try{pmDecorateRows()}catch(e){}return r};
  const _ocr=window.openClassRoster;
  window.openClassRoster=function(){const r=_ocr.apply(this,arguments);try{pmRosterFoot()}catch(e){}return r};
  const _rhm=window.renderHafalanModal;
  window.renderHafalanModal=function(){const r=_rhm.apply(this,arguments);try{pmHafalanBtn()}catch(e){}return r};
  const _rf=window.refresh;
  window.refresh=function(){const r=_rf.apply(this,arguments);try{pmEnsure()}catch(e){}return r};
  const _rd=window.rpDoc;
  window.rpDoc=function(){return _rd.apply(this,arguments).replace('</head>',()=>`<style id="pm-pg-css">${PG_CSS}</style></head>`)};
})();

pmEnsure();
pmMount();
pmDecorateRows();
})();
