
function scKids(){let n=students.filter(s=>s.classId==$('scClass').value&&s.status!=='Nonaktif').length;$('scKids').textContent=n+' anak aktif · satu lembar formulir per anak.'}
const _g2=go;go=function(v,b){_g2(v,b);if(v==='scan')scKids();let f=$('scFab');if(f)f.style.display=(v==='scan'||v==='siswa'||v==='kelas')?'none':''};
