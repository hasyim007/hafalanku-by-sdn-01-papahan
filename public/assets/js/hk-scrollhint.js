/* Memberi tanda (kelas hk-sh-l / hk-sh-r) pada wadah yang bisa digeser mendatar. */
(function(){
  var SEL='.tablewrap,.ach-table-wrap,.ds-grades';
  function mark(el){
    var max=el.scrollWidth-el.clientWidth,x=Math.abs(el.scrollLeft);
    el.classList.toggle('hk-sh-l',max>2&&x>2);
    el.classList.toggle('hk-sh-r',max>2&&x<max-2);
  }
  function all(){document.querySelectorAll(SEL).forEach(mark)}
  var raf=0;function soon(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;all()})}
  document.addEventListener('scroll',function(e){var t=e.target;if(t&&t.matches&&t.matches(SEL))mark(t)},true);
  window.addEventListener('resize',soon);
  new MutationObserver(soon).observe(document.documentElement,{childList:true,subtree:true});
  soon();
})();
