
/* ===== Menu Alumni: angkatan per tahun pelajaran, grafik perbandingan, dan daftar kelas ===== */
(function(){
const ALM_GRAD=['linear-gradient(135deg,#4f61f5,#2f3fd6)','linear-gradient(135deg,#17a58e,#0b7a68)','linear-gradient(135deg,#2b3152,#12142a)','linear-gradient(135deg,#f2ad45,#c77a10)'];
const ALM_AV=['#3d4ef0','#0f9d84','#e0892b','#8b5cf6','#e5484d','#0ea5c6'];
const ALM_LV=[{c:'#d9dcef',t:'#2a2f45'},{c:'#a4aef6',t:'#1d2466'},{c:'#3d4ef0',t:'#ffffff'},{c:'#17a34a',t:'#ffffff'}];
const almHash=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h};
const almByName=(a,b)=>String(a.name).localeCompare(String(b.name),'id');
const almYearNum=k=>{const m=String(k||'').match(/(\d{4})/);return m?+m[1]:-1};
const almShort=k=>{const m=String(k||'').match(/(\d{4})\s*\/\s*(\d{2,4})/);return m?m[1]+'/'+m[2].slice(-2):String(k||'—')};
const almKelas=k=>k==='—'?'Kelas belum tercatat':(/^kelas/i.test(k)?k:'Kelas '+k);
const almTitle=y=>y.num<0?'Tahun belum tercatat':'Tahun Pelajaran '+esc(y.key);
let almYears=[],almIdx=-1;

function almData(){
  const map=new Map();
  students.forEach(s=>{
    if(!s||!s.alumni)return;
    const key=String(s.alumni.tahun||'').trim()||'Tanpa tahun';
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(s);
  });
  const years=[...map.entries()].map(([key,list])=>{
    const pcts=list.map(s=>pct(s)),counts=[0,0,0,0],cls=new Map();
    list.forEach(s=>{
      counts[studentLevel(s).n-1]++;
      const k=String(s.alumni.kelas||'').trim()||'—';
      if(!cls.has(k))cls.set(k,[]);
      cls.get(k).push(s);
    });
    const classes=[...cls.entries()].sort((a,b)=>a[0].localeCompare(b[0],'id',{numeric:true})).map(([name,kids])=>({name,kids:kids.slice().sort(almByName)}));
    return{key,num:almYearNum(key),label:almShort(key),total:list.length,avg:Math.round(pcts.reduce((a,b)=>a+b,0)/list.length),done:pcts.filter(p=>p>=100).length,counts,classes};
  });
  years.sort((a,b)=>(b.num-a.num)||a.key.localeCompare(b.key,'id'));
  return years;
}

function almStack(counts,total,tall){
  const cls=tall?' tall':'';
  if(!total)return`<div class="alm-stack${cls}"><span style="width:100%;background:#eceef6"></span></div>`;
  return`<div class="alm-stack${cls}" role="img" aria-label="${counts.map((c,i)=>'Level '+(i+1)+': '+c+' anak').join(', ')}">${counts.map((c,i)=>c?`<span style="width:${(c/total*100).toFixed(2)}%;background:${ALM_LV[i].c};color:${ALM_LV[i].t}">${tall&&c/total>=.1?Math.round(c/total*100)+'%':''}</span>`:'').join('')}</div>`;
}
const almLegend=counts=>counts.map((c,i)=>`<span><i style="background:${ALM_LV[i].c}"></i>Level ${i+1} <b>${c}</b></span>`).join('');

function almStatsHtml(years){
  const all=students.filter(s=>s&&s.alumni),total=all.length;
  const avg=total?Math.round(all.reduce((a,s)=>a+pct(s),0)/total):0;
  const done=all.filter(s=>pct(s)>=100).length;
  return[
    ['Total alumni',total,'Lulusan yang tersimpan'],
    ['Tahun pelajaran',years.length,'Angkatan lulus tercatat'],
    ['Rata-rata capaian',avg+'%','Dari target ayat'],
    ['Mencapai target',done,total?Math.round(done/total*100)+'% dari seluruh alumni':'Belum ada data']
  ].map(([a,b,c])=>`<div class="stat"><div class="stat-top"><small>${a}</small></div><h3>${b}</h3><div class="sub">${c}</div></div>`).join('');
}

function almBarSvg(chron){
  const W=560,H=260,pl=40,pr=12,pt=26,pb=52,iw=W-pl-pr,ih=H-pt-pb,n=chron.length;
  const slot=iw/n,bw=Math.min(64,slot*.56);
  let s=`<defs><linearGradient id="almBarGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b79f7"/><stop offset="1" stop-color="#3d4ef0"/></linearGradient></defs>`;
  [0,25,50,75,100].forEach(v=>{
    const y=pt+ih-v/100*ih;
    s+=`<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#eceef6" stroke-width="1" stroke-dasharray="3 4"/><text x="${pl-8}" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="11" fill="#8b90a8">${v}%</text>`;
  });
  chron.forEach((y,i)=>{
    const cx=pl+slot*i+slot/2,h=Math.max(3,y.avg/100*ih),top=pt+ih-h;
    s+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="10" fill="url(#almBarGrad)"/>`
      +`<text x="${cx.toFixed(1)}" y="${(top-8).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#161a2e">${y.avg}%</text>`
      +`<text x="${cx.toFixed(1)}" y="${H-28}" text-anchor="middle" font-size="12" font-weight="700" fill="#2a2f45">${esc(y.label)}</text>`
      +`<text x="${cx.toFixed(1)}" y="${H-12}" text-anchor="middle" font-size="11" fill="#8b90a8">${y.total} lulusan</text>`;
  });
  return`<div class="alm-scroll"><svg class="alm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik rata-rata capaian lulusan per tahun pelajaran">${s}</svg></div>`;
}

function almDeltaHtml(chron){
  if(chron.length<2)return'<p class="alm-note">Perbandingan antar tahun akan muncul setelah angkatan berikutnya lulus.</p>';
  return`<div class="alm-deltas">${chron.slice(1).map((y,i)=>{
    const p=chron[i],d=y.avg-p.avg,cls=d>0?'up':(d<0?'down':'flat');
    const txt=d===0?'tetap':(d>0?'▲ +'+d:'▼ −'+Math.abs(d))+' poin';
    return`<span class="alm-delta ${cls}">${esc(p.label)} → ${esc(y.label)} · ${txt}</span>`;
  }).join('')}</div>`;
}

function almNameRow(s,n){
  const l=studentLevel(s),lv=['l1','l2','l3','l4'][l.n-1],p=pct(s);
  const meta=[s.alumni&&s.alumni.date?'Lulus '+niceDate(s.alumni.date):'Alumni',(s.done||0)+'/'+(s.target||0)+' ayat'].join(' · ');
  return`<li class="alm-name"><span class="alm-no">${n}</span><div class="alm-nm"><b>${esc(s.name)}</b><small>${esc(meta)}</small></div><span class="alm-lv ${lv}">Level ${l.n}</span><div class="alm-pg"><b>${p}%</b><i><u style="width:${Math.max(0,Math.min(100,p))}%"></u></i></div></li>`;
}

let almSlide=0,almQ='';
function almParts(y,q){
  const t=String(q||'').trim().toLowerCase();
  return y.classes.map(c=>({c,kids:t?c.kids.filter(s=>String(s.name).toLowerCase().includes(t)):c.kids,avg:Math.round(c.kids.reduce((a,s)=>a+pct(s),0)/c.kids.length)}));
}
function almBody(y,q){
  return almParts(y,q).map(p=>`<section class="alm-slide" aria-label="${esc(almKelas(p.c.name))}"><div class="alm-shead"><div><b>${esc(almKelas(p.c.name))}</b><small>${p.c.kids.length} anak</small></div><em>rata-rata ${p.avg}%</em></div>${p.kids.length?`<ul class="alm-names">${p.kids.map((s,i)=>almNameRow(s,i+1)).join('')}</ul>`:'<div class="alm-empty-m">Tidak ada nama yang cocok di kelas ini.</div>'}</section>`).join('');
}
function almTabs(y,q){
  return almParts(y,q).map((p,i)=>`<button type="button" class="alm-tab${i===almSlide?' on':''}" onclick="almGo(${i})">${esc(almKelas(p.c.name))}<span>${p.kids.length}</span></button>`).join('');
}
function almSync(){
  const y=almYears[almIdx];if(!y)return;
  const n=y.classes.length;
  document.querySelectorAll('#almTabs .alm-tab').forEach((t,i)=>{t.classList.toggle('on',i===almSlide);if(i===almSlide)t.scrollIntoView({inline:'center',block:'nearest'})});
  document.querySelectorAll('#almDots i').forEach((d,i)=>d.classList.toggle('on',i===almSlide));
  const pv=document.getElementById('almPrev'),nx=document.getElementById('almNext');
  if(pv)pv.disabled=almSlide<=0;if(nx)nx.disabled=almSlide>=n-1;
}
function almGo(i,instant){
  const y=almYears[almIdx],el=document.getElementById('almSlides');if(!y||!el)return;
  almSlide=Math.max(0,Math.min(y.classes.length-1,i));
  el.scrollTo({left:almSlide*el.clientWidth,behavior:instant?'auto':'smooth'});
  almSync();
}

function almRender(){
  const cards=document.getElementById('almCards');if(!cards)return;
  almYears=almData();
  const chron=almYears.slice().reverse();
  document.getElementById('almStats').innerHTML=almStatsHtml(almYears);
  document.getElementById('almYearCount').textContent=almYears.length?almYears.length+' angkatan':'';
  document.getElementById('almLegendTop').innerHTML=ALM_LV.map((l,i)=>`<span><i style="background:${l.c}"></i>Level ${i+1} · ${ACH_LEVELS[i].name}</span>`).join('');
  if(!chron.length){
    document.getElementById('almBarChart').innerHTML='<div class="alm-empty-sm">Grafik akan muncul setelah ada lulusan yang tercatat.</div>';
    document.getElementById('almDeltas').innerHTML='';
    document.getElementById('almLevelChart').innerHTML='<div class="alm-empty-sm">Belum ada data level lulusan.</div>';
    cards.innerHTML=`<div class="alm-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 10v6"/></svg><h4>Belum ada alumni</h4><p>Alumni tercatat otomatis saat Anda memproses naik kelas dan memilih “Lulus” untuk anak di kelas tertinggi. Setiap tahun pelajaran yang lulus akan tampil sebagai kartu angkatan di sini.</p></div>`;
    return;
  }
  document.getElementById('almBarChart').innerHTML=almBarSvg(chron);
  document.getElementById('almDeltas').innerHTML=almDeltaHtml(chron);
  document.getElementById('almLevelChart').innerHTML=chron.map(y=>`<div class="alm-cmp-row"><div><b>${esc(y.label)}</b><small>${y.total} lulusan</small></div>${almStack(y.counts,y.total,true)}</div>`).join('');
  cards.innerHTML=almYears.map((y,i)=>`<button type="button" class="alm-card" onclick="almOpen(${i})" aria-label="Lihat kelas dan nama alumni ${esc(y.label)}">
    <div class="alm-card-top" style="background:${ALM_GRAD[i%ALM_GRAD.length]}">
      <span class="alm-kicker">Alumni</span>
      <h4>${almTitle(y)}</h4>
      <div class="alm-count">${y.total}<small>lulusan</small></div>
      <div class="alm-chips"><span class="alm-chip"><b>${y.classes.length}</b>rombel</span><span class="alm-chip"><b>${y.avg}%</b>rata-rata</span><span class="alm-chip"><b>${y.done}</b>capai target</span></div>
    </div>
    <div class="alm-card-body">${almStack(y.counts,y.total,false)}<div class="alm-legend">${almLegend(y.counts)}</div></div>
    <div class="alm-card-foot"><span>Lihat kelas &amp; nama</span><span class="alm-arrow" aria-hidden="true">→</span></div>
  </button>`).join('');
}

function almDetach(){
  const b=document.getElementById('almBack');
  if(b)b.remove();
  document.body.style.overflow='';
}

function almOpen(i){
  const y=almYears[i];if(!y)return;
  almDetach();
  almIdx=i;almSlide=0;almQ='';
  const g=ALM_GRAD[i%ALM_GRAD.length];
  const b=document.createElement('div');
  b.id='almBack';b.className='alm-back';
  b.innerHTML=`<div class="alm-modal" role="dialog" aria-modal="true" aria-labelledby="almMTitle">
    <header class="alm-mhead" style="background:${g}"><div><small>Alumni</small><h3 id="almMTitle">${almTitle(y)}</h3><p>${y.total} lulusan · ${y.classes.length} rombel · rata-rata ${y.avg}%</p></div><button type="button" class="alm-x" onclick="almClose()" aria-label="Tutup">×</button></header>
    <div class="alm-msearch"><input type="search" placeholder="Cari nama alumni…" aria-label="Cari nama alumni" oninput="almFilter(this.value)"></div>
    <div class="alm-tabs" id="almTabs">${almTabs(y,'')}</div>
    <div class="alm-slides" id="almSlides">${almBody(y,'')}</div>
    <footer class="alm-mfoot"><button type="button" class="alm-nav" id="almPrev" onclick="almGo(almSlide-1)">‹ <em style="font-style:normal">Sebelumnya</em></button><div class="alm-dots" id="almDots">${y.classes.map((_,k)=>'<i'+(k===0?' class="on"':'')+'></i>').join('')}</div><button type="button" class="alm-nav" id="almNext" onclick="almGo(almSlide+1)"><em style="font-style:normal">Berikutnya</em> ›</button></footer>
  </div>`;
  b.addEventListener('click',e=>{if(e.target===b)almDetach()});
  document.body.appendChild(b);
  document.body.style.overflow='hidden';
  const sl=document.getElementById('almSlides');let raf=0;
  sl.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const k=Math.round(sl.scrollLeft/Math.max(1,sl.clientWidth));if(k!==almSlide){almSlide=k;almSync()}})},{passive:true});
  almSync();
  const inp=b.querySelector('.alm-msearch input');
  if(inp&&window.matchMedia('(min-width:721px)').matches)inp.focus({preventScroll:true});
}

window.almRender=almRender;
window.almOpen=almOpen;
window.almClose=almDetach;
window.almGo=almGo;
window.almFilter=function(q){
  const y=almYears[almIdx];if(!y)return;
  const parts=almParts(y,q);
  if(String(q||'').trim()&&!parts[almSlide].kids.length){const f=parts.findIndex(p=>p.kids.length);if(f>=0)almSlide=f}
  document.getElementById('almSlides').innerHTML=almBody(y,q);
  document.getElementById('almTabs').innerHTML=almTabs(y,q);
  almGo(almSlide,true);
};
document.addEventListener('keydown',e=>{if(!document.getElementById('almBack'))return;if(e.key==='Escape')almDetach();else if(e.key==='ArrowRight'&&e.target.tagName!=='INPUT')almGo(almSlide+1);else if(e.key==='ArrowLeft'&&e.target.tagName!=='INPUT')almGo(almSlide-1)});
const _goAlm=window.go;
window.go=function(v){const r=_goAlm.apply(this,arguments);if(v==='alumni')almRender();return r};
})();

