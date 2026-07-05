(function(){
  const VERSION='v76';
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  let activeTimer=null,lastStart=0;
  function canNotify(){return 'Notification' in window;}
  async function ensurePermission(){
    if(!canNotify())return false;
    if(Notification.permission==='granted')return true;
    if(Notification.permission==='denied')return false;
    try{return (await Notification.requestPermission())==='granted';}catch(e){return false;}
  }
  function toast(msg){let el=document.getElementById('ironlog-rest-notification-toast');if(!el){el=document.createElement('div');el.id='ironlog-rest-notification-toast';el.style.cssText='position:fixed;left:max(12px,calc((100vw - 480px)/2 + 12px));right:max(12px,calc((100vw - 480px)/2 + 12px));bottom:calc(96px + env(safe-area-inset-bottom));z-index:1300;padding:10px 12px;border-radius:14px;background:rgba(8,11,31,.95);border:1px solid rgba(99,102,241,.22);color:#c7d2fe;font-size:12px;font-weight:850;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.42);';document.body.appendChild(el);}el.textContent=msg;clearTimeout(window.__ironlogRestNotificationToast);window.__ironlogRestNotificationToast=setTimeout(()=>el.remove(),2600);}
  function notifyDone(label){
    if(!canNotify()||Notification.permission!=='granted')return;
    try{
      const n=new Notification('IronLog Rest Complete',{body:label||'Time for your next set.',tag:'ironlog-rest-complete',renotify:true,silent:false});
      n.onclick=function(){try{window.focus();}catch(e){};try{n.close();}catch(e){}};
    }catch(e){}
  }
  function secondsFromText(t){
    const s=String(t||'');
    const mmss=s.match(/(\d{1,2}):(\d{2})/);
    if(mmss)return Number(mmss[1])*60+Number(mmss[2]);
    const sec=s.match(/(\d+)\s*(?:sec|seconds|s)\b/i);
    if(sec)return Number(sec[1]);
    const min=s.match(/(\d+)\s*(?:min|minutes|m)\b/i);
    if(min)return Number(min[1])*60;
    return 0;
  }
  function findRestSeconds(){
    const active=[...document.querySelectorAll('.rest-bar,.timer,.rest-timer,[class*="rest" i],[id*="rest" i]')].filter(el=>el.offsetParent!==null);
    for(const el of active){const sec=secondsFromText(el.textContent);if(sec>0&&sec<=900)return sec;}
    const saved=Number(read('restSec',0)||read('restSeconds',0)||read('defaultRest',0)||0);
    if(Number.isFinite(saved)&&saved>0&&saved<=900)return saved;
    return 90;
  }
  async function startRestNotification(seconds,label){
    seconds=Number(seconds)||findRestSeconds();
    if(seconds<5)seconds=90;
    if(seconds>900)seconds=900;
    clearTimeout(activeTimer);
    lastStart=Date.now();
    write('ironlogRestNotification',{startedAt:lastStart,seconds,label:label||'Time for your next set.'});
    const ok=await ensurePermission();
    if(ok){toast('Rest notification set. You can lock your phone.');activeTimer=setTimeout(()=>notifyDone(label),seconds*1000);}else if(canNotify()){toast('Notifications are off. Enable them for Lock Screen rest alerts.');}
  }
  function bind(){
    if(window.__ironlogRestNotificationsBound)return;
    window.__ironlogRestNotificationsBound=true;
    document.addEventListener('click',e=>{
      const b=e.target&&e.target.closest&&e.target.closest('button,.check,[role="button"]');
      if(!b)return;
      const txt=(b.textContent||b.getAttribute('aria-label')||'').trim().toLowerCase();
      const looksLikeSetCheck=/✓|✔|check|done|complete|finish set/.test(txt)||b.className&&/check|done|complete/i.test(String(b.className));
      if(!looksLikeSetCheck)return;
      if(Date.now()-lastStart<2500)return;
      setTimeout(()=>startRestNotification(findRestSeconds(),'Rest is over. Log your next set.'),180);
    },true);
    document.addEventListener('visibilitychange',()=>{
      const r=read('ironlogRestNotification',null);if(!r||!r.startedAt||!r.seconds)return;
      const remaining=r.seconds*1000-(Date.now()-r.startedAt);
      if(document.visibilityState==='visible'&&remaining>1000){clearTimeout(activeTimer);activeTimer=setTimeout(()=>notifyDone(r.label),remaining);}
    });
  }
  function addSettingsHint(){
    const settings=[...document.querySelectorAll('h3')].find(h=>/workout|settings|general/i.test(h.textContent||''));
    if(!settings||document.querySelector('.ironlog-rest-notification-note'))return;
    const note=document.createElement('div');note.className='ironlog-rest-notification-note';note.style.cssText='margin:12px 0;padding:12px;border-radius:13px;border:1px solid rgba(99,102,241,.18);background:rgba(15,21,53,.58);color:var(--muted);font-size:12.5px;line-height:1.45';note.innerHTML='<b style="color:#c7d2fe;font-family:var(--display)">Rest notifications</b><br>After you check off a set, IronLog can send a Lock Screen notification when rest is complete. iOS may ask for notification permission.';settings.insertAdjacentElement('afterend',note);
  }
  function setVersion(){document.querySelectorAll('div[style*="position: fixed"]').forEach(el=>{if(/^v\d+$/.test((el.textContent||'').trim()))el.textContent=VERSION;});}
  function run(){bind();addSettingsHint();setVersion();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,2000);window.IronLogRestNotifications={start:startRestNotification,permission:ensurePermission};
})();
