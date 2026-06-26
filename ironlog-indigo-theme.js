(function(){
  const STYLE_ID='ironlog-indigo-theme';
  function install(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      :root{
        --bg:#03040c!important;
        --surface:#080b1f!important;
        --surface2:#0f1535!important;
        --surface3:#18204a!important;
        --border:#263169!important;
        --border2:#34428a!important;
        --text:#f3f5ff!important;
        --muted:#a8afd4!important;
        --muted2:#727aa5!important;
        --accent:#6366f1!important;
        --accent-dim:#4f46e5!important;
        --accent-deep:#312e81!important;
        --accent-ink:#ffffff!important;
        --glow:rgba(79,70,229,.42)!important;
        --hot:#818cf8!important;
      }
      body{background:#02030a!important;}
      .app{background:linear-gradient(180deg,#090d24 0%,#050716 44%,#02030a 100%)!important;border-left-color:rgba(99,102,241,.2)!important;border-right-color:rgba(99,102,241,.2)!important;box-shadow:0 0 86px rgba(0,0,0,.76),0 0 34px rgba(49,46,129,.2)!important;}
      .app::before{background:linear-gradient(180deg,rgba(99,102,241,.14),transparent 28%,rgba(49,46,129,.13) 68%,transparent),repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 34px),repeating-linear-gradient(180deg,rgba(255,255,255,.02) 0 1px,transparent 1px 34px)!important;}
      .brand-mark,.day-start,.btn-primary,.preset-row button.on,.unit-toggle button.on{background:linear-gradient(135deg,#818cf8,#4f46e5)!important;box-shadow:0 0 22px rgba(79,70,229,.34)!important;}
      .today-hero{border-color:rgba(99,102,241,.24)!important;background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(49,46,129,.16) 48%,rgba(30,64,175,.1)),linear-gradient(180deg,rgba(8,11,31,.98),rgba(3,4,12,.96))!important;box-shadow:0 18px 52px rgba(0,0,0,.48),0 0 38px rgba(79,70,229,.2),inset 0 1px 0 rgba(255,255,255,.08)!important;}
      .card,.stat-card,.dash-card,.focus-row,.quick-tile,.routine-card,.cal-log,.rec-row,.set-row,.ex-row{border-color:rgba(99,102,241,.16)!important;background-color:rgba(8,11,31,.78)!important;}
      .topbar,.nav{background:rgba(3,4,12,.92)!important;border-color:rgba(99,102,241,.15)!important;}
      .nav button.on{color:#818cf8!important;background:linear-gradient(180deg,rgba(99,102,241,.18),rgba(49,46,129,.12))!important;box-shadow:inset 0 0 0 1px rgba(99,102,241,.18)!important;}
      .sync-status-pill,.unit-toggle,.gear,.rc-edit,.ironlog-force-update{background:rgba(15,21,53,.82)!important;border-color:rgba(99,102,241,.18)!important;}
      .rest-bar{background:linear-gradient(135deg,#312e81,#4f46e5)!important;box-shadow:0 10px 30px rgba(49,46,129,.48)!important;}
      .section-h,.today-date,.focus-icon,.quick-tile svg,.cal-log-h svg,.mini-link{color:#818cf8!important;}
      .mb-bar>div,.cal-dot.w{background:#6366f1!important;}
      .toast,.update-banner,.ironlog-native-toast{border-color:rgba(99,102,241,.25)!important;background:rgba(8,11,31,.94)!important;box-shadow:0 16px 42px rgba(0,0,0,.42),0 0 34px rgba(79,70,229,.14)!important;}
    `;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(install,2000);
})();
