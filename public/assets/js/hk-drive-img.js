
/* Gambar dari link Google Drive: yang disimpan ke D1 hanya teks link (puluhan karakter),
   bukan file gambarnya. File harus dibagikan "Siapa saja yang memiliki link". */
(function(){
  const $=id=>document.getElementById(id);
  const ID=/(?:\/file\/d\/|\/d\/|[?&]id=)([A-Za-z0-9_-]{15,})/;
  function toUrl(t){
    t=String(t||'').trim();if(!t)return '';
    if(/^https:\/\/drive\.google\.com\/thumbnail\?/.test(t))return t;
    let m=t.match(ID);if(!m&&/^[A-Za-z0-9_-]{25,}$/.test(t))m=[0,t];
    return m?'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w800':'';
  }
  function ask(title,cb){
    const w=document.createElement('div');
    w.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(10,30,25,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit';
    w.innerHTML='<form style="background:#fff;border-radius:18px;max-width:440px;width:100%;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.3)"><h3 style="margin:0 0 6px;font-size:17px">'+title+'</h3><p style="margin:0 0 12px;font-size:13px;color:#51645f;line-height:1.5">Tempel link berbagi Google Drive. Di Drive: klik kanan file gambar → Bagikan → akses umum <b>Siapa saja yang memiliki link</b> → Salin link. Hanya link yang disimpan, jadi tidak menambah penyimpanan database.</p><input id="hkDrvIn" placeholder="https://drive.google.com/file/d/…/view" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1.5px solid #cfe0da;border-radius:12px;font:inherit;font-size:14px"><div id="hkDrvEr" style="color:#9b2c2c;font-size:12.5px;margin-top:8px;min-height:16px"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" id="hkDrvNo" class="btn light small">Batal</button><button class="btn small" id="hkDrvOk">Pasang</button></div></form>';
    document.body.appendChild(w);
    const inp=w.querySelector('#hkDrvIn'),er=w.querySelector('#hkDrvEr'),ok=w.querySelector('#hkDrvOk');
    inp.focus();
    w.querySelector('#hkDrvNo').onclick=()=>w.remove();
    w.addEventListener('mousedown',e=>{if(e.target===w)w.remove()});
    w.querySelector('form').onsubmit=e=>{
      e.preventDefault();er.textContent='';
      const url=toUrl(inp.value);
      if(!url){er.textContent='Link Google Drive tidak dikenali. Salin ulang dari menu Bagikan.';return}
      ok.disabled=true;ok.textContent='Memeriksa…';
      const im=new Image(),t=setTimeout(()=>im.onerror(),15000);
      im.onload=()=>{clearTimeout(t);w.remove();cb(url)};
      im.onerror=()=>{clearTimeout(t);ok.disabled=false;ok.textContent='Pasang';er.textContent='Gambar tidak bisa dimuat. Pastikan akses file: Siapa saja yang memiliki link, dan file berupa gambar (PNG/JPG).'};
      im.src=url;
    };
  }
  window.hkDriveLogo=function(slot){
    const T={brand:'Logo aplikasi dari Google Drive',school:'Logo sekolah dari Google Drive',form:'Logo formulir dari Google Drive',kop:'Logo kop dari Google Drive'};
    ask(T[slot]||'Gambar dari Google Drive',function(url){
      if(slot==='brand'){pendingLogo=url;$('logoPreview').src=url;toast('Logo dipilih. Klik Simpan Identitas untuk menerapkan.')}
      else if(slot==='school'){pendingSchoolLogo=url;refreshLogoPreviews();toast('Logo dipilih. Klik Simpan untuk menerapkan.')}
      else if(slot==='form'){pendingFormLogo=url;refreshLogoPreviews();toast('Logo dipilih. Klik Simpan untuk menerapkan.')}
      else if(slot==='kop'&&kopDraft){kopDraft.logo=url;kopDraft.noLogo=false;kopRenderEditor();toast('Logo kop dipasang. Klik Simpan Kop untuk menyimpan.')}
    });
  };
})();
