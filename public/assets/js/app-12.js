
(function(){
let pai=[];const el=id=>document.getElementById(id);
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function render(){const h=el('paiList');if(!h)return;
 h.innerHTML=pai.length?pai.map((t,i)=>`<div class="pai-row"><div class="formrow"><input placeholder="Contoh: 1A, 2" value="${E(t.kelas)}" oninput="paiSet(${i},'kelas',this.value)" aria-label="Kelas"></div><div class="formrow"><input placeholder="Nama lengkap beserta gelar" value="${E(t.name)}" oninput="paiSet(${i},'name',this.value)" aria-label="Nama guru"></div><div class="formrow"><input placeholder="NIP" value="${E(t.nip)}" oninput="paiSet(${i},'nip',this.value)" aria-label="NIP"></div><button type="button" class="btn danger small" onclick="paiDel(${i})">Hapus</button></div>`).join(''):'<div class="pai-empty">Belum ada guru PAI dan BP. Klik tombol di bawah untuk menambahkan.</div>'}
window.paiSet=(i,f,v)=>{if(pai[i])pai[i][f]=v};
window.paiAdd=()=>{pai.push({kelas:'',name:'',nip:''});render();const r=document.querySelectorAll('#paiList .pai-row');if(r.length)r[r.length-1].querySelector('input').focus()};
window.paiDel=i=>{pai.splice(i,1);render()};
window.paiLoad=()=>{pai=(settings.paiTeachers||[]).map(x=>({...x}));render()};
const s0=window.saveSettings;
window.saveSettings=function(e){settings.paiTeachers=pai.filter(t=>String(t.kelas||t.name||t.nip||'').trim()).map(t=>({kelas:String(t.kelas||'').trim(),name:String(t.name||'').trim(),nip:String(t.nip||'').trim()}));s0(e);paiLoad()};
const r0=window.shRefresh;
window.shRefresh=function(){r0();try{const p=el('shChip-profil');if(p)p.textContent=(settings.school||'Belum diisi')+' · '+((settings.paiTeachers||[]).length)+' guru PAI'}catch(x){}};
const g1=window.go;
window.go=function(v,b){g1(v,b);if(v==='pengaturan'){paiLoad();shRefresh()}};
paiLoad();shRefresh();
})();
