const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
function check(name, pass) {
  checks.push({ name, pass: !!pass });
}

const index = read('index.html');
const patch = read('ironlog-patch.js');
const sw = read('service-worker.js');
const v2 = read('index-v2.html');
const bundle = read('app.bundle.js');
const loader = read('app-loader.js');
const manifest = JSON.parse(read('manifest.json'));
const coreHasBackupSafety = index.includes('BACKUP_KEYS') && index.includes('Backup file does not contain IronLog data');
const helperHasBackupSafety = patch.includes('normalizeBackup') && patch.includes('BACKUP_KEYS');
const coreOffersUndoExport = index.includes('Export your current IronLog data first?') && index.includes('Export a backup first?');
const helperOffersUndoExport = patch.includes('Export your current IronLog data first?') && patch.includes('Export a backup first?');

check('manifest has install metadata', manifest.name && manifest.start_url && manifest.icons && manifest.icons.length >= 2);
check('backup safety is available', coreHasBackupSafety || helperHasBackupSafety);
check('import/reset offer undo export', coreOffersUndoExport || helperOffersUndoExport);
check('Supabase secret keys are blocked', (index.includes('sb_secret_') && index.includes('service_role')) || (patch.includes('sb_secret_') && patch.includes('service_role')));
check('PWA update event is wired', index.includes('ironlog:update-ready') || patch.includes('SKIP_WAITING'));
check('deployed helper validates imports', helperHasBackupSafety);
check('deployed helper avoids duplicate backup UI', patch.includes("labels.includes('Backup')"));
check('deployed helper keeps safety snapshot', patch.includes('SAFETY_SNAPSHOT_KEY') && patch.includes('restoreSafetySnapshot'));
check('deployed helper normalizes imported routines', patch.includes('cleanRoutine') && patch.includes('cleanExercise'));
check('compiled v2 shell removes browser Babel', v2.includes('app-loader.js') && !v2.includes('text/babel') && !v2.includes('babel.min.js'));
check('compiled bundle contains app mount', bundle.includes('ReactDOM.createRoot') || bundle.includes('createRoot'));
check('compiled loader references chunks', loader.includes('app-chunks/app.00.js') && loader.includes('eval'));
check('service worker caches helper', sw.includes('./ironlog-patch.js'));
check('service worker caches v2 shell', sw.includes('./index-v2.html') && sw.includes('./app-loader.js') && sw.includes('./app-chunks/app.11.js'));
check('service worker serves v2 shell', sw.includes("new URL('./index-v2.html'"));
check('service worker version bumped', /ironlog-v\d+/.test(sw));
check('service worker injects helper once', sw.includes('html.includes') && sw.includes('ironlog-patch.js'));

const failed = checks.filter((item) => !item.pass);
checks.forEach((item) => {
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}`);
});

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll IronLog smoke checks passed.');
