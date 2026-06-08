const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content);

function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing ${label}`);
  return source.replace(needle, replacement);
}

let html = read('index.html');

if (!html.includes('const reorderPreviewDay = (nextIds)=>')) {
  html = replaceOnce(
    html,
    `  const openDayPreview = (day, program, label)=>{
    const dayIds=asArray(day&&day.exerciseIds);
    if(!day || !dayIds.length) return;
    setPreviewDay({day, program, label, entries:dayIds.map(id=>newEntry(id, true))});
  };
`,
    `  const openDayPreview = (day, program, label)=>{
    const dayIds=asArray(day&&day.exerciseIds);
    if(!day || !dayIds.length) return;
    setPreviewDay({day, program, label, entries:dayIds.map(id=>newEntry(id, true))});
  };
  const reorderPreviewDay = (nextIds)=>{
    const p=previewDay;
    if(!p || !p.day || !p.program) return;
    const ids=asArray(nextIds);
    const updateDays=days=>asArray(days).map(d=>d&&d.id===p.day.id?{...d, exerciseIds:ids}:d);
    setRoutines(curr=>asArray(curr).map(r=>r&&r.id===p.program.id?{...r, days:updateDays(r.days)}:r));
    setPreviewDay(curr=>{
      if(!curr || !curr.day || curr.day.id!==p.day.id) return curr;
      return {
        ...curr,
        day:{...curr.day, exerciseIds:ids},
        program:curr.program?{...curr.program, days:updateDays(curr.program.days)}:curr.program,
        entries:ids.map(id=>newEntry(id, true))
      };
    });
  };
`,
    'day preview opener'
  );
}

html = html.replace(
  `<DayPreviewSheet preview={previewDay} exById={exById} unit={unit} logs={logs} restDefault={restDefault}
        onClose={()=>setPreviewDay(null)} onStart={(idx=0)=>{ const p=previewDay; setPreviewDay(null); startDay(p.day,p.program,p.label,idx); }} />`,
  `<DayPreviewSheet preview={previewDay} exById={exById} unit={unit} logs={logs} restDefault={restDefault}
        onReorder={reorderPreviewDay}
        onClose={()=>setPreviewDay(null)} onStart={(idx=0)=>{ const p=previewDay; setPreviewDay(null); startDay(p.day,p.program,p.label,idx); }} />`
);

const dayPreview = `function DayPreviewSheet({preview, exById, unit, logs, restDefault, onClose, onStart, onReorder}){
  const day=preview.day||{};
  const entries=asArray(preview.entries);
  const label=preview.label || day.name || 'Routine day';
  const dayIds=asArray(day.exerciseIds);
  const [ids,setIds]=useState(()=>dayIds);
  const [reorderId,setReorderId]=useState(null);
  const holdRef=useRef(null);
  const holdPointRef=useRef(null);
  const suppressClickRef=useRef(false);
  useEffect(()=>{ setIds(dayIds); setReorderId(null); },[day.id, dayIds.join('|')]);
  useEffect(()=>()=>{ if(holdRef.current) clearTimeout(holdRef.current); },[]);
  const entryById=useMemo(()=>{
    const map={};
    dayIds.forEach((id,i)=>{ map[id]=entries[i]; });
    return map;
  },[dayIds.join('|'), entries]);
  const clearHold=()=>{ if(holdRef.current) clearTimeout(holdRef.current); holdRef.current=null; holdPointRef.current=null; };
  const armReorder=(id,e)=>{
    if(e.pointerType==='mouse' && e.button!==0) return;
    clearHold();
    holdPointRef.current={x:e.clientX,y:e.clientY};
    holdRef.current=setTimeout(()=>{
      suppressClickRef.current=true;
      setReorderId(id);
      holdRef.current=null;
      holdPointRef.current=null;
      if(typeof navigator!=='undefined' && navigator.vibrate) navigator.vibrate(12);
    },420);
  };
  const trackHold=(e)=>{
    const p=holdPointRef.current;
    if(p && (Math.abs(e.clientX-p.x)>10 || Math.abs(e.clientY-p.y)>10)) clearHold();
  };
  const stopButton=e=>e.stopPropagation();
  const move=(i,d)=>{
    const j=i+d;if(j<0||j>=ids.length)return;
    const next=[...ids];[next[i],next[j]]=[next[j],next[i]];
    setIds(next);
    if(onReorder) onReorder(next);
  };
  const startFrom=(i)=>{
    if(suppressClickRef.current){ suppressClickRef.current=false; return; }
    if(reorderId) return;
    onStart(i);
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()} style={{maxHeight:'90vh'}}>
        <div className="sheet-grip"></div>
        <div className="sheet-head"><h2>Plan Day</h2><button className="x-btn" onClick={onClose}>{I.x}</button></div>
        <div className="sheet-body">
          <div className="plan-day-head">
            <div className="guided-meta">{preview.program?preview.program.name:'Routine'}</div>
            <div className="plan-day-title">{label}</div>
            <div className="plan-day-meta">{ids.length} exercise{ids.length!==1?'s':''} · ~{estimateMinutes(ids, logs, restDefault)} min</div>
          </div>
          {ids.map((id,i)=>{
            const ex=exById[id]; if(!ex) return null;
            const entry=entryById[id]||{sets:[]};
            const ordering=reorderId===id;
            return (
              <div key={id} className={'ex-row tap reorder-row'+(ordering?' ordering':'')}
                onClick={()=>startFrom(i)}
                onPointerDown={e=>armReorder(id,e)} onPointerMove={trackHold} onPointerUp={clearHold} onPointerCancel={clearHold} onPointerLeave={clearHold}>
                <div className="reorder-handle" title="Hold to reorder" aria-hidden="true">{I.grip}</div>
                <Thumb ex={ex} />
                <div className="ex-info">
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-sub"><span style={{color:EQUIP[ex.eq]?EQUIP[ex.eq].c:'#888'}}>{ex.eq}</span>·<span style={{color:MUSCLE[ex.m]||'#888'}}>{ex.m}</span>{sideOf(ex)&&<span style={{color:'var(--accent)'}}>· {sideLabel(ex)}</span>}</div>
                  <div className="target-line"><b>{i+1}</b> · {targetSummary(entry, ex, unit)}</div>
                </div>
                {ordering ?
                  <div className="reorder-actions">
                    <button type="button" aria-label="Move exercise up" disabled={i===0} onPointerDown={stopButton} onClick={e=>{e.stopPropagation();move(i,-1);}}>{I.up}</button>
                    <button type="button" aria-label="Move exercise down" disabled={i===ids.length-1} onPointerDown={stopButton} onClick={e=>{e.stopPropagation();move(i,1);}}>{I.down}</button>
                    <button type="button" className="reorder-done" aria-label="Done reordering" onPointerDown={stopButton} onClick={e=>{e.stopPropagation();setReorderId(null);}}>{I.check}</button>
                  </div>
                  :
                  <span className="chevron">{I.chevron}</span>}
              </div>
            );
          })}
          <button className="btn btn-accent" style={{marginTop:10}} onClick={()=>onStart(0)}>{I.flame}Start from first</button>
        </div>
      </div>
    </div>
  );
}`;

const previewPattern = /function DayPreviewSheet\(\{preview, exById, unit, logs, restDefault, onClose, onStart(?:, onReorder)?\}\)\{[\s\S]*?\r?\n\}\r?\n\r?\nfunction TodayView/;
if (!previewPattern.test(html)) throw new Error('DayPreviewSheet replacement failed');
html = html.replace(previewPattern, `${dayPreview}\n\nfunction TodayView`);

write('index.html', html);

let sw = read('service-worker.js');
sw = sw.replace(/ironlog-v\d+/, 'ironlog-v31');
write('service-worker.js', sw);

let smoke = read('tests/smoke-check.js');
if (!smoke.includes('plan day preview can save reordered exercises')) {
  smoke = smoke.replace(
    "check('routine day exercises support hold reorder', index.includes('reorder-row') && index.includes('armReorder') && index.includes('onPointerDown={e=>armReorder(id,e)}') && index.includes('Move exercise up') && index.includes('Move exercise down'));",
    "check('routine day exercises support hold reorder', index.includes('reorder-row') && index.includes('armReorder') && index.includes('onPointerDown={e=>armReorder(id,e)}') && index.includes('Move exercise up') && index.includes('Move exercise down'));\ncheck('plan day preview can save reordered exercises', index.includes('onReorder={reorderPreviewDay}') && index.includes('function DayPreviewSheet') && index.includes('const [reorderId,setReorderId]=useState(null)') && index.includes('if(onReorder) onReorder(next)') && index.includes('onClick={()=>startFrom(i)}'));"
  );
}
write('tests/smoke-check.js', smoke);

console.log('Plan preview reorder fix applied.');
