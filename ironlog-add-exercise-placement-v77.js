(function(){
  const VERSION='v77';
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const arr=v=>Array.isArray(v)?v:[];
  function css(){return `
    .ironlog-placement-box{margin:10px 0 12px;padding:12px;border:1px solid rgba(99,102,241,.18);border-radius:14px;background:rgba(8,11,31,.68);position:relative;z-index:5;clear:both}
    .ironlog-placement-title{font-family:var(--display);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#818cf8;font-weight:900;margin-bottom:8px}
    .ironlog-placement-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .ironlog-placement-grid button{padding:9px 10px;border-radius:12px;border:1px solid rgba(99,102,241,.18);background:rgba(15,21,53,.82);color:#c7d2fe;font-size:12px;font-weight:900;text-align:center}
    .ironlog-placement-grid button.on{background:linear-gradient(135deg,#818cf8,#4f46e5);color:#fff}
    .ironlog-placement-select{width:100%;margin-top:8px;background:var(--surface2);border:1px solid rgba(99,102,241,.18);border-radius:10px;color:var(--text);padding:9px;font-size:13px}
    .ironlog-add-flow-fix .sheet,.ironlog-add-flow-fix .modal,.ironlog-add-flow-fix .overlay,.ironlog-add-flow-fix .drawer{overflow:auto!important;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}
    .ironlog-add-flow-fix button{position:relative;z-index:auto}
    .ironlog-add-flow-fix .ironlog-type-toggle,.ironlog-add-flow-fix .ironlog-cardio-fields{position:relative!important;z-index:2!important;clear:both!important;margin-top:12px!important;margin-bottom:12px!important}
    .ironlog-add-flow-fix .ironlog-type-toggle + button,.ironlog-add-flow-fix .ironlog-cardio-fields + button{margin-top:14px!important;clear:both!important;display:block!important;width:100%!important;position:relative!important;z-index:6!important}
  `}
  function injectCss(){let st=document.getElementById('ironlog-add-placement-style');if(!st){st=document.createElement('style');st.id='ironlog-add-placement-style';document.head.appendChild(st)}st.textContent=css();document.documentElement.classList.add('ironlog-add-flow-fix');}
  function visibleExercises(){return [...document.querySelectorAll('.ex-row,.set-block,.rec-row')].filter(el=>el.offsetParent!==null).map(el=>{const n=((el.querySelector('.ex-name,b,h3,h4')||el).textContent||'Exercise').replace(/Profile|Cardio|SS/g,'').trim().slice(0,60);return n||'Exercise';});}
  function currentPlacement(){return read('pendingExercisePlacement',{mode:'end',target:''});}
  function savePlacement(mode,target){write('pendingExercisePlacement',{mode,target:target||'',at:Date.now()});}
  function addPlacementControls(){document.querySelectorAll('.sheet,.modal,.overlay,.drawer,form').forEach(root=>{
    const txt=(root.textContent||'').toLowerCase();
    if(!/add exercise|custom exercise|create exercise|exercise name|choose exercise|search exercise/.test(txt))return;
    if(root.querySelector('.ironlog-placement-box'))return;
    const anchor=[...root.querySelectorAll('input,textarea,select')].find(i=>/exercise|search|name/i.test((i.placeholder||i.name||'')+' '+((i.closest('label')||{}).textContent||'')))||root.querySelector('input,textarea,select,button');
    if(!anchor)return;
    const p=currentPlacement();
    const ex=visibleExercises();
    const box=document.createElement('div');box.className='ironlog-placement-box';
    box.innerHTML=`<div class="ironlog-placement-title">Add Position</div><div class="ironlog-placement-grid"><button type="button" data-place="end">End</button><button type="button" data-place="top">Top</button><button type="button" data-place="before">Before</button><button type="button" data-place="after">After</button></div><select class="ironlog-placement-select"><option value="">Select target exercise</option>${ex.map(x=>`<option value="${x.replace(/"/g,'&quot;')}">${x}</option>`).join('')}</select>`;
    const container=anchor.closest('label,.field,.form-row')||anchor.parentElement||root;
    container.insertAdjacentElement('afterend',box);
    const select=box.querySelector('select');
    function render(){const cur=currentPlacement();box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.place===cur.mode));select.style.display=(cur.mode==='before'||cur.mode==='after')?'block':'none';select.value=cur.target||'';}
    box.addEventListener('click',e=>{const b=e.target.closest('button[data-place]');if(!b)return;savePlacement(b.dataset.place,select.value);render();});
    select.addEventListener('change',()=>savePlacement(currentPlacement().mode,select.value));
    root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=(b.textContent||'').toLowerCase();if(/add|create|save|done/.test(action)){const p=currentPlacement();write('lastExercisePlacementRequest',p);setTimeout(()=>repositionNewestExercise(p),450);setTimeout(()=>repositionNewestExercise(p),1200);}},true);
    render();
  });}
  function getExerciseRows(){return [...document.querySelectorAll('.ex-row,.set-block,.rec-row')].filter(el=>el.offsetParent!==null);}
  function rowName(el){return ((el.querySelector('.ex-name,b,h3,h4')||el).textContent||'').replace(/Profile|Cardio|SS/g,'').trim().slice(0,60);}
  function repositionNewestExercise(p){
    p=p||currentPlacement();
    const rows=getExerciseRows();if(rows.length<2)return;
    const newest=rows[rows.length-1];
    if(p.mode==='end')return;
    if(p.mode==='top'){rows[0].parentElement.insertBefore(newest,rows[0]);return;}
    const target=rows.find(r=>rowName(r)===p.target);
    if(!target||target===newest)return;
    if(p.mode==='before')target.parentElement.insertBefore(newest,target);
    if(p.mode==='after')target.parentElement.insertBefore(newest,target.nextSibling);
  }
  function fixOverlaps(){document.querySelectorAll('.sheet,.modal,.overlay,.drawer').forEach(root=>{root.style.overflow='auto';root.style.paddingBottom='calc(96px + env(safe-area-inset-bottom))';});document.querySelectorAll('.ironlog-type-toggle,.ironlog-cardio-fields,.ironlog-placement-box').forEach(el=>{el.style.position='relative';el.style.zIndex='5';el.style.clear='both';});}
  function setVersion(){document.querySelectorAll('div[style*="position: fixed"]').forEach(el=>{if(/^v\d+$/.test((el.textContent||'').trim()))el.textContent=VERSION;});}
  function run(){injectCss();addPlacementControls();fixOverlaps();setVersion();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,1200);window.IronLogExercisePlacement={save:savePlacement,reposition:repositionNewestExercise,current:currentPlacement};
})();
