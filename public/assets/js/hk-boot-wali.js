
/* Pemuat halaman orang tua / wali: data dimuat per anak dari server setelah verifikasi. */
(function(){
  var splash=document.getElementById('hkSplash');
  function bad(t,retry){if(!splash)return;splash.classList.add('err');splash.innerHTML='<b>'+t+'</b>'+(retry?'<a href="javascript:location.reload()">Muat ulang</a>':'')+'<a href="/">Kembali ke halaman awal</a>'}
  function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=function(){no(new Error('Gagal memuat '+src))};document.head.appendChild(s)})}
  window.HKW={info:null,pub:[],
    stubs:function(classId){
      return HKS.api('GET','/api/wali/anak?kelas='+encodeURIComponent(classId)).then(function(r){
        students=r.students.map(function(s){return{id:s.id,name:s.name,classId:classId,status:'Aktif',_m:s.m}});
      });
    },
    resetPublic:function(){classes=HKW.pub;students=[];logs=[];try{exams.length=0}catch(e){}},
    report:async function(id,mode,nis,dob){
      var r=await HKS.api('POST','/api/wali/lapor',{id:id,mode:mode,nis:nis,dob:dob});
      students=[r.student];classes=r.cls?[r.cls]:[];logs=r.logs;
      exams.length=0;r.exams.forEach(function(x){exams.push(x)});
      settings=Object.assign({name:'Guru Tahfidz',school:HKW.info.school||'SDN 01 Papahan',year:HKW.info.year||'',appName:'Hafalanku',logo:null},r.settings);
      if(r.surahs&&r.surahs.length)surahs=r.surahs;
      try{if(r.levelMap&&lvValid(r.levelMap))lvApply(r.levelMap)}catch(e){}
      HKLS.setItem('hkMessages',JSON.stringify({v:1,items:r.message?[r.message]:[],generated:[]}));
      try{if(window.pmReload)window.pmReload()}catch(e){}
      return r.student;
    }
  };
  (async function(){
    HKS.setMode('wali');HKS.seed({});
    try{HKW.info=await HKS.api('GET','/api/wali/info')}catch(e){return bad('Tidak dapat terhubung ke server. '+e.message,true)}
    if(!HKW.info.on)return bad('Portal orang tua sedang dinonaktifkan oleh sekolah.',false);
    try{for(var i=0;i<window.HK_APP_SCRIPTS.length;i++)await load(window.HK_APP_SCRIPTS[i])}
    catch(e){return bad(e.message,true)}
    HKW.pub=HKW.info.classes.map(function(c){return{id:c.id,name:c.name,grade:c.grade}});
    classes=HKW.pub;students=[];
    settings.school=HKW.info.school||settings.school;
    window.verMethods=function(s){return(s&&s._m)||[]};
    window.verOn=function(){return !!HKW.info.needVerify};
    if(splash)splash.remove();
    HK.openParent();
  })();
})();
