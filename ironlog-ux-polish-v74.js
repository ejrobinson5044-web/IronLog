(function(){
  const VERSION='v74';
  function css(){return `
    html,body,.app,*:not(input):not(textarea):not([contenteditable="true"]){-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important}
    input,textarea,[contenteditable="true"]{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}
    body{overscroll-behavior-y:none!important;background:#02030a!important}
    .app{scroll-padding-bottom:calc(180px + env(safe-area-inset-bottom))!important}
    .card,.stat-card,.dash-card,.focus-row,.quick-tile,.routine-card,.cal-log,.rec-row,.set-row,.ex-row{box-shadow:none!important;background:rgba(8,11,31,.62)!important;border-color:rgba(99,102,241,.11)!important}
    .card .card,.set-row .card,.ex-row .card{background:transparent!important;border-color:rgba(99,102,241,.08)!important}
    .today-hero{box-shadow:none!important;border-color:rgba(99,102,241,.16)!important;background:linear-gradient(180deg,rgba(8,11,31,.82),rgba(5,7,22,.78))!important}
    button,.btn,.rc-edit,.gear,.quick-tile{box-shadow:none!important}
    .btn-primary,.day-start{box-shadow:0 0 18px rgba(79,70,229,.22)!important}
    .ex-row,.rec-row,.set-block{position:relative!important;margin-bottom:10px!important;padding-top:12px!important;padding-bottom:12px!important}
    .ex-row b,.ex-name,.set-block h3,.set-block h4{font-size:17px!important;line-height:1.16!important;letter-spacing:-.01em!important}
    .set-row{display:grid!important;grid-template-columns:auto minmax(0,1fr) minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;padding:9px 10px!important;border-radius:13px!important;margin:7px 0!important}
    .set-row input{min-height:42px!important;font-size:20px!important;font-weight:850!important;text-align:center!important;border-radius:12px!important;padding:7px!important;background:rgba(15,21,53,.9)!important;border-color:rgba(99,102,241,.16)!important}
    .set-row input:focus{border-color:rgba(129,140,248,.72)!important;box-shadow:0 0 0 3px rgba(99,102,241,.18)!important;outline:none!important}
    .set-row:focus-within{border-color:rgba(129,140,248,.28)!important;background:rgba(15,21,53,.78)!important;transform:none!important}
    .set-row button,.set-row .check{min-width:42px!important;min-height:42px!important;border-radius:12px!important}
    .ironlog-profile-hint,.ironlog-cardio-badge,.ironlog-superset-badge{opacity:.78!important;transform:scale(.94)!important}
    .ironlog-profile-hint{padding:1px 6px!important;font-size:9px!important}
    .ironlog-watch-paused-note{display:none!important}
    .ironlog-compact-helper{font-size:11px;color:var(--muted2);margin-top:4px;line-height:1.35}
    .sheet,.ironlog-sheet,.ironlog-profile-panel{animation:ironlogSheetPolish .18s cubic-bezier(.2,.9,.2,1) both!important}
    @keyframes ironlogSheetPolish{from{opacity:.72;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:430px){.set-row{grid-template-columns:auto 1fr 1fr auto!important}.set-row input{font-size:18px!important}.ex-row b,.ex-name,.set-block h3,.set-block h4{font-size:16px!important}}
  `}
  function injectCss(){let st=document.getElementById('ironlog-ux-polish-v74-style');if(!st){st=document.createElement('style');st.id='ironlog-ux-polish-v74-style';document.head.appendChild(st)}st.textContent=css();}
  function setVersion(){document.querySelectorAll('div[style*="position: fixed"]').forEach(el=>{if(/^v\d+$/.test((el.textContent||'').trim()))el.textContent=VERSION;});}
  function scrollFocusedIntoView(e){const el=e.target;if(!el||!el.matches||!el.matches('input,textarea,select'))return;setTimeout(()=>{try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(_){el.scrollIntoView(false);}},180);}
  function improveSetFlow(){if(window.__ironlogSetFlowV74)return;window.__ironlogSetFlowV74=true;document.addEventListener('focusin',scrollFocusedIntoView,true);document.addEventListener('keydown',e=>{const el=e.target;if(!el||!el.matches||!el.matches('.set-row input,input[inputmode="decimal"],input[type="number"]'))return;if(e.key!=='Enter')return;const row=el.closest('.set-row');if(!row)return;const inputs=[...row.querySelectorAll('input')];const idx=inputs.indexOf(el);if(idx>-1&&idx<inputs.length-1){e.preventDefault();inputs[idx+1].focus();inputs[idx+1].select&&inputs[idx+1].select();return}const check=row.querySelector('button,.check');if(check){e.preventDefault();check.focus&&check.focus();}},true);}
  function reduceDuplicateHints(){document.querySelectorAll('.ironlog-watch-paused-note').forEach(x=>x.remove());document.querySelectorAll('.ironlog-compact-helper').forEach(x=>x.remove());document.querySelectorAll('.set-block,.ex-row').forEach(el=>{if(el.querySelector('.ironlog-compact-helper'))return;const rows=el.querySelectorAll('.set-row');if(rows.length>=3){const note=document.createElement('div');note.className='ironlog-compact-helper';note.textContent='Log sets first. Profile/setup stay secondary.';(el.querySelector('.ex-name,b,h3,h4')||el).insertAdjacentElement('afterend',note);}});}
  function run(){injectCss();setVersion();improveSetFlow();reduceDuplicateHints();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(run,1500);
})();
