const CACHE = 'todo-v5';
const ASSETS = [
  '/To-Do-List/',
  '/To-Do-List/index.html',
  '/To-Do-List/style.css',
  '/To-Do-List/script.js',
  '/To-Do-List/supabase.js',
  '/To-Do-List/manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});