
(function(){
 const adm=()=>{try{return (HK.getAuth()||{}).role==='admin'}catch(e){return false}};
 const deny=()=>{try{toast('Hanya admin yang dapat melakukan tindakan ini.')}catch(e){}};
 const guard=(name,async_)=>{const f=window[name];if(typeof f!=='function')return;const w=async_?async function(){if(!adm()){deny();return}return f.apply(this,arguments)}:function(){if(!adm()){deny();return}return f.apply(this,arguments)};try{window[name]=w}catch(e){}};
 ['resetData','taOpen','taUndo','cdApply','cdUndo','lvReset','lvUndo','lvCommit','dsDelete','pmOpenBulkGen'].forEach(n=>guard(n,false));
 /* form lama "Catat Kemajuan": batasi ayat sesuai surat, dan sinkronkan ke catatan ayat hafal */
 const _sm=submitModal;
 submitModal=function(e){
  if(modalMode!=='progress')return _sm(e);
  const v=Object.fromEntries(new FormData(e.target).entries()),from=Number(v.from),to=Number(v.to),max=(typeof LV_MASTER!=='undefined')?LV_MASTER.get(v.surah):null;
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from){e.preventDefault();toast('Rentang ayat tidak valid.');return}
  if(max&&to>max){e.preventDefault();toast('Surat '+v.surah+' hanya '+max+' ayat.');return}
  const n0=logs.length,r=_sm(e);
  if(logs.length>n0&&max&&(v.status==='Lancar')){
   const s=students.find(x=>x.id==v.studentId);
   if(s){const lv=Object.keys(HAFALAN_CURRICULUM).find(l=>HAFALAN_CURRICULUM[l].some(c=>c[0]===v.surah));
    if(lv){s.surahProgress=s.surahProgress||{};const rg=hfRangesFor(s,v.surah).slice();rg.push({from,to,status:'Hafal',date:v.date||today(),note:v.note||''});s.surahProgress[v.surah]={level:lv,surah:v.surah,ranges:rg,from,to,status:'Hafal',date:v.date||today(),note:v.note||''};if(!s.hafalanLevel)s.hafalanLevel=defaultHafalanLevel(s);try{save();refresh()}catch(_){}}}
  }
  return r;
 };
})();
