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
const manifest = JSON.parse(read('manifest.json'));

check('manifest has install metadata', manifest.name && manifest.start_url && manifest.icons && manifest.icons.length >= 2);
check('backup schema is present in app', index.includes('ironlog.backup.v1'));
check('backup import validates known keys', index.includes('BACKUP_KEYS') && index.includes('Backup file does not contain IronLog data'));
check('import offers undo export', index.includes('Export your current IronLog data first?'));
check('reset offers undo export', index.includes('Export a backup first?'));
check('Supabase secret keys are blocked', index.includes('sb_secret_') && index.includes('service_role'));
check('PWA update event is wired', index.includes('ironlog:update-ready') && index.includes('SKIP_WAITING'));
check('deployed helper validates imports', patch.includes('normalizeBackup') && patch.includes('BACKUP_KEYS'));
check('deployed helper avoids duplicate backup UI', patch.includes("labels.includes('Backup')"));
check('service worker caches helper', sw.includes('./ironlog-patch.js'));
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
