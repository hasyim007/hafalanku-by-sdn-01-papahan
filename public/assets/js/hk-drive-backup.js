/* Cadangan ke Google Drive.
   Memakai Google Identity Services (login Google di browser) dan Drive API v3 dengan izin "drive.file":
   aplikasi hanya bisa melihat file yang ia buat sendiri, bukan seluruh isi Drive.
   Cadangan disimpan sebagai file JSON di folder "Hafalanku Cadangan" milik akun Google yang dipakai masuk.
   Format file sama dengan tombol "Unduh cadangan", jadi bisa juga dipulihkan lewat "Pulihkan dari file". */
(function(){
  const SCOPE='https://www.googleapis.com/auth/drive.file';
  const FOLDER='Hafalanku Cadangan';
  const LAST='hkLastDrive';
  const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const say=m=>{try{toast(m)}catch(e){}};
  const good=m=>{try{HKFB.paint('ok',m)}catch(e){say(m)}};
  const bad=m=>{try{HKFB.paint('err',m)}catch(e){say(m)}};
  let tok=null,tokExp=0,gisP=null,busy=false,files=null,listErr='',showHelp=false;

  const isAdmin=()=>{try{return !window.__HK_USER||window.__HK_USER.role==='admin'}catch(e){return true}};
  const clientId=()=>{try{return String((settings&&settings.driveClientId)||'').trim()}catch(e){return ''}};
  const lastDrive=()=>{try{return HKLS.getItem(LAST)}catch(e){return null}};
  const fmt=(iso,o)=>{const t=Date.parse(iso);return isNaN(t)?'tidak diketahui':new Date(t).toLocaleString('id-ID',o||{dateStyle:'medium',timeStyle:'short'})};
  const sizeTxt=n=>{n=Number(n);if(!n)return'';return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'};

  function loadGis(){
    if(window.google&&google.accounts&&google.accounts.oauth2)return Promise.resolve();
    if(gisP)return gisP;
    gisP=new Promise((ok,no)=>{
      const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
      s.onload=()=>ok();
      s.onerror=()=>{gisP=null;no(new Error('Layanan login Google tidak bisa dimuat. Periksa koneksi internet atau pemblokir iklan.'))};
      document.head.appendChild(s);
    });
    return gisP;
  }
  /* Harus dipanggil langsung dari klik tombol agar jendela login Google tidak diblokir browser. */
  async function getToken(){
    if(tok&&Date.now()<tokExp-30000)return tok;
    const cid=clientId();if(!cid)throw new Error('Client ID Google belum diisi.');
    await loadGis();
    return new Promise((ok,no)=>{
      const c=google.accounts.oauth2.initTokenClient({
        client_id:cid,scope:SCOPE,
        callback:r=>{
          if(r.error){no(new Error(r.error==='access_denied'?'Izin ke Google Drive tidak diberikan.':'Login Google gagal ('+(r.error_description||r.error)+').'));return}
          if(!google.accounts.oauth2.hasGrantedAllScopes(r,SCOPE)){no(new Error('Izin Drive belum dicentang. Ulangi dan centang izin untuk mengelola file yang dibuat aplikasi ini.'));return}
          tok=r.access_token;tokExp=Date.now()+(Number(r.expires_in)||3600)*1000;ok(tok);
        },
        error_callback:e=>no(new Error(e&&e.type==='popup_closed'?'Jendela login Google ditutup.':e&&e.type==='popup_failed_to_open'?'Jendela login Google diblokir browser. Izinkan pop-up untuk situs ini.':'Login Google gagal.'))
      });
      c.requestAccessToken({prompt:tok?'':'select_account'});
    });
  }
  async function gerr(r){
    let m='';try{const j=await r.json();m=(j.error&&(j.error.message||j.error))||''}catch(e){}
    if(r.status===401)return new Error('Sesi Google berakhir. Coba lagi.');
    if(r.status===403&&/has not been used|is disabled|accessNotConfigured/i.test(m))return new Error('Google Drive API belum diaktifkan di proyek Google Cloud Anda (langkah 3 pada panduan).');
    if(r.status===403&&/quota|storage/i.test(m))return new Error('Penyimpanan Google Drive penuh.');
    return new Error('Google Drive menolak permintaan ('+r.status+')'+(m?': '+m:'')+'.');
  }
  async function dv(url,opt){
    const t=await getToken();
    opt=opt||{};opt.headers=Object.assign({},opt.headers,{Authorization:'Bearer '+t});
    let r;try{r=await fetch(url,opt)}catch(e){throw new Error('Tidak bisa terhubung ke Google. Periksa koneksi internet.')}
    if(r.status===401){tok=null}
    if(!r.ok)throw await gerr(r);
    return r;
  }
  const API='https://www.googleapis.com/drive/v3/files';
  async function findFolder(create){
    const q="name='"+FOLDER+"' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const r=await(await dv(API+'?spaces=drive&pageSize=1&fields=files(id)&q='+encodeURIComponent(q))).json();
    if(r.files&&r.files[0])return r.files[0].id;
    if(!create)return null;
    const c=await(await dv(API+'?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:FOLDER,mimeType:'application/vnd.google-apps.folder'})})).json();
    return c.id;
  }
  async function upload(obj,name,folder){
    const B='hk'+Math.random().toString(36).slice(2);
    const meta={name:name,mimeType:'application/json',parents:[folder],description:'Cadangan data aplikasi Hafalanku'};
    const body='--'+B+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+B+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(obj)+'\r\n--'+B+'--';
    return (await dv('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+B},body})).json();
  }
  async function listBackups(){
    const f=await findFolder(false);if(!f)return[];
    const q="'"+f+"' in parents and trashed=false and mimeType='application/json'";
    const r=await(await dv(API+'?spaces=drive&pageSize=30&orderBy=createdTime%20desc&fields=files(id,name,createdTime,size)&q='+encodeURIComponent(q))).json();
    return r.files||[];
  }

  function setBusy(b,msg){busy=b;const el=$('gdStatus');if(el)el.textContent=msg||'';try{if(b)HKFB.paint('busy',msg||'Memproses…');else HKFB.clearBusy()}catch(e){}document.querySelectorAll('#cdDrive .gd-act').forEach(x=>x.disabled=b)}

  window.gdSaveId=function(){
    const v=($('gdCid')||{}).value||'';const id=v.trim();
    if(!/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(id)){$('gdErr').textContent='Client ID tidak dikenali. Bentuknya seperti 123456789-abcdef.apps.googleusercontent.com';return}
    settings=Object.assign({},settings,{driveClientId:id});save();tok=null;files=null;
    say('Client ID disimpan.');hkDriveRender();
  };
  window.gdChangeId=async function(){
    if(!await HK.confirm('Hapus Client ID Google yang tersimpan? Anda bisa mengisinya lagi kapan saja. Cadangan yang sudah ada di Drive tidak terhapus.','Hapus'))return;
    const s=Object.assign({},settings);delete s.driveClientId;settings=s;save();tok=null;files=null;showHelp=true;hkDriveRender();
  };
  window.gdHelp=function(){showHelp=!showHelp;hkDriveRender()};

  window.gdBackup=async function(){
    if(busy)return;setBusy(true,'Menghubungkan ke Google…');
    try{
      await getToken();
      setBusy(true,'Menyiapkan folder di Drive…');
      const folder=await findFolder(true);
      setBusy(true,'Mengunggah cadangan…');
      const o=cdBuildBackup();
      const f=await upload(o,'Cadangan-Hafalanku-'+cdStamp()+'.json',folder);
      try{HKLS.setItem(LAST,o.dibuat)}catch(e){}
      files=null;
      cdMarkBackup(o.dibuat);
      good('Cadangan tersimpan di Google Drive: '+f.name);
    }catch(e){setBusy(false,'');bad(e.message);const el=$('gdErr');if(el)el.textContent=e.message;return}
    setBusy(false,'');
  };
  window.gdList=async function(){
    if(busy)return;setBusy(true,'Menghubungkan ke Google…');listErr='';
    try{await getToken();setBusy(true,'Membaca daftar cadangan…');files=await listBackups()}
    catch(e){files=null;listErr=e.message;bad(e.message)}
    setBusy(false,'');hkDriveRender();
  };
  window.gdRestore=async function(id,name,when){
    if(busy)return;setBusy(true,'Mengunduh cadangan…');
    try{
      const r=await dv(API+'/'+encodeURIComponent(id)+'?alt=media');
      const o=await r.json();
      setBusy(false,'');
      cdPrepare(o,'Google Drive');
    }catch(e){setBusy(false,'');if(e instanceof SyntaxError)e=new Error('Isi file di Drive bukan format cadangan yang benar.');cdFail(e.message);bad(e.message)}
  };
  window.gdDelete=async function(id,name){
    if(busy)return;
    if(!await HK.confirm('Hapus "'+name+'" dari Google Drive? File dipindah ke sampah Drive.','Hapus'))return;
    setBusy(true,'Menghapus…');
    try{await dv(API+'/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})});files=(files||[]).filter(f=>f.id!==id);good('Cadangan dipindah ke sampah Drive.')}
    catch(e){bad(e.message)}
    setBusy(false,'');hkDriveRender();
  };

  const DRIVE_ICO='<svg viewBox="0 0 24 24"><path d="M8 4h8l5 9-4 7H7l-4-7z"/><path d="M8 4l5 9M16 4l-5 9M3 13h14"/></svg>';
  function setupHtml(){
    const o=location.origin;
    const admin=isAdmin();
    return `<div class="gd-card"><div class="gd-head"><span class="gd-ico">${DRIVE_ICO}</span><div><b>Cadangan ke Google Drive</b><small>Simpan cadangan ke Drive akun Google Anda, tanpa mengunduh file.</small></div></div>
    ${admin?`<p class="gd-p">Fitur ini perlu satu kali pengaturan: sebuah <b>Client ID</b> dari Google Cloud (gratis). Isi di bawah, lalu tombol cadangan akan muncul.</p>
    <div class="gd-row"><input id="gdCid" class="field" placeholder="123456789-abcdef.apps.googleusercontent.com" autocomplete="off" spellcheck="false"><button class="btn" onclick="gdSaveId()">Simpan</button></div>
    <div id="gdErr" class="gd-err"></div>
    <button class="gd-link" onclick="gdHelp()">${showHelp?'Sembunyikan':'Tampilkan'} cara mendapatkan Client ID</button>
    ${showHelp?helpHtml(o):''}`:`<p class="gd-p">Client ID Google belum diisi. Minta admin mengisinya di Pengaturan → Data Aplikasi.</p>`}</div>`;
  }
  function helpHtml(o){
    return `<ol class="gd-steps">
    <li>Buka <b>console.cloud.google.com</b>, masuk dengan akun Google, lalu buat proyek baru (nama bebas, mis. Hafalanku).</li>
    <li>Menu <b>APIs &amp; Services → OAuth consent screen</b>. Pilih <b>External</b>, isi nama aplikasi dan email Anda, lalu simpan. Di bagian <b>Test users</b> tambahkan email Google yang akan dipakai mencadangkan (selama status aplikasi masih <i>Testing</i>).</li>
    <li>Menu <b>APIs &amp; Services → Library</b>, cari <b>Google Drive API</b>, klik <b>Enable</b>.</li>
    <li>Menu <b>APIs &amp; Services → Credentials → Create credentials → OAuth client ID</b>. Jenis: <b>Web application</b>.</li>
    <li>Pada <b>Authorized JavaScript origins</b> isi alamat aplikasi ini persis: <code>${E(o)}</code> (tanpa garis miring di akhir). Kolom redirect URI dikosongkan.</li>
    <li>Klik <b>Create</b>, salin <b>Client ID</b> (berakhiran <code>.apps.googleusercontent.com</code>), tempel di kolom di atas.</li></ol>
    <p class="gd-p small">Aplikasi hanya meminta izin <i>drive.file</i>: hanya bisa melihat dan mengubah file yang ia buat sendiri di folder “${E(FOLDER)}”, tidak bisa membaca file Drive lainnya. Client ID bukan rahasia.</p>`;
  }
  function listHtml(){
    if(listErr)return `<div class="cd-prev err"><h4>Daftar cadangan tidak bisa dibuka</h4><div style="font-size:13px;color:#7a2a2a">${E(listErr)}</div></div>`;
    if(files==null)return '';
    if(!files.length)return `<div class="gd-empty">Belum ada cadangan di folder “${E(FOLDER)}” pada akun Google ini.</div>`;
    return `<div class="gd-list">${files.map(f=>`<div class="gd-item"><div><b>${E(fmt(f.createdTime))}</b><small>${E(f.name)}${f.size?' · '+E(sizeTxt(f.size)):''}</small></div><div class="cd-acts"><button class="btn small gd-act" onclick="gdRestore('${E(f.id)}')">Pilih</button><button class="btn light small gd-act" aria-label="Hapus" onclick="gdDelete('${E(f.id)}','${E(f.name).replace(/'/g,'')}')">Hapus</button></div></div>`).join('')}</div>`;
  }
  function readyHtml(){
    const ld=lastDrive();
    return `<div class="gd-card"><div class="gd-head"><span class="gd-ico">${DRIVE_ICO}</span><div><b>Cadangan ke Google Drive</b><small>${ld?'Terakhir ke Drive: '+E(fmt(ld)):'Belum pernah dicadangkan ke Drive dari perangkat ini.'}</small></div></div>
    <div class="cd-acts"><button class="btn gd-act" onclick="gdBackup()">Cadangkan ke Drive</button><button class="btn secondary gd-act" onclick="gdList()">Pulihkan dari Drive</button></div>
    <div id="gdStatus" class="gd-status" aria-live="polite"></div><div id="gdErr" class="gd-err"></div>
    ${listHtml()}
    <div class="gd-foot">File disimpan di folder “${E(FOLDER)}” pada Drive akun Google yang Anda pilih saat masuk.${isAdmin()?` <button class="gd-link" onclick="gdChangeId()">Ganti Client ID</button>`:''}</div></div>`;
  }
  window.hkDriveRender=function hkDriveRender(){
    const el=$('cdDrive');if(!el)return;
    el.innerHTML=clientId()?readyHtml():setupHtml();
  };
  hkDriveRender();
  setTimeout(hkDriveRender,700);
})();
