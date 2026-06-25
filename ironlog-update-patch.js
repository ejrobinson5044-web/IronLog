(function(){
  const VERSION='v60';
  const LB_TO_KG=0.45359237;
  const KG_TO_LB=2.2046226218;
  const IN_TO_CM=2.54;
  const MI_TO_KM=1.609344;

  function read(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch(e){return f;}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function arr(v){return Array.isArray(v)?v:[];}
  function num(v,f=1){const n=Number(v);return Number.isFinite(n)?n:f;}
  function round(v,d=2){if(v===undefined||v===null||v==='')return v;const n=Number(v);if(!Number.isFinite(n))return v;const p=Math.pow(10,d);return Math.round(n*p)/p;}
  function convSet(s,wf,df){if(!s||typeof s!=='object')return s;const n={...s};['weight','targetWeight'].forEach(k=>{if(n[k]!==undefined&&n[k]!==null&&n[k]!=='')n[k]=round(num(n[k])*wf,2);});['dist','targetDist'].forEach(k=>{if(n[k]!==undefined&&n[k]!==null&&n[k]!=='')n[k]=round(num(n[k])*df,2);});return n;}
  function convEntry(en,wf,df){return en&&typeof en==='object'?{...en,sets:arr(en.sets).map(s=>convSet(s,wf,df))}:en;}
  function convWorkout(w,wf,df){return w&&typeof w==='object'?{...w,entries:arr(w.entries).map(en=>convEntry(en,wf,df))}:w;}
  function convRoutine(r,wf,df){return r&&typeof r==='object'?{...r,days:arr(r.days).map(d=>{const targets={...(d&&d.targets||{})};Object.keys(targets).forEach(id=>{targets[id]=arr(targets[id]).map(s=>convSet(s,wf,df));});return {...d,targets};})}:r;}
  function convMeas(m,wf,lf){if(!m||typeof m!=='object')return m;const n={...m};Object.keys(n).forEach(k=>{if(n[k]===undefined||n[k]===null||n[k]===''||k==='id'||k==='date'||k==='note'||k==='bodyfat')return;if(k==='weight')n[k]=round(num(n[k])*wf,2);else n[k]=round(num(n[k])*lf,2);});return n;}
  function convertUnits(next){const old=read('unit','lb');if(next!== 'lb'&&next!=='kg')return false;if(old===next)return false;const wf=old==='lb'&&next==='kg'?LB_TO_KG:KG_TO_LB;const lf=old==='lb'&&next==='kg'?IN_TO_CM:1/IN_TO_CM;const df=old==='lb'&&next==='kg'?MI_TO_KM:1/MI_TO_KM;write('logs',arr(read('logs',[])).map(w=>convWorkout(w,wf,df)));const active=read('active',null);if(active)write('active',convWorkout(active,wf,df));write('routines',arr(read('routines',[])).map(r=>convRoutine(r,wf,df)));write('measurements',arr(read('measurements',[])).map(m=>convMeas(m,wf,lf)));write('unit',next);return true;}

  async function forceUpdate(){
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(async r=>{try{await r.update();}catch(e){} try{if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'});}catch(e){} try{await r.unregister();}catch(e){}}));
      }
      if(window.caches){const keys=await caches.keys();await Promise.all(keys.filter(k=>/^ironlog-/i.test(k)).map(k=>caches.delete(k)));}
    }catch(e){}
    const u=new URL(location.href);u.searchParams.set('v',Date.now());location.replace(u.toString());
  }

  async function checkUpdate(){try{if(!('serviceWorker'in navigator))return;const r=await navigator.serviceWorker.getRegistration();if(r)await r.update();}catch(e){}}

  function installUi(){
    if(document.getElementById('ironlog-update-patch-style'))return;
    const st=document.createElement('style');st.id='ironlog-update-patch-style';st.textContent='.topbar .unit-toggle{display:none!important}.ironlog-force-update{background:rgba(36,22,49,.82);border:1px solid rgba(168,85,247,.18);color:var(--muted);font-size:12px;font-weight:800;font-family:var(--display);padding:6px 13px;border-radius:999px;white-space:nowrap}.ironlog-force-update:active{background:var(--surface2)}';document.head.appendChild(st);
    const topRight=document.querySelector('.top-right');
    if(topRight&&!document.querySelector('.ironlog-force-update')){const b=document.createElement('button');b.className='ironlog-force-update';b.type='button';b.textContent='Update';b.addEventListener('click',forceUpdate);topRight.insertBefore(b,topRight.firstChild);}
    Array.from(document.querySelectorAll('div[style*="position: fixed"]')).filter(el=>/^v\d+$/.test((el.textContent||'').trim())).forEach(el=>{el.textContent=VERSION;});
  }

  document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const t=(b.textContent||'').trim().toLowerCase();if(t.includes('kilograms')||t==='kg'){if(convertUnits('kg'))setTimeout(()=>location.reload(),120);}if(t.includes('pounds')||t==='lb'){if(convertUnits('lb'))setTimeout(()=>location.reload(),120);}},true);
  window.IronLogForceUpdate=forceUpdate;
  window.addEventListener('focus',checkUpdate);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate();});
  setInterval(checkUpdate,30*60*1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUi);else installUi();
  setInterval(installUi,1500);
  setTimeout(checkUpdate,1000);
})();
