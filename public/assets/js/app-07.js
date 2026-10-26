
/* ===== Kamera scan (satu per satu / beruntun) + tombol Scan melayang ===== */
let camStream=null,camBusy=false,camMode='one',camN=0;
document.getElementById('appRoot').insertAdjacentHTML('beforeend',`<div class="cam" id="camBox"><video id="camV" playsinline autoplay muted></video><div class="cam-guide"></div><div class="cam-bar"><button class="btn light small" onclick="camClose()">Tutup</button><div id="camInfo" style="flex:1 1 150px"></div><select class="field" id="camMode" onchange="camMode=this.value"><option value="one">Satu per satu</option><option value="bulk">Beruntun (bulk)</option></select><button class="cam-shot" aria-label="Ambil foto" onclick="camShot()"></button><button class="btn small" onclick="camDone()">Selesai</button></div></div>`);
async function camOpen(mode){camMode=mode;camN=0;$('camMode').value=mode;$('camInfo').textContent='Posisikan satu halaman penuh (4 kotak hitam terlihat), lalu ketuk tombol bulat.';
 try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw 0;await lib('jsQR');camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1440}},audio:false});$('camV').srcObject=camStream;$('camBox').style.display='flex'}
 catch(e){toast('Kamera tidak bisa dibuka (butuh izin kamera dan https). Membuka kamera bawaan HP.');$('scCam').click()}}
function camClose(){if(camStream)camStream.getTracks().forEach(t=>t.stop());camStream=null;$('camBox').style.display='none'}
async function camShot(){let v=$('camV');if(!v.videoWidth||camBusy)return;camBusy=true;$('camInfo').textContent='Membaca formulir…';
 try{let c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);let b=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));b.name='kamera-'+(scItems.length+1)+'.jpg';let it=await scAnalyze(b);
  if(it.err){$('camInfo').textContent='⚠ '+it.err+' Coba lagi.';return}
  scItems.push(it);camN++;let s=students.find(x=>x.id===it.studentId);$('camInfo').textContent=`✓ ${camN} terscan · ${s?s.name:'anak belum dikenali (pilih manual nanti)'} · ${scLv(it).mk.filter(Boolean).length} surat hafal`;
  if(camMode==='one')setTimeout(camDone,700)}
 catch(e){$('camInfo').textContent='Gagal membaca foto. Coba lagi.'}finally{camBusy=false}}
function camDone(){camClose();$('scStatus').textContent=`${scItems.length} formulir terbaca. Periksa hasilnya di bawah, koreksi bila perlu, lalu simpan.`;go('scan');scRender();$('scList').scrollIntoView({behavior:'smooth'})}
