/* Controle+ · service worker */
const CACHE = 'controle-mais-v2';
const ASSETS = [
  './','./index.html','./manifest.json',
  './icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    // Página principal: rede primeiro (sempre versão nova quando online), cache como reserva offline
    e.respondWith(
      fetch(req).then(res => { const cl = res.clone(); caches.open(CACHE).then(c => c.put(req, cl)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Demais arquivos: cache primeiro, atualizando em segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const f = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') { const cl = res.clone(); caches.open(CACHE).then(c => c.put(req, cl)); }
        return res;
      }).catch(() => cached);
      return cached || f;
    })
  );
});
