// Service worker: serve local override file first, else pull it from the base game.
// Base files come back as same-origin responses -> no CORS errors at all.
const BASE = '<https://cdn.jsdelivr.net/gh/iamthegamesofsprunk/assets-fixing@main/kanaexe/>'; // e.g. "https://somehost.com/rpg/game"
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.otf': 'font/otf', '.ttf': 'font/ttf', '.wasm': 'application/wasm',
  '.loc': 'application/octet-stream', '.map': 'application/octet-stream'
};
const mime = p => { const i = p.lastIndexOf('.'); return i < 0 ? null : (MIME[p.slice(i).toLowerCase()] || 'application/octet-stream'); };
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith((async () => {
    // 1) local override / already-downloaded file wins
    try {
      const local = await fetch(req);
      if (local.ok) return local;
    } catch (e) {}
    // 2) fall back to the base game, no-cors -> rebuild as same-origin response
    const upstream = await fetch(BASE + url.pathname, { mode: 'no-cors' });
    const blob = await upstream.blob();
    const headers = new Headers();
    const type = mime(url.pathname);
    if (type) headers.set('Content-Type', type);
    return new Response(blob, { status: 200, headers });
  })());
});
