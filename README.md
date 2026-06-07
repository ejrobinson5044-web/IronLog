# IronLog
My workout app

## Safety basics

- Use Settings > General > Backup > Export before major changes.
- Import restores routines, exercises, logs, measurements, and the active workout from an IronLog JSON backup.
- Import and reset both offer a quick undo export before replacing local data.
- IronLog also keeps one automatic safety snapshot before import/reset so the most recent destructive change can be restored.
- Supabase setup blocks secret/service-role keys; use the publishable or anon public key only.
- When a new PWA version is available, IronLog shows an in-app Update banner instead of relying on manual cache refreshes.

## Quick check

Run this before deploying changes:

```bash
npm run build:v2
npm run check
```

`index.html` remains the first-load fallback. The service worker serves `index-v2.html`, `app-loader.js`, and `app-chunks/*` after activation so returning users avoid the in-browser Babel transform.
