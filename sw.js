const CACHE = 'fiets-v2';
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
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(url.hostname.includes('supabase.co')||url.hostname.includes('googleapis')||url.hostname.includes('jsdelivr')||url.hostname.includes('gstatic')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    const cl=r.clone();
    caches.open(CACHE).then(cache=>cache.put(e.request,cl));
    return r;
  })));
});
