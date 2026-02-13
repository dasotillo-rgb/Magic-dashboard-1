// public/service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // Por ahora, solo pasamos la petición.
  // En el futuro, aquí se implementará la lógica de caché.
  event.respondWith(fetch(event.request));
});
