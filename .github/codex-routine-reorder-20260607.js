const fs = require('fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content);

let html = read('index.html');

const reorderCss = `  .reorder-row{position:relative;user-select:none;touch-action:pan-y}
  .reorder-row.ordering{background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(13,9,20,.94));border-color:rgba(168,85,247,.48);box-shadow:0 0 28px rgba(168,85,247,.22),inset 0 1px 0 rgba(255,255,255,.07);transform:translateY(-1px)}
  .reorder-handle{width:28px;height:46px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;color:var(--muted2);background:rgba(36,22,49,.45);border:1px solid transparent}
  .reorder-row.ordering .reorder-handle{color:var(--accent);background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.25)}
  .reorder-handle svg{width:18px;height:18px}
  .reorder-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
  .reorder-actions button{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:rgba(36,22,49,.88);border:1px solid rgba(168,85,247,.22);color:var(--text);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
  .reorder-actions button:disabled{opacity:.35;color:var(--muted2)}
  .reorder-actions button svg{width:17px;height:17px}
  .reorder-actions .reorder-done{background:linear-gradient(135deg,var(--accent),var(--accent-dim));color:var(--accent-ink);border-color:transparent}
`;

if (!html.includes('.reorder-row{')) {
  html = html.replace(/  \.ex-row\.tap:active\{background:[^\n]+\}\n/, (match) => match + reorderCss);
}

const reorderIcons = `  grip:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/></svg>,
  up:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  down:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
`;

if (!html.includes('grip:<svg')) {
  html = html.replace(/  chevron:<svg[^\n]+<\/svg>,\n/, (match) => match + reorderIcons);
}

const newDayEditor = String.raw`/* edits a single day inside a routine (name + its exercises) */
function DayEditor({day, exById, exercises, logs, restDefault, onCreate, onClose, onSave}){
  const [name,setName]=useState(day.name||'');
  const [ids,setIds]=useState([...day.exerciseIds]);
  const [picking,setPicking]=useState(false);
  const [reorderId,setReorderId]=useState(null);
  const holdRef=useRef(null);
  const holdPointRef=useRef(null);
  const clearHold=()=>{ if(holdRef.current) clearTimeout(holdRef.current); holdRef.current=null; holdPointRef.current=null; };
  useEffect(()=>()=>{ if(holdRef.current) clearTimeout(holdRef.current); },[]);
  const armReorder=(id,e)=>{
    if(e.pointerType==='mouse' && e.button!==0) return;
    clearHold();
    holdPointRef.current={x:e.clientX,y:e.clientY};
    holdRef.current=setTimeout(()=>{
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
  const remove=id=>{ setIds(ids.filter(x=>x!==id)); if(reorderId===id) setReorderId(null); };
  const move=(i,d)=>{const j=i+d;if(j<0||j>=ids.length)return;const a=[...ids];[a[i],a[j]]=[a[j],a[i]];setIds(a);};
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-grip"></div>
        <div className="sheet-head"><h2>Edit Day</h2><button className="x-btn" onClick={onClose}>{I.x}</button></div>
        <div className="sheet-body">
          <div className="field"><label>Day name</label><input placeholder="e.g. Push, Pull, Legs, Arms" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="section-h" style={{margin:'4px 0 10px'}}><span>Exercises ({ids.length})</span>
            <button onClick={()=>setPicking(true)} style={{color:'var(--accent)',fontSize:12,fontFamily:'var(--display)',fontWeight:700}}>+ Add</button></div>
          {ids.length===0 ?
            <div style={{textAlign:'center',padding:'24px 10px',color:'var(--muted)',fontSize:13.5}}>No exercises yet. Tap <b style={{color:'var(--accent)'}}>+ Add</b> to pull from your library.</div>
            :
            ids.map((id,i)=>{ const ex=exById[id]; if(!ex) return null;
              const ordering=reorderId===id;
              return (
                <div key={id} className={'ex-row reorder-row'+(ordering?' ordering':'')} style={{marginBottom:8}}
                  onPointerDown={e=>armReorder(id,e)} onPointerMove={trackHold} onPointerUp={clearHold} onPointerCancel={clearHold} onPointerLeave={clearHold}>
                  <div className="reorder-handle" title="Hold to reorder" aria-hidden="true">{I.grip}</div>
                  <Thumb ex={ex} cls="" />
                  <div className="ex-info"><div className="ex-name">{ex.name}</div>
                    <div className="ex-sub"><span style={{color:EQUIP[ex.eq]?EQUIP[ex.eq].c:'#888'}}>{ex.eq}</span>{'\u00b7'}<span style={{color:MUSCLE[ex.m]||'#888'}}>{ex.m}</span></div></div>
                  {ordering ?
                    <div className="reorder-actions">
                      <button type="button" aria-label="Move exercise up" disabled={i===0} onPointerDown={stopButton} onClick={()=>move(i,-1)}>{I.up}</button>
                      <button type="button" aria-label="Move exercise down" disabled={i===ids.length-1} onPointerDown={stopButton} onClick={()=>move(i,1)}>{I.down}</button>
                      <button type="button" className="reorder-done" aria-label="Done reordering" onPointerDown={stopButton} onClick={()=>setReorderId(null)}>{I.check}</button>
                    </div>
                    :
                    <button className="delset" onPointerDown={stopButton} onClick={()=>remove(id)}>{I.trash}</button>}
                </div>
              ); })}
          {ids.length>0 &&
            <div>
              <div className="section-h" style={{margin:'20px 0 10px'}}>Muscles Worked</div>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'11px 14px',marginBottom:14,fontSize:13.5}}>
                {I.timer}<span style={{color:'var(--muted)'}}>Estimated time</span>
                <b style={{marginLeft:'auto',fontFamily:'var(--display)',fontSize:16,color:'var(--accent)'}}>~{estimateMinutes(ids, logs, restDefault)} min</b>
              </div>
              <MuscleBreakdown exerciseIds={ids} exById={exById} />
            </div>}
          <button className="btn btn-accent" style={{marginTop:14}}
            onClick={()=>onSave({...day, name:(name.trim()||day.name||'Day'), exerciseIds:ids})}>{I.check}Done</button>
        </div>
      </div>
      {picking && <ExercisePicker exercises={exercises} preselected={ids} onClose={()=>setPicking(false)} onCreate={onCreate} onConfirm={(sel)=>{setIds([...new Set([...ids,...sel])]);setPicking(false);}} />}
    </div>
  );
}`;

const dayStart = '/* edits a single day inside a routine (name + its exercises) */';
const pickerStart = '/* ============================================================\n   EXERCISE PICKER\n   ============================================================ */';
const dayA = html.indexOf(dayStart);
const dayB = html.indexOf(pickerStart, dayA);
if (dayA === -1 || dayB === -1) throw new Error('Could not locate DayEditor block');
html = html.slice(0, dayA) + newDayEditor + '\n\n' + html.slice(dayB);
write('index.html', html);

let sw = read('service-worker.js');
sw = sw.replace(/ironlog-v\d+/, 'ironlog-v24');
write('service-worker.js', sw);

let smoke = read('tests/smoke-check.js');
if (!smoke.includes('routine day exercises support hold reorder')) {
  smoke = smoke.replace(
    "check('compiled v2 shell removes browser Babel'",
    "check('routine day exercises support hold reorder', index.includes('reorder-row') && index.includes('armReorder') && index.includes('onPointerDown={e=>armReorder(id,e)}') && index.includes('Move exercise up') && index.includes('Move exercise down'));\ncheck('compiled v2 shell removes browser Babel'"
  );
}
write('tests/smoke-check.js', smoke);

console.log('Routine exercise reorder patch applied.');
