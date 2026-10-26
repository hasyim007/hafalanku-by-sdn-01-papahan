
(function(){
const el=id=>document.getElementById(id);
function chip(k,t){const e=el('shChip-'+k);if(e)e.textContent=t}
window.shRefresh=function(){try{
 chip('brand',settings.appName||'Hafalanku');
 chip('profil',(settings.school||'Belum diisi')+(settings.year?' · '+settings.year:''));
 chip('kop',kopCur().lines.length+' baris'+(kopCur().logo?' · logo':''));
 chip('akun',window.HK&&HK.getAuth?('@'+HK.getAuth().u):'Terlindungi');
 chip('data',nonAlumni().length+' anak tersimpan');
}catch(e){}};
window.shOpen=function(k){
 const v=el('view-pengaturan');v.classList.add('sh-detail');
 let t='';document.querySelectorAll('#stGrid>.st-card').forEach(c=>{const on=c.dataset.key===k;c.classList.toggle('sh-on',on);if(on)t=c.dataset.title||''});
 el('shBarTitle').textContent=t;
 if(k==='kop'&&typeof kopRenderSummary==='function')kopRenderSummary();
 window.scrollTo({top:0,behavior:'smooth'});
};
window.shBack=function(){el('view-pengaturan').classList.remove('sh-detail');document.querySelectorAll('#stGrid>.st-card').forEach(c=>c.classList.remove('sh-on'));shRefresh();window.scrollTo({top:0,behavior:'smooth'})};
const g0=window.go;
window.go=function(v,b){g0(v,b);if(v==='pengaturan')shBack()};
shRefresh();
})();
