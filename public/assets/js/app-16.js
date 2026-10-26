
(function(){
 const sb=document.getElementById('sidebar');if(!sb)return;
 let tab=document.getElementById('navTab');if(!tab){tab=document.createElement('i');tab.id='navTab';tab.className='nav-tab';sb.insertBefore(tab,sb.firstChild)}
 let shown=false;
 function move(){
  const a=sb.querySelector('.nav button.active');
  if(!a||innerWidth<=720){tab.style.opacity=0;shown=false;return}
  const sr=sb.getBoundingClientRect(),ar=a.getBoundingClientRect();
  if(!ar.height||!sr.height){shown=false;return}
  const first=!shown;if(first)tab.classList.add('no-anim');
  tab.style.opacity=1;tab.style.height=ar.height+'px';tab.style.left=(ar.left-sr.left-sb.clientLeft)+'px';
  tab.style.transform='translateY('+(ar.top-sr.top-sb.clientTop+sb.scrollTop)+'px)';
  if(first){void tab.offsetHeight;tab.classList.remove('no-anim');shown=true}
 }
 window.hkNavTab=move;
 const g=window.go;if(typeof g==='function'){window.go=function(){const r=g.apply(this,arguments);requestAnimationFrame(()=>move());return r}}
 if(window.ResizeObserver){const ro=new ResizeObserver(()=>move());ro.observe(sb);sb.querySelectorAll('.nav,.brand').forEach(e=>ro.observe(e))}
 addEventListener('resize',move);addEventListener('load',move);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(move);
 new MutationObserver(()=>setTimeout(move,30)).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 [60,300,900].forEach(t=>setTimeout(move,t));move();
})();
