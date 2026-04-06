// Echon Service Worker v2
// Vite already handles JS/CSS caching via content-hash filenames.
// This SW only caches app-shell assets (icons, manifest) so the app
// installs as a PWA. API calls and JS/CSS bundles are always fetched
// fresh from the network.

const CACHE_NAME = 'echon-shell-v2';
const SHELL_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches (including echon-v1 which incorrectly cached JS bundles)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https — ignore chrome-extension://, data:, etc.
  if (!url.protocol.startsWith('http')) return;

  // Never intercept API or WebSocket calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) return;

  // Never cache JS/CSS — Vite content-hash filenames + HTTP cache handle this
  if (url.pathname.match(/\.(js|css)$/)) return;

  // Cache-first for shell icons and manifest only
  if (SHELL_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request)
      )
    );
    return;
  }

  // Everything else (navigation): network-first, fallback to index.html offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/index.html'))
  );
});
