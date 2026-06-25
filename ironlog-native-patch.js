(function(){
  const VERSION='v61';
  const STYLE_ID='ironlog-native-feel-style';
  const FX_ID='ironlog-native-fx-layer';

  function vibrate(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(e){}}
  function haptic(kind){
    if(kind==='success') return vibrate([18,35,24]);
    if(kind==='heavy') return vibrate([30]);
    if(kind==='pr') return vibrate([15,30,15,30,28]);
    return vibrate([10]);
  }
  function toast(text,kind){
    let el=document.querySelector('.ironlog-native-toast');
    if(!el){el=document.createElement('div');el.className='ironlog-native-toast';document.body.appendChild(el);}
    el.textContent=text; el.dataset.kind=kind||'default'; el.classList.remove('show');
    requestAnimationFrame(()=>{el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);});
  }
  function fxLayer(){
    let layer=document.getElementById(FX_ID);
    if(!layer){layer=document.createElement('div');layer.id=FX_ID;layer.setAttribute('aria-hidden','true');document.body.appendChild(layer);}
    return layer;
  }
  function celebratePR(){
    haptic('pr'); toast('New PR detected','pr');
    const layer=fxLayer(); layer.innerHTML='';
    for(let i=0;i<20;i++){
      const p=document.createElement('i');
      p.style.left=(18+Math.random()*64)+'%'; p.style.animationDelay=(Math.random()*220)+'ms';
      p.style.setProperty('--dx',((Math.random()*2-1)*90)+'px');
      p.style.setProperty('--rot',(Math.random()*360)+'deg');
      layer.appendChild(p);
    }
    setTimeout(()=>{layer.innerHTML='';},1500);
  }
  function setVersionBadge(){
    Array.from(document.querySelectorAll('div[style*="position: fixed"]')).forEach(el=>{if(/^v\d+$/i.test((el.textContent||'').trim()))el.textContent=VERSION;});
  }
  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const css=`
      @media (prefers-reduced-motion: no-preference){
        button,.btn,.card,.ex-row,.set-row,.sheet,.day-row,.routine-card,.rec-row{transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s ease,border-color .16s ease,background .16s ease,opacity .16s ease!important;}
        button:active,.btn:active,.day-row:active,.ex-row:active,.routine-card:active,.rec-row:active{transform:scale(.972)!important;}
        .sheet{animation:ironlogSheetUp .22s cubic-bezier(.2,.9,.2,1 both);}
        .overlay{animation:ironlogFadeIn .18s ease both;}
        .card,.routine-card,.ex-row,.rec-row{animation:ironlogSoftIn .20s ease both;}
        .set-row:has(.done),.set-row.done{animation:ironlogSetDone .24s ease both;}
        .toast,.update-banner,.rest-bar{animation:ironlogToastUp .20s cubic-bezier(.2,.9,.2,1) both;}
        .rest-bar{position:fixed!important;left:max(12px,calc((100vw - 480px)/2 + 12px))!important;right:max(12px,calc((100vw - 480px)/2 + 12px))!important;border-radius:18px!important;border:1px solid rgba(168,85,247,.25)!important;background:radial-gradient(circle at 18px 18px,rgba(192,132,252,.22),transparent 38%),linear-gradient(180deg,rgba(20,13,31,.96),rgba(10,7,16,.96))!important;box-shadow:0 -18px 42px rgba(0,0,0,.45),0 0 32px rgba(168,85,247,.16)!important;overflow:hidden!important;}
        .rest-bar:before{content:'';position:absolute;inset:-1px;pointer-events:none;background:linear-gradient(90deg,rgba(99,230,190,.32),rgba(245,193,108,.3),rgba(255,107,154,.26));opacity:.42;mask:linear-gradient(#000 0 0) top/100% 3px no-repeat;animation:ironlogRestPulse 1.1s ease-in-out infinite;}
        .rest-bar b,.rest-bar .time,.rest-bar strong{font-family:var(--display)!important;font-size:22px!important;letter-spacing:.02em!important;color:var(--text)!important;text-shadow:0 0 18px rgba(168,85,247,.22)!important;}
        .check-pop{animation:ironlogCheckPop .28s cubic-bezier(.2,1.4,.2,1) both!important;}
      }
      .ironlog-native-toast{position:fixed;left:50%;bottom:calc(148px + env(safe-area-inset-bottom));transform:translate(-50%,18px) scale(.98);z-index:500;max-width:min(420px,calc(100vw - 28px));padding:10px 14px;border-radius:999px;border:1px solid rgba(168,85,247,.24);background:rgba(13,9,20,.94);backdrop-filter:blur(16px);box-shadow:0 16px 42px rgba(0,0,0,.42);font-family:var(--display);font-size:12px;font-weight:800;color:var(--text);opacity:0;pointer-events:none;transition:.18s ease;}
      .ironlog-native-toast.show{opacity:1;transform:translate(-50%,0) scale(1);}
      .ironlog-native-toast[data-kind='pr']{border-color:rgba(245,193,108,.5);box-shadow:0 16px 42px rgba(0,0,0,.42),0 0 34px rgba(245,193,108,.22);color:#ffd166;}
      #ironlog-native-fx-layer{position:fixed;inset:0;pointer-events:none;z-index:499;overflow:hidden;}
      #ironlog-native-fx-layer i{position:absolute;top:18%;width:7px;height:12px;border-radius:2px;background:linear-gradient(180deg,#ffd166,#c084fc);animation:ironlogConfetti 1.15s ease-out forwards;}
      .native-pr-badge{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(245,193,108,.16);border:1px solid rgba(245,193,108,.36);color:#ffd166;font-size:10px;font-family:var(--display);font-weight:900;letter-spacing:.05em;vertical-align:middle;}
      @keyframes ironlogFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes ironlogSheetUp{from{opacity:.82;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes ironlogSoftIn{from{opacity:.75;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ironlogToastUp{from{opacity:.65;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ironlogSetDone{0%{transform:scale(1)}45%{transform:scale(.985);filter:brightness(1.16)}100%{transform:scale(1);filter:brightness(1)}}
      @keyframes ironlogCheckPop{0%{transform:scale(.82)}70%{transform:scale(1.14)}100%{transform:scale(1)}}
      @keyframes ironlogRestPulse{0%,100%{opacity:.28}50%{opacity:.72}}
      @keyframes ironlogConfetti{0%{transform:translateY(0) translateX(0) rotate(0);opacity:1}100%{transform:translateY(74vh) translateX(var(--dx)) rotate(var(--rot));opacity:0}}
    `;
    const style=document.createElement('style'); style.id=STYLE_ID; style.textContent=css; document.head.appendChild(style);
  }
  function buttonMeaning(btn){
    const text=(btn.textContent||'').trim().toLowerCase();
    const cls=(btn.className||'').toString().toLowerCase();
    const aria=(btn.getAttribute('aria-label')||'').toLowerCase();
    const all=text+' '+cls+' '+aria;
    if(/finish|save workout|workout saved|complete workout/.test(all))return 'finish';
    if(/start workout|resume workout|start/.test(all))return 'start';
    if(/pr|personal record/.test(all))return 'pr';
    if(/check|done|save/.test(all)||btn.querySelector('svg'))return 'check';
    return 'tap';
  }
  function bindHaptics(){
    if(window.__ironlogNativeHaptics)return; window.__ironlogNativeHaptics=true;
    document.addEventListener('pointerdown',e=>{const btn=e.target&&e.target.closest&&e.target.closest('button,.btn,.day-row,.ex-row,.card.tap');if(!btn)return;const kind=buttonMeaning(btn);haptic(kind==='finish'?'success':kind==='start'?'heavy':kind==='pr'?'pr':'light');if(kind==='check'){btn.classList.remove('check-pop');void btn.offsetWidth;btn.classList.add('check-pop');}},true);
    document.addEventListener('click',e=>{const btn=e.target&&e.target.closest&&e.target.closest('button,.btn');if(!btn)return;const kind=buttonMeaning(btn);if(kind==='finish')setTimeout(()=>toast('Workout complete','success'),80);},true);
  }
  function annotatePossiblePRs(){
    const rows=Array.from(document.querySelectorAll('.hist-row,.rec-row,.cal-log,.set-row'));
    rows.forEach(row=>{
      const txt=(row.textContent||'').toLowerCase();
      if((txt.includes('pr')||txt.includes('record')||txt.includes('best'))&&!row.querySelector('.native-pr-badge')){
        const badge=document.createElement('span');badge.className='native-pr-badge';badge.textContent='PR';
        const target=row.querySelector('.ex-name,.hist-date,.cal-log-h,b')||row; target.appendChild(badge);
      }
    });
  }
  function observeRest(){
    const seen=new WeakSet();
    const scan=()=>{document.querySelectorAll('.rest-bar').forEach(el=>{if(seen.has(el))return;seen.add(el);haptic('heavy');});};
    scan(); setInterval(scan,1500);
  }
  function install(){installStyles();bindHaptics();setVersionBadge();annotatePossiblePRs();observeRest();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(()=>{setVersionBadge();annotatePossiblePRs();},2000);
  window.IronLogNativeFeel={haptic,celebratePR,version:VERSION};
})();
