const CACHE_VERSION = 'ironlog-v83';

const SHELL = [
  './','./index.html','./index-v2.html','./app-loader.js',
  './app-chunks/app.00.js','./app-chunks/app.01.js','./app-chunks/app.02.js','./app-chunks/app.03.js','./app-chunks/app.04.js',
  './app-chunks/app.05.js','./app-chunks/app.06.js','./app-chunks/app.07.js','./app-chunks/app.08.js','./app-chunks/app.09.js',
  './app-chunks/app.10.js','./app-chunks/app.11.js','./app-chunks/app.12.js','./app-chunks/app.13.js','./app-chunks/app.14.js',
  './app-chunks/app.15.js','./app-chunks/app.16.js','./app-chunks/app.17.js','./app-chunks/app.18.js',
  './ironlog-patch.js','./ironlog-update-patch.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png'
];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    await cache.addAll(SHELL);
    await Promise.allSettled(CDN.map(u=>cache.add(u)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

let restNotificationTimer=null;
function clearRestNotification(){
  if(restNotificationTimer) clearTimeout(restNotificationTimer);
  restNotificationTimer=null;
  self.registration.getNotifications({tag:'ironlog-rest'}).then(items=>items.forEach(n=>n.close())).catch(()=>{});
}
function restNotificationOptions(rest){
  const endsAt=Number(rest.endsAt||Date.now());
  return {body:rest.label?`${rest.label}: next set is ready.`:'Next set is ready.',tag:'ironlog-rest',renotify:true,requireInteraction:true,silent:false,timestamp:endsAt,vibrate:[180,80,180,80,260],icon:'./icon-192.png',badge:'./favicon-32.png',actions:[{action:'open',title:'Open IronLog'},{action:'dismiss',title:'Dismiss'}],data:{url:'./?rest=complete',restId:rest.id||'',endsAt}};
}
function showRestNotification(rest){return self.registration.showNotification('Rest complete',restNotificationOptions(rest)).catch(()=>{});}
function scheduleRestNotification(rest){
  clearRestNotification();
  const delay=Math.max(0,Number(rest.endsAt||0)-Date.now());
  if(delay<=0) return showRestNotification(rest);
  if('TimestampTrigger' in self){
    const options=restNotificationOptions(rest); options.showTrigger=new self.TimestampTrigger(Number(rest.endsAt));
    self.registration.showNotification('Rest complete',options).catch(()=>{restNotificationTimer=setTimeout(()=>{restNotificationTimer=null;showRestNotification(rest);},delay);});
    return;
  }
  restNotificationTimer=setTimeout(()=>{restNotificationTimer=null;showRestNotification(rest);},delay);
}
self.addEventListener('message', event => {
  if(event.data&&event.data.type==='SKIP_WAITING') return self.skipWaiting();
  if(event.data&&event.data.type==='SCHEDULE_REST_NOTIFICATION') return scheduleRestNotification(event.data.rest||{});
  if(event.data&&event.data.type==='CANCEL_REST_NOTIFICATION') clearRestNotification();
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if(event.action==='dismiss') return;
  const targetUrl=new URL(event.notification.data&&event.notification.data.url||'./',self.location.href).href;
  event.waitUntil((async()=>{
    const openClients=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of openClients){if(client.url.startsWith(self.location.origin)&&'focus' in client){await client.focus();return;}}
    if(clients.openWindow) await clients.openWindow(targetUrl);
  })());
});

self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.hostname.endsWith('supabase.co')) return;
  if(isAppShellRequest(req,url)) return event.respondWith(appShellWithPatch(req));
  if(isPatchableAppChunk(url)) return event.respondWith(patchedAppChunk(req,url));
  if(isVersionedAsset(url)) return event.respondWith(cacheFirst(req));
  event.respondWith(staleWhileRevalidate(req,event));
});
function isAppShellRequest(req,url){return url.origin===self.location.origin&&(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html'));}
function isVersionedAsset(url){if(url.origin!==self.location.origin)return false;const p=url.pathname;return p.includes('/app-chunks/')||p.endsWith('/app-loader.js')||p.endsWith('/app.bundle.js')||p.endsWith('/index-v2.html')||p.endsWith('/index.html')||p.endsWith('/ironlog-patch.js')||p.endsWith('/ironlog-update-patch.js')||p.endsWith('/manifest.json')||p.endsWith('.png');}
function isPatchableAppChunk(url){return url.origin===self.location.origin&&url.pathname.includes('/app-chunks/');}
function anyLoggedSetNumberExpression(n){return '["weight","reps","time","dist"].some(function(f){var v='+n+'[f];return v!==undefined&&v!==null&&v!==""&&!isNaN(parseFloat(v));})';}
function acceptSuggestedTargetsExpression(n){return '["weight","reps","time","dist"].forEach(function(f){var k=targetKey(f),v='+n+'[k];if(('+n+'[f]===undefined||'+n+'[f]===null||'+n+'[f]==="")&&v!==undefined&&v!==null&&v!=="")'+n+'[f]=v;})';}
function patchAppChunkSource(source,url){
  let patched=source.replace(/v5[0-9]/g,'v60');
  if(url.pathname.endsWith('/app-chunks/app.13.js')){
    patched=patched.replace('s&&applySuggestedReps(m,d),!setHasData(m,d))return d.done=!1,void n(c);','s&&(applySuggestedReps(m,d),'+acceptSuggestedTargetsExpression('d')+'),!'+anyLoggedSetNumberExpression('d')+')return d.done=!1,void n(c);');
  }
  return patched;
}
async function patchedAppChunk(req,url){const res=await networkFirst(req);const source=await res.text();const patched=patchAppChunkSource(source,url);const headers=new Headers(res.headers);headers.set('Content-Type','application/javascript; charset=utf-8');return new Response(patched,{status:res.status,statusText:res.statusText,headers});}

function fixedBottomCss(){return `<style id="ironlog-fixed-bottom-patch">
:root{--fixed-action-left:max(12px, calc((100vw - 480px)/2 + 12px));--fixed-action-right:max(12px, calc((100vw - 480px)/2 + 12px));--fixed-action-bottom:calc(82px + env(safe-area-inset-bottom));}
.sheet-body{padding-bottom:calc(132px + env(safe-area-inset-bottom)) !important;}
.reorder-sheet .sheet-body{padding-bottom:calc(260px + env(safe-area-inset-bottom)) !important;scroll-padding-bottom:calc(260px + env(safe-area-inset-bottom)) !important;}
.day-launch{position:fixed !important;left:var(--fixed-action-left) !important;right:var(--fixed-action-right) !important;bottom:0 !important;z-index:80 !important;margin:0 !important;border-top:1px solid rgba(168,85,247,.22) !important;border-left:0 !important;border-right:0 !important;border-bottom:0 !important;border-radius:0 !important;box-shadow:0 -18px 42px rgba(0,0,0,.45) !important;background:linear-gradient(180deg,rgba(13,9,20,.72),var(--surface) 34%) !important;}
.train-command-bar{position:fixed !important;left:var(--fixed-action-left) !important;right:var(--fixed-action-right) !important;bottom:var(--fixed-action-bottom) !important;z-index:75 !important;margin:0 !important;}
.selected-count,.review-actions,.reorder-savebar{position:fixed !important;left:var(--fixed-action-left) !important;right:var(--fixed-action-right) !important;bottom:var(--fixed-action-bottom) !important;z-index:75 !important;margin:0 !important;border:1px solid rgba(168,85,247,.22) !important;border-radius:16px !important;box-shadow:0 -18px 42px rgba(0,0,0,.45) !important;}
.rest-bar{bottom:calc(154px + env(safe-area-inset-bottom)) !important;}
.toast{bottom:calc(164px + env(safe-area-inset-bottom)) !important;}
</style>`;}
async function networkFirst(req){const cache=await caches.open(CACHE_VERSION);try{const fresh=await fetch(req,{cache:'reload'});if(fresh&&(fresh.ok||fresh.type==='opaque'))cache.put(req,fresh.clone()).catch(()=>{});return fresh;}catch(e){const cached=await cache.match(req);if(cached)return cached;throw e;}}
async function cacheFirst(req){const cache=await caches.open(CACHE_VERSION);const cached=await cache.match(req);if(cached)return cached;const fresh=await fetch(req).catch(()=>null);if(fresh&&(fresh.ok||fresh.type==='opaque'))cache.put(req,fresh.clone()).catch(()=>{});if(fresh)return fresh;return new Response('Offline - open IronLog once while online to cache it.',{status:503,headers:{'Content-Type':'text/plain'}});}
async function appShellWithPatch(){
  const shellReq=new Request(new URL('./index-v2.html',self.location.href).toString());
  const res=await networkFirst(shellReq);
  const type=res.headers.get('Content-Type')||'';
  if(!type.includes('text/html')) return res;
  const html=await res.text();
  let patched=html.replace(/const APP_VERSION = 'v\d+';/g,"const APP_VERSION = 'v60';");
  if(!patched.includes('ironlog-fixed-bottom-patch')) patched=patched.replace('</head>',fixedBottomCss()+'</head>');
  if(!patched.includes('ironlog-patch.js')) patched=patched.replace('</body>','<script src="./ironlog-patch.js" defer></script></body>');
  if(!patched.includes('ironlog-update-patch.js')) patched=patched.replace('</body>','<script src="./ironlog-update-patch.js" defer></script></body>');
  const headers=new Headers(res.headers);headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','no-store');
  return new Response(patched,{status:res.status,statusText:res.statusText,headers});
}
async function staleWhileRevalidate(req,event){const cache=await caches.open(CACHE_VERSION);const cached=await cache.match(req);const network=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone()).catch(()=>{});return res;}).catch(()=>null);if(cached){event.waitUntil(network);return cached;}const fresh=await network;if(fresh)return fresh;if(req.mode==='navigate'){const shell=await cache.match('./index-v2.html')||await cache.match('./index.html');if(shell)return shell;}return new Response('Offline - open IronLog once while online to cache it.',{status:503,headers:{'Content-Type':'text/plain'}});}
