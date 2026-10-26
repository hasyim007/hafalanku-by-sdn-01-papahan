/* Hafalanku: lapisan penyimpanan.
 *
 * Aplikasi lama membaca/menulis data lewat localStorage (hkClasses, hkStudents, ...).
 * Di versi ini semua pemanggilan itu diarahkan ke objek HKLS di bawah, yang:
 *   - memuat data dari server (D1) sekali saat halaman dibuka (HKS.hydrate),
 *   - menyimpan data di memori agar aplikasi tetap cepat,
 *   - mengirim HANYA baris yang berubah ke /api/sync (HKS.flush),
 *   - menyimpan kunci lokal perangkat (pengingat cadangan, dll.) di localStorage asli.
 *
 * Browser tidak pernah mengakses D1 langsung; semua lewat API Worker.
 */
(function () {
  'use strict';

  (function () {
    var s = document.createElement('style');
    s.textContent = '.hk-btnspin{display:inline-block;flex:none;width:15px;height:15px;border:2.5px solid currentColor;border-right-color:transparent;border-radius:50%;opacity:.9;animation:hkbs .75s linear infinite}@keyframes hkbs{to{transform:rotate(360deg)}}';
    (document.head || document.documentElement).appendChild(s);
  })();
  var SYNC_KEYS = ['hkClasses', 'hkStudents', 'hkSurahs', 'hkLogs', 'hkSettings', 'hkExams', 'hkLevelMap', 'hkMessages', 'hkArchive'];
  var ARRAY_TABLE = {
    hkClasses: 'classes', hkStudents: 'students', hkLogs: 'progress',
    hkExams: 'exams', hkSurahs: 'surahs', hkArchive: 'archive'
  };
  var realLS = null;
  try { realLS = window.localStorage; } catch (e) {}

  var mode = 'admin'; // 'admin' = tersambung ke server; 'wali' = hanya memori
  var cache = Object.create(null); // kunci -> teks JSON atau null
  var snap = Object.create(null); // kunci -> Map(entitas -> teks JSON yang sudah ada di server)
  var lastRaw = Object.create(null); // kunci -> teks terakhir yang sudah dibandingkan
  var dirty = Object.create(null);
  var timer = 0, running = null, retryTimer = 0, retryN = 0, state = 'idle', lastError = '', lastStatus = 0;
  var waiters = [];

  function isSync(k) { return SYNC_KEYS.indexOf(k) > -1; }

  // ---------- pemetaan kunci aplikasi -> entitas tabel ----------
  function entities(key, raw) {
    var out = new Map(), data;
    if (raw == null) return out;
    try { data = JSON.parse(raw); } catch (e) { return out; }
    if (ARRAY_TABLE[key]) {
      if (!Array.isArray(data)) return out;
      var t = ARRAY_TABLE[key];
      for (var i = 0; i < data.length; i++) {
        var o = data[i];
        if (!o || typeof o !== 'object' || o.id == null) continue;
        out.set(t + '|' + o.id, { t: t, id: String(o.id), j: JSON.stringify(o) });
      }
    } else if (key === 'hkSettings') {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        Object.keys(data).forEach(function (p) {
          if (data[p] === undefined) return;
          out.set('settings|set.' + p, { t: 'settings', id: 'set.' + p, j: JSON.stringify(data[p]) });
        });
      }
    } else if (key === 'hkLevelMap') {
      if (data && typeof data === 'object') out.set('settings|levelmap', { t: 'settings', id: 'levelmap', j: JSON.stringify(data) });
    } else if (key === 'hkMessages') {
      if (data && typeof data === 'object') {
        (Array.isArray(data.items) ? data.items : []).forEach(function (o) {
          if (!o || typeof o !== 'object' || o.studentId == null) return;
          out.set('messages|' + o.studentId, { t: 'messages', id: String(o.studentId), j: JSON.stringify(o) });
        });
        out.set('settings|msg.generated', { t: 'settings', id: 'msg.generated', j: JSON.stringify(Array.isArray(data.generated) ? data.generated : []) });
      }
    }
    return out;
  }

  // ---------- API HTTP ----------
  function api(method, path, body) {
    // Batas waktu 45 detik agar status "Menyimpan…" tidak menggantung selamanya saat koneksi macet.
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var tm = ctl ? setTimeout(function () { ctl.abort(); }, 45000) : 0;
    return fetch(path, {
      method: method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      clearTimeout(tm);
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) {
          var err = new Error((j && j.error) || ('Kesalahan ' + r.status));
          err.status = r.status; err.code = j && j.code; throw err;
        }
        return j;
      });
    }, function (e) {
      clearTimeout(tm);
      var err = new Error(e && e.name === 'AbortError' ? 'Server tidak merespons (koneksi lambat).' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
      err.status = 0; err.network = true; throw err;
    });
  }

  // ---------- indikator status simpan ----------
  var chip = null;
  function ensureChip() {
    if (chip || !document.body) return chip;
    var st = document.createElement('style');
    st.textContent = '#hkSync{position:fixed;left:16px;bottom:16px;z-index:99999;display:none;align-items:center;gap:8px;max-width:calc(100vw - 32px);padding:9px 14px;border-radius:999px;background:#10302a;color:#fff;font:600 12.5px/1.3 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 10px 30px rgba(10,40,33,.28)}#hkSync.on{display:inline-flex}#hkSync.err{background:#9b2c2c}#hkSync a,#hkSync button{color:#fff;background:rgba(255,255,255,.18);border:0;border-radius:999px;padding:4px 10px;font:inherit;cursor:pointer;text-decoration:none}#hkSync i{width:9px;height:9px;border-radius:50%;background:#6ee7b7;flex:none}#hkSync.busy i{background:#fbbf24;animation:hkp 1s infinite}#hkSync.err i{background:#fecaca}@keyframes hkp{50%{opacity:.35}}@media (max-width:700px){#hkSync{bottom:88px}}@media print{#hkSync{display:none!important}}';
    document.head.appendChild(st);
    chip = document.createElement('div');
    chip.id = 'hkSync'; chip.setAttribute('role', 'status'); chip.setAttribute('aria-live', 'polite');
    document.body.appendChild(chip);
    return chip;
  }
  var hideT = 0, listeners = [], pendingErr = null, touched = false;
  // Perubahan otomatis saat halaman baru dibuka (sebelum pengguna menyentuh apa pun) tidak perlu diberitahukan.
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { touched = true; }, true); });
  function emit(kind, text) {
    listeners.slice().forEach(function (f) { try { f(kind, text); } catch (e) {} });
  }
  function show(kind, text, extra, force) {
    emit(kind, text);
    if (kind !== 'err') pendingErr = null;
    // Bila toast umpan balik sedang menampilkan status yang sama, chip tidak ikut tampil (hindari dobel).
    // Kegagalan ditunda: chip muncul lagi setelah toast hilang bila masih gagal (reshow).
    if (window.HKFB && HKFB.owns && HKFB.owns() && !force) {
      if (kind === 'err') pendingErr = [text, extra];
      if (chip) chip.className = '';
      return;
    }
    if (kind !== 'err' && !touched) { if (chip) chip.className = ''; return; }
    var c = ensureChip(); if (!c) return;
    clearTimeout(hideT);
    c.className = 'on ' + (kind === 'err' ? 'err' : kind === 'busy' ? 'busy' : '');
    c.innerHTML = '<i></i><span></span>' + (extra || '');
    c.querySelector('span').textContent = text;
    var rb = c.querySelector('[data-retry]');
    if (rb) rb.onclick = function () { retryNow(); };
    if (kind === 'ok') hideT = setTimeout(function () { c.className = ''; }, 2200);
  }

  // ---------- kirim perubahan ----------
  function mark(k) {
    if (mode !== 'admin') return;
    dirty[k] = true;
    clearTimeout(timer);
    timer = setTimeout(run, 600);
    if (state !== 'busy') show('busy', 'Sedang menyimpan data…');
  }

  function buildOps() {
    var ups = [], dels = [], plan = [];
    Object.keys(dirty).forEach(function (k) {
      var raw = cache[k] == null ? null : cache[k];
      if (raw === lastRaw[k]) return; // tidak berubah sejak terakhir tersimpan
      var oldMap = snap[k] || new Map();
      var newMap = entities(k, raw);
      newMap.forEach(function (e, ek) {
        var o = oldMap.get(ek);
        if (!o || o.j !== e.j) ups.push({ ek: ek, k: k, e: e });
      });
      oldMap.forEach(function (e, ek) { if (!newMap.has(ek)) dels.push({ ek: ek, k: k, e: e }); });
      plan.push({ k: k, raw: raw });
    });
    return { ups: ups, dels: dels, plan: plan };
  }

  function sendChunks(ops) {
    var maxUp = 120, maxDel = 400;
    var ui = 0, di = 0;
    function next() {
      if (ui >= ops.ups.length && di >= ops.dels.length) return Promise.resolve();
      var u = [], size = 0;
      while (ui < ops.ups.length && u.length < maxUp && size < 1200000) {
        var it = ops.ups[ui]; size += it.e.j.length; u.push(it); ui++;
        if (it.e.j.length > 900000) break; // satu baris besar dikirim sendiri
      }
      var d = ops.dels.slice(di, di + maxDel); di += d.length;
      var payload = {
        up: u.map(function (x) { return { t: x.e.t, id: x.e.id, j: x.e.j }; }),
        del: d.map(function (x) { return { t: x.e.t, id: x.e.id }; })
      };
      return api('POST', '/api/sync', payload).then(function () {
        u.forEach(function (x) { (snap[x.k] || (snap[x.k] = new Map())).set(x.ek, x.e); });
        d.forEach(function (x) { if (snap[x.k]) snap[x.k].delete(x.ek); });
        return next();
      }, function (err) {
        if (err.code === 'TOO_BIG' && (maxUp > 10 || maxDel > 40)) {
          ui -= u.length; di -= d.length; maxUp = Math.max(10, maxUp >> 1); maxDel = Math.max(40, maxDel >> 1);
          return next();
        }
        throw err;
      });
    }
    return next();
  }

  function run() {
    if (running) return running;
    if (!Object.keys(dirty).length) { settle(true); return Promise.resolve(true); }
    state = 'busy';
    var ops = buildOps();
    var snapshotDirty = Object.keys(dirty);
    snapshotDirty.forEach(function (k) { delete dirty[k]; });
    var hadOps = ops.ups.length + ops.dels.length > 0;
    running = sendChunks(ops).then(function () {
      ops.plan.forEach(function (p) { lastRaw[p.k] = p.raw; });
      running = null; retryN = 0;
      if (Object.keys(dirty).length) { clearTimeout(timer); timer = setTimeout(run, 100); return; }
      state = 'idle'; if (hadOps) show('ok', 'Data berhasil disimpan'); else if (chip) chip.className = ''; settle(true);
    }, function (err) {
      running = null;
      snapshotDirty.forEach(function (k) { dirty[k] = true; });
      state = 'error'; lastError = err.message || 'Gagal menyimpan'; lastStatus = err.status || 0;
      settle(false); // beri tahu yang menunggu (toast, keluar, pemulihan); percobaan ulang tetap berjalan sendiri
      if (err.status === 401) {
        show('err', 'Sesi berakhir. Silakan masuk kembali agar perubahan tersimpan.', '<a href="/admin/login.html" target="_blank" rel="noopener">Masuk</a><button type="button" data-retry>Coba lagi</button>');
      } else if (err.status === 413 || err.status === 400) {
        show('err', 'Data tidak dapat disimpan: ' + lastError, '<button type="button" data-retry>Coba lagi</button>');
        return; // kesalahan data: jangan diulang otomatis
      } else {
        show('err', 'Data belum tersimpan. Menghubungkan kembali…', '<button type="button" data-retry>Coba lagi</button>');
      }
      retryN++;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(run, Math.min(60000, 3000 * retryN));
    });
    return running;
  }
  function retryNow() { clearTimeout(retryTimer); retryN = 0; show('busy', 'Sedang menyimpan data…'); run(); }

  function settle(ok) {
    var w = waiters; waiters = [];
    w.forEach(function (f) { f(ok); });
  }
  // Menunggu semua perubahan tersimpan. Hasil: true bila berhasil.
  function flush() {
    return new Promise(function (resolve) {
      if (mode !== 'admin') return resolve(true);
      if (!Object.keys(dirty).length && !running) return resolve(true);
      waiters.push(resolve);
      clearTimeout(timer);
      run();
    });
  }

  // ---------- muat data dari server ----------
  function fetchAll(table, onRows) {
    var rows = [];
    function page(after) {
      return api('GET', '/api/data/' + table + '?after=' + encodeURIComponent(after || '')).then(function (r) {
        for (var i = 0; i < r.rows.length; i++) rows.push(r.rows[i]);
        if (onRows) onRows(rows.length);
        return r.next ? page(r.next) : rows;
      });
    }
    return page('');
  }

  function hydrate(onProgress) {
    var tables = ['classes', 'students', 'progress', 'exams', 'surahs', 'messages', 'archive', 'settings'];
    var counts = {}, total = 0;
    function prog() { if (onProgress) { total = 0; for (var k in counts) total += counts[k]; onProgress(total); } }
    return Promise.all(tables.map(function (t) {
      return fetchAll(t, function (n) { counts[t] = n; prog(); });
    })).then(function (res) {
      var by = {}; tables.forEach(function (t, i) { by[t] = res[i]; });
      var raws = {};
      raws.hkClasses = by.classes.length ? JSON.stringify(by.classes) : null;
      raws.hkStudents = by.students.length ? JSON.stringify(by.students) : null;
      raws.hkLogs = by.progress.length ? JSON.stringify(by.progress) : null;
      raws.hkExams = by.exams.length ? JSON.stringify(by.exams) : null;
      raws.hkSurahs = by.surahs.length ? JSON.stringify(by.surahs) : null;
      raws.hkArchive = by.archive.length ? JSON.stringify(by.archive) : null;
      var setObj = {}, hasSet = false, level = null, generated = null;
      by.settings.forEach(function (r) {
        if (r.k.indexOf('set.') === 0) { setObj[r.k.slice(4)] = r.v; hasSet = true; }
        else if (r.k === 'levelmap') level = r.v;
        else if (r.k === 'msg.generated') generated = r.v;
      });
      raws.hkSettings = hasSet ? JSON.stringify(setObj) : null;
      raws.hkLevelMap = level ? JSON.stringify(level) : null;
      raws.hkMessages = (by.messages.length || (generated && generated.length))
        ? JSON.stringify({ v: 1, items: by.messages, generated: generated || [] }) : null;
      SYNC_KEYS.forEach(function (k) {
        cache[k] = raws[k]; lastRaw[k] = raws[k];
        snap[k] = entities(k, raws[k]);
      });
    });
  }

  // Mode wali: isi data langsung dari kiriman server (tanpa sinkron).
  function seed(map) {
    SYNC_KEYS.forEach(function (k) { cache[k] = map && map[k] != null ? String(map[k]) : null; });
  }

  // ---------- objek pengganti localStorage ----------
  var API = {
    getItem: function (k) {
      if (isSync(k)) return cache[k] == null ? null : cache[k];
      try { return realLS ? realLS.getItem(k) : null; } catch (e) { return null; }
    },
    setItem: function (k, v) {
      k = String(k); v = String(v);
      if (isSync(k)) { cache[k] = v; mark(k); return; }
      if (realLS) realLS.setItem(k, v); // bisa melempar kesalahan kuota, sama seperti aslinya
    },
    removeItem: function (k) {
      k = String(k);
      if (isSync(k)) { cache[k] = null; mark(k); return; }
      try { if (realLS) realLS.removeItem(k); } catch (e) {}
    },
    clear: function () { SYNC_KEYS.forEach(function (k) { API.removeItem(k); }); },
    key: function (i) { try { return realLS ? realLS.key(i) : null; } catch (e) { return null; } },
    get length() { try { return realLS ? realLS.length : 0; } catch (e) { return 0; } }
  };
  var HKLS = new Proxy(API, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (typeof p === 'string') { var v = API.getItem(p); return v == null ? undefined : v; }
      return undefined;
    },
    set: function (t, p, v) { API.setItem(String(p), v); return true; },
    deleteProperty: function (t, p) { API.removeItem(String(p)); return true; },
    has: function (t, p) { return p in t || API.getItem(String(p)) != null; }
  });

  window.addEventListener('beforeunload', function (e) {
    if (mode === 'admin' && (Object.keys(dirty).length || running)) { e.preventDefault(); e.returnValue = ''; return ''; }
  });
  // Saat tab disembunyikan, kirim dulu perubahan yang tertunda.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && mode === 'admin' && Object.keys(dirty).length) { clearTimeout(timer); run(); }
  });

  window.HKLS = HKLS;
  window.HKS = {
    api: api,
    hydrate: hydrate,
    seed: seed,
    flush: flush,
    setMode: function (m) { mode = m; },
    on: function (f) { listeners.push(f); },
    reshow: function () { if (state === 'error' && pendingErr) { var a = pendingErr; pendingErr = null; show('err', a[0], a[1], true); } },
    retry: retryNow,
    lastError: function () { return lastError; },
    lastStatus: function () { return lastStatus; },
    isDirty: function () { return !!Object.keys(dirty).length || !!running; },
    status: function () { return state; }
  };
})();
