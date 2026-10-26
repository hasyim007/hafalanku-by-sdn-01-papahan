/* Hafalanku: umpan balik tiga status untuk setiap simpan / ubah / hapus.
 *
 *   ⏳ Memproses / Menyimpan…   (spinner, bertahan sampai ada hasil)
 *   ✓  Berhasil                 (hijau, hanya setelah server benar-benar mengonfirmasi)
 *   ✕  Gagal                    (merah, dengan tombol "Coba lagi" bila bisa diulang)
 *
 * Cara kerja (tidak perlu mengubah 120+ pemanggilan toast() yang sudah ada):
 *   1. toast() dibungkus. Pesan sukses ("… berhasil disimpan", "… dihapus") yang muncul saat
 *      ada perubahan belum terkirim ditahan sebagai "Menyimpan…", lalu berubah menjadi ✓ atau ✕
 *      setelah HKS.flush() selesai. Jadi centang hijau berarti data SUDAH ada di server.
 *   2. HKS.api() dibungkus untuk panggilan langsung (akun, dll.): "Memproses…" -> hasil,
 *      dan tombol yang sedang ditekan dinonaktifkan sementara agar tidak terkirim ganda.
 *   3. Pesan galat dari server/jaringan otomatis tampil merah.
 * Dimuat tepat setelah app-01.js (tempat toast() didefinisikan).
 */
(function () {
  'use strict';
  if (window.HKFB) return;

  var gen = 0, hideT = 0, ownGen = -1, syncErrGen = -1, apiErr = { m: '', t: 0 };

  var ERR_RE = /gagal|tidak bisa|tidak dapat|kesalahan|belum tersimpan|terlalu besar|penuh|ditolak|tidak terhubung|tidak merespons|sudah dipakai|salah/i;
  var OK_RE = /berhasil|tersimpan|disimpan|dihapus|ditambahkan|diperbarui|dicatat|dipasang|dipulihkan|diperbarui/i;
  var NOT_OK_RE = /klik|^belum|^isi |^pilih|^gunakan/i;

  // Tampilan kartu: putih, bersih, ikon bulat berwarna lembut, judul + keterangan, bilah waktu tipis.
  // Selector digandakan dengan "#appRoot" supaya menang atas gaya toast bawaan tema.
  function R(sel, decl) { return sel + ',#appRoot ' + sel + '{' + decl + '}'; }
  var css = [
    R('.toast.hkt.show', 'display:flex;align-items:flex-start;gap:12px;position:fixed;width:min(372px,calc(100vw - 28px));max-width:none;padding:13px 12px 15px 14px;background:#fff;color:#1b2430;border:1px solid rgba(20,30,50,.08);border-radius:16px;box-shadow:0 1px 2px rgba(16,24,40,.06),0 14px 34px -8px rgba(16,24,40,.28);text-align:left;font-size:13px;line-height:1.45;overflow:hidden;animation:hktin .34s cubic-bezier(.2,.8,.2,1)'),
    R('.toast.hkt.hkt-single.show', 'align-items:center'),
    '.toast .hkt-i{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center}',
    '.toast .hkt-i svg{width:18px;height:18px;display:block}',
    '.toast.hkt-busy .hkt-i{background:#fef3c7;color:#b45309}.toast.hkt-busy .hkt-i svg{animation:hktspin .8s linear infinite}',
    '.toast.hkt-ok .hkt-i{background:#d1fae5;color:#047857}',
    '.toast.hkt-err .hkt-i{background:#ffe4e6;color:#be123c}',
    '.toast.hkt-info .hkt-i{background:#e0e7ff;color:#4338ca}',
    '.toast .hkt-body{flex:1;min-width:0}',
    '.toast .hkt-t{font-weight:700;font-size:13px;color:#0f172a;letter-spacing:.005em}',
    '.toast .hkt-d{color:#566474;font-size:12.5px;margin-top:1px;word-break:break-word}',
    '.toast.hkt-single .hkt-d{color:#1b2430;font-size:13px;font-weight:500;margin:0}',
    '.toast .hkt-b{display:inline-block;margin-top:9px;border:0;border-radius:999px;background:#be123c;color:#fff;padding:6px 15px;font-family:inherit;font-weight:600;font-size:12px;line-height:1.2;cursor:pointer;box-shadow:0 4px 10px -3px rgba(190,18,60,.5)}',
    '.toast .hkt-b:hover{background:#9f1239}',
    '.toast .hkt-u{flex:none;align-self:center;border:0;border-radius:999px;background:#eef2ff;color:#3730a3;padding:7px 14px;font-family:inherit;font-weight:700;font-size:12.5px;line-height:1.2;cursor:pointer}.toast .hkt-u:hover{background:#e0e7ff}',
    '.toast .hkt-a{display:inline-block;text-decoration:none}.toast .hkt-b.hkt-ghost{background:transparent;color:#be123c;box-shadow:none;border:1px solid #fecdd3;margin-left:6px}',
    '.toast .hkt-x{flex:none;width:24px;height:24px;margin:-2px -2px 0 0;border:0;border-radius:50%;background:transparent;color:#94a3b8;cursor:pointer;display:grid;place-items:center;padding:0}',
    '.toast .hkt-x:hover{background:#f1f5f9;color:#475569}.toast .hkt-x svg{width:13px;height:13px}',
    '.toast .hkt-bar{position:absolute;left:0;bottom:0;height:3px;width:100%;transform-origin:left;opacity:.55;animation:hktbar var(--d,3s) linear forwards}',
    '.toast.hkt-ok .hkt-bar{background:#10b981}.toast.hkt-err .hkt-bar{background:#e11d48}.toast.hkt-info .hkt-bar{background:#6366f1}',
    '.hk-busy{opacity:.65;cursor:progress!important}',
    /* Formulir (modal) harus di atas menu bawah HP, dan toast di atas formulir. Sebelumnya tombol Simpan tertutup menu bawah. */
    '#appRoot .modalback.open{z-index:60}#appRoot .toast.show{z-index:10001}',
    '#hkOff{position:fixed;z-index:10002;left:50%;top:14px;transform:translate(-50%,-160%);display:flex;align-items:center;gap:10px;max-width:calc(100vw - 28px);padding:9px 16px 9px 12px;background:#fff;color:#7c4a03;border:1px solid #fcd9a0;border-radius:999px;box-shadow:0 1px 2px rgba(16,24,40,.06),0 12px 28px -8px rgba(16,24,40,.28);white-space:nowrap;font:600 12.5px/1.35 "Plus Jakarta Sans",system-ui,sans-serif;opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s}',
    '#hkOff.on{transform:translate(-50%,0);opacity:1}',
    '#hkOff i{flex:none;width:9px;height:9px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.22);animation:hkoffp 1.6s ease-in-out infinite}',
    '@keyframes hkoffp{50%{box-shadow:0 0 0 7px rgba(245,158,11,0)}}',
    '@media (max-width:700px){#hkOff{top:64px}}',
    '@keyframes hktspin{to{transform:rotate(360deg)}}@keyframes hktbar{to{transform:scaleX(0)}}',
    '@keyframes hktin{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}',
    '@media (max-width:700px){#appRoot .toast.hkt.show,.toast.hkt.show{width:auto}}',
    '@media (prefers-reduced-motion:reduce){#appRoot .toast.hkt.show,.toast.hkt.show{animation:none}.toast.hkt-busy .hkt-i svg{animation-duration:2.4s}.toast .hkt-bar{display:none}}',
    '@media print{.toast{display:none!important}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el() {
    var t = document.getElementById('toast');
    if (t && !t.getAttribute('role')) { t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); }
    return t;
  }

  var SVG = function (d, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>'; };
  var ICON = {
    busy: SVG('<path d="M12 3a9 9 0 1 0 9 9"/>'),
    ok: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    err: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    info: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.7v.01"/>')
  };
  var TITLE = { busy: 'Memproses', ok: 'Berhasil', err: 'Gagal' };

  // kind: 'busy' | 'ok' | 'err' | '' (netral). opts: {retry:true, sync:true}
  function paint(kind, msg, opts) {
    var t = el(); if (!t) return 0;
    opts = opts || {};
    clearTimeout(hideT);
    var my = ++gen, k = kind || 'info', title = TITLE[kind] || '';
    t.className = 'toast show hkt hkt-' + k + (title ? '' : ' hkt-single');
    t.textContent = '';
    var i = document.createElement('span'); i.className = 'hkt-i'; i.innerHTML = ICON[k]; t.appendChild(i);
    var body = document.createElement('div'); body.className = 'hkt-body';
    if (title) { var h = document.createElement('div'); h.className = 'hkt-t'; h.textContent = title; body.appendChild(h); }
    var s = document.createElement('div'); s.className = 'hkt-d'; s.textContent = msg; body.appendChild(s);
    if (opts.login) {
      var a = document.createElement('a'); a.className = 'hkt-b hkt-a'; a.href = '/admin/login.html'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Masuk kembali';
      a.onclick = function (e) { e.stopPropagation(); };
      body.appendChild(a);
    }
    if (opts.retry) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hkt-b' + (opts.login ? ' hkt-ghost' : ''); b.textContent = 'Coba lagi';
      b.onclick = function (e) { e.stopPropagation(); paint('busy', 'Sedang menyimpan data…', { sync: true }); watch(); try { HKS.retry(); } catch (x) {} };
      body.appendChild(b);
    }
    t.appendChild(body);
    if (opts.undo) {
      var u = document.createElement('button'); u.type = 'button'; u.className = 'hkt-u'; u.textContent = 'Batalkan';
      u.onclick = function (e) { e.stopPropagation(); clearTimeout(hideT); opts.undo(); };
      t.appendChild(u);
    }
    if (kind !== 'busy') {
      var x = document.createElement('button'); x.type = 'button'; x.className = 'hkt-x'; x.setAttribute('aria-label', 'Tutup');
      x.innerHTML = SVG('<path d="M6 6l12 12M18 6L6 18"/>'); x.onclick = function (e) { e.stopPropagation(); hide(); };
      t.appendChild(x);
      var ms = opts.ms || (kind === 'err' ? 8000 : kind === 'ok' ? 2800 : 3400);
      var bar = document.createElement('i'); bar.className = 'hkt-bar'; t.style.setProperty('--d', ms + 'ms'); t.appendChild(bar);
      hideT = setTimeout(function () { if (gen !== my) return; if (opts.onExpire) opts.onExpire(); else hide(); }, ms);
    }
    ownGen = opts.sync ? my : -1;
    syncErrGen = kind === 'err' && opts.retry ? my : -1; // hanya galat penyimpanan yang boleh diganti pesan "pulih"
    if (opts.sync && kind !== 'err') { var c = document.getElementById('hkSync'); if (c) c.className = ''; } // chip kecil mengalah ke toast
    return my;
  }
  function clearBusy() { var t = el(); if (t && t.classList.contains('show') && t.classList.contains('hkt-busy')) hide(); }
  function hide() { var t = el(); if (t) t.classList.remove('show'); ownGen = -1; try { HKS.reshow(); } catch (e) {} }

  // Dipakai hk-store: bila toast sedang memegang status simpan, chip kecil tidak ikut tampil.
  function owns() { var t = el(); return !!t && t.classList.contains('show') && ownGen === gen; }

  var SAVING = 'Sedang menyimpan data…';

  // Tunggu hasil pengiriman ke server, lalu ubah toast menjadi ✓ atau ✕.
  function watch(okMsg) {
    var my = gen;
    HKS.flush().then(function (ok) {
      if (ok) {
        if (gen === my) paint('ok', okMsg || 'Data berhasil disimpan.', { sync: true });
      } else {
        // Kegagalan selalu ditampilkan, walau toast lain sempat muncul.
        var why = String(HKS.lastError() || '').replace(/[.\s]+$/, '');
        if (HKS.lastStatus() === 401) { paint('err', 'Sesi Anda telah berakhir. Masuk kembali di tab baru, lalu kembali ke sini dan klik Coba lagi. Perubahan Anda belum hilang.', { retry: true, login: true }); return; }
        paint('err', 'Data gagal disimpan' + (why ? ': ' + why : '') + '. Perubahan Anda tidak hilang dan sistem akan mencoba kembali secara otomatis.', { retry: true });
      }
    });
  }

  function classify(msg) {
    if (apiErr.m && msg === apiErr.m && Date.now() - apiErr.t < 4000) return 'err';
    if (ERR_RE.test(msg)) return 'err';
    if (OK_RE.test(msg) && !NOT_OK_RE.test(msg)) return 'ok';
    return '';
  }

  function toast(msg) {
    msg = String(msg == null ? '' : msg);
    var kind = classify(msg);
    if (kind === 'err') return paint('err', msg);
    if (kind === '') return paint('', msg);
    // Pesan sukses: tunggu sebentar agar kode pemanggil sempat menyimpan data, lalu periksa.
    setTimeout(function () {
      if (window.HKS && HKS.isDirty()) {
        paint('busy', SAVING, { sync: true });
        watch(msg);
      } else {
        paint('ok', msg);
      }
    }, 0);
  }

  // ---------- panggilan API langsung (akun, dll.) ----------
  var rawApi = HKS.api;
  HKS.api = function (method, path, body) {
    if (method === 'GET' || path === '/api/sync' || path.indexOf('/api/auth/') === 0) return rawApi(method, path, body);
    var my = paint('busy', 'Sedang memproses permintaan…');
    var btn = document.activeElement;
    if (btn && btn.tagName === 'BUTTON' && !btn.disabled) { btn.disabled = true; btn.classList.add('hk-busy'); } else btn = null;
    function free() { if (btn) { btn.disabled = false; btn.classList.remove('hk-busy'); } }
    return rawApi(method, path, body).then(function (r) {
      free();
      // Bila pemanggil tidak menampilkan toast sendiri, tutup status "Memproses…" setelah jeda singkat.
      setTimeout(function () { if (gen === my) paint('ok', 'Permintaan berhasil diproses.'); }, 1500);
      return r;
    }, function (e) {
      free();
      apiErr = { m: e && e.message || 'Permintaan gagal diproses.', t: Date.now() };
      paint('err', apiErr.m);
      throw e;
    });
  };

  // ---------- pulih otomatis setelah gagal ----------
  HKS.on(function (kind) {
    if (kind === 'ok' && syncErrGen === gen && el() && el().classList.contains('hkt-err')) paint('ok', 'Perubahan berhasil disimpan.', { sync: true });
  });

  // Bungkus umum untuk kode baru: HKFB.run(promise, {busy:'…', ok:'…'})
  function run(p, o) {
    o = o || {};
    paint('busy', o.busy || 'Sedang memproses…');
    return Promise.resolve(p).then(function (r) { paint('ok', o.ok || 'Proses berhasil.'); return r; },
      function (e) { paint('err', (o.err ? o.err + ' ' : '') + (e && e.message || 'Proses gagal.')); throw e; });
  }

  // Tombol status: laporkan keadaan sebenarnya, bukan pesan tetap.
  function status() {
    if (HKS.isDirty()) {
      if (HKS.status() === 'error') return paint('err', 'Data belum tersimpan: ' + String(HKS.lastError() || 'koneksi bermasalah').replace(/[.\s]+$/, '') + '.', { retry: true, sync: true });
      paint('busy', SAVING, { sync: true }); return watch('Semua data telah tersimpan.');
    }
    paint('ok', 'Semua data telah tersimpan.');
  }

  // Penghapusan yang bisa dibatalkan: tampil 6 detik dengan tombol Batalkan, lalu dipastikan tersimpan.
  function undoable(msg, restore) {
    paint('', msg, {
      ms: 6000, sync: true,
      undo: function () {
        try { restore(); } catch (e) { paint('err', 'Pembatalan gagal: ' + (e && e.message || 'data tidak dapat dikembalikan.')); return; }
        paint('ok', 'Penghapusan dibatalkan. Data telah dikembalikan.');
        if (HKS.isDirty()) watch('Data telah dikembalikan dan tersimpan.');
      },
      onExpire: function () { paint('busy', SAVING, { sync: true }); watch(msg); }
    });
  }

  window.toast = toast;
  window.HKFB = { undoable: undoable, clearBusy: clearBusy, status: status, toast: toast, paint: paint, owns: owns, run: run };

  // ---------- pita offline ----------
  var offEl = null, wasOff = false;
  function offBar(on) {
    if (!offEl) {
      if (!document.body) return;
      offEl = document.createElement('div'); offEl.id = 'hkOff'; offEl.setAttribute('role', 'status'); offEl.setAttribute('aria-live', 'polite');
      offEl.innerHTML = '<i></i><span>Offline. Perubahan dikirim saat tersambung.</span>';
      document.body.appendChild(offEl);
      void offEl.offsetWidth; // pastikan transisi masuk berjalan
    }
    offEl.classList.toggle('on', !!on);
  }
  function net() {
    if (navigator.onLine === false) { wasOff = true; offBar(true); return; }
    offBar(false);
    if (!wasOff) return;
    wasOff = false;
    if (HKS.isDirty()) { paint('busy', 'Tersambung kembali. Mengirim perubahan…', { sync: true }); watch('Koneksi pulih. Semua perubahan telah tersimpan.'); }
    else paint('ok', 'Koneksi tersambung kembali.');
  }
  window.addEventListener('offline', net); window.addEventListener('online', net);
  if (navigator.onLine === false) net();

  // Klik pada toast menutupnya (kecuali sedang memproses).
  document.addEventListener('click', function (e) {
    var t = el();
    if (t && t.contains(e.target) && !t.classList.contains('hkt-busy') && !e.target.closest('.hkt-b')) hide();
  });
})();
