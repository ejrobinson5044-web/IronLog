(function(){
  const PUBLIC_SUPABASE_URL = 'https://tqszscrxtddljiwjoriw.supabase.co';
  const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc3pzY3J4dGRkbGppd2pvcml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODU1MDcsImV4cCI6MjA5NjA2MTUwN30.tuceNVTA9Pm3OyjX5xy5xfJRCEWc9RT38jtA5Eys5Kg';
  const BOOTSTRAP_KEY = 'ironlog.publicAuthBootstrapped.v1';

  function readJson(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(_){ return fallback; }
  }
  function writeJson(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(_){}
  }
  function ensurePublicConfig(){
    const currentUrl = readJson('sb_url', '');
    const currentKey = readJson('sb_key', '');
    let changed = false;
    if(!currentUrl || /supabase\.com\/project\//i.test(String(currentUrl))){ writeJson('sb_url', PUBLIC_SUPABASE_URL); changed = true; }
    if(!currentKey || /^sb_secret_/i.test(String(currentKey))){ writeJson('sb_key', PUBLIC_SUPABASE_ANON_KEY); changed = true; }
    if(changed && !sessionStorage.getItem(BOOTSTRAP_KEY)){
      sessionStorage.setItem(BOOTSTRAP_KEY, '1');
      setTimeout(()=>location.reload(), 80);
    }
  }
  function installAccountUiPolish(){
    if(!document.getElementById('ironlog-public-auth-style')){
      const style=document.createElement('style');
      style.id='ironlog-public-auth-style';
      style.textContent=`
        details.help:has(pre), details.help:has(li:nth-child(2)){display:none!important}
        .ironlog-account-note{margin:10px 0 14px;padding:11px 13px;border-radius:12px;border:1px solid rgba(168,85,247,.16);background:rgba(23,16,33,.58);color:var(--muted);font-size:12.5px;line-height:1.45}
        .ironlog-account-note b{color:var(--text);font-family:var(--display)}
      `;
      document.head.appendChild(style);
    }
    document.querySelectorAll('h3').forEach(h=>{
      if((h.textContent||'').trim().toLowerCase()==='cloud sync') h.textContent='Account & Sync';
    });
    document.querySelectorAll('label').forEach(label=>{
      const txt=(label.textContent||'').trim().toLowerCase();
      if(txt.includes('supabase url') || txt.includes('anon key') || txt.includes('project url')){
        const block=label.closest('.field,.form-row,.set-block,label') || label.parentElement;
        if(block) block.style.display='none';
      }
    });
    document.querySelectorAll('input').forEach(input=>{
      const ph=(input.placeholder||'').toLowerCase();
      const val=String(input.value||'');
      if(ph.includes('supabase') || ph.includes('anon') || val.includes('supabase.co') || val.startsWith('eyJ')){
        const block=input.closest('.field,.form-row,.set-block,label') || input.parentElement;
        if(block) block.style.display='none';
      }
    });
    const syncHead=[...document.querySelectorAll('h3')].find(h=>(h.textContent||'').trim()==='Account & Sync');
    if(syncHead && !document.querySelector('.ironlog-account-note')){
      const note=document.createElement('div');
      note.className='ironlog-account-note';
      note.innerHTML='<b>Sign in to sync your workouts.</b><br>IronLog is already connected. Create an account or sign in—no project setup needed.';
      syncHead.insertAdjacentElement('afterend', note);
    }
    document.querySelectorAll('button').forEach(btn=>{
      const txt=(btn.textContent||'').trim();
      if(/^connect$/i.test(txt)) btn.textContent='Continue';
    });
  }

  ensurePublicConfig();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', installAccountUiPolish); else installAccountUiPolish();
  setInterval(installAccountUiPolish, 1200);
  window.IronLogPublicAuth = { url: PUBLIC_SUPABASE_URL, configured: true };
})();
