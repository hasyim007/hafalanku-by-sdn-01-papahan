
(function(){
  const P={
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    kelas:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    capaian:'<path d="M5 20V11M12 20V5M19 20v-7"/>',
    alumni:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5"/>',
    siswa:'<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
    scan:'<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
    level:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    ujian:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    riwayat:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    surat:'<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    laporan:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 13h6M10 17h6"/>',
    pengaturan:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>'
  };
  function decorate(){
    document.querySelectorAll('#appRoot .view').forEach(function(v){
      var key=(v.id||'').replace('view-','');
      var head=v.querySelector(':scope>.dhead, :scope>.sectiontitle, :scope>.st-head');
      if(!head||head.querySelector(':scope>.ph-ico')||!P[key])return;
      var i=document.createElement('span');i.className='ph-ico';i.setAttribute('aria-hidden','true');
      i.innerHTML='<svg viewBox="0 0 24 24">'+P[key]+'</svg>';
      head.insertBefore(i,head.firstChild);
    });
  }
  function setDate(){
    var n=new Date(),h=n.getHours();
    var sal=h<4?'Selamat dini hari':h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';
    var a=document.getElementById('dashSalam'),dy=document.getElementById('dashDay'),df=document.getElementById('dashDateFull');
    if(a)a.textContent=sal;
    try{
      if(dy)dy.textContent=n.toLocaleDateString('id-ID',{weekday:'long'});
      if(df)df.textContent=n.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
    }catch(e){if(df)df.textContent=n.toDateString()}
  }
  function setName(){
    try{var a=window.HK&&HK.getAuth&&HK.getAuth();var n=document.querySelector('#dashGreet .ph-name');
      if(a&&a.name&&n)n.textContent=String(a.name).trim()||'Guru'}catch(e){}
  }
  decorate();setDate();setName();
  var _go=window.go;
  if(typeof _go==='function'){window.go=function(v){var r=_go.apply(this,arguments);decorate();if(v==='dashboard'){setDate();setName()}return r}}
})();
