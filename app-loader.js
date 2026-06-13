(function(){
  const chunks = ["app-chunks/app.00.js","app-chunks/app.01.js","app-chunks/app.02.js","app-chunks/app.03.js","app-chunks/app.04.js","app-chunks/app.05.js","app-chunks/app.06.js","app-chunks/app.07.js","app-chunks/app.08.js","app-chunks/app.09.js","app-chunks/app.10.js","app-chunks/app.11.js","app-chunks/app.12.js","app-chunks/app.13.js","app-chunks/app.14.js"];
  const root = new URL('.', document.currentScript.src);
  const error = (message) => {
    const el = document.getElementById('root') || document.body;
    el.innerHTML = '<div style="padding:24px;font-family:system-ui,sans-serif;color:#eef0f7;background:#0d0e16;min-height:100vh"><h1 style="font-size:20px">IronLog could not start</h1><p style="color:#a3aab8">' + message + '</p></div>';
  };
  Promise.all(chunks.map((file) => fetch(new URL(file, root), { cache: 'no-cache' }).then((res) => {
    if (!res.ok) throw new Error(file + ' failed with ' + res.status);
    return res.text();
  }))).then((parts) => {
    (0, eval)(parts.join(''));
  }).catch((err) => {
    console.error('IronLog bundle load failed', err);
    error('Refresh once. If it still fails, clear the app cache and open IronLog again.');
  });
})();
