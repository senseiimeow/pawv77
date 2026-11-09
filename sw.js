/* PAWGRAM service worker — offline-first for art & pages, network-first for HTML */
const VER = 'pawgram-v9';
/* precache only what the first visit needs — art/pages fill the cache on demand */
const CORE = [
  './', './index.html', './gallery.html', './chapters.html', './characters.html', './pawfun.html',
  './splash.html', './manifest.webmanifest',
  './art/icon-192.png', './art/icon-512.png', './art/favicon-32.png', './art/apple-touch-icon.png',
  './readers/Chapter_1_Reader.html',
  './art/og-cover.jpg',
  './assets/fonts/bricolage-latin-var.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';

  if (isHTML) {
    // network first (so a fresh Vercel deploy is always seen), cache as fallback
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        const copy = res.clone();
        caches.open(VER).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // images / css / js: cache first
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VER).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
