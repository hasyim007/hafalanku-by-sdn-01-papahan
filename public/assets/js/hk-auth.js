
/* Objek HK: dialog konfirmasi, info akun, dan keluar. */
const HK=window.HK={};
HK.hash=function(s){return String(s)};
HK.confirm=function(msg,ok){return new Promise(res=>{const b=document.createElement('div');b.className='hk-confirm-back';b.innerHTML='<div class="hk-confirm" role="alertdialog" aria-modal="true"><p></p><div><button type="button" class="btn light" data-v="0">Batal</button><button type="button" class="btn danger" data-v="1"></button></div></div>';b.querySelector('p').textContent=msg;b.querySelector('[data-v="1"]').textContent=ok||'Ya, lanjutkan';const done=v=>{b.remove();res(v)};b.addEventListener('click',e=>{const t=e.target.closest('[data-v]');if(t)done(t.dataset.v==='1');else if(e.target===b)done(false)});document.body.appendChild(b);b.querySelector('[data-v="1"]').focus()})};
HK.getAuth=function(){return window.__HK_USER||{id:'',name:'Orang Tua',u:'',role:'wali',must:false}};
HK.logout=async function(){
  try{closeModal();closeStudentHafalan();closeClassRoster();$('sidebar').classList.remove('open');$('navoverlay').classList.remove('show')}catch(e){}
  document.querySelectorAll('.ak-back').forEach(function(x){x.remove()});
  if(window.HKS&&HKS.isDirty()){
    var ok=await HKS.flush();
    if(!ok&&!(await HK.confirm('Ada perubahan yang belum tersimpan ke server. Tetap keluar?','Tetap keluar')))return;
  }
  try{sessionStorage.removeItem('hkWelcome')}catch(e){}
  try{await HKS.api('POST','/api/auth/logout',{})}catch(e){}
  location.href='/admin/login.html';
};
