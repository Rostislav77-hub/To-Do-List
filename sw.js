const CACHE = 'todo-v1';
const ASSETS = [
  '/To-Do-List/',
  '/To-Do-List/index.html',
  '/To-Do-List/style.css',
  '/To-Do-List/script.js',
  '/To-Do-List/supabase.js',
  '/To-Do-List/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});