(function(){
  const VERSION='v62';
  const PUBLIC_SUPABASE_URL='https://tqszscrxtddljiwjoriw.supabase.co';
  const PUBLIC_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc3pzY3J4dGRkbGppd2pvcml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODU1MDcsImV4cCI6MjA5NjA2MTUwN30.tuceNVTA9Pm3OyjX5xy5xfJRCEWc9RT38jtA5Eys5Kg';
  const LB_TO_KG=0.45359237,KG_TO_LB=2.2046226218,IN_TO_CM=2.54,MI_TO_KM=1.609344;
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
  function ensurePublicAccountConfig(){
    const currentUrl=read('sb_url','');
    const currentKey=read('sb_key','');
    let changed=false;
    if(!currentUrl || /supabase\.com\/project\//i.test(String(currentUrl))){write('sb_url',PUBLIC_SUPABASE_URL);changed=true;}
    if(!currentKey || /^sb_secret_/i.test(String(currentKey))){write('sb_key',PUBLIC_SUPABASE_ANON_KEY);changed=true;}
    if(changed&&!sessionStorage.getItem('ironlog-public-auth-reloaded')){sessionStorage.setItem('ironlog-public-auth-reloaded','1');setTimeout(()=>location.reload(),80);}
  }
  async function forceUpdate(){
    try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(async r=>{try{await r.update();}catch(e){}try{if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'});}catch(e){}try{await r.unregister();}catch(e){}}));}if(window.caches){const keys=await caches.keys();await Promise.all(keys.filter(k=>/^ironlog-/i.test(k)).map(k=>caches.delete(k)));}}catch(e){}
    const u=new URL(location.href);u.searchParams.set('v',Date.now());location.replace(u.toString());
  }
  async function checkUpdate(){try{if(!('serviceWorker'in navigator))return;const r=await navigator.serviceWorker.getRegistration();if(r)await r.update();}catch(e){}}
  function polishAccountUi(){
    document.querySelectorAll('h3').forEach(h=>{if((h.textContent||'').trim().toLowerCase()==='cloud sync')h.textContent='Account & Sync';});
    document.querySelectorAll('details.help').forEach(d=>{if((d.textContent||'').toLowerCase().includes('supabase'))d.style.display='none';});
    document.querySelectorAll('label').forEach(l=>{const t=(l.textContent||'').toLowerCase();if(t.includes('supabase')||t.includes('anon key')||t.includes('project url')){const b=l.closest('.field,.form-row,.set-block,label')||l.parentElement;if(b)b.style.display='none';}});
    document.querySelectorAll('input').forEach(i=>{const p=(i.placeholder||'').toLowerCase(),v=String(i.value||'');if(p.includes('supabase')||p.includes('anon')||v.includes('supabase.co')||v.startsWith('eyJ')){const b=i.closest('.field,.form-row,.set-block,label')||i.parentElement;if(b)b.style.display='none';}});
    const h=[...document.querySelectorAll('h3')].find(x=>(x.textContent||'').trim()==='Account & Sync');
    if(h&&!document.querySelector('.ironlog-account-note')){const n=document.createElement('div');n.className='ironlog-account-note';n.innerHTML='<b>Sign in to sync your workouts.</b><br>IronLog is already connected. Create an account or sign in—no project setup needed.';h.insertAdjacentElement('afterend',n);}
    document.querySelectorAll('button').forEach(b=>{if(/^connect$/i.test((b.textContent||'').trim()))b.textContent='Continue';});
  }
  function installUi(){
    if(!document.getElementById('ironlog-update-patch-style')){const st=document.createElement('style');st.id='ironlog-update-patch-style';st.textContent='.topbar .unit-toggle{display:none!important}.ironlog-force-update{background:rgba(36,22,49,.82);border:1px solid rgba(168,85,247,.18);color:var(--muted);font-size:12px;font-weight:800;font-family:var(--display);padding:6px 13px;border-radius:999px;white-space:nowrap}.ironlog-force-update:active{background:var(--surface2)}.ironlog-account-note{margin:10px 0 14px;padding:11px 13px;border-radius:12px;border:1px solid rgba(168,85,247,.16);background:rgba(23,16,33,.58);color:var(--muted);font-size:12.5px;line-height:1.45}.ironlog-account-note b{color:var(--text);font-family:var(--display)}';document.head.appendChild(st);}
    const topRight=document.querySelector('.top-right');
    if(topRight&&!document.querySelector('.ironlog-force-update')){const b=document.createElement('button');b.className='ironlog-force-update';b.type='button';b.textContent='Update';b.addEventListener('click',forceUpdate);topRight.insertBefore(b,topRight.firstChild);}
    Array.from(document.querySelectorAll('div[style*="position: fixed"]')).filter(el=>/^v\d+$/.test((el.textContent||'').trim())).forEach(el=>{el.textContent=VERSION;});
    polishAccountUi();
  }
  document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const t=(b.textContent||'').trim().toLowerCase();if(t.includes('kilograms')||t==='kg'){if(convertUnits('kg'))setTimeout(()=>location.reload(),120);}if(t.includes('pounds')||t==='lb'){if(convertUnits('lb'))setTimeout(()=>location.reload(),120);}},true);
  ensurePublicAccountConfig();
  window.IronLogForceUpdate=forceUpdate;
  window.IronLogPublicAuth={url:PUBLIC_SUPABASE_URL,configured:true};
  window.addEventListener('focus',checkUpdate);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate();});
  setInterval(checkUpdate,30*60*1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUi);else installUi();
  setInterval(installUi,1200);
  setTimeout(checkUpdate,1000);
})();
