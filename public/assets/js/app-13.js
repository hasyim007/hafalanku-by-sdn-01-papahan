
(function(){const g=window.go;
function sync(v){const t=document.querySelector('.topbar');if(t)t.classList.toggle('nosearch',v!=='dashboard')}
window.go=function(v,b){g(v,b);sync(v)};
sync('dashboard');})();
