
/* ===== Kamera scan otomatis: formulir dibaca sendiri saat diarahkan ke kamera, lalu langsung disimpan ===== */
let camStream=null,camN=0,camMode='one',camTimer=null,camRun=false,camPrev=null,camLock=null,camGoneAt=0,camSeen=new Set(),camCv=null,camNoteT=null,camAC=null;
const CAM_RES=1600,CAM_GAP=400; // resolusi analisis per bidikan (sama dengan scAnalyze) dan jeda antar bidikan (ms)
document.getElementById('appRoot').insertAdjacentHTML('beforeend',`<div class="cam" id="camBox"><video id="camV" playsinline autoplay muted></video><div class="cam-guide"></div><div id="camNote" style="display:none;position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:2;width:calc(100% - 32px);max-width:520px;box-sizing:border-box;padding:12px 16px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;line-height:1.35;text-align:center;box-shadow:0 6px 24px #0008"></div><div class="cam-bar"><button class="btn light small" onclick="camClose()">Tutup</button><div id="camInfo" style="flex:1 1 150px"></div><select class="field" id="camMode" onchange="camMode=this.value"><option value="one">Satu per satu</option><option value="bulk">Beruntun (bulk)</option></select><button class="cam-shot" aria-label="Simpan sekarang" title="Simpan sekarang tanpa menunggu" onclick="camShot()"></button><button class="btn small" onclick="camDone()">Selesai</button></div></div>`);

function camNote(msg,kind){const el=$('camNote');if(!el)return;
 el.textContent=msg;el.style.background=kind==='ok'?'#15803d':kind==='warn'?'#b45309':'rgba(15,23,42,.9)';el.style.display='block';
 clearTimeout(camNoteT);camNoteT=setTimeout(()=>{el.style.display='none'},kind==='ok'?3500:kind==='warn'?6000:2500);
 if(kind==='ok'){try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch(e){}camBeep()}}
function camBeep(){try{if(!camAC)return;if(camAC.state==='suspended')camAC.resume();const o=camAC.createOscillator(),g=camAC.createGain();o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(camAC.destination);o.start();o.stop(camAC.currentTime+.2)}catch(e){}}
function camSig(it){const m=(it.marksByPage||[])[it.page||0]||[];return m.map(b=>b?1:0).join('')}

/* Satu bidikan sudah dibaca. Formulir disimpan hanya jika bacaannya sama di dua bidikan berurutan
   (kamera tidak goyang), anaknya dikenali dari QR, dan formulir itu belum diproses selama masih di depan kamera. */
function camJudge(it,force){
 const now=Date.now();
 if(it.err){camPrev=null;if(!camGoneAt)camGoneAt=now;if(camLock&&now-camGoneAt>1200)camLock=null;
  if(!camN)$('camInfo').textContent='Arahkan kamera ke formulir. Tidak perlu menekan tombol.';return}
 camGoneAt=0;
 const key=it.studentId?'id:'+it.studentId:'anon',sig=camSig(it),cur=key+'|'+sig,stable=camPrev===cur;
 camPrev=cur;
 if(!stable&&!force)return;
 if(camLock===key)return;
 camLock=key;
 if(!it.studentId){
  if(!scItems.some(x=>!x.studentId&&camSig(x)===sig))scItems.push(it);
  camNote('Formulir terbaca, tapi anaknya belum dikenali (QR tidak terbaca). Pilih anaknya di daftar scan.','warn');
  if(camMode==='one')setTimeout(camFinish,1800);
  return}
 const s=students.find(x=>x.id===it.studentId);
 if(!s){camNote('Anak pada formulir ini tidak ditemukan di data.','warn');return}
 if(camSeen.has(s.id)){camNote(`${s.name} sudah tersimpan dari formulir ini.`,'info');return}
 const c=scApply(it);
 if(c<=0){camNote(`${s.name}: belum ada surat yang dihitamkan, belum disimpan.`,'warn');return}
 camSeen.add(s.id);camN++;refresh();
 const kel=(classes.find(x=>x.id==s.classId)||{}).name||'';
 camNote(`✓ Scan berhasil: ${s.name}${kel?' · '+kel:''} · ${c} surat masuk`,'ok');
 $('camInfo').textContent=`✓ ${camN} formulir tersimpan`;
 toast(`Scan berhasil: ${s.name}, ${c} surat tersimpan.`);
 if(camMode==='one')setTimeout(camFinish,1800);
}
function camTick(force){
 const v=$('camV');if(!camStream||!v||!v.videoWidth)return null;
 const k=Math.min(1,CAM_RES/Math.max(v.videoWidth,v.videoHeight)),w=Math.round(v.videoWidth*k),h=Math.round(v.videoHeight*k);
 camCv=camCv||document.createElement('canvas');camCv.width=w;camCv.height=h;
 const cx=camCv.getContext('2d',{willReadFrequently:true});cx.drawImage(v,0,0,w,h);
 const it=scAnalyzeData(cx.getImageData(0,0,w,h),w,h,'kamera');
 camJudge(it,force);return it;
}
function camLoop(){if(!camRun)return;try{camTick(false)}catch(e){}camTimer=setTimeout(camLoop,CAM_GAP)}
function camShot(){if(!camRun)return;const it=camTick(true);if(it&&it.err)camNote('Formulir belum terbaca. Pastikan seluruh halaman dan 4 kotak hitam terlihat.','info')}
async function camOpen(mode){camMode=mode;camN=0;camSeen=new Set();camLock=null;camPrev=null;camGoneAt=0;
 $('camMode').value=mode;$('camInfo').textContent='Arahkan kamera ke formulir. Tidak perlu menekan tombol.';
 try{
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw 0;
  await lib('jsQR');
  camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1440}},audio:false});
  $('camV').srcObject=camStream;$('camBox').style.display='flex';
  try{camAC=camAC||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
  camRun=true;camLoop();
 }catch(e){toast('Kamera tidak bisa dibuka (butuh izin kamera dan https). Membuka kamera bawaan HP.');$('scCam').click()}
}
function camClose(){camRun=false;clearTimeout(camTimer);if(camStream)camStream.getTracks().forEach(t=>t.stop());camStream=null;$('camBox').style.display='none';const n=$('camNote');if(n)n.style.display='none'}
function camFinish(){if(!camRun)return;if(scItems.length)camDone();else camClose()}
function camDone(){camClose();
 if(scItems.length){$('scStatus').textContent=`${scItems.length} formulir terbaca. Periksa hasilnya di bawah, koreksi bila perlu, lalu simpan.`;go('scan');scRender();$('scList').scrollIntoView({behavior:'smooth'})}
 else if(camN)toast(`${camN} formulir tersimpan ke kelas.`)}
