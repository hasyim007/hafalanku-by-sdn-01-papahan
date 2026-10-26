/* Data Anak: hapus massal per rombel, per kelas, atau semua anak. */
(function(){
const IC={
 trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
 warn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4L12 3.5z"/><path d="M12 10v4.5M12 17.4v.1"/></svg>',
 x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};
let st=null;           // {scope, picked:Set, arch:null|number|'err', seq:0}
let el=null;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const live=()=>students.filter(s=>!s.alumni);
const grades=()=>[...new Set(classes.map(c=>c.grade).filter(Boolean))].sort((a,b)=>a-b);

function targetSet(){
 const ids=new Set();
 if(st.scope==='all'){live().forEach(s=>ids.add(String(s.id)));return ids}
 const cls=new Set();
 if(st.scope==='rombel')classes.forEach(c=>{if(st.picked.has(String(c.id)))cls.add(String(c.id))});
 else classes.forEach(c=>{if(st.picked.has(String(c.grade)))cls.add(String(c.id))});
 live().forEach(s=>{if(cls.has(String(s.classId)))ids.add(String(s.id))});
 return ids;
}
function impact(ids){
 let lg=0,ex=0;
 logs.forEach(l=>{if(l&&ids.has(String(l.studentId)))lg++});
 exams.forEach(e=>{if(e&&ids.has(String(e.studentId)))ex++});
 return {n:ids.size,lg,ex};
}
function optionsHtml(){
 if(st.scope==='all'){
  const n=live().length;
  return `<div class="dd-all"><b>${n}</b><span>anak aktif &amp; nonaktif di ${classes.length} rombel akan dihapus. Anak yang berstatus alumni tidak ikut terhapus.</span></div>`;
 }
 let items;
 if(st.scope==='rombel')items=classes.map(c=>({k:String(c.id),t:c.name,n:live().filter(s=>String(s.classId)===String(c.id)).length}));
 else items=grades().map(g=>{const cl=classes.filter(c=>String(c.grade)===String(g));return{k:String(g),t:'Kelas '+g,sub:cl.length+' rombel',n:live().filter(s=>cl.some(c=>String(c.id)===String(s.classId))).length}});
 if(!items.length)return '<div class="dd-none">Belum ada kelas.</div>';
 const allOn=items.every(i=>st.picked.has(i.k));
 return `<div class="dd-pickhead"><span>Pilih ${st.scope==='rombel'?'rombel':'kelas'} yang datanya dihapus</span><button type="button" class="dd-link" data-act="toggleall">${allOn?'Batal pilih semua':'Pilih semua'}</button></div>
 <div class="dd-grid">${items.map(i=>`<button type="button" class="dd-opt ${st.picked.has(i.k)?'on':''}" data-k="${E(i.k)}" aria-pressed="${st.picked.has(i.k)}"><span class="dd-chk">${IC.ok}</span><span class="dd-ot"><b>${E(i.t)}</b><small>${i.sub?E(i.sub)+' · ':''}${i.n} anak</small></span></button>`).join('')}</div>`;
}
function summaryHtml(im){
 const arch=st.arch==null?'<i class="dd-dots"></i>':st.arch==='err'?'–':st.arch;
 return `<div class="dd-sum"><div><b>${im.n}</b><small>Anak</small></div><div><b>${im.lg}</b><small>Setoran aktif</small></div><div><b>${arch}</b><small>Setoran arsip</small></div><div><b>${im.ex}</b><small>Hasil ujian</small></div></div>`;
}
function paint(){
 if(!el)return;
 const ids=targetSet(),im=impact(ids),ok=im.n>0&&el.querySelector('#ddConfirm').value.trim().toUpperCase()==='HAPUS';
 el.querySelectorAll('.dd-seg button').forEach(b=>b.classList.toggle('on',b.dataset.scope===st.scope));
 el.querySelector('#ddOptions').innerHTML=optionsHtml();
 el.querySelector('#ddSummary').innerHTML=im.n?summaryHtml(im):'<div class="dd-empty">Belum ada anak yang dipilih.</div>';
 const go=el.querySelector('#ddGo');go.disabled=!ok;go.querySelector('span').textContent=im.n?'Hapus '+im.n+' anak':'Hapus';
}
let tmr=null;
function fetchArch(){
 const ids=[...targetSet()];st.arch=null;const my=++st.seq;
 clearTimeout(tmr);
 if(!ids.length){st.arch=0;paint();return}
 tmr=setTimeout(async()=>{
  try{const r=await HKS.api('POST','/api/archive/students-count',{students:ids});if(my===st.seq){st.arch=r.n||0;paint()}}
  catch(e){if(my===st.seq){st.arch='err';paint()}}
 },250);
}
function setScope(s){st.scope=s;st.picked=new Set();paint();fetchArch()}
function close(){if(!el)return;el.classList.add('out');const n=el;el=null;st=null;clearTimeout(tmr);setTimeout(()=>n.remove(),180);document.removeEventListener('keydown',onKey)}
function onKey(e){if(e.key==='Escape'&&!(el&&el.classList.contains('busy')))close()}

window.openDeleteStudents=function(scope){
 if(!live().length){toast('Belum ada data anak untuk dihapus.');return}
 dsCloseMenu&&dsCloseMenu();ddCloseMenu();
 st={scope:scope||'rombel',picked:new Set(),arch:null,seq:0};
 if(st.scope==='rombel'&&typeof dsClass!=='undefined'&&dsClass!=='all')st.picked.add(String(dsClass));
 else if(st.scope==='kelas'&&typeof dsGrade!=='undefined'&&dsGrade!=='all')st.picked.add(String(dsGrade));
 el=document.createElement('div');el.className='dd-back';
 el.innerHTML=`<div class="dd-modal" role="dialog" aria-modal="true" aria-labelledby="ddTitle">
  <div class="dd-head"><span class="dd-ico">${IC.warn}</span><div><h3 id="ddTitle">Hapus Data Anak</h3><p>Pilih cakupan data yang ingin dihapus. Tindakan ini juga menghapus setoran dan hasil ujian anak tersebut.</p></div><button type="button" class="dd-x" data-act="close" aria-label="Tutup">${IC.x}</button></div>
  <div class="dd-body">
   <div class="dd-seg" role="tablist"><button type="button" data-scope="rombel" role="tab">Per Rombel</button><button type="button" data-scope="kelas" role="tab">Per Kelas</button><button type="button" data-scope="all" role="tab">Semua Anak</button></div>
   <div id="ddOptions"></div>
   <div id="ddSummary"></div>
   <div class="dd-note">${IC.warn}<span>Setoran yang sudah diarsip dihapus permanen. Untuk anak yang lulus atau pindah, lebih aman ubah statusnya menjadi alumni atau Nonaktif agar riwayatnya tetap ada.</span></div>
   <label class="dd-conf"><span>Ketik <b>HAPUS</b> untuk melanjutkan</span><input id="ddConfirm" type="text" autocomplete="off" spellcheck="false" placeholder="HAPUS"></label>
  </div>
  <div class="dd-foot"><button type="button" class="dd-btn ghost" data-act="close">Batal</button><button type="button" class="dd-btn danger" id="ddGo" disabled>${IC.trash}<span>Hapus</span></button></div>
 </div>`;
 document.body.appendChild(el);
 el.addEventListener('click',e=>{
  if(e.target===el&&!el.classList.contains('busy'))return close();
  const b=e.target.closest('button');if(!b||el.classList.contains('busy'))return;
  if(b.dataset.act==='close')return close();
  if(b.dataset.scope)return setScope(b.dataset.scope);
  if(b.dataset.act==='toggleall'){const items=el.querySelectorAll('.dd-opt');const all=[...items].every(x=>x.classList.contains('on'));st.picked=new Set(all?[]:[...items].map(x=>x.dataset.k));paint();return fetchArch()}
  if(b.classList.contains('dd-opt')){const k=b.dataset.k;st.picked.has(k)?st.picked.delete(k):st.picked.add(k);paint();return fetchArch()}
  if(b.id==='ddGo')run();
 });
 el.querySelector('#ddConfirm').addEventListener('input',paint);
 el.querySelector('#ddConfirm').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const g=el.querySelector('#ddGo');if(!g.disabled)g.click()}});
 document.addEventListener('keydown',onKey);
 paint();fetchArch();
 setTimeout(()=>{const f=el&&el.querySelector('.dd-opt,.dd-all');f&&f.focus&&f.focus()},60);
};

async function run(){
 const ids=targetSet();if(!ids.size)return;
 const go=el.querySelector('#ddGo');el.classList.add('busy');go.disabled=true;go.querySelector('span').textContent='Menghapus…';
 try{
  if(st.arch!==0){await HKS.api('POST','/api/archive/students-delete',{students:[...ids]})}
 }catch(e){
  el.classList.remove('busy');go.disabled=false;go.querySelector('span').textContent='Coba lagi';
  toast('Setoran di arsip gagal dihapus: '+(e.message||'coba lagi')+' Data anak belum dihapus.');return;
 }
 const gone=[],pos=[];
 for(let i=students.length-1;i>=0;i--){if(ids.has(String(students[i].id))){gone.unshift(students[i]);pos.unshift(i);students.splice(i,1)}}
 const own=logs.filter(l=>l&&ids.has(String(l.studentId))),ownEx=exams.filter(e=>e&&ids.has(String(e.studentId)));
 logs=logs.filter(l=>!(l&&ids.has(String(l.studentId))));exams=exams.filter(e=>!(e&&ids.has(String(e.studentId))));
 close();dsPage=1;refresh();
 const msg=gone.length+' data anak dihapus.';
 if(window.HKFB&&HKFB.undoable)HKFB.undoable(msg,()=>{
  gone.forEach((s,k)=>{if(!students.some(x=>x.id===s.id))students.splice(Math.min(pos[k],students.length),0,s)});
  own.forEach(l=>{if(!logs.some(x=>x&&x.id===l.id))logs.push(l)});
  ownEx.forEach(e=>{if(!exams.some(x=>x&&x.id===e.id))exams.push(e)});
  refresh();
 });else toast(msg);
}

{const _t=window.dsToggleMenu;if(_t)window.dsToggleMenu=function(e){ddCloseMenu();return _t(e)}}
/* menu tarik-turun tombol "Hapus Data" */
window.ddCloseMenu=function(){const m=document.getElementById('dsDelMenu');if(m){m.classList.remove('open');const b=m.querySelector('button');b&&b.setAttribute('aria-expanded','false')}};
window.ddToggleMenu=function(e){e.stopPropagation();dsCloseMenu&&dsCloseMenu();const m=document.getElementById('dsDelMenu'),o=!m.classList.contains('open');m.classList.toggle('open',o);m.querySelector('button').setAttribute('aria-expanded',String(o))};
document.addEventListener('click',e=>{if(!e.target.closest||!e.target.closest('#dsDelMenu'))ddCloseMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')ddCloseMenu()});
})();
