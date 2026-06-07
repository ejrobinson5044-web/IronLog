(function () {
  const BACKUP_SCHEMA = 'ironlog.backup.v1';
  const BACKUP_KEYS = ['exercises', 'routines', 'logs', 'measurements', 'unit', 'restDefault', 'active'];
  const SAFETY_SNAPSHOT_KEY = 'ironlog.safetySnapshot.v1';
  const LAST_BACKUP_KEY = 'ironlog.lastBackupAt';
  const PATCH_STYLE_ID = 'ironlog-safety-patch-style';

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function backupPayload() {
    return {
      v: 2,
      exercises: readJson('exercises', []),
      routines: readJson('routines', []),
      logs: readJson('logs', []),
      measurements: readJson('measurements', []),
      unit: readJson('unit', 'lb'),
      restDefault: readJson('restDefault', 90),
      active: readJson('active', null)
    };
  }

  function backupEnvelope(reason) {
    return {
      schema: BACKUP_SCHEMA,
      app: 'IronLog',
      exportedAt: new Date().toISOString(),
      reason: reason || 'manual',
      data: backupPayload()
    };
  }

  function saveSafetySnapshot(reason) {
    const snapshot = backupEnvelope(reason || 'safety snapshot');
    localStorage.setItem(SAFETY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    return snapshot;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function cleanSet(set) {
    const s = set && typeof set === 'object' ? set : {};
    return {
      done: !!s.done,
      weight: s.weight == null || s.weight === '' ? '' : safeNumber(s.weight),
      reps: s.reps == null || s.reps === '' ? '' : safeNumber(s.reps),
      time: s.time == null || s.time === '' ? '' : safeNumber(s.time),
      dist: s.dist == null || s.dist === '' ? '' : safeNumber(s.dist)
    };
  }

  function cleanEntries(entries) {
    return asArray(entries).map((en) => ({
      exerciseId: String(en && en.exerciseId || ''),
      note: String(en && en.note || ''),
      sets: asArray(en && en.sets)
        .map(cleanSet)
        .filter((s) => s.weight !== '' || s.reps !== '' || s.time !== '' || s.dist !== '' || s.done)
    })).filter((en) => en.exerciseId);
  }

  function cleanWorkout(item) {
    if (!item || typeof item !== 'object') return null;
    return {
      ...item,
      id: String(item.id || Math.random().toString(36).slice(2, 9)),
      date: String(item.date || todayISO()).slice(0, 10),
      startedAt: safeNumber(item.startedAt, Date.now()),
      endedAt: item.endedAt ? safeNumber(item.endedAt, Date.now()) : undefined,
      name: String(item.name || 'Workout'),
      note: String(item.note || ''),
      entries: cleanEntries(item.entries)
    };
  }

  function cleanExercise(item) {
    const ex = item && typeof item === 'object' ? item : {};
    const allowedTracks = new Set(['ws', 'r', 't', 'dt', 'd', 'wt']);
    let name = String(ex.name || 'Exercise').trim().replace(/\s+/g, ' ').slice(0, 120);
    let side = ex.side === 'arm' || ex.side === 'leg' ? ex.side : '';
    if (/(?:single|one)[-\s]+arm/i.test(name)) side = 'arm';
    if (/(?:single|one)[-\s]+leg/i.test(name)) side = 'leg';
    name = name.replace(/Single[-\s]+Arm/ig, 'One Arm').replace(/Single[-\s]+Leg/ig, 'One Leg');
    return {
      ...ex,
      id: String(ex.id || Math.random().toString(36).slice(2, 9)),
      name,
      eq: String(ex.eq || 'Other').trim() || 'Other',
      m: String(ex.m || 'Other').trim() || 'Other',
      sec: ex.sec ? String(ex.sec).trim() : undefined,
      media: String(ex.media || ''),
      custom: !!ex.custom,
      edited: !!ex.edited,
      side,
      track: allowedTracks.has(ex.track) ? ex.track : 'ws',
      cue: String(ex.cue || '')
    };
  }

  function cleanDay(item) {
    const day = item && typeof item === 'object' ? item : {};
    return {
      ...day,
      id: String(day.id || Math.random().toString(36).slice(2, 9)),
      name: String(day.name || ''),
      exerciseIds: asArray(day.exerciseIds).map((id) => String(id)).filter(Boolean)
    };
  }

  function cleanRoutine(item) {
    const routine = item && typeof item === 'object' ? item : {};
    const days = asArray(routine.days).length ? asArray(routine.days).map(cleanDay) : [cleanDay({ exerciseIds: routine.exerciseIds })];
    return {
      ...routine,
      id: String(routine.id || Math.random().toString(36).slice(2, 9)),
      name: String(routine.name || 'Routine'),
      note: String(routine.note || ''),
      labelMode: routine.labelMode === 'name' ? 'name' : 'num',
      days
    };
  }

  function cleanLogs(logs) {
    return asArray(logs).map(cleanWorkout).filter((w) => w && (w.entries.length || w.note));
  }

  function cleanMeasurements(measurements) {
    return asArray(measurements).map((m) => ({
      ...(m && typeof m === 'object' ? m : {}),
      id: String(m && m.id || Math.random().toString(36).slice(2, 9)),
      date: String(m && m.date || todayISO()).slice(0, 10)
    })).filter((m) => m.date);
  }

  function normalizeBackup(raw) {
    const data = raw && raw.schema === BACKUP_SCHEMA ? raw.data : raw;
    if (!data || typeof data !== 'object') throw new Error('That is not an IronLog backup.');
    if (!BACKUP_KEYS.some((key) => Object.prototype.hasOwnProperty.call(data, key))) {
      throw new Error('Backup file does not contain IronLog data.');
    }
    return {
      exercises: asArray(data.exercises).map(cleanExercise).filter((ex) => ex.name),
      routines: asArray(data.routines).map(cleanRoutine),
      logs: cleanLogs(data.logs),
      measurements: cleanMeasurements(data.measurements),
      unit: data.unit === 'kg' ? 'kg' : 'lb',
      restDefault: Math.max(10, Math.min(600, safeNumber(data.restDefault, 90))),
      active: cleanWorkout(data.active)
    };
  }

  function exportBackup() {
    const backup = backupEnvelope('manual export');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironlog-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    localStorage.setItem(LAST_BACKUP_KEY, backup.exportedAt);
    toast('Backup exported');
  }

  function summarizeData(data) {
    return [
      `${asArray(data.routines).length} routines`,
      `${asArray(data.exercises).length} exercises`,
      `${asArray(data.logs).length} workouts`,
      `${asArray(data.measurements).length} measurements`
    ].join(', ');
  }

  async function importBackup(file) {
    const parsed = JSON.parse(await file.text());
    const data = normalizeBackup(parsed);
    if (!confirm(`Import this backup (${summarizeData(data)})? It replaces the IronLog data on this device.`)) return;
    if (confirm('Export your current IronLog data first? This gives you a quick undo file before the import replaces it.')) exportBackup();
    saveSafetySnapshot('before import');
    ['exercises', 'routines', 'logs', 'measurements', 'unit', 'restDefault', 'active'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) writeJson(key, data[key]);
    });
    toast('Backup imported');
    setTimeout(() => location.reload(), 500);
  }

  function restoreSafetySnapshot() {
    const snapshot = readJson(SAFETY_SNAPSHOT_KEY, null);
    if (!snapshot || snapshot.schema !== BACKUP_SCHEMA || !snapshot.data) {
      toast('No safety snapshot found');
      return;
    }
    const data = normalizeBackup(snapshot);
    const when = snapshot.exportedAt ? new Date(snapshot.exportedAt).toLocaleString() : 'the last safety snapshot';
    if (!confirm(`Restore the safety snapshot from ${when}? This replaces the IronLog data on this device.`)) return;
    saveSafetySnapshot('before snapshot restore');
    BACKUP_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) writeJson(key, data[key]);
    });
    toast('Safety snapshot restored');
    setTimeout(() => location.reload(), 500);
  }

  function cleanSupabaseUrl(input) {
    let raw = (input || '').trim().replace(/\s+/g, '');
    if (!raw) return { ok: false, value: '', message: 'Paste the Project URL from Supabase.' };
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    try {
      const url = new URL(raw);
      const project = url.hostname === 'supabase.com' && url.pathname.match(/\/project\/([a-z0-9]+)/i);
      if (project) return { ok: true, value: `https://${project[1]}.supabase.co`, message: 'Dashboard link detected; IronLog will use the matching Project URL.' };
      if (!url.hostname.endsWith('.supabase.co')) return { ok: false, value: raw, message: 'Use the Project URL ending in .supabase.co, not the dashboard URL.' };
      return { ok: true, value: `https://${url.hostname}`, message: url.pathname && url.pathname !== '/' ? 'Extra URL path removed for Supabase auth.' : '' };
    } catch (_) {
      return { ok: false, value: raw, message: 'That does not look like a valid URL.' };
    }
  }

  function jwtPayload(token) {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch (_) {
      return null;
    }
  }

  function validateSupabaseKey(input) {
    const key = (input || '').trim();
    if (!key) return { ok: false, message: 'Paste the publishable/anon key.' };
    if (/^sb_secret_/i.test(key)) return { ok: false, message: 'That is a secret key. Use the publishable or anon public key instead.' };
    if (/^sb_publishable_/i.test(key)) return { ok: true, value: key, message: '' };
    const jwt = jwtPayload(key);
    if (jwt) {
      if (jwt.role === 'service_role' || jwt.role === 'supabase_admin') return { ok: false, message: 'That JWT is a service-role key. Use the anon public key instead.' };
      return { ok: true, value: key, message: jwt.role === 'anon' ? '' : 'JWT key detected. Make sure it is the anon public key.' };
    }
    return { ok: false, message: 'That key does not look like a Supabase publishable or anon key.' };
  }

  function setNativeValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
    setter ? setter.call(input, value) : (input.value = value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function ensureStyles() {
    if (document.getElementById(PATCH_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PATCH_STYLE_ID;
    style.textContent = `
      .backup-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px;margin-top:10px}
      .backup-note{font-size:11.5px;color:var(--muted2);line-height:1.45;margin:9px 0 13px}
      .backup-meta{font-size:11px;color:var(--muted2);line-height:1.35;margin:8px 0 0}
      .patch-msg{font-size:12px;color:var(--warn);line-height:1.4;margin:-4px 0 10px}
      .update-banner{position:fixed;left:14px;right:14px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:80;display:flex;align-items:center;gap:10px;background:rgba(22,24,38,.97);border:1px solid var(--border);box-shadow:0 18px 40px rgba(0,0,0,.42);border-radius:14px;padding:10px 10px 10px 12px}
      .update-banner span{flex:1;min-width:0;font-size:12.5px;color:var(--text);font-weight:750}
      .update-banner button{border:none;border-radius:10px;padding:8px 10px;font-weight:800;font-size:12px;color:white;background:var(--accent-deep)}
      .update-banner .quiet{width:32px;height:32px;padding:0;background:var(--surface2);color:var(--muted)}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  function ensureBackupUi() {
    const sheet = document.querySelector('.sheet-body');
    if (!sheet || sheet.querySelector('[data-ironlog-backup]')) return;
    const general = Array.from(sheet.querySelectorAll('.set-block')).find((block) => /General/i.test(block.textContent || ''));
    if (!general) return;
    const labels = Array.from(general.querySelectorAll('label')).map((label) => label.textContent.trim());
    if (labels.includes('Backup') && /\bExport\b/.test(general.textContent || '') && /\bImport\b/.test(general.textContent || '')) {
      ensureRestoreButton(general);
      return;
    }
    const reset = general.querySelector('.btn-danger');
    const snapshot = readJson(SAFETY_SNAPSHOT_KEY, null);
    const lastBackupAt = localStorage.getItem(LAST_BACKUP_KEY);
    const wrap = document.createElement('div');
    wrap.dataset.ironlogBackup = '1';
    wrap.innerHTML = `
      <label style="display:block;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Backup</label>
      <input type="file" accept="application/json,.json" style="display:none">
      <div class="backup-actions">
        <button class="btn btn-ghost btn-sm" type="button">Export</button>
        <button class="btn btn-ghost btn-sm" type="button">Import</button>
        ${snapshot ? '<button class="btn btn-ghost btn-sm" type="button" data-restore-snapshot>Restore</button>' : ''}
      </div>
      <div class="backup-note">Export a JSON backup before major changes. Import replaces local data and will sync to cloud if you are signed in.</div>
      ${lastBackupAt ? `<div class="backup-meta">Last manual export: ${new Date(lastBackupAt).toLocaleString()}</div>` : ''}
      ${snapshot && snapshot.exportedAt ? `<div class="backup-meta">Safety snapshot: ${new Date(snapshot.exportedAt).toLocaleString()}</div>` : ''}
    `;
    const file = wrap.querySelector('input');
    const [exportBtn, importBtn] = wrap.querySelectorAll('button');
    const restoreBtn = wrap.querySelector('[data-restore-snapshot]');
    exportBtn.addEventListener('click', exportBackup);
    importBtn.addEventListener('click', () => file.click());
    if (restoreBtn) restoreBtn.addEventListener('click', restoreSafetySnapshot);
    file.addEventListener('change', async () => {
      if (!file.files || !file.files[0]) return;
      try {
        await importBackup(file.files[0]);
      } catch (err) {
        toast(`Import failed: ${err.message || err}`);
      } finally {
        file.value = '';
      }
    });
    general.insertBefore(wrap, reset || null);
  }


  function ensureRestoreButton(general) {
    const snapshot = readJson(SAFETY_SNAPSHOT_KEY, null);
    const fileInput = general.querySelector('input[type="file"]');
    if (fileInput && fileInput.dataset.ironlogSnapshotGuard !== '1') {
      fileInput.dataset.ironlogSnapshotGuard = '1';
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) saveSafetySnapshot('before import');
      }, true);
    }
    if (!snapshot || general.querySelector('[data-restore-snapshot]')) return;
    const actions = general.querySelector('.backup-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.className = 'btn btn-ghost btn-sm';
    button.type = 'button';
    button.dataset.restoreSnapshot = '1';
    button.textContent = 'Restore';
    button.addEventListener('click', restoreSafetySnapshot);
    actions.appendChild(button);
    if (!general.querySelector('[data-snapshot-meta]') && snapshot.exportedAt) {
      const meta = document.createElement('div');
      meta.className = 'backup-meta';
      meta.dataset.snapshotMeta = '1';
      meta.textContent = `Safety snapshot: ${new Date(snapshot.exportedAt).toLocaleString()}`;
      actions.insertAdjacentElement('afterend', meta);
    }
  }
  function ensureResetGuard() {
    const sheet = document.querySelector('.sheet-body');
    const general = sheet && Array.from(sheet.querySelectorAll('.set-block')).find((block) => /General/i.test(block.textContent || ''));
    const reset = general && general.querySelector('.btn-danger');
    if (!reset || reset.dataset.ironlogResetGuard === '1') return;
    reset.dataset.ironlogResetGuard = '1';
    reset.addEventListener('click', () => {
      if (confirm('Export a backup first? This gives you a quick undo file before reset.')) exportBackup();
      saveSafetySnapshot('before reset');
    }, true);
  }

  function ensureSupabaseValidation() {
    const sheet = document.querySelector('.sheet-body');
    if (!sheet || sheet.dataset.ironlogValidation === '1') return;
    const urlInput = sheet.querySelector('input[placeholder="https://xxxx.supabase.co"]');
    const keyInput = sheet.querySelector('input[placeholder^="eyJ"], input[placeholder^="sb_publishable"]');
    if (!urlInput || !keyInput) return;
    sheet.dataset.ironlogValidation = '1';
    keyInput.placeholder = 'sb_publishable_... or anon JWT';
    const urlMsg = document.createElement('div');
    const keyMsg = document.createElement('div');
    urlMsg.className = keyMsg.className = 'patch-msg';
    urlInput.closest('.field').after(urlMsg);
    keyInput.closest('.field').after(keyMsg);
    const connect = Array.from(sheet.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Connect');

    function refresh() {
      const urlCheck = cleanSupabaseUrl(urlInput.value);
      const keyCheck = validateSupabaseKey(keyInput.value);
      urlMsg.textContent = urlInput.value.trim() ? urlCheck.message : '';
      keyMsg.textContent = keyInput.value.trim() ? keyCheck.message : '';
      if (connect) connect.disabled = !(urlCheck.ok && keyCheck.ok);
      return { urlCheck, keyCheck };
    }

    urlInput.addEventListener('input', refresh);
    keyInput.addEventListener('input', refresh);
    if (connect) {
      connect.addEventListener('click', (event) => {
        const { urlCheck, keyCheck } = refresh();
        if (!urlCheck.ok || !keyCheck.ok) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (urlInput.value !== urlCheck.value) {
          event.preventDefault();
          event.stopImmediatePropagation();
          localStorage.setItem('sb_url', JSON.stringify(urlCheck.value));
          localStorage.setItem('sb_key', JSON.stringify(keyCheck.value));
          toast('Connected. Reopening sync setup...');
          setTimeout(() => location.reload(), 450);
        } else {
          setNativeValue(keyInput, keyCheck.value);
        }
      }, true);
    }
    refresh();
  }

  function showUpdateBanner(worker) {
    if (document.querySelector('.update-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = '<span>New IronLog version ready.</span><button type="button">Update</button><button type="button" class="quiet" aria-label="Dismiss update">x</button>';
    banner.querySelector('button').addEventListener('click', () => worker ? worker.postMessage({ type: 'SKIP_WAITING' }) : location.reload());
    banner.querySelector('.quiet').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
  }

  function wireUpdates() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(worker);
        });
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  }

  function scan() {
    ensureStyles();
    ensureBackupUi();
    ensureResetGuard();
    ensureSupabaseValidation();
  }

  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  wireUpdates();
})();
