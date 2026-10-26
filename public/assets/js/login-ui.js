window.HK=window.HK||{};
(function(){const host=document.getElementById('loginRoot'),sroot=host.attachShadow({mode:'open'});sroot.appendChild(document.getElementById('loginTpl').content.cloneNode(true));

const CFG={ADMIN_WA:''}; /* isi nomor WhatsApp admin, format 628xxxxxxxxxx */
async function authenticate(username,password){
  let r;
  try{r=await HKS.api('POST','/api/auth/login',{username:username,password:password})}
  catch(e){if(e.code==='INVALID'){const x=new Error('invalid');x.code='INVALID';throw x}throw e}
  return{ok:true,name:r.user.name||r.user.u};
}
const $=id=>sroot.getElementById(id);
const un=$('un'),pw=$('pw'),btn=$('btn'),alertEl=$('alert');
const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;

const EYE_ON='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></svg>',EYE_OFF=EYE_ON;
function setEye(){const show=pw.type==='text';$('eye').innerHTML='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(show?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>':'<path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 6 10 6a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>')+'</svg>';$('eye').setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi')}
$('eye').addEventListener('click',()=>{pw.type=pw.type==='password'?'text':'password';setEye()});

const ICON_BAD='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v7M12 18v.01"/></svg>';
const ICON_OK='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function fieldErr(key,msg){
  const g=$('fld-'+key).parentElement,e=$('e-'+key);
  g.classList.toggle('err',!!msg);
  if(msg){e.textContent=msg;e.hidden=false;g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake');$(key).setAttribute('aria-invalid','true')}
  else{e.hidden=true;$(key).removeAttribute('aria-invalid');g.classList.remove('shake')}
}
function showAlert(type,title,text){
  alertEl.className='alert '+(type==='bad'?'bad':'good');
  $('aicon').innerHTML=type==='bad'?ICON_BAD:ICON_OK;
  $('atitle').textContent=title;$('atext').textContent=text;
  alertEl.hidden=false;
  if(type==='bad'){alertEl.classList.remove('shake');void alertEl.offsetWidth;alertEl.classList.add('shake')}
}
function clearAll(){fieldErr('un');fieldErr('pw');alertEl.hidden=true}
function setBtn(state){btn.classList.remove('loading','ok');if(state)btn.classList.add(state);btn.setAttribute('aria-busy',state==='loading')}
[un,pw].forEach(i=>i.addEventListener('input',()=>{const k=i.id;fieldErr(k);alertEl.hidden=true}));

$('f').addEventListener('submit',async e=>{
  e.preventDefault();
  clearAll();
  const u=un.value.trim(),p=pw.value;
  let bad=false;
  if(!u){fieldErr('un','Username wajib diisi');bad=true}
  if(!p){fieldErr('pw','Kata sandi wajib diisi');bad=true}
  if(bad){(!u?un:pw).focus();return}
  setBtn('loading');un.readOnly=pw.readOnly=true;
  try{
    const r=await authenticate(u,p);
    setBtn('ok');
    showAlert('good','Berhasil masuk','Selamat datang, '+r.name+'. Mengalihkan ke dashboard…');
    setTimeout(()=>{location.href='/admin/'},900);
  }catch(err){
    setBtn();
    if(err&&err.code==='INVALID'){
      showAlert('bad','Gagal masuk','Username atau kata sandi tidak cocok. Periksa kembali, lalu coba lagi.');
      fieldErr('un','');$('fld-un').parentElement.classList.add('err');$('fld-pw').parentElement.classList.add('err');
      pw.select();
    }else{
      showAlert('bad',err&&err.status?'Gagal masuk':'Tidak dapat terhubung',err&&err.status?err.message:'Periksa koneksi internet Anda, lalu coba lagi.');
    }
  }finally{un.readOnly=pw.readOnly=false}
});

/* Lupa kata sandi → WhatsApp admin */
let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3200)}
$('forgot').addEventListener('click',e=>{
  if(!CFG.ADMIN_WA){e.preventDefault();toast('Nomor WhatsApp admin belum diatur.');return}
  const msg='Assalamualaikum, saya lupa kata sandi akun Hafalanku. Mohon bantuannya.';
  $('forgot').href='https://wa.me/'+CFG.ADMIN_WA+'?text='+encodeURIComponent(msg);
  $('forgot').target='_blank';$('forgot').rel='noopener';
});

/* Geser panel (mobile) */
const sh=$('shell'),swipe=$('swipe');
const go=i=>sh.scrollTo({left:i*sh.clientWidth,behavior:rm?'auto':'smooth'});
sh.addEventListener('scroll',()=>{
  const i=Math.round(sh.scrollLeft/sh.clientWidth);
},{passive:true});
swipe.addEventListener('click',()=>go(1));
$('back').addEventListener('click',()=>go(0));

const roles=$('roles'),fm=$('f'),lead=$('lead'),rbk=$('roleBack');
function showRoles(){roles.hidden=false;fm.hidden=true;rbk.hidden=true;lead.textContent='Pilih cara masuk Anda'}
function showAdmin(){roles.hidden=true;fm.hidden=false;rbk.hidden=false;lead.textContent='Silakan masuk ke akun Anda';setTimeout(()=>un.focus(),60)}
$('roleAdmin').addEventListener('click',()=>{location.href='/admin/login.html'});
$('roleBack').addEventListener('click',()=>{location.href='/'});
$('roleParent').addEventListener('click',()=>{location.href='/wali/'});
HK.resetLogin=function(){setBtn();clearAll();un.value='';pw.value='';pw.type='password';setEye();sh.scrollTo({left:0});showRoles()};


/* Halaman admin: bila belum ada akun, tampilkan formulir pembuatan admin pertama. */
if(window.HK_LOGIN_PAGE==='admin'){
  showAdmin();
  HKS.api('GET','/api/auth/status').then(function(st){
    if(st.user){location.replace('/admin/');return}
    if(!st.needsSetup)return;
    lead.textContent='Buat akun admin pertama';fm.hidden=true;
    const fs=document.createElement('form');fs.id='fs';fs.noValidate=true;
    const f=(id,ph,type,ac)=>'<div class="grp"><div class="field"><input id="'+id+'" type="'+type+'" placeholder="'+ph+'" autocomplete="'+ac+'" style="padding-left:18px"></div></div>';
    fs.innerHTML=(st.setupReady?'':'<div class="alert bad" style="display:flex"><div><b>SETUP_KEY belum diatur</b><span>Buka dashboard Cloudflare → Workers &amp; Pages → hafalanku → Settings → Variables and Secrets → Add. Pilih Type: Secret, nama SETUP_KEY, lalu Deploy.</span></div></div>')+f('sk','Kunci setup (SETUP_KEY)','password','off')+f('sn','Nama lengkap beserta gelar','text','name')+f('su','Username (minimal 3 karakter)','text','username')+f('sp','Kata sandi (minimal 6 karakter)','password','new-password')+'<div class="alert bad" id="sa" hidden style="margin-top:10px"><div><b id="sat"></b><span id="sax"></span></div></div><button class="btn" type="submit" style="margin-top:14px"><span class="s s-idle" style="opacity:1;transform:none;position:static">Buat Akun Admin</span></button>';
    fm.after(fs);
    fs.addEventListener('submit',async function(e){e.preventDefault();
      const g=id=>fs.querySelector('#'+id).value,a=fs.querySelector('#sa');a.hidden=true;
      try{await HKS.api('POST','/api/auth/setup',{key:g('sk'),name:g('sn'),username:g('su'),password:g('sp')});location.href='/admin/'}
      catch(err){fs.querySelector('#sat').textContent='Gagal';fs.querySelector('#sax').textContent=err.message;a.hidden=false}});
  }).catch(function(){});
}

})();
