(function(){
  if(window.__ironlogReorderPatch) return;
  window.__ironlogReorderPatch=1;
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const stateMap=new WeakMap();
  const icon={
    grip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/></svg>',
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };
  const arr=v=>Array.isArray(v)?v:[];
  const txt=el=>String(el&&el.textContent||'').replace(/\s+/g,' ').trim();
  const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
  const today=()=>new Date().toISOString().slice(0,10);
  const pos=(i,m)=>m==='week'?days[i%7]:'Day '+(i+1);
  const label=(d,i,m)=>d&&d.name?pos(i,m)+' · '+d.name:pos(i,m);
  const blank=()=>({weight:'',reps:'',time:'',dist:'',done:false});
  const cleanSet=s=>({weight:s&&s.weight!=null?s.weight:'',reps:s&&s.reps!=null?s.reps:'',time:s&&s.time!=null?s.time:'',dist:s&&s.dist!=null?s.dist:'',done:!!(s&&s.done)});
  function planned(id){
    for(const w of arr(read('logs',[]))){
      const e=arr(w&&w.entries).find(x=>x&&x.exerciseId===id);
      if(e&&arr(e.sets).length) return {exerciseId:id,note:e.note||'',sets:arr(e.sets).map(cleanSet)};
    }
    return {exerciseId:id,note:'',sets:[blank(),blank(),blank()]};
  }
  function context(sheet){
    const rn=txt(sheet.querySelector('.guided-meta'));
    const dl=txt(sheet.querySelector('.plan-day-title'));
    if(!rn||!dl) return null;
    const routines=arr(read('routines',[]));
    const ri=routines.findIndex(r=>r&&r.name===rn);
    if(ri<0) return null;
    const r=routines[ri], mode=r.labelMode||'num';
    const di=arr(r.days).findIndex((d,i)=>label(d,i,mode)===dl||pos(i,mode)===dl||String(d&&d.name||'')===dl);
    if(di<0) return null;
    const d=r.days[di], ids=arr(d&&d.exerciseIds).map(String).filter(Boolean);
    return ids.length?{key:(r.id||rn)+':'+(d.id||di),routineId:r.id,routineIndex:ri,dayId:d.id,dayIndex:di,label:dl,ids}:null;
  }
  function rows(sheet){
    return Array.from(sheet.querySelectorAll('.sheet-body .ex-row')).filter(r=>r.querySelector('.target-line')&&r.querySelector('.ex-name'));
  }
  function save(st){
    const routines=arr(read('routines',[]));
    const r=routines.find((x,i)=>(st.routineId&&x&&x.id===st.routineId)||i===st.routineIndex);
    if(!r||!arr(r.days)[st.dayIndex]) return false;
    r.days[st.dayIndex]={...r.days[st.dayIndex],exerciseIds:st.ids.slice()};
    write('routines',routines);
    return true;
  }
  function start(e,st,i){
    e.preventDefault(); e.stopImmediatePropagation(); save(st);
    write('active',{id:uid(),date:today(),startedAt:null,note:'',routineId:st.routineId||null,dayId:st.dayId||null,mode:'guided',currentEntryIndex:Math.max(0,Math.min(st.ids.length-1,i||0)),name:st.label||'Workout',entries:st.ids.map(planned)});
    location.reload();
  }
  function move(e,sheet,st,id,dir){
    e.preventDefault(); e.stopImmediatePropagation();
    const i=st.ids.indexOf(id), j=i+dir;
    if(i<0||j<0||j>=st.ids.length) return;
    const next=st.ids.slice();
    [next[i],next[j]]=[next[j],next[i]];
    st.ids=next; st.active=id; st.dirty=true; save(st); render(sheet,st);
  }
  function render(sheet,st){
    const rs=rows(sheet), byId={};
    rs.forEach(r=>{if(r.dataset.previewExerciseId) byId[r.dataset.previewExerciseId]=r});
    const startBtn=Array.from(sheet.querySelectorAll('button')).find(b=>/^Start from first/i.test(txt(b)));
    const parent=rs[0]&&rs[0].parentNode;
    if(parent&&startBtn) st.ids.forEach(id=>byId[id]&&parent.insertBefore(byId[id],startBtn));
    rows(sheet).forEach((r,i)=>{
      const id=st.ids[i], on=st.active===id;
      r.dataset.previewExerciseId=id; r.dataset.previewIndex=String(i);
      r.classList.add('reorder-row'); r.classList.toggle('ordering',on);
      const chev=r.querySelector('.chevron'); if(chev) chev.style.display=on?'none':'';
      let a=r.querySelector('[data-preview-reorder-actions]');
      if(!on&&a) a.remove();
      if(!on) return;
      if(!a){a=document.createElement('div');a.className='reorder-actions';a.dataset.previewReorderActions='1';r.appendChild(a)}
      a.innerHTML='<button type="button" aria-label="Move exercise up" '+(i===0?'disabled':'')+'>'+icon.up+'</button><button type="button" aria-label="Move exercise down" '+(i===st.ids.length-1?'disabled':'')+'>'+icon.down+'</button><button type="button" class="reorder-done" aria-label="Done reordering">'+icon.check+'</button>';
      const [up,down,done]=a.querySelectorAll('button');
      [up,down,done].forEach(b=>b.addEventListener('pointerdown',ev=>ev.stopPropagation(),true));
      up.addEventListener('click',e=>move(e,sheet,st,id,-1),true);
      down.addEventListener('click',e=>move(e,sheet,st,id,1),true);
      done.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();st.active=null;render(sheet,st)},true);
    });
  }
  function wireRow(sheet,r,st,i){
    r.dataset.previewReorder='1'; r.dataset.previewExerciseId=st.ids[i]; r.dataset.previewIndex=String(i); r.classList.add('reorder-row');
    if(!r.querySelector('[data-preview-reorder-handle]')){
      const h=document.createElement('div'); h.className='reorder-handle'; h.dataset.previewReorderHandle='1'; h.title='Hold to reorder'; h.setAttribute('aria-hidden','true'); h.innerHTML=icon.grip; r.insertBefore(h,r.firstChild);
    }
    if(r.dataset.previewReorderWired==='1') return;
    r.dataset.previewReorderWired='1';
    let timer=null, point=null;
    const clear=()=>{if(timer)clearTimeout(timer);timer=null;point=null};
    r.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0) return;
      clear(); point={x:e.clientX,y:e.clientY};
      const id=r.dataset.previewExerciseId;
      timer=setTimeout(()=>{st.active=id;st.suppress=true;timer=null;point=null;if(navigator.vibrate)navigator.vibrate(12);render(sheet,st)},420);
    },true);
    r.addEventListener('pointermove',e=>{if(point&&(Math.abs(e.clientX-point.x)>10||Math.abs(e.clientY-point.y)>10))clear()},true);
    ['pointerup','pointercancel','pointerleave'].forEach(t=>r.addEventListener(t,clear,true));
    r.addEventListener('click',e=>{
      if(st.suppress||st.active){st.suppress=false;e.preventDefault();e.stopImmediatePropagation();return}
      if(st.dirty) start(e,st,Number(r.dataset.previewIndex)||0);
    },true);
  }
  function scan(){
    const sheet=Array.from(document.querySelectorAll('.sheet')).find(s=>s.querySelector('.plan-day-title'));
    if(!sheet) return;
    const c=context(sheet); if(!c) return;
    let st=stateMap.get(sheet);
    if(!st||st.key!==c.key){st={...c,active:null,dirty:false,suppress:false};stateMap.set(sheet,st)}
    const rs=rows(sheet); if(rs.length!==st.ids.length) return;
    rs.forEach((r,i)=>wireRow(sheet,r,st,i));
    const startBtn=Array.from(sheet.querySelectorAll('button')).find(b=>/^Start from first/i.test(txt(b)));
    if(startBtn&&startBtn.dataset.previewStartWired!=='1'){startBtn.dataset.previewStartWired='1';startBtn.addEventListener('click',e=>{if(st.dirty)start(e,st,0)},true)}
    render(sheet,st);
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
