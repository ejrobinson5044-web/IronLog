(function(){
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const arr=v=>Array.isArray(v)?v:[];
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const CARDIO_WORDS=/treadmill|run|walk|bike|cycle|rower|rowing|elliptical|stair|stepper|cardio|sprint|jog|incline walk|assault bike|ski erg|erg/i;
  function exerciseTypeMap(){return read('exerciseTypes',{})||{};}
  function setExerciseType(name,type){const map=exerciseTypeMap();map[norm(name)]=type;write('exerciseTypes',map);}
  function getExerciseType(name){const map=exerciseTypeMap();const key=norm(name);return map[key]||(/treadmill|run|walk|bike|cycle|rower|rowing|elliptical|stair|stepper|cardio|sprint|jog|erg/i.test(key)?'cardio':'strength');}
  function css(){return `.ironlog-type-toggle{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ironlog-type-toggle button{padding:10px;border-radius:13px;border:1px solid rgba(99,102,241,.2);background:rgba(15,21,53,.75);color:var(--muted);font-family:var(--display);font-weight:900}.ironlog-type-toggle button.on{background:linear-gradient(135deg,#818cf8,#4f46e5);color:#fff;box-shadow:0 0 18px rgba(79,70,229,.25)}.ironlog-cardio-fields{margin:10px 0;padding:12px;border:1px solid rgba(99,102,241,.18);border-radius:14px;background:rgba(8,11,31,.66)}.ironlog-cardio-fields h4{margin:0 0 8px;font-family:var(--display);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#818cf8}.ironlog-cardio-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ironlog-cardio-grid label{display:flex;flex-direction:column;gap:4px;font-size:10px;color:var(--muted2);font-weight:900;letter-spacing:.05em;text-transform:uppercase}.ironlog-cardio-grid input,.ironlog-cardio-grid select{background:var(--surface2);border:1px solid rgba(99,102,241,.18);border-radius:9px;color:var(--text);padding:8px;font-size:13px}.ironlog-cardio-badge{display:inline-flex;margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(99,102,241,.14);border:1px solid rgba(99,102,241,.22);color:#c7d2fe;font-size:10px;font-weight:900}.ironlog-cardio-mode .weight-col,.ironlog-cardio-mode [placeholder*="lb" i],.ironlog-cardio-mode [placeholder*="weight" i]{opacity:.45}.ironlog-cardio-summary{font-size:12px;color:var(--muted);line-height:1.35;margin-top:5px}`}
  function injectCss(){let st=document.getElementById('ironlog-cardio-custom-style');if(!st){st=document.createElement('style');st.id='ironlog-cardio-custom-style';document.head.appendChild(st)}st.textContent=css();}
  function labelForInput(input){const label=input.closest('label');return ((label&&label.textContent)||input.placeholder||input.name||'').toLowerCase();}
  function findNameInput(root){const inputs=[...root.querySelectorAll('input,textarea')];return inputs.find(i=>/name|exercise/i.test(labelForInput(i))||/exercise name/i.test(i.placeholder||''))||inputs[0];}
  function addTypeToggleToForms(){document.querySelectorAll('.sheet,.modal,.overlay,.drawer,form').forEach(root=>{
    const txt=(root.textContent||'').toLowerCase();
    if(!/custom exercise|add exercise|create exercise|exercise name/.test(txt))return;
    if(root.querySelector('.ironlog-type-toggle'))return;
    const nameInput=findNameInput(root); if(!nameInput)return;
    const wrap=document.createElement('div');wrap.className='ironlog-type-toggle';wrap.innerHTML='<button type="button" data-type="strength" class="on">Strength / Lift</button><button type="button" data-type="cardio">Cardio</button>';
    const fields=document.createElement('div');fields.className='ironlog-cardio-fields';fields.style.display='none';fields.innerHTML='<h4>Cardio Defaults</h4><div class="ironlog-cardio-grid"><label>Metric<select data-cardio="metric"><option>Time</option><option>Distance</option><option>Pace</option><option>Calories</option><option>Heart Rate</option></select></label><label>Machine<select data-cardio="machine"><option>General</option><option>Treadmill</option><option>Bike</option><option>Rower</option><option>Stair Stepper</option><option>Elliptical</option><option>Outdoor</option></select></label><label>Duration min<input data-cardio="duration" inputmode="decimal" placeholder="20"></label><label>Distance<input data-cardio="distance" inputmode="decimal" placeholder="2.0"></label><label>Incline / Level<input data-cardio="level" placeholder="Incline, level, resistance"></label><label>Calories<input data-cardio="calories" inputmode="decimal" placeholder="250"></label></div><div class="ironlog-cardio-summary">Cardio exercises use duration, distance, pace/speed, resistance/incline, calories, and heart-rate instead of weight/reps.</div>';
    const container=nameInput.closest('label,.field,.form-row')||nameInput.parentElement||root;
    container.insertAdjacentElement('afterend',fields);
    container.insertAdjacentElement('afterend',wrap);
    function setType(type){wrap.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.type===type));fields.style.display=type==='cardio'?'block':'none';root.dataset.exerciseType=type;const name=nameInput.value||'';if(name)setExerciseType(name,type);}
    wrap.addEventListener('click',e=>{const b=e.target.closest('button[data-type]');if(!b)return;setType(b.dataset.type);});
    nameInput.addEventListener('input',()=>{const name=nameInput.value||'';if(CARDIO_WORDS.test(name))setType('cardio');else if(!exerciseTypeMap()[norm(name)])setType(root.dataset.exerciseType||'strength');});
    root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=(b.textContent||'').toLowerCase();if(/save|add|create|done/.test(action)){const name=nameInput.value||'';if(name)setExerciseType(name,root.dataset.exerciseType||getExerciseType(name));const defs={};root.querySelectorAll('[data-cardio]').forEach(el=>defs[el.dataset.cardio]=el.value);if(name&&Object.keys(defs).length){const all=read('cardioDefaults',{});all[norm(name)]=defs;write('cardioDefaults',all);}}},true);
    if(CARDIO_WORDS.test(nameInput.value||''))setType('cardio');
  });}
  function annotateCardioRows(){document.querySelectorAll('.ex-row,.rec-row,.set-block,.cal-log').forEach(el=>{if(el.querySelector('.ironlog-cardio-badge'))return;const primary=el.querySelector('.ex-name,b,h3,h4')||el;const name=(primary.textContent||el.textContent||'').replace(/Profile|Cardio/g,'').trim();if(getExerciseType(name)==='cardio'||CARDIO_WORDS.test(name)){const badge=document.createElement('span');badge.className='ironlog-cardio-badge';badge.textContent='Cardio';primary.appendChild(badge);el.classList.add('ironlog-cardio-mode');}});}
  function patchCustomExerciseSaves(){
    const custom=arr(read('customExercises',[])); let changed=false;
    const map=exerciseTypeMap();
    custom.forEach(ex=>{const name=typeof ex==='string'?ex:(ex&&ex.name);if(!name)return;const key=norm(name);if(!map[key]){map[key]=CARDIO_WORDS.test(name)?'cardio':'strength';changed=true;}if(typeof ex==='object'&&ex&&!ex.type){ex.type=map[key];changed=true;}});
    if(changed){write('exerciseTypes',map);write('customExercises',custom);}
  }
  function run(){injectCss();patchCustomExerciseSaves();addTypeToggleToForms();annotateCardioRows();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,1200);window.IronLogExerciseTypes={get:getExerciseType,set:setExerciseType,map:exerciseTypeMap};
})();