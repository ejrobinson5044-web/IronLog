(function(){
  const VERSION='v78';
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const arr=v=>Array.isArray(v)?v:[];
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function css(){return `
    .ironlog-swap-save{display:block!important;width:100%!important;margin-top:14px!important;padding:12px!important;border-radius:12px!important;background:linear-gradient(135deg,#818cf8,#4f46e5)!important;border:0!important;color:#fff!important;font-family:var(--display)!important;font-weight:900!important;position:relative!important;z-index:12!important}
    .ironlog-placement-required{margin:10px 0;padding:12px;border-radius:14px;border:1px solid rgba(99,102,241,.2);background:rgba(8,11,31,.76)}
    .ironlog-placement-required h4{margin:0 0 8px;color:#818cf8;font-family:var(--display);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
    .ironlog-placement-required select{width:100%;padding:10px;border-radius:10px;background:var(--surface2);border:1px solid rgba(99,102,241,.18);color:var(--text)}
    .ironlog-longpress-suppressed{touch-action:none!important}
  `}
  function injectCss(){let st=document.getElementById('ironlog-exercise-flow-v78-style');if(!st){st=document.createElement('style');st.id='ironlog-exercise-flow-v78-style';document.head.appendChild(st)}st.textContent=css();}
  function currentRows(){return [...document.querySelectorAll('.ex-row,.set-block,.rec-row')].filter(el=>el.offsetParent!==null);}
  function rowName(el){return ((el.querySelector('.ex-name,b,h3,h4')||el).textContent||'').replace(/Profile|Cardio|SS/g,'').trim().slice(0,80);}
  function ensureSwapSave(){
    document.querySelectorAll('.sheet,.modal,.overlay,.drawer,form').forEach(root=>{
      const txt=(root.textContent||'').toLowerCase();
      if(!/swap/.test(txt)||!/custom exercise|create exercise|exercise name|new exercise/.test(txt))return;
      if(root.querySelector('.ironlog-swap-save'))return;
      const nameInput=[...root.querySelectorAll('input,textarea')].find(i=>/exercise|name/i.test((i.placeholder||i.name||'')+' '+((i.closest('label')||{}).textContent||'')))||root.querySelector('input,textarea');
      if(!nameInput)return;
      const btn=document.createElement('button');btn.type='button';btn.className='ironlog-swap-save';btn.textContent='Save & Swap Exercise';
      (root.querySelector('.ironlog-cardio-fields')||nameInput.closest('label,.field,.form-row')||nameInput).insertAdjacentElement('afterend',btn);
      btn.addEventListener('click',()=>{
        const name=(nameInput.value||'').trim();if(!name){alert('Enter an exercise name first.');return;}
        const custom=arr(read('customExercises',[]));if(!custom.some(x=>norm(typeof x==='string'?x:x&&x.name)===norm(name)))custom.push({name,type:(root.dataset.exerciseType||'strength'),createdAt:Date.now()});write('customExercises',custom);
        write('pendingSwapCreatedExercise',{name,at:Date.now()});
        const existing=[...root.querySelectorAll('button')].find(b=>/save|create|add|done/i.test((b.textContent||'').trim())&&!b.classList.contains('ironlog-swap-save'));
        if(existing)existing.click();else{root.style.display='none';alert('Exercise saved. Select it to complete the swap.');}
      });
    });
  }
  function ensurePlacementBeforeAdd(){
    document.querySelectorAll('.sheet,.modal,.overlay,.drawer,form').forEach(root=>{
      const txt=(root.textContent||'').toLowerCase();
      if(!/add exercise|choose exercise|search exercise/.test(txt)||/swap/.test(txt))return;
      if(root.querySelector('.ironlog-placement-required'))return;
      const rows=currentRows();if(!rows.length)return;
      const box=document.createElement('div');box.className='ironlog-placement-required';
      box.innerHTML=`<h4>Place New Exercise</h4><select><option value="end">End of workout</option><option value="top">Top of workout</option>${rows.map((r,i)=>`<option value="before:${i}">Before ${rowName(r)}</option><option value="after:${i}">After ${rowName(r)}</option>`).join('')}</select>`;
      const anchor=root.querySelector('.ironlog-placement-box')||root.querySelector('input,select,textarea,button');if(!anchor)return;
      anchor.insertAdjacentElement('afterend',box);
      box.querySelector('select').addEventListener('change',e=>write('pendingExercisePlacementV78',{value:e.target.value,at:Date.now()}));
      write('pendingExercisePlacementV78',{value:'end',at:Date.now()});
      root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=(b.textContent||'').toLowerCase();if(!/add|create|save|done/.test(t))return;setTimeout(applyPlacement,350);setTimeout(applyPlacement,900);},true);
    });
  }
  function applyPlacement(){
    const p=read('pendingExercisePlacementV78',null);if(!p||!p.value)return;
    const rows=currentRows();if(rows.length<2)return;const newest=rows[rows.length-1];
    if(p.value==='end')return;
    if(p.value==='top'){rows[0].parentElement.insertBefore(newest,rows[0]);return;}
    const m=p.value.match(/^(before|after):(\d+)$/);if(!m)return;const target=rows[Number(m[2])];if(!target||target===newest)return;
    target.parentElement.insertBefore(newest,m[1]==='before'?target:target.nextSibling);
  }
  function replaceLongPressBehavior(){
    if(window.__ironlogLongPressV78)return;window.__ironlogLongPressV78=true;
    let timer=null,startX=0,startY=0,target=null,moved=false;
    document.addEventListener('pointerdown',e=>{
      const row=e.target&&e.target.closest&&e.target.closest('.ex-row,.set-block,.rec-row');if(!row)return;
      if(e.target.closest('[draggable="true"],.drag-handle,.reorder-handle,[class*="drag" i],[class*="reorder" i]'))return;
      target=row;startX=e.clientX;startY=e.clientY;moved=false;
      timer=setTimeout(()=>{if(moved||!target)return;const activeReorder=document.querySelector('.reordering,.dragging,[data-reordering="true"],.sortable-chosen');if(activeReorder)return;target.classList.add('ironlog-longpress-suppressed');if(typeof window.showSupersetSheet==='function')window.showSupersetSheet(target);else target.dispatchEvent(new CustomEvent('ironlog:quickactions',{bubbles:true}));},650);
    },true);
    document.addEventListener('pointermove',e=>{if(!timer)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>10){moved=true;clearTimeout(timer);timer=null;}},true);
    ['pointerup','pointercancel','scroll'].forEach(ev=>document.addEventListener(ev,()=>{clearTimeout(timer);timer=null;if(target)target.classList.remove('ironlog-longpress-suppressed');target=null;},true));
  }
  function disableLegacyLongPress(){window.__ironlogLongPressBound=true;}
  function setVersion(){document.querySelectorAll('div[style*="position: fixed"]').forEach(el=>{if(/^v\d+$/.test((el.textContent||'').trim()))el.textContent=VERSION;});}
  function run(){injectCss();disableLegacyLongPress();ensureSwapSave();ensurePlacementBeforeAdd();replaceLongPressBehavior();setVersion();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,1200);window.IronLogExerciseFlowV78={applyPlacement};
})();
