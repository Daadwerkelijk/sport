// Sport-Tracker service worker
// Versienummer ophogen bij elke nieuwe deploy zodat oude caches automatisch verwijderd worden
const SW_VERSION = 'v3';
const CACHE = 'sport-tracker-' + SW_VERSION;
const ASSETS = [
  '/sport/',
  '/sport/index.html',
  '/sport/manifest.json',
  '/sport/icon-192.png',
  '/sport/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-cleaner: luistert naar berichten vanuit de app om caches handmatig te wissen
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'CLEAR_CACHE'){
    caches.keys().then(keys => {
      Promise.all(keys.map(k => caches.delete(k))).then(() => {
        e.source.postMessage({type:'CACHE_CLEARED'});
      });
    });
  }
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase: altijd netwerk, nooit cachen
  if(url.hostname.includes('supabase.co')){
    e.respondWith(fetch(e.request));
    return;
  }

  // Externe libs (fonts, chart.js): cache-first, prima om te cachen (versie-gepind via URL)
  if(url.hostname.includes('googleapis') || url.hostname.includes('gstatic') || url.hostname.includes('jsdelivr')){
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // App-shell (index.html, manifest, icons): NETWORK-FIRST
  // Altijd eerst proberen de nieuwste versie te halen; cache is alleen fallback voor offline.
  e.respondWith(
    fetch(e.request, {cache:'no-store'}).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
