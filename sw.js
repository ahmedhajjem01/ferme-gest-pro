// Service Worker for FermeGest PRO (100% Offline-First Agrarian Management)
const CACHE_NAME = 'fermegest-v150';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './avatars.js',
  './mobile-bridge.js',
  './supabase-client.js',
  './translations.js',
  './app.js',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Let external CDN and Supabase API calls go straight to network
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-First for ALL app assets: always fresh when online, offline cache when disconnected
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return null;
        });
      })
  );
});

// Handle Daily 16h Feed & 17h Egg Collection Notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') {
    return;
  }
  const isFeed = (event.notification.data && event.notification.data.type === 'daily_feed_distribution') || (event.action === 'record_feed');
  const targetAction = isFeed ? 'open_feed_distribution' : 'open_daily_eggs';
  const targetUrl = isFeed ? './?action=feed_distribution' : './?action=daily_eggs';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ action: targetAction });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
