const fs = require('fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content);

function mustReplace(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error('Could not replace ' + label);
  return next;
}

let html = read('index.html');

if (!html.includes('const SIDE_OPTIONS =')) {
  const helpers = `const SIDE_OPTIONS = {
  arm:{label:'One Arm', per:'arm'},
  leg:{label:'One Leg', per:'leg'}
};
const sideOf = (ex)=> ex && (ex.side==='arm'||ex.side==='leg') ? ex.side : '';
const sideLabel = (ex)=> sideOf(ex) ? SIDE_OPTIONS[sideOf(ex)].label : '';
const sideRepLabel = (ex)=> sideOf(ex) ? 'Reps / '+SIDE_OPTIONS[sideOf(ex)].per : 'Reps';
const sideFromName = (name)=>{
  if(/(?:single|one)[-\\s]+arm/i.test(name||'')) return 'arm';
  if(/(?:single|one)[-\\s]+leg/i.test(name||'')) return 'leg';
  return '';
};
function stripSidePrefix(name, eq){
  let base=String(name||'Exercise').trim().replace(/\\s+/g,' ');
  const eqName=String(eq||'').trim();
  if(eqName && base.toLowerCase().startsWith(eqName.toLowerCase()+' ')) base=base.slice(eqName.length).trim();
  return base.replace(/^(?:single|one)[-\\s]+(?:arm|leg)\\s+/i,'').trim() || 'Exercise';
}
function formatExerciseName(name, eq, side){
  const cleanSide = side==='arm'||side==='leg' ? side : '';
  const raw = String(name||'Exercise').trim().replace(/\\s+/g,' ');
  if(!cleanSide) return raw || 'Exercise';
  const base = stripSidePrefix(raw, eq);
  const prefix = String(eq||'Other').trim() || 'Other';
  return \`${prefix} ${SIDE_OPTIONS[cleanSide].label} ${base}\`;
}
function normalizeExerciseVariant(ex){
  const side = sideOf(ex) || sideFromName(ex&&ex.name);
  return side ? {...ex, side, name:formatExerciseName(ex.name, ex.eq, side)} : {...ex, side:''};
}
function baseExerciseName(ex){
  return sideOf(ex) ? \`${String(ex.eq||'Other').trim()||'Other'} ${stripSidePrefix(ex.name, ex.eq)}\` : (ex&&ex.name);
}
const ARM_SIDE_MUSCLES = new Set(['Chest','Back','Front Delts','Side Delts','Rear Delts','Biceps','Triceps','Forearms']);
const LEG_SIDE_MUSCLES = new Set(['Quads','Hamstrings','Glutes','Calves']);
function sideOptionsFor(ex){
  const name=String(ex&&ex.name||'').toLowerCase();
  const opts=[];
  if(ARM_SIDE_MUSCLES.has(ex&&ex.m) || /\\b(press|row|curl|raise|fly|extension|pushdown|pulldown|shrug|snatch|swing|windmill|carry|get-up)\\b/.test(name)) opts.push('arm');
  if(LEG_SIDE_MUSCLES.has(ex&&ex.m) || /\\b(squat|lunge|step|leg|glute|calf|kickback|deadlift|thrust|march)\\b/.test(name)) opts.push('leg');
  return [...new Set(opts)];
}
`;
  html = mustReplace(html, 'const trackOf = (ex)=> (ex && TRACK[ex.track]) ? ex.track : \'ws\';', helpers + "const trackOf = (ex)=> (ex && TRACK[ex.track]) ? ex.track : 'ws';", 'unilateral helpers');
}

html = html.replace(/const fieldLabel = \(f, unit\)=>[^\n]+/, "const fieldLabel = (f, unit, ex)=> f==='weight' ? ('Weight ('+unit+')') : f==='reps' ? sideRepLabel(ex) : f==='time' ? 'Time (min)' : ('Dist ('+distUnit(unit)+')');");
html = html.replaceAll('fieldLabel(f,unit)</div>', 'fieldLabel(f,unit,ex)</div>');
html = html.replaceAll('"Cable Single-Arm Triceps Extension"', '"Cable One Arm Triceps Extension"');
html = html.replaceAll('"Bodyweight Single-Leg Glute Bridge"', '"Bodyweight One Leg Glute Bridge"');
html = html.replace(/\{name:"Cable One Arm Triceps Extension", eq:"Cable", m:"Triceps", cue:"One-arm pushdown[^}]+\}/, '{name:"Cable One Arm Triceps Extension", eq:"Cable", m:"Triceps", side:"arm", cue:"One arm pushdown \\u2014 fix imbalances, full lockout."}');
html = html.replace(/\{name:"Bodyweight One Leg Glute Bridge", eq:"Bodyweight", m:"Glutes", sec:"Hamstrings", cue:"One leg extended[^}]+\}/, '{name:"Bodyweight One Leg Glute Bridge", eq:"Bodyweight", m:"Glutes", sec:"Hamstrings", side:"leg", cue:"One leg extended, bridge with the other \\u2014 unilateral glutes."}');
html = html.replace("].map(e => ({ id:uid(), media:'', custom:false, track: e.track||'ws', ...e }));", "].map(e => normalizeExerciseVariant({ id:uid(), media:'', custom:false, track: e.track||'ws', side:e.side||'', ...e }));");

const migrateStart = html.indexOf('function migrateExercises(saved){');
const migrateEnd = html.indexOf('\n\n/* Routines are now', migrateStart);
if (migrateStart === -1 || migrateEnd === -1) throw new Error('Could not locate migrateExercises');
const migrateBlock = `function migrateExercises(saved){
  if(!Array.isArray(saved) || saved.length===0) return SEED;
  const normalizedSaved = saved.map(e=>normalizeExerciseVariant(e));
  const savedByName = new Map(normalizedSaved.map(e=>[e.name, e]));
  // current SEED, reusing the prior id when this exercise already existed
  const merged = SEED.map(s=>{
    const prev = savedByName.get(s.name);
    if(prev && prev.edited) return normalizeExerciseVariant(prev); // keep the user's edited version, but normalize unilateral naming
    return prev ? { ...s, id: prev.id, media: prev.media || s.media || '' } : s;
  });
  // keep any user-created customs (saved names that aren't part of SEED)
  const seedNames = new Set(SEED.map(s=>s.name));
  normalizedSaved.forEach(e=>{ if(!seedNames.has(e.name)) merged.push(e); });
  return merged;
}`;
html = html.slice(0, migrateStart) + migrateBlock + html.slice(migrateEnd);

html = html.replace('const f = GIFS[ex.name];', 'const f = GIFS[ex.name] || GIFS[baseExerciseName(ex)];');
html = html.replaceAll('let tiers = MUS[ex.name];', 'let tiers = MUS[ex.name] || MUS[baseExerciseName(ex)];');

const oldExerciseMutators = "  const addCustomExercise = (e)=>{ const ex={id:uid(), custom:true, media:'', ...e}; setExercises([ex, ...exercises]); setNewExOpen(false); flash('Exercise added'); return ex; };\n  const updateExercise = (id, p)=>{ const upd={...exById[id], ...p, edited:true}; setExercises(exercises.map(e=>e.id===id?upd:e)); if(detailEx&&detailEx.id===id) setDetailEx(upd); setEditEx(null); flash('Exercise updated'); };";
const newExerciseMutators = `  const addCustomExercise = (e)=>{ const ex=normalizeExerciseVariant({id:uid(), custom:true, media:'', ...e}); setExercises([ex, ...exercises]); setNewExOpen(false); flash('Exercise added'); return ex; };
  const updateExercise = (id, p)=>{ const upd=normalizeExerciseVariant({...exById[id], ...p, edited:true}); setExercises(exercises.map(e=>e.id===id?upd:e)); if(detailEx&&detailEx.id===id) setDetailEx(upd); setEditEx(null); flash('Exercise updated'); };
  const createExerciseVariant = (base, side)=>{
    const name=formatExerciseName(base.name, base.eq, side);
    const existing=exercises.find(e=>e.name.toLowerCase()===name.toLowerCase());
    if(existing){ setDetailEx(existing); flash('Variation already exists'); return existing; }
    const ex=normalizeExerciseVariant({...base, id:uid(), name, side, custom:true, edited:false, media:base.media||'', track:trackOf(base)});
    setExercises([ex, ...exercises]); setDetailEx(ex); flash(side==='arm'?'One arm variation added':'One leg variation added'); return ex;
  };`;
if (!html.includes('createExerciseVariant =')) html = mustReplace(html, oldExerciseMutators, newExerciseMutators, 'exercise mutators');
html = html.replace('onDelete={deleteExercise} onEdit={setEditEx} />', 'onDelete={deleteExercise} onEdit={setEditEx} onVariant={createExerciseVariant} />');

html = html.replace('function ExerciseDetail({ex, unit, rec, onClose, onDelete, onEdit}){', 'function ExerciseDetail({ex, unit, rec, onClose, onDelete, onEdit, onVariant}){');
if (!html.includes('const variantOptions=sideOptionsFor(ex)')) {
  html = html.replace('  const tk=trackOf(ex);', "  const tk=trackOf(ex);\n  const variantOptions=sideOptionsFor(ex).filter(s=>s!==sideOf(ex));");
  html = html.replace('                <Pill color="#7c87a8">{TRACK[tk].label}</Pill>', '                <Pill color="#7c87a8">{TRACK[tk].label}</Pill>\n                {sideOf(ex) && <Pill color="#c084fc">{sideLabel(ex)}</Pill>}');
  html = html.replace('          {ex.cue && <div className="cue"><b>Form cue:</b> {ex.cue}</div>}', `          {ex.cue && <div className="cue"><b>Form cue:</b> {ex.cue}</div>}
          {onVariant && variantOptions.length>0 &&
            <div>
              <div className="section-h" style={{margin:'12px 0 8px'}}>Variations</div>
              <div className="seg">{variantOptions.map(s=>
                <button key={s} onClick={()=>onVariant(ex,s)}>{SIDE_OPTIONS[s].label}</button>)}</div>
            </div>}`);
}

if (!html.includes('const [side,setSide]')) {
  html = html.replace("  const [track,setTrack]=useState(ed?trackOf(exercise):'ws');\n  const valid=name.trim().length>0;", "  const [track,setTrack]=useState(ed?trackOf(exercise):'ws');\n  const [side,setSide]=useState(ed?sideOf(exercise):sideFromName(initialName||''));\n  const finalName=formatExerciseName(name.trim(),eq,side);\n  const valid=finalName.length>0;");
  html = html.replace('          <div className="field"><label>Equipment</label><div className="seg">', `          <div className="field"><label>Variation</label><div className="seg">
            <button className={side===''?'on':''} onClick={()=>setSide('')}>Standard</button>
            <button className={side==='arm'?'on':''} onClick={()=>setSide('arm')}>One Arm</button>
            <button className={side==='leg'?'on':''} onClick={()=>setSide('leg')}>One Leg</button>
          </div></div>
          <div className="field"><label>Equipment</label><div className="seg">`);
  html = html.replace("onClick={()=>valid&&onSave({name:name.trim(),eq,m,sec:sec||undefined,cue:cue.trim()||undefined,media:media.trim(),track})}", "onClick={()=>valid&&onSave({name:finalName,eq,m,sec:sec||undefined,cue:cue.trim()||undefined,media:media.trim(),track,side})}");
}

html = html.replace("<span style={{color:MUSCLE[e.m]||'#888'}}>{e.m}</span>{e.custom&&", "<span style={{color:MUSCLE[e.m]||'#888'}}>{e.m}</span>{sideOf(e)&&<span style={{color:'var(--accent)'}}>· {sideLabel(e)}</span>}{e.custom&&");
html = html.replace("<span style={{color:MUSCLE[ex.m]||'#888'}}>{ex.m}</span></div></div>", "<span style={{color:MUSCLE[ex.m]||'#888'}}>{ex.m}</span>{sideOf(ex)&&<span style={{color:'var(--accent)'}}>· {sideLabel(ex)}</span>}</div></div>");
html = html.replace("<span style={{color:MUSCLE[e.m]||'#888'}}>{e.m}</span>{already&&on?", "<span style={{color:MUSCLE[e.m]||'#888'}}>{e.m}</span>{sideOf(e)&&<span style={{color:'var(--accent)'}}>· {sideLabel(e)}</span>}{already&&on?");

write('index.html', html);

let patch = read('ironlog-patch.js');
if (!patch.includes("side = ex.side === 'arm'")) {
  patch = patch.replace("    const allowedTracks = new Set(['ws', 'r', 't', 'dt', 'd', 'wt']);\n    return {", `    const allowedTracks = new Set(['ws', 'r', 't', 'dt', 'd', 'wt']);
    let name = String(ex.name || 'Exercise').trim().replace(/\\s+/g, ' ').slice(0, 120);
    let side = ex.side === 'arm' || ex.side === 'leg' ? ex.side : '';
    if (/(?:single|one)[-\\s]+arm/i.test(name)) side = 'arm';
    if (/(?:single|one)[-\\s]+leg/i.test(name)) side = 'leg';
    name = name.replace(/Single[-\\s]+Arm/ig, 'One Arm').replace(/Single[-\\s]+Leg/ig, 'One Leg');
    return {`);
  patch = patch.replace("      name: String(ex.name || 'Exercise').trim().slice(0, 120),", "      name,");
  patch = patch.replace("      edited: !!ex.edited,\n      track:", "      edited: !!ex.edited,\n      side,\n      track:");
}
write('ironlog-patch.js', patch);

let sw = read('service-worker.js').replace(/ironlog-v\d+/, 'ironlog-v25');
write('service-worker.js', sw);

let smoke = read('tests/smoke-check.js');
if (!smoke.includes('unilateral exercise variants are supported')) {
  smoke = smoke.replace(
    "check('compiled v2 shell removes browser Babel'",
    "check('unilateral exercise variants are supported', index.includes('SIDE_OPTIONS') && index.includes('formatExerciseName') && index.includes('sideRepLabel') && index.includes('onVariant={createExerciseVariant}') && index.includes('Reps / '));\ncheck('single-arm and single-leg library names are normalized', index.includes('Cable One Arm Triceps Extension') && index.includes('Bodyweight One Leg Glute Bridge') && !index.includes('\\\"Cable Single-Arm Triceps Extension\\\"') && !index.includes('\\\"Bodyweight Single-Leg Glute Bridge\\\"'));\ncheck('backup cleaner preserves unilateral side', patch.includes(\"side = ex.side === 'arm' || ex.side === 'leg'\") && patch.includes('side,') && patch.includes('One Arm') && patch.includes('One Leg'));\ncheck('compiled v2 shell removes browser Babel'"
  );
}
write('tests/smoke-check.js', smoke);

console.log('Unilateral variants patch applied.');
