// sw.js — MediSafe Senior Service Worker
const CACHE_NAME = 'medisafe-senior-v1';
const ASSETS = [
  'index.html',
  'css/variables.css',
  'css/senior.css',
  'js/services/sync.js',
  'js/router.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// ── Installation ───────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activation ─────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch — cache first ────────────────────────────────────
self.addEventListener('fetch', function(e) {
  // Ignorer les requêtes non-HTTP
  if (!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});

// ── Notifications push ─────────────────────────────────────
self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'MediSafe', {
      body:  data.body  || 'Il est l\'heure de prendre votre médicament.',
      icon:  'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag:   'medisafe-reminder',
      renotify: true,
      data:  { url: 'index.html' }
    })
  );
});

// ── Tap sur la notification → ouvre l'app ─────────────────
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list) {
      for (var c of list) {
        if (c.url.includes('index.html') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('index.html');
    })
  );
});

// ── Alarmes locales — vérifier les prises toutes les minutes
// (contournement : sans push server, on utilise periodic sync si dispo)
self.addEventListener('periodicsync', function(e) {
  if (e.tag === 'med-check') {
    e.waitUntil(_checkMedications());
  }
});

async function _checkMedications() {
  try {
    const cs = await clients.matchAll({ type:'window' });
    // Signaler aux clients de vérifier les prises imminentes
    cs.forEach(function(c) { c.postMessage({ type:'CHECK_MEDS' }); });
  } catch(e) {}
}
