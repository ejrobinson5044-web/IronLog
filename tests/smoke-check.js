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
const generatedChunks = [...loader.matchAll(/app-chunks\/app\.\d+\.js/g)].map((match) => match[0]);
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
check('app opens to Today dashboard', index.includes("'train' : 'today'") && index.includes('function TodayView') && index.includes('<span>Today</span>'));
check('progress keeps calendar access', index.includes('onOpenCalendar') && index.includes('Calendar</button>'));
check('routine day tap opens day preview', index.includes('function DayPreviewSheet') && index.includes('onOpenDay(d, r, dayLabel') && index.includes('onStart={(idx=0)=>') && index.includes('Start workout'));
check('planned routines use guided flow', index.includes("mode: day ? 'guided' : 'open'") && index.includes('currentEntryIndex') && index.includes('className="guided-head"'));
check('routine defaults use 3 sets of 8 reps', index.includes('blankSets(planned?3:1, ex, planned)') && index.includes('set.targetReps=8') && index.includes('defaultSetFor(ex, planned)'));
check('set completion can auto-advance after touched fields', index.includes('function TrainView') && index.includes('advanceAfterSet') && index.includes('applyTargetDefaults(tk,set)') && index.includes("'Next: '+nx.name") && index.includes('fieldsTouched(set, fields)') && index.includes('Auto-complete only after every required field has been touched') && !index.includes('typing never auto-completes a set'));
check('set rows keep edit/add controls distinct', index.includes('selectSetInput') && index.includes('newSetAfter') && index.includes('className="set-remove"') && index.includes('<div>Done</div><div></div>') && index.includes('if(guided) e.currentEntryIndex=ei'));
check('live routine edits persist to day template', index.includes('persistRoutineDayShape') && index.includes('routineShapeFromEntries') && index.includes('targets:shape.targets') && index.includes('onRoutineUpdate={persistRoutineDayShape}') && index.includes('saveActive(e, true)') && /setActive\(e\);\s+if\(guided && onRoutineUpdate\) onRoutineUpdate\(e\);\s+if\(autoReady\)/.test(index));
check('routine templates preserve planned set targets', index.includes('planSetsFor') && index.includes('targets:d.targets||{}') && patch.includes('targets[id] = rows'));
check('workout timer starts after first logged set', index.includes('startedAt:null') && index.includes('if(!active.startedAt){ setElapsed(0); return; }') && index.includes('if(!e.startedAt) e.startedAt=Date.now();'));
check('guided workout shows exercise demo and targets', index.includes('workout-demo') && index.includes('function targetSummary') && index.includes('targetSummary(en, ex, unit)') && index.includes('<AnimatedDemo demo={demo} />'));
check('guided workout avoids duplicate current exercise header', index.includes('compactGuidedHeader=guided && !isSS') && index.includes("className={'log-ex-head'+(compactGuidedHeader?' compact':'')}") && index.includes('{!compactGuidedHeader && <Thumb ex={ex} />}'));
check('rest timer can schedule phone notifications', index.includes('requestRestNotificationPermission') && index.includes('SCHEDULE_REST_NOTIFICATION') && index.includes('Enable phone alerts') && sw.includes('showNotification') && sw.includes('notificationclick') && sw.includes('ironlog-v46'));
check('guided exercise click avoids blank screen crashes', index.includes('if(!ex) return false;') && index.includes('const validEntries=entries.filter') && index.includes('This routine day has exercises that no longer exist') && index.includes('if(!demo) return null;') && index.includes('const isVideo=demo.type==='));
check('exercise picker and detail resist black screens', index.includes('class AppErrorBoundary') && index.includes('<AppErrorBoundary><App/></AppErrorBoundary>') && index.includes('key={detailEx.id}') && index.includes('const safeSessions=rec && Array.isArray(rec.sessions)') && index.includes('const safeExercises=asArray(exercises)') && index.includes('if(!active){ setPickerFor(null); return; }'));
check('saved data is sanitized before render', index.includes('repairStoredIronLog') && index.includes("cleanLogs(store.get('logs', []))") && index.includes("cleanMeasurements(store.get('measurements', []))") && index.includes("cleanActive(store.get('active', null))") && index.includes('const safeLogs=asArray(logs)') && index.includes('const sets=asArray(en.sets)'));
check('routine day exercises support drag reorder', index.includes('function useDragReorder') && index.includes('reorder-handle') && index.includes('handleProps(') && index.includes('rowProps(') && index.includes("'.sheet-body'"));
check('plan day preview can save reordered exercises', index.includes('function DayPreviewSheet') && index.includes('onUpdateDay') && index.includes('updatePreviewDay') && index.includes('selectPreviewExercise') && index.includes('linkPair') && index.includes('unlinkId'));
check('live workouts can be reordered mid-session', index.includes('function WorkoutReorderSheet') && index.includes('onApply={applyReorder}') && index.includes('workout-actions') && index.includes('setShowReorder(true)'));
check('temporary reorder helper is removed', !fs.existsSync(path.join(root, 'ironlog-reorder-patch.js')) && !sw.includes('ironlog-reorder-patch.js'));
check('unilateral exercise variants are supported', index.includes('SIDE_OPTIONS') && index.includes('formatExerciseName') && index.includes('sideRepLabel') && index.includes('onVariant={createExerciseVariant}') && index.includes('Reps / '));
check('single-arm and single-leg library names are normalized', index.includes('Cable One Arm Triceps Extension') && index.includes('Bodyweight One Leg Glute Bridge') && !index.includes('"Cable Single-Arm Triceps Extension"') && !index.includes('"Bodyweight Single-Leg Glute Bridge"'));
check('backup cleaner preserves unilateral side', patch.includes("side = ex.side === 'arm' || ex.side === 'leg'") && patch.includes("side,") && patch.includes('One Arm') && patch.includes('One Leg'));
check('backup cleaner preserves paused workout timer', patch.includes('startedAt: item.startedAt == null ? null'));
check('weight plate equipment option exists', index.includes("'Weight Plate':{c:") && index.includes('Object.keys(EQUIP)'));
check('compiled v2 shell removes browser Babel', v2.includes('app-loader.js') && !v2.includes('text/babel') && !v2.includes('babel.min.js'));
check('compiled bundle contains app mount', bundle.includes('ReactDOM.createRoot') || bundle.includes('createRoot'));
check('compiled loader references chunks', generatedChunks.length > 0 && loader.includes('eval'));
check('service worker caches helper', sw.includes('./ironlog-patch.js'));
check('service worker caches v2 shell', sw.includes('./index-v2.html') && sw.includes('./app-loader.js'));
check('service worker caches generated chunks', generatedChunks.every((file) => sw.includes(`./${file}`)));
check('service worker serves v2 shell', sw.includes("new URL('./index-v2.html'"));
check('service worker version bumped', /ironlog-v\d+/.test(sw));
check('service worker injects helper once', (sw.includes('html.includes') || sw.includes('patched.includes')) && sw.includes('ironlog-patch.js'));
check('supersets: link/unlink + grouped flow', index.includes('const groupsOf') && index.includes('linkWithNext') && index.includes('unlinkGroup') && index.includes('superset-wrap') && index.includes('Superset: '));
check('swap: similar-exercise sheet with movement ranking', index.includes('function SwapSheet') && index.includes('function rankAlternates') && index.includes('movementName') && index.includes('setSwapFor'));
check('targets prefill as editable values', index.includes('const liveEntry') && index.includes('en.sets=asArray(en.sets).map(s=>applyTargetDefaults'));

const failed = checks.filter((item) => !item.pass);
checks.forEach((item) => {
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}`);
});

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll IronLog smoke checks passed.');
