(function(){
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  function markDirty(reason){write('ironlogNeedsSync',{reason:reason||'local-change',at:Date.now()});}
  function clearDirty(){try{localStorage.removeItem('ironlogNeedsSync')}catch(e){}}
  function isDirty(){return !!read('ironlogNeedsSync',null);}
  function toast(msg){let el=document.getElementById('ironlog-sync-toast');if(!el){el=document.createElement('div');el.id='ironlog-sync-toast';el.style.cssText='position:fixed;left:max(12px,calc((100vw - 480px)/2 + 12px));right:max(12px,calc((100vw - 480px)/2 + 12px));bottom:calc(84px + env(safe-area-inset-bottom));z-index:1200;padding:10px 12px;border-radius:14px;background:rgba(8,11,31,.94);border:1px solid rgba(99,102,241,.22);color:#c7d2fe;font-size:12px;font-weight:800;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.42);';document.body.appendChild(el);}el.textContent=msg;clearTimeout(window.__ironlogSyncToastTimer);window.__ironlogSyncToastTimer=setTimeout(()=>{el&&el.remove();},2600);}
  function decorate(){
    let pill=document.getElementById('ironlog-network-pill');
    const online=navigator.onLine;
    if(!pill){pill=document.createElement('div');pill.id='ironlog-network-pill';pill.style.cssText='position:fixed;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:1190;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:900;pointer-events:none;opacity:.92;';document.body.appendChild(pill);}
    if(!online){pill.textContent='Offline — logging saved locally';pill.style.background='rgba(245,193,108,.14)';pill.style.border='1px solid rgba(245,193,108,.22)';pill.style.color='#f5c16c';pill.style.display='block';}
    else if(isDirty()){pill.textContent='Needs sync';pill.style.background='rgba(99,102,241,.14)';pill.style.border='1px solid rgba(99,102,241,.22)';pill.style.color='#c7d2fe';pill.style.display='block';}
    else{pill.style.display='none';}
  }
  function triggerExistingSync(){
    const buttons=[...document.querySelectorAll('button')];
    const syncBtn=buttons.find(b=>/sync|cloud|upload|connect|retry/i.test((b.textContent||'').trim())&&!/sign out/i.test((b.textContent||'').trim()));
    if(syncBtn){try{syncBtn.click();toast('Connection restored — attempting sync.');setTimeout(clearDirty,2500);return true;}catch(e){}}
    if(typeof window.syncNow==='function'){try{window.syncNow();toast('Connection restored — attempting sync.');setTimeout(clearDirty,2500);return true;}catch(e){}}
    if(typeof window.IronLogSync==='object'&&typeof window.IronLogSync.sync==='function'){try{window.IronLogSync.sync();toast('Connection restored — attempting sync.');setTimeout(clearDirty,2500);return true;}catch(e){}}
    return false;
  }
  function scheduleRetry(){if(!navigator.onLine)return;clearTimeout(window.__ironlogSyncRetry);window.__ironlogSyncRetry=setTimeout(()=>{if(isDirty())triggerExistingSync();decorate();},900);}
  function bind(){
    if(window.__ironlogSyncResilienceBound)return;window.__ironlogSyncResilienceBound=true;
    window.addEventListener('offline',()=>{markDirty('offline');toast('Gym connection dropped — workout is still saved locally.');decorate();});
    window.addEventListener('online',()=>{toast('Back online — retrying sync.');scheduleRetry();decorate();});
    document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const txt=(b.textContent||'').toLowerCase();if(/✓|check|save|done|finish|complete|add set|start workout|end workout/.test(txt))markDirty('workout-change');setTimeout(decorate,250);},true);
    document.addEventListener('input',e=>{if(e.target&&e.target.matches&&e.target.matches('input,textarea,select')){markDirty('input-change');setTimeout(decorate,250);}},true);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){scheduleRetry();decorate();}});
    window.addEventListener('focus',()=>{scheduleRetry();decorate();});
  }
  function run(){bind();decorate();if(navigator.onLine&&isDirty())scheduleRetry();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,5000);window.IronLogSyncResilience={markDirty,clearDirty,retry:triggerExistingSync};
})();