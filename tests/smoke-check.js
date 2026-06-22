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
check('routine day tap opens day preview', index.includes('function DayPreviewSheet') && index.includes('onClick={()=>onOpenDay(d, r, dayLabel') && index.includes('onStart={(idx=0)=>') && index.includes('Start workout'));
check('planned routines use guided flow', index.includes("mode: day ? 'guided' : 'open'") && index.includes('currentEntryIndex') && index.includes('className="guided-head"'));
check('routine defaults use 3 sets of 8 reps', index.includes('blankSets(planned?3:1, ex, planned)') && index.includes('set.targetReps=8') && index.includes('defaultSetFor(ex, planned)'));
check('set completion can auto-advance after touched fields', index.includes('function TrainView') && index.includes('advanceAfterSet') && index.includes("'Next: '+nx.name") && index.includes('return fields.every(f=>touched.includes(f));') && index.includes('clearUntouchedGoalValues') && index.includes('Auto-complete only after every required field has been touched') && index.includes('finishSet(ei,si,e,false)') && !index.includes('typing never auto-completes a set'));
check('check button accepts suggested reps without typing them', index.includes('function applySuggestedReps') && index.includes('if(useTargets) applySuggestedReps(tk,set)') && index.includes('finishSet(ei,si,e,true)') && index.includes('Tap check to accept goal reps and start rest'));
check('set rows keep edit/add controls distinct', index.includes('selectSetInput') && index.includes('newSetAfter') && index.includes('className="set-remove"') && index.includes('<div>Done</div><div></div>') && index.includes('if(guided) e.currentEntryIndex=ei'));
check('live routine edits persist to day template', index.includes('persistRoutineDayShape') && index.includes('routineShapeFromEntries') && index.includes('targets:shape.targets') && index.includes('onRoutineUpdate={persistRoutineDayShape}') && index.includes('saveActive(e, true)') && /setActive\(e\);\s+if\(guided && onRoutineUpdate\) onRoutineUpdate\(e\);\s+if\(autoReady\)/.test(index));
check('routine templates preserve planned set targets', index.includes('planSetsFor') && index.includes('targets:d.targets||{}') && patch.includes('targets[id] = rows'));
check('workout timer starts after first logged set', index.includes('startedAt:null') && index.includes('if(!active.startedAt){ setElapsed(0); return; }') && index.includes('if(!e.startedAt) e.startedAt=Date.now();'));
check('guided workout shows exercise demo and targets', index.includes('workout-demo') && index.includes('function targetSummary') && index.includes('targetSummary(en, ex, unit)') && index.includes('<AnimatedDemo demo={demo} />'));
check('guided workout avoids duplicate current exercise header', index.includes('compactGuidedHeader=guided && !isSS') && index.includes("className={'log-ex-head'+(compactGuidedHeader?' compact':'')}") && index.includes('{!compactGuidedHeader && <Thumb ex={ex} />}'));
check('rest timer can schedule phone notifications', index.includes('requestRestNotificationPermission') && index.includes('SCHEDULE_REST_NOTIFICATION') && index.includes('Enable phone alerts') && sw.includes('showNotification') && sw.includes('notificationclick') && sw.includes('ironlog-v51'));
check('rest notifications use lock-screen friendly options', sw.includes('requireInteraction: true') && sw.includes('vibrate: [180, 80, 180, 80, 260]') && sw.includes('TimestampTrigger') && sw.includes("action: 'dismiss'"));
check('plan day resumes matching active workout instead of starting new', index.includes('const activeDay=!!(active && program && day && active.routineId===program.id && active.dayId===day.id)') && index.includes("activeDay?'Resume workout':'Start workout'") && index.includes("onResume={()=>{ setPreviewDay(null); setTab('train'); }}") && index.includes("isActiveDay?'Resume':'Start'"));
check('plate calculator is available for loadable exercises', index.includes('function PlateCalculatorSheet') && index.includes('calcPlateLoad') && index.includes('PLATES =') && index.includes('plateCalculatorApplies') && index.includes('setPlateCalc({exercise:ex, initialWeight:plateWeightFromSets(sets)})'));
check('machine settings persist from previous workouts', index.includes('machineSettings: String(en && en.machineSettings ||') && index.includes('machineSettings: lastMachineSettingsFor(id)') && index.includes('lastMachineSettingsFor') && index.includes('updMachineSettings') && index.includes('Machine setup') && patch.includes('machineSettings: String(en && en.machineSettings ||'));
check('exercise muscle audit rules cover tertiary targeting', index.includes('MUSCLE_AUDIT_RULES') && index.includes('MUSCLE_AUDIT_OVERRIDES') && index.includes('auditedMuscleTiersFor') && index.includes('defaultMuscleTiersFor(ex).forEach') && index.includes('return tiers.map(normalizeTier).filter(Boolean).slice(0,3)'));
check('guided exercise click avoids blank screen crashes', index.includes('if(!ex) return false;') && index.includes('const validEntries=entries.filter') && index.includes('This routine day has exercises that no longer exist') && index.includes('if(!demo) return null;') && index.includes('const isVideo=demo.type==='));
check('exercise picker and detail resist black screens', index.includes('class AppErrorBoundary') && index.includes('<AppErrorBoundary><App/></AppErrorBoundary>') && index.includes('key={detailEx.id}') && index.includes('const safeSessions=rec && Array.isArray(rec.sessions)') && index.includes('const safeExercises=asArray(exercises)') && index.includes('if(!active){ setPickerFor(null); return; }'));
check('saved data is sanitized before render', index.includes('repairStoredIronLog') && index.includes("cleanLogs(store.get('logs', []))") && index.includes("cleanMeasurements(store.get('measurements', []))") && index.includes("cleanActive(store.get('active', null))") && index.includes('const safeLogs=asArray(logs)') && index.includes('const sets=asArray(en.sets)'));
check('routine day exercises support drag reorder', index.includes('function useDragReorder') && index.includes('reorder-handle') && index.includes('handleProps(') && index.includes('rowProps(') && index.includes("'.sheet-body'"));
check('plan day preview can save reordered exercises', index.includes('function DayPreviewSheet') && index.includes('onUpdateDay') && index.includes('updatePreviewDay') && index.includes('selectPreviewExercise') && index.includes('linkPair') && index.includes('unlinkId'));
check('plan day preview can add exercises without starting', index.includes('const addExercises=(selected)=>') && index.includes('setPicking(true)}>{I.plus}Add') && index.includes('No exercises yet') && index.includes('ExercisePicker exercises={exercises} preselected={ids}') && index.includes('onConfirm={addExercises}'));
check('live workouts can be reordered mid-session', index.includes('function WorkoutReorderSheet') && index.includes('onApply={applyReorder}') && index.includes('workout-actions') && index.includes('setShowReorder(true)') && index.includes('reorder-sheet') && index.includes('reorder-savebar'));
check('live add exercise can prompt for superset', index.includes('function ActiveAddOptionsSheet') && index.includes('activeAddPrompt') && index.includes('linkAddedExercisesToActiveSuperset') && index.includes('Superset with {anchor?anchor.name'));
check('reorder bottom space and long press no-select are protected', index.includes('--bottom-safe') && index.includes('scroll-padding-bottom') && index.includes('reorder-sheet .sheet-body{padding-bottom:calc(132px') && index.includes('document.body.style.userSelect') && index.includes('onSelectStart:(e)=>e.preventDefault()'));
check('reorder hold and drag states are visibly distinct', index.includes('const [holdId,setHoldId]=useState(null)') && index.includes('reorder-row.holding') && index.includes('body.is-reordering') && index.includes("+(holding?' holding':'')") && index.includes('setHoldId(id)'));
check('temporary reorder helper is removed', !fs.existsSync(path.join(root, 'ironlog-reorder-patch.js')) && !sw.includes('ironlog-reorder-patch.js'));
check('unilateral exercise variants are supported', index.includes('SIDE_OPTIONS') && index.includes('formatExerciseName') && index.includes('sideRepLabel') && index.includes('onVariant={createExerciseVariant}') && index.includes('Reps / '));
check('single-arm and single-leg library names are normalized', index.includes('Cable One Arm Triceps Extension') && index.includes('Bodyweight One Leg Glute Bridge') && !index.includes('"Cable Single-Arm Triceps Extension"') && !index.includes('"Bodyweight Single-Leg Glute Bridge"'));
check('backup cleaner preserves unilateral side', patch.includes("side = ex.side === 'arm' || ex.side === 'leg'") && patch.includes("side,") && patch.includes('One Arm') && patch.includes('One Leg'));
check('backup cleaner preserves paused workout timer', patch.includes('startedAt: item.startedAt == null ? null'));
check('weight plate equipment option exists', index.includes("'Weight Plate':{c:") && index.includes('Object.keys(EQUIP)'));
check('EZ bar equipment and exercises exist', index.includes("'EZ Bar':{c:") && index.includes("EZ Bar Curl") && index.includes("EZ Bar Skullcrusher") && index.includes("'ez bar'"));
check('tertiary muscles are editable and included in breakdowns', index.includes('function muscleTiersFor') && index.includes('ex.ter') && index.includes('Tertiary muscle (optional)') && index.includes('ter:ter||undefined') && patch.includes('ter: ex.ter ? String(ex.ter).trim() : undefined'));
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
check('targets stay placeholders until actuals are entered', index.includes('goals never auto-log a set') && index.includes('return newEntry(id, planned, day);') && index.includes('placeholder={s[targetKey(f)]') && index.includes('Tap check to accept goal reps and start rest') && !index.includes('en.sets=asArray(en.sets).map(s=>applyTargetDefaults'));

const failed = checks.filter((item) => !item.pass);
checks.forEach((item) => {
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}`);
});

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll IronLog smoke checks passed.');
