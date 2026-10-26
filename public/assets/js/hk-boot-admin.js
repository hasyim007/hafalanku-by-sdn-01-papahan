
/* Pemuat halaman admin: cek sesi, muat data dari server, lalu jalankan aplikasi. */
(function(){
  var splash=document.getElementById('hkSplash'),msgEl=splash&&splash.querySelector('span');
  function say(t){if(msgEl)msgEl.textContent=t}
  function bad(t){if(!splash)return;splash.classList.add('err');splash.innerHTML='<b>'+t+'</b><a href="javascript:location.reload()">Muat ulang</a>'}
  function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=function(){no(new Error('Gagal memuat '+src))};document.head.appendChild(s)})}
  (async function(){
    var me;
    try{me=(await HKS.api('GET','/api/me')).user}
    catch(e){if(e.status===401){location.replace('/admin/login.html');return}return bad('Tidak dapat terhubung ke server. '+e.message)}
    window.__HK_USER=me;
    say('Memuat data…');
    try{await HKS.hydrate(function(n){say('Memuat data… '+n+' baris')})}
    catch(e){if(e.status===401){location.replace('/admin/login.html');return}return bad('Gagal memuat data: '+e.message)}
    document.documentElement.classList.add('authed');
    try{for(var i=0;i<window.HK_APP_SCRIPTS.length;i++)await load(window.HK_APP_SCRIPTS[i])}
    catch(e){return bad(e.message)}
    if(splash)splash.remove();
    HK.openParent=function(){window.open('/wali/','_blank','noopener')};
    try{var seen=false;try{seen=sessionStorage.getItem('hkWelcome')==='1';sessionStorage.setItem('hkWelcome','1')}catch(e){}if(!seen)toast('Selamat datang, '+me.name+'.')}catch(e){}
  })();
})();
