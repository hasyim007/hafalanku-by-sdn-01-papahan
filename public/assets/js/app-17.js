
(function(){
 const PS=8;let all=[],pg=0,q='';
 const $=i=>document.getElementById(i);
 const IC_L='<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',IC_R='<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
 function ui(){
  const body=$('reportRows');if(!body)return false;
  const wrap=body.closest('.tablewrap');if(!wrap)return false;
  if(!$('rpcTools')){
   wrap.insertAdjacentHTML('beforebegin','<div class="rpc-tools" id="rpcTools"><label class="rpc-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="rpcQ" placeholder="Cari nama anak..." autocomplete="off"></label><span class="rpc-count" id="rpcCount"></span></div>');
   wrap.insertAdjacentHTML('afterend','<div class="rpc-pager" id="rpcPager"></div>');
   $('rpcQ').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();pg=0;draw(0)});
   $('rpcPager').addEventListener('click',e=>{const b=e.target.closest('button[data-p]');if(!b||b.disabled)return;const n=+b.dataset.p;draw(n>pg?1:-1,n)});
   let x0=null;wrap.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
   wrap.addEventListener('touchend',e=>{if(x0===null)return;const d=e.changedTouches[0].clientX-x0;x0=null;if(wrap.scrollWidth<=wrap.clientWidth+2&&Math.abs(d)>70)draw(d<0?1:-1,pg+(d<0?1:-1))},{passive:true});
  }
  return true;
 }
 function pages(n,cur){const a=[];for(let i=0;i<n;i++)if(i===0||i===n-1||Math.abs(i-cur)<=1)a.push(i);const o=[];a.forEach((v,i)=>{if(i&&v-a[i-1]>1)o.push('…');o.push(v)});return o}
 function draw(dir,to){
  const body=$('reportRows');if(!body)return;
  const list=all.filter(r=>!q||r.t.includes(q)),n=Math.max(1,Math.ceil(list.length/PS));
  if(typeof to==='number')pg=to;pg=Math.min(Math.max(0,pg),n-1);
  const slice=list.slice(pg*PS,pg*PS+PS);
  body.className=dir<0?'rpc-prev':'';
  body.innerHTML=slice.length?slice.map(r=>r.h).join(''):'<tr class="rpc-empty"><td colspan="6">Tidak ada anak yang cocok.</td></tr>';
  const a=list.length?pg*PS+1:0,b=pg*PS+slice.length;
  $('rpcCount').textContent=list.length+' anak';
  $('rpcPager').innerHTML='<span class="rpc-info">Menampilkan <b>'+a+'–'+b+'</b> dari <b>'+list.length+'</b> anak</span><div class="rpc-nav"><button data-p="'+(pg-1)+'" '+(pg===0?'disabled':'')+' aria-label="Sebelumnya">'+IC_L+'</button>'+pages(n,pg).map(v=>v==='…'?'<span class="gap">…</span>':'<button class="pg'+(v===pg?' on':'')+'" data-p="'+v+'">'+(v+1)+'</button>').join('')+'<span class="rpc-cur">'+(pg+1)+' / '+n+'</span><button data-p="'+(pg+1)+'" '+(pg>=n-1?'disabled':'')+' aria-label="Berikutnya">'+IC_R+'</button></div>';
 }
 const r0=window.renderReports;
 window.renderReports=function(){
  r0.apply(this,arguments);
  if(!ui())return;
  all=Array.from($('reportRows').children).filter(t=>!t.classList.contains('rpc-empty')).map(t=>({h:t.outerHTML,t:(t.cells[0]?t.cells[0].textContent:t.textContent).toLowerCase()}));
  draw(0);
 };
})();
